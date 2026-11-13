/**
 * Block Renderer for In-App Messages
 */
import { countdownParts, countdownSpokenText, resolveCountdownEnd } from '../iamCountdown';
import { imageShapeCorners, imageShapeIsSquareCrop } from '../iamImageShape';
function fieldIsPii(f) {
    if (f.pii)
        return true;
    return f.type === 'email' || f.type === 'tel';
}
function formNeedsConsent(cfg) {
    if (!cfg.consentFieldId)
        return false;
    return cfg.fields.some(fieldIsPii);
}
function consentSatisfied(form, cfg) {
    if (!formNeedsConsent(cfg))
        return true;
    const consent = cfg.fields.find((f) => f.id === cfg.consentFieldId);
    if (!consent || consent.type !== 'checkbox')
        return false;
    for (let i = 0; i < form.elements.length; i++) {
        const el = form.elements[i];
        if (el.name === consent.name && el.type === 'checkbox')
            return el.checked;
    }
    return false;
}
function collectFormData(form, fields) {
    var _a;
    const fd = new FormData(form);
    const data = {};
    for (const f of fields) {
        if (f.type === 'checkbox') {
            const v = fd.get(f.name);
            data[f.name] = v === 'true' || v === 'on' ? 'true' : 'false';
        }
        else if (f.type === 'checkbox_group' || f.type === 'multiselect') {
            const all = fd.getAll(f.name);
            data[f.name] = all.filter(Boolean).join(',');
        }
        else if (f.type === 'radio') {
            data[f.name] = String((_a = fd.get(f.name)) !== null && _a !== void 0 ? _a : '');
        }
        else {
            const el = form.elements.namedItem(f.name);
            if (el && 'value' in el)
                data[f.name] = el.value;
        }
    }
    return data;
}
function applySpacing(el, s) {
    if (!s)
        return;
    const pad = (key) => {
        const v = s[key];
        if (v !== undefined && v !== null)
            return `${Number(v)}px`;
        return undefined;
    };
    if (s.padding !== undefined)
        el.style.padding = `${s.padding}px`;
    if (s.paddingTop !== undefined)
        el.style.paddingTop = pad('paddingTop');
    if (s.paddingRight !== undefined)
        el.style.paddingRight = pad('paddingRight');
    if (s.paddingBottom !== undefined)
        el.style.paddingBottom = pad('paddingBottom');
    if (s.paddingLeft !== undefined)
        el.style.paddingLeft = pad('paddingLeft');
    if (s.margin !== undefined)
        el.style.margin = `${s.margin}px`;
    if (s.marginTop !== undefined)
        el.style.marginTop = pad('marginTop');
    if (s.marginRight !== undefined)
        el.style.marginRight = pad('marginRight');
    if (s.marginBottom !== undefined)
        el.style.marginBottom = pad('marginBottom');
    if (s.marginLeft !== undefined)
        el.style.marginLeft = pad('marginLeft');
}
/**
 * Render an image block
 */
export function renderImageBlock(block) {
    const config = block.config.image;
    if (!config) {
        return document.createElement('div');
    }
    const img = document.createElement('img');
    const url = typeof config.url === 'string' ? config.url.trim() : '';
    if (!url) {
        return document.createElement('div');
    }
    img.src = url;
    img.alt = config.alt || '';
    // A typed width of "300" means pixels; CSS would otherwise ignore it.
    const cssLength = (value) => (/^\d+(\.\d+)?$/.test(value.trim()) ? `${value.trim()}px` : value);
    if (config.width) {
        img.style.width = cssLength(String(config.width));
    }
    if (config.height) {
        img.style.height = cssLength(String(config.height));
    }
    const container = document.createElement('div');
    container.className = 'tappd-block-image';
    applySpacing(container, config);
    if (config.alignment === 'full') {
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
    }
    else {
        container.style.textAlign = config.alignment || 'left';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'inline-block';
    }
    const corners = imageShapeCorners(config.shape);
    if (corners) {
        img.style.borderRadius = `${corners.topLeft}px ${corners.topRight}px ${corners.bottomRight}px ${corners.bottomLeft}px`;
        img.style.objectFit = 'cover';
    }
    if (imageShapeIsSquareCrop(config.shape)) {
        img.style.setProperty('aspect-ratio', '1 / 1');
    }
    if (Number(config.borderWidth) > 0) {
        img.style.border = `${Number(config.borderWidth)}px solid ${config.borderColor || '#e5e7eb'}`;
        img.style.boxSizing = 'border-box';
    }
    img.addEventListener('error', () => {
        img.alt = 'Image unavailable';
        img.style.minHeight = '80px';
        img.style.background = '#f3f4f6';
        img.style.border = '1px dashed #d1d5db';
    });
    const link = typeof config.link === 'string' ? config.link.trim() : '';
    if (/^https?:\/\//i.test(link)) {
        const anchor = document.createElement('a');
        anchor.href = link;
        anchor.target = '_blank';
        anchor.rel = 'noopener';
        anchor.addEventListener('click', (e) => e.stopPropagation());
        anchor.appendChild(img);
        container.appendChild(anchor);
    }
    else {
        container.appendChild(img);
    }
    return container;
}
/**
 * Render a text block
 */
export function renderTextBlock(block) {
    const config = block.config.text;
    if (!config) {
        return document.createElement('div');
    }
    const container = document.createElement('div');
    container.className = 'tappd-block-text';
    applySpacing(container, config);
    const alignment = config.alignment || 'left';
    container.style.textAlign = alignment;
    if (config.fontSize) {
        const fontSizeMap = {
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
            '5xl': '3rem',
        };
        container.style.fontSize = fontSizeMap[config.fontSize] || config.fontSize;
    }
    if (config.fontWeight) {
        container.style.fontWeight = config.fontWeight === 'bold' ? '700' : '400';
    }
    if (config.color) {
        container.style.color = config.color;
    }
    const content = config.content || '';
    const sanitizedContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');
    container.innerHTML = sanitizedContent;
    return container;
}
/**
 * Render a button block
 */
export function renderButtonBlock(block, onButtonClick) {
    const config = block.config.button;
    if (!config) {
        return document.createElement('div');
    }
    const container = document.createElement('div');
    container.className = 'tappd-block-button';
    applySpacing(container, config);
    const alignment = config.alignment || 'left';
    if (alignment !== 'full') {
        container.style.textAlign = alignment;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = config.text || 'Click Here';
    button.className = 'tappd-button';
    if (config.textColor) {
        button.style.color = config.textColor;
    }
    if (config.backgroundColor) {
        button.style.backgroundColor = config.backgroundColor;
    }
    button.style.padding = '10px 20px';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.fontWeight = '500';
    button.style.transition = 'opacity 0.2s';
    if (alignment === 'full') {
        button.style.width = '100%';
        button.style.display = 'block';
        button.style.textAlign = 'center';
    }
    else if (config.width) {
        button.style.width = String(config.width);
    }
    button.addEventListener('mouseenter', () => {
        button.style.opacity = '0.9';
    });
    button.addEventListener('mouseleave', () => {
        button.style.opacity = '1';
    });
    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const link = config.link || '#';
        if (link.includes('tappd.closeIAM()')) {
            const messageIdMatch = link.match(/tappd\.closeIAM\(['"]?([^'")]*)['"]?\)/);
            const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
            if (window.tappd && window.tappd.closeIAM) {
                window.tappd.closeIAM(messageId);
                if (onButtonClick) {
                    onButtonClick(link, config.text || '');
                }
                return;
            }
        }
        if (link.includes('tappd.nextPage()')) {
            const messageIdMatch = link.match(/tappd\.nextPage\(['"]?([^'")]*)['"]?\)/);
            const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
            if (window.tappd && window.tappd.nextPage) {
                window.tappd.nextPage(messageId);
                if (onButtonClick) {
                    onButtonClick(link, config.text || '');
                }
                return;
            }
        }
        if (link.includes('tappd.previousPage()')) {
            const messageIdMatch = link.match(/tappd\.previousPage\(['"]?([^'")]*)['"]?\)/);
            const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
            if (window.tappd && window.tappd.previousPage) {
                window.tappd.previousPage(messageId);
                if (onButtonClick) {
                    onButtonClick(link, config.text || '');
                }
                return;
            }
        }
        if (config.action && config.action.type !== 'none') {
            if (onButtonClick) {
                onButtonClick(config.link || '#', config.text || '', config.action);
            }
        }
        else if (onButtonClick) {
            onButtonClick(config.link || '#', config.text || '');
        }
        else {
            if (config.link && config.link !== '#') {
                if (config.linkBehavior === 'browser' || !config.linkBehavior) {
                    window.open(config.link, '_blank');
                }
                else {
                    window.location.href = config.link;
                }
            }
        }
    });
    container.appendChild(button);
    return container;
}
/**
 * Render an HTML block
 */
export function renderHtmlBlock(block) {
    const config = block.config.html;
    if (!config) {
        return document.createElement('div');
    }
    const container = document.createElement('div');
    container.className = 'tappd-block-html';
    applySpacing(container, config);
    const content = config.content || '';
    const temp = document.createElement('div');
    temp.innerHTML = content;
    while (temp.firstChild) {
        container.appendChild(temp.firstChild);
    }
    const images = container.querySelectorAll('img');
    images.forEach((img) => {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
    });
    const links = container.querySelectorAll('a[href]');
    links.forEach((link) => {
        const href = link.getAttribute('href') || '';
        if (href.includes('tappd.closeIAM()')) {
            const messageIdMatch = href.match(/tappd\.closeIAM\(['"]?([^'")]*)['"]?\)/);
            const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.tappd && window.tappd.closeIAM) {
                    window.tappd.closeIAM(messageId);
                }
            });
        }
        else if (href.includes('tappd.nextPage()')) {
            const messageIdMatch = href.match(/tappd\.nextPage\(['"]?([^'")]*)['"]?\)/);
            const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.tappd && window.tappd.nextPage) {
                    window.tappd.nextPage(messageId);
                }
            });
        }
        else if (href.includes('tappd.previousPage()')) {
            const messageIdMatch = href.match(/tappd\.previousPage\(['"]?([^'")]*)['"]?\)/);
            const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.tappd && window.tappd.previousPage) {
                    window.tappd.previousPage(messageId);
                }
            });
        }
    });
    return container;
}
function renderInputFieldControl(field, opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'tappd-iam-field';
    wrap.style.marginBottom = '12px';
    const lab = document.createElement('label');
    lab.textContent = field.label || field.name;
    lab.style.display = 'block';
    lab.style.marginBottom = '4px';
    lab.style.fontSize = '14px';
    // Optional: forms on dark backgrounds need light labels (inherits the page colour otherwise).
    if (opts.labelColor)
        lab.style.color = opts.labelColor;
    if (field.type === 'checkbox') {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '8px';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `tappd-field-${field.id}`;
        input.name = field.name;
        input.value = 'true';
        if (field.required)
            input.required = true;
        if (field.defaultValue === 'true')
            input.checked = true;
        lab.htmlFor = input.id;
        row.appendChild(input);
        const span = document.createElement('span');
        span.appendChild(lab);
        row.appendChild(span);
        wrap.appendChild(row);
        return wrap;
    }
    if (field.type === 'radio' && field.options && field.options.length > 0) {
        lab.style.marginBottom = '6px';
        wrap.appendChild(lab);
        const group = document.createElement('div');
        group.style.display = 'flex';
        group.style.flexDirection = 'column';
        group.style.gap = '6px';
        field.options.forEach((opt, i) => {
            const r = document.createElement('div');
            r.style.display = 'flex';
            r.style.alignItems = 'center';
            r.style.gap = '6px';
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = field.name;
            input.value = opt;
            input.id = `tappd-field-${field.id}-${i}`;
            if (field.required && i === 0)
                input.required = true;
            if (field.defaultValue === opt)
                input.checked = true;
            const ol = document.createElement('label');
            ol.htmlFor = input.id;
            ol.textContent = opt;
            ol.style.fontSize = '14px';
            r.appendChild(input);
            r.appendChild(ol);
            group.appendChild(r);
        });
        wrap.appendChild(group);
        return wrap;
    }
    if ((field.type === 'checkbox_group' || field.type === 'multiselect') && field.options && field.options.length > 0) {
        lab.style.marginBottom = '6px';
        wrap.appendChild(lab);
        const group = document.createElement('div');
        group.style.display = 'flex';
        group.style.flexDirection = 'column';
        group.style.gap = '6px';
        const defaults = (field.defaultValue || '').split(',').map((s) => s.trim());
        field.options.forEach((opt, i) => {
            const r = document.createElement('div');
            r.style.display = 'flex';
            r.style.alignItems = 'center';
            r.style.gap = '6px';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.name = field.name;
            input.value = opt;
            input.id = `tappd-field-${field.id}-${i}`;
            if (defaults.includes(opt))
                input.checked = true;
            const ol = document.createElement('label');
            ol.htmlFor = input.id;
            ol.textContent = opt;
            ol.style.fontSize = '14px';
            r.appendChild(input);
            r.appendChild(ol);
            group.appendChild(r);
        });
        wrap.appendChild(group);
        return wrap;
    }
    lab.htmlFor = `tappd-field-${field.id}`;
    wrap.appendChild(lab);
    let input;
    if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 4;
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';
    }
    else if (field.type === 'select' && field.options && field.options.length > 0) {
        input = document.createElement('select');
        const empty = document.createElement('option');
        empty.value = '';
        empty.textContent = field.placeholder || 'Choose…';
        empty.disabled = true;
        empty.selected = !field.defaultValue;
        input.appendChild(empty);
        field.options.forEach((opt) => {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt;
            if (field.defaultValue === opt)
                o.selected = true;
            input.appendChild(o);
        });
        input.style.width = '100%';
    }
    else {
        input = document.createElement('input');
        input.type =
            field.type === 'date'
                ? 'date'
                : field.type === 'number'
                    ? 'number'
                    : field.type === 'email'
                        ? 'email'
                        : field.type === 'tel'
                            ? 'tel'
                            : 'text';
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';
        input.style.padding = '8px';
    }
    input.id = `tappd-field-${field.id}`;
    input.name = field.name;
    if (field.placeholder)
        input.setAttribute('placeholder', field.placeholder);
    if (field.required)
        input.required = true;
    if (field.defaultValue && field.type !== 'select')
        input.value = field.defaultValue;
    wrap.appendChild(input);
    return wrap;
}
/**
 * Single input block (dashboard `input` type)
 */
export function renderInputBlock(block) {
    const field = block.config.input;
    if (!field) {
        return document.createElement('div');
    }
    const el = renderInputFieldControl(field);
    applySpacing(el, field); // explicit values override the default 12px bottom margin
    return el;
}
/**
 * Form block with submit
 */
export function renderFormBlock(block, callbacks) {
    const cfg = block.config.form;
    if (!cfg || !cfg.fields || cfg.fields.length === 0) {
        return document.createElement('div');
    }
    const form = document.createElement('form');
    form.className = 'tappd-block-form';
    form.style.width = '100%';
    form.style.boxSizing = 'border-box'; // width:100% + padding must not overflow the container
    applySpacing(form, cfg);
    const mx = (parseFloat(form.style.marginLeft) || 0) + (parseFloat(form.style.marginRight) || 0);
    if (mx)
        form.style.width = `calc(100% - ${mx}px)`;
    if (cfg.privacyNoticeHtml && cfg.privacyNoticeHtml.trim()) {
        const notice = document.createElement('div');
        notice.className = 'tappd-form-privacy-notice';
        notice.style.marginBottom = '12px';
        notice.style.fontSize = '12px';
        notice.style.lineHeight = '1.4';
        notice.innerHTML = cfg.privacyNoticeHtml;
        form.appendChild(notice);
    }
    cfg.fields.forEach((field) => {
        form.appendChild(renderInputFieldControl(field, { labelColor: cfg.labelColor }));
    });
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = cfg.submitButtonText || 'Submit';
    submit.className = 'tappd-button';
    submit.style.marginTop = '8px';
    submit.style.padding = '10px 20px';
    submit.style.border = 'none';
    submit.style.borderRadius = '4px';
    submit.style.cursor = 'pointer';
    if (cfg.submitButtonTextColor)
        submit.style.color = cfg.submitButtonTextColor;
    if (cfg.submitButtonBackgroundColor)
        submit.style.backgroundColor = cfg.submitButtonBackgroundColor;
    const submitAlign = cfg.submitButtonAlignment || cfg.alignment || 'left';
    if (submitAlign === 'full') {
        submit.style.width = '100%';
        submit.style.display = 'block';
        submit.style.textAlign = 'center';
    }
    else {
        form.style.textAlign = submitAlign;
        if (cfg.submitButtonWidth)
            submit.style.width = String(cfg.submitButtonWidth);
    }
    form.appendChild(submit);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!form.reportValidity())
            return;
        if (!consentSatisfied(form, cfg)) {
            return;
        }
        const data = collectFormData(form, cfg.fields);
        if (callbacks === null || callbacks === void 0 ? void 0 : callbacks.onFormSubmit) {
            callbacks.onFormSubmit(data, cfg.submitAction);
        }
    });
    return form;
}
/**
 * Spacer / vertical gap block
 */
export function renderSpacerBlock(block) {
    var _a;
    const cfg = block.config.spacer;
    const el = document.createElement('div');
    el.className = 'tappd-block-spacer';
    el.style.width = '100%';
    el.style.boxSizing = 'border-box';
    const h = (_a = cfg === null || cfg === void 0 ? void 0 : cfg.height) !== null && _a !== void 0 ? _a : 16;
    el.style.minHeight = `${h}px`;
    el.style.height = `${h}px`;
    if (cfg === null || cfg === void 0 ? void 0 : cfg.backgroundColor)
        el.style.backgroundColor = cfg.backgroundColor;
    if (cfg === null || cfg === void 0 ? void 0 : cfg.showDivider) {
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.minHeight = `${Math.max(h, 8)}px`;
        el.style.height = 'auto';
        const line = document.createElement('div');
        line.style.flex = '1';
        line.style.borderTop = '1px solid rgba(0,0,0,0.12)';
        el.appendChild(line);
    }
    applySpacing(el, cfg);
    return el;
}
const COUNTDOWN_SIZES = {
    sm: { digit: 18, label: 9, pad: 6, min: 38, gap: 4 },
    md: { digit: 26, label: 10, pad: 8, min: 52, gap: 6 },
    lg: { digit: 36, label: 11, pad: 10, min: 68, gap: 8 },
};
function paintCountdown(row, cfg, remainingMs) {
    const size = COUNTDOWN_SIZES[cfg.size || 'md'] || COUNTDOWN_SIZES.md;
    const plain = cfg.variant === 'plain';
    const parts = countdownParts(remainingMs, cfg);
    row.setAttribute('aria-label', countdownSpokenText(parts));
    while (row.firstChild)
        row.removeChild(row.firstChild);
    parts.forEach((part, index) => {
        if (plain && index > 0) {
            const colon = document.createElement('span');
            colon.textContent = ':';
            colon.setAttribute('aria-hidden', 'true');
            colon.style.fontSize = `${size.digit}px`;
            colon.style.fontWeight = '700';
            colon.style.lineHeight = '1.1';
            colon.style.color = cfg.digitColor || '#111827';
            row.appendChild(colon);
        }
        const unit = document.createElement('div');
        unit.setAttribute('aria-hidden', 'true');
        unit.style.display = 'flex';
        unit.style.flexDirection = 'column';
        unit.style.alignItems = 'center';
        unit.style.boxSizing = 'border-box';
        if (!plain) {
            unit.style.minWidth = `${size.min}px`;
            unit.style.padding = `${size.pad}px`;
            unit.style.borderRadius = '10px';
            unit.style.backgroundColor = cfg.boxColor || '#f3f4f6';
        }
        const digit = document.createElement('span');
        digit.textContent = part.value;
        digit.style.fontSize = `${size.digit}px`;
        digit.style.fontWeight = '700';
        digit.style.lineHeight = '1.1';
        digit.style.fontVariantNumeric = 'tabular-nums';
        digit.style.color = cfg.digitColor || '#111827';
        unit.appendChild(digit);
        if (cfg.showLabels !== false) {
            const label = document.createElement('span');
            label.textContent = part.label;
            label.style.marginTop = '2px';
            label.style.fontSize = `${size.label}px`;
            label.style.color = cfg.labelColor || '#6b7280';
            unit.appendChild(label);
        }
        row.appendChild(unit);
    });
}
/**
 * Countdown timer. Time always comes from the clock, so it stays right after the tab sleeps, and
 * the interval stops by itself once the message has been removed from the page.
 */
export function renderCountdownBlock(block) {
    const cfg = block.config.countdown;
    const container = document.createElement('div');
    if (!cfg)
        return container;
    const endsAt = resolveCountdownEnd(cfg, block.id);
    if (endsAt === null)
        return container;
    container.className = 'tappd-block-countdown';
    container.style.textAlign = cfg.alignment || 'center';
    applySpacing(container, cfg);
    const row = document.createElement('div');
    row.setAttribute('role', 'timer');
    row.style.display = 'inline-flex';
    row.style.alignItems = 'flex-start';
    row.style.flexWrap = 'wrap';
    row.style.justifyContent = 'center';
    row.style.gap = `${(COUNTDOWN_SIZES[cfg.size || 'md'] || COUNTDOWN_SIZES.md).gap}px`;
    container.appendChild(row);
    const finish = () => {
        const behavior = cfg.expiredBehavior || 'text';
        if (behavior === 'zero') {
            paintCountdown(row, cfg, 0);
        }
        else if (behavior === 'hide') {
            container.style.display = 'none';
        }
        else {
            row.removeAttribute('role');
            row.removeAttribute('aria-label');
            while (row.firstChild)
                row.removeChild(row.firstChild);
            const text = document.createElement('span');
            text.textContent = cfg.expiredText || 'This offer has ended';
            text.style.fontSize = '14px';
            text.style.fontWeight = '600';
            text.style.color = cfg.digitColor || '#111827';
            row.appendChild(text);
        }
    };
    const remainingNow = endsAt - Date.now();
    if (remainingNow <= 0) {
        finish();
        return container;
    }
    paintCountdown(row, cfg, remainingNow);
    let attached = false;
    const timer = setInterval(() => {
        if (container.isConnected) {
            attached = true;
        }
        else if (attached) {
            clearInterval(timer);
            return;
        }
        const remaining = endsAt - Date.now();
        if (remaining <= 0) {
            clearInterval(timer);
            finish();
            return;
        }
        paintCountdown(row, cfg, remaining);
    }, 1000);
    return container;
}
/**
 * Row block with nested blocks
 */
export function renderRowBlock(block, callbacks) {
    var _a;
    const row = block.config.row;
    if (!row || !row.cells || row.cells.length === 0) {
        return document.createElement('div');
    }
    const outer = document.createElement('div');
    outer.className = 'tappd-block-row';
    outer.style.display = 'flex';
    outer.style.flexDirection = 'row';
    outer.style.flexWrap = 'wrap';
    outer.style.width = '100%';
    const gap = Number((_a = row.gap) !== null && _a !== void 0 ? _a : 8) || 0;
    outer.style.gap = `${gap}px`;
    outer.style.boxSizing = 'border-box';
    if (row.backgroundColor)
        outer.style.backgroundColor = row.backgroundColor;
    if (row.borderWidth && row.borderStyle && row.borderStyle !== 'none') {
        outer.style.border = `${row.borderWidth}px ${row.borderStyle} ${row.borderColor || '#ccc'}`;
    }
    if (row.borderRadius !== undefined)
        outer.style.borderRadius = `${row.borderRadius}px`;
    applySpacing(outer, {
        padding: row.padding,
        paddingTop: row.paddingTop,
        paddingRight: row.paddingRight,
        paddingBottom: row.paddingBottom,
        paddingLeft: row.paddingLeft,
        margin: row.margin,
        marginTop: row.marginTop,
        marginRight: row.marginRight,
        marginBottom: row.marginBottom,
        marginLeft: row.marginLeft,
    });
    // Opt-in: on narrow screens the columns stack (see .tappd-row-stack in styles.ts).
    if (row.stackOnMobile)
        outer.classList.add('tappd-row-stack');
    const n = Math.max(1, row.columns || row.cells.length);
    // Columns share what's left after the gaps; a plain 100% / n would overflow and wrap onto new lines.
    const flexBasis = `calc((100% - ${gap * (n - 1)}px) / ${n})`;
    row.cells.forEach((columnBlocks) => {
        const col = document.createElement('div');
        col.style.flex = `1 1 ${flexBasis}`;
        col.style.minWidth = '0';
        col.style.boxSizing = 'border-box';
        const sorted = [...columnBlocks].sort((a, b) => a.order - b.order);
        sorted.forEach((nested) => {
            col.appendChild(renderBlock(nested, callbacks));
        });
        outer.appendChild(col);
    });
    return outer;
}
/**
 * Render a block based on its type
 */
export function renderBlock(block, callbacks) {
    const cb = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onButtonClick;
    switch (block.type) {
        case 'image':
            return renderImageBlock(block);
        case 'text':
            return renderTextBlock(block);
        case 'button':
            return renderButtonBlock(block, cb);
        case 'html':
            return renderHtmlBlock(block);
        case 'row':
            return renderRowBlock(block, callbacks);
        case 'form':
            return renderFormBlock(block, callbacks);
        case 'input':
            return renderInputBlock(block);
        case 'spacer':
            return renderSpacerBlock(block);
        case 'countdown':
            return renderCountdownBlock(block);
        default:
            return document.createElement('div');
    }
}
/**
 * Render multiple blocks
 */
export function renderBlocks(blocks, callbacks) {
    const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
    return sortedBlocks.map((block) => renderBlock(block, callbacks));
}
//# sourceMappingURL=blockRenderer.js.map