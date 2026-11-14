/**
 * Pure rules for signup forms: page targeting, device and audience checks, and how often a
 * form may show. No DOM access here, so these are easy to test.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
function normalizePath(url) {
    try {
        const u = new URL(url, 'https://x.invalid');
        return `${u.pathname}${u.search}`;
    }
    catch (_a) {
        return url;
    }
}
function matchesOne(rule, url) {
    const value = String(rule.value || '');
    if (!value)
        return false;
    const path = normalizePath(url);
    switch (rule.op) {
        case 'equals':
            return path === value || url === value || path.replace(/\/$/, '') === value.replace(/\/$/, '');
        case 'starts_with':
            return path.startsWith(value) || url.startsWith(value);
        case 'regex':
            try {
                return new RegExp(value).test(url);
            }
            catch (_a) {
                return false;
            }
        case 'contains':
        default:
            return url.includes(value);
    }
}
/**
 * Include rules: page must match at least one (no include rules = every page).
 * Exclude rules: page must match none.
 */
export function urlMatches(rules, url) {
    const list = Array.isArray(rules) ? rules.filter((r) => r && r.value) : [];
    const includes = list.filter((r) => !r.exclude);
    const excludes = list.filter((r) => r.exclude);
    if (excludes.some((r) => matchesOne(r, url)))
        return false;
    return includes.length === 0 || includes.some((r) => matchesOne(r, url));
}
export function isMobileViewport(width, userAgent) {
    return width < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
}
export function deviceMatches(devices, mobile) {
    if (devices === 'desktop')
        return !mobile;
    if (devices === 'mobile')
        return mobile;
    return true;
}
/**
 * known: the visitor is identified (has an external id).
 * subscribed: they already gave us an email through a form or identify.
 */
export function audienceMatches(audience, visitor) {
    if (audience === 'anonymous')
        return !visitor.known;
    if (audience === 'not_subscribed')
        return !visitor.subscribed;
    return true;
}
/** True when frequency settings say the form must stay hidden for now. */
export function isSnoozed(form, history, now) {
    var _a;
    if (!history)
        return false;
    const freq = form.frequency || {};
    if (history.submittedAt && freq.hideAfterSubmit !== false)
        return true;
    const days = Number((_a = freq.hideDaysAfterClose) !== null && _a !== void 0 ? _a : 7);
    if (history.closedAt && days > 0 && now - history.closedAt < days * DAY_MS)
        return true;
    return false;
}
/** FNV-1a: a small, stable string hash for assigning designs. */
export function hashString(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i += 1) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
}
/**
 * Picks a design for a visitor. The same seed always gets the same design, and designs
 * are chosen in proportion to their weights. Returns null when no design has weight.
 */
export function pickVariant(variants, seed) {
    const live = variants.filter((v) => Number(v.weight) > 0);
    const total = live.reduce((sum, v) => sum + Number(v.weight), 0);
    if (!(total > 0))
        return null;
    let point = (hashString(seed) % 10000) / 10000 * total;
    for (const v of live) {
        point -= Number(v.weight);
        if (point < 0)
            return v.id;
    }
    return live[live.length - 1].id;
}
export function isEligible(form, ctx) {
    if (!(form === null || form === void 0 ? void 0 : form.id) || !form.config)
        return false;
    const t = form.targeting || {};
    return urlMatches(t.urlRules, ctx.url)
        && deviceMatches(t.devices, ctx.mobile)
        && audienceMatches(t.audience, ctx.visitor)
        && !isSnoozed(form, ctx.history[form.id], ctx.now);
}
/**
 * Replaces {{ discount_code }} and {{ wheel_prize }} in every string of a form config.
 * Text blocks show plain text while HTML blocks and notices use markup, so values are
 * stripped of markup characters instead of escaped (escaping would show up twice in text).
 */
export function fillPlaceholders(config, values) {
    const clean = (s) => s.replace(/[<>&"'`]/g, '');
    const swap = (s) => s
        .replace(/\{\{\s*discount_code\s*\}\}/g, clean(values.discount_code || ''))
        .replace(/\{\{\s*wheel_prize\s*\}\}/g, clean(values.wheel_prize || ''));
    const walk = (v) => {
        if (typeof v === 'string')
            return swap(v);
        if (Array.isArray(v))
            return v.map(walk);
        if (v && typeof v === 'object') {
            const out = {};
            for (const k of Object.keys(v))
                out[k] = walk(v[k]);
            return out;
        }
        return v;
    };
    return walk(config);
}
/** Child blocks of a block: rows keep them in config.row.cells (columns of blocks). */
function childBlocks(b) {
    var _a, _b, _c;
    const out = [];
    if (Array.isArray(b === null || b === void 0 ? void 0 : b.children))
        out.push(...b.children);
    if (Array.isArray((_a = b === null || b === void 0 ? void 0 : b.config) === null || _a === void 0 ? void 0 : _a.children))
        out.push(...b.config.children);
    const cells = (_c = (_b = b === null || b === void 0 ? void 0 : b.config) === null || _b === void 0 ? void 0 : _b.row) === null || _c === void 0 ? void 0 : _c.cells;
    if (Array.isArray(cells))
        for (const cell of cells)
            if (Array.isArray(cell))
                out.push(...cell);
    return out;
}
/** Every form field on a page, including forms nested in rows. */
export function collectFormFields(page) {
    const fields = [];
    const walk = (blocks) => {
        var _a, _b;
        for (const b of blocks || []) {
            if ((b === null || b === void 0 ? void 0 : b.type) === 'form')
                fields.push(...(((_b = (_a = b.config) === null || _a === void 0 ? void 0 : _a.form) === null || _b === void 0 ? void 0 : _b.fields) || []));
            walk(childBlocks(b));
        }
    };
    walk((page === null || page === void 0 ? void 0 : page.blocks) || []);
    return fields;
}
/** What a form page asks for, based on its fields: an email step, a phone step, or neither. */
export function pageStep(page) {
    const fields = collectFormFields(page);
    if (fields.some((f) => (f === null || f === void 0 ? void 0 : f.type) === 'email'))
        return 'email';
    if (fields.some((f) => (f === null || f === void 0 ? void 0 : f.type) === 'tel'))
        return 'phone';
    return null;
}
/** Splits submitted form values into what the API expects for each step. */
export function readSubmission(step, data, fields) {
    const byType = (type) => { var _a; return (_a = fields.find((f) => f.type === type)) === null || _a === void 0 ? void 0 : _a.name; };
    if (step === 'email') {
        const emailKey = byType('email');
        const email = emailKey ? String(data[emailKey] || '').trim() : '';
        const extra = {};
        for (const f of fields)
            if (f.name !== emailKey)
                extra[f.name] = data[f.name];
        return { email, fields: extra };
    }
    const telKey = byType('tel');
    const consentField = fields.find((f) => f.type === 'checkbox' && /sms|text|consent/i.test(f.name))
        || fields.find((f) => f.type === 'checkbox');
    return {
        phone: telKey ? String(data[telKey] || '').trim() : '',
        smsConsent: consentField ? data[consentField.name] === 'true' : false,
    };
}
//# sourceMappingURL=rules.js.map