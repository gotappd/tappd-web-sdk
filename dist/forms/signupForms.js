var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Signup forms: on-site popups for anonymous or known visitors (configured in the dashboard
 * under Signup forms). Fetches live forms once, re-checks targeting on every page view,
 * and shows at most one form at a time, sharing the in-app message slot.
 *
 * Form pages follow the in-app message format. A page whose form has an email field is the
 * email step, one with a phone field is the phone step, and the page after the last step is
 * the success page. {{ discount_code }} and {{ wheel_prize }} are filled in on the pages
 * after the email step.
 */
import { renderMessage } from '../renderers/messageRenderer';
import { collectFormFields, fillPlaceholders, isEligible, isMobileViewport, pageStep, readSubmission, } from './rules';
import { TriggerEngine } from './triggers';
const HISTORY_KEY = '_tappd_forms';
const PAGE_COUNT_KEY = '_tappd_form_pages';
const SLOT_RETRY_MS = 3000;
const SLOT_RETRY_LIMIT = 10;
function storageGet(store, key) {
    try {
        return store ? store.getItem(key) : null;
    }
    catch (_a) {
        return null;
    }
}
function storageSet(store, key, value) {
    try {
        store === null || store === void 0 ? void 0 : store.setItem(key, value);
    }
    catch ( /* private mode */_a) { /* private mode */ }
}
function removeRendered(el, immediate = false) {
    if (!el)
        return;
    const overlay = el.closest('.tappd-message-overlay') || el;
    if (immediate) {
        overlay.remove();
        return;
    }
    overlay.style.transition = 'opacity 0.2s ease-out';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 200);
}
export class SignupForms {
    constructor(host) {
        this.host = host;
        this.forms = [];
        this.engines = new Map();
        this.open = null;
        this.teaserEl = null;
        this.teaserHiddenThisSession = false;
        this.shownThisPage = new Set();
        this.started = false;
        this.loaded = false;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.started || typeof window === 'undefined')
                return;
            this.started = true;
            try {
                const res = yield fetch(`${this.host.apiUrl}/forms/active`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', 'X-App-Id': this.host.appId },
                });
                if (!res.ok)
                    return;
                const body = yield res.json();
                this.forms = Array.isArray((_a = body === null || body === void 0 ? void 0 : body.data) === null || _a === void 0 ? void 0 : _a.forms) ? body.data.forms : [];
            }
            catch (err) {
                this.host.log('[Tappd SDK] Signup forms fetch failed', err);
                return;
            }
            this.loaded = true;
            if (!this.forms.length)
                return;
            this.host.ensureStyles();
            this.onPageView();
        });
    }
    /** Call on every page view (including SPA route changes). */
    onPageView() {
        // Page views before the forms load are covered by start(), which counts the current page.
        if (!this.loaded)
            return;
        const count = Number(storageGet(window.sessionStorage, PAGE_COUNT_KEY) || 0) + 1;
        storageSet(window.sessionStorage, PAGE_COUNT_KEY, String(count));
        if (!this.forms.length)
            return;
        this.shownThisPage.clear();
        this.evaluate(count);
    }
    /** Call on every tracked event so event triggers can fire. */
    onEvent(name) {
        this.engines.forEach((engine) => engine.notifyEvent(name));
    }
    /** True while a form is on screen (the SDK routes close/next/previous links here). */
    isOpen() {
        return Boolean(this.open);
    }
    closeFromButton() {
        this.close('button');
    }
    /** Next-page links only move past pages without a form step, so nobody skips the email step. */
    nextFromButton() {
        const o = this.open;
        if (!o)
            return;
        const step = pageStep(this.pages()[o.pageIndex]);
        if (step === 'email' || (step === 'phone' && !o.submitted))
            return;
        this.advance();
    }
    previousFromButton() {
        const o = this.open;
        if (!o || o.pageIndex === 0 || o.submitted)
            return;
        o.pageIndex -= 1;
        this.render();
    }
    destroy() {
        this.engines.forEach((e) => e.destroy());
        this.engines.clear();
        this.removeTeaser();
    }
    history() {
        try {
            return JSON.parse(storageGet(window.localStorage, HISTORY_KEY) || '{}') || {};
        }
        catch (_a) {
            return {};
        }
    }
    updateHistory(formId, patch) {
        const all = this.history();
        all[formId] = Object.assign(Object.assign({}, (all[formId] || {})), patch);
        storageSet(window.localStorage, HISTORY_KEY, JSON.stringify(all));
    }
    eligibleForms() {
        const ctx = {
            url: window.location.href,
            mobile: isMobileViewport(window.innerWidth, navigator.userAgent),
            visitor: { known: Boolean(this.host.getExternalId()), subscribed: Boolean(this.host.getEmail()) },
            history: this.history(),
            now: Date.now(),
        };
        return this.forms.filter((f) => isEligible(f, ctx));
    }
    evaluate(pageCount) {
        var _a, _b;
        this.engines.forEach((e) => e.destroy());
        this.engines.clear();
        const eligible = this.eligibleForms();
        const mobile = isMobileViewport(window.innerWidth, navigator.userAgent);
        for (const form of eligible) {
            const rules = ((_a = form.triggers) === null || _a === void 0 ? void 0 : _a.rules) || [];
            if (!rules.length)
                continue;
            const engine = new TriggerEngine(rules, ((_b = form.triggers) === null || _b === void 0 ? void 0 : _b.match) === 'all' ? 'all' : 'any', { pageCount, mobile }, () => {
                this.engines.delete(form.id);
                this.tryShow(form, 0);
            });
            this.engines.set(form.id, engine);
            engine.start();
        }
        const teaserForm = eligible.find((f) => { var _a, _b; return ((_a = f.teaser) === null || _a === void 0 ? void 0 : _a.enabled) && ((_b = f.teaser) === null || _b === void 0 ? void 0 : _b.showBeforeOpen); });
        if (teaserForm && !this.open)
            this.showTeaser(teaserForm);
    }
    tryShow(form, attempt) {
        if (this.open || this.shownThisPage.has(form.id))
            return;
        if (!this.host.isSlotFree()) {
            if (attempt < SLOT_RETRY_LIMIT)
                setTimeout(() => this.tryShow(form, attempt + 1), SLOT_RETRY_MS);
            return;
        }
        this.show(form);
    }
    show(form) {
        var _a;
        this.removeTeaser();
        const slotId = `form_${form.id}`;
        this.host.claimSlot(slotId);
        this.shownThisPage.add(form.id);
        this.open = { form, slotId, element: null, pageIndex: 0, values: {}, submitted: false, busy: false };
        this.render();
        this.updateHistory(form.id, { views: (((_a = this.history()[form.id]) === null || _a === void 0 ? void 0 : _a.views) || 0) + 1 });
        this.sendEvents(form.id, [{ type: 'view' }]);
    }
    render() {
        const o = this.open;
        if (!o)
            return;
        removeRendered(o.element, true);
        const pseudoMessage = {
            _id: o.slotId,
            // Steps advance only through a successful submit, so hide the generic Previous/Next buttons.
            config: Object.assign(Object.assign({}, fillPlaceholders(o.form.config, o.values)), { showNavigationButtons: false }),
        };
        o.element = renderMessage(pseudoMessage, {
            currentPageIndex: o.pageIndex,
            containerId: this.host.containerId,
            onDismiss: () => this.close('dismissed'),
            onNavigatePage: (_id, pageIndex) => {
                o.pageIndex = pageIndex;
                this.render();
            },
            onButtonClick: (_id, link, _text, action) => {
                if ((action === null || action === void 0 ? void 0 : action.type) === 'close')
                    return this.close('button');
                const href = (action === null || action === void 0 ? void 0 : action.link) || link;
                // tappd.closeIAM() / nextPage() / previousPage() links are routed here by the SDK.
                if (!href || href === '#' || href.includes('tappd.'))
                    return;
                if ((action === null || action === void 0 ? void 0 : action.type) === 'link' || !action)
                    window.location.href = href;
            },
            onFormSubmit: (_id, data) => {
                this.handleSubmit(data);
            },
        });
    }
    pages() {
        var _a, _b;
        return Array.isArray((_b = (_a = this.open) === null || _a === void 0 ? void 0 : _a.form.config) === null || _b === void 0 ? void 0 : _b.pages) ? this.open.form.config.pages : [];
    }
    handleSubmit(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const o = this.open;
            if (!o || o.busy)
                return;
            const page = this.pages()[o.pageIndex];
            const step = pageStep(page);
            if (!step)
                return this.advance();
            if (step === 'phone' && !o.stepToken)
                return this.advance();
            const fields = collectFormFields(page);
            const parsed = readSubmission(step, data, fields);
            o.busy = true;
            this.setError(null);
            try {
                const res = yield fetch(`${this.host.apiUrl}/forms/${encodeURIComponent(o.form.id)}/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-App-Id': this.host.appId },
                    body: JSON.stringify(Object.assign(Object.assign({ step }, parsed), { stepToken: o.stepToken, anonymousId: this.host.getAnonymousId(), pageUrl: window.location.href })),
                });
                const body = yield res.json().catch(() => ({}));
                if (!res.ok || (body === null || body === void 0 ? void 0 : body.success) === false) {
                    this.setError((body === null || body === void 0 ? void 0 : body.message) || 'Something went wrong. Please try again.');
                    return;
                }
                const result = (body === null || body === void 0 ? void 0 : body.data) || {};
                if (step === 'email') {
                    o.submitted = true;
                    o.stepToken = result.stepToken;
                    o.values = {
                        discount_code: result.code || null,
                        wheel_prize: result.wheelIndex != null ? ((_b = (_a = o.form.wheel) === null || _a === void 0 ? void 0 : _a[result.wheelIndex]) === null || _b === void 0 ? void 0 : _b.label) || null : null,
                    };
                    this.updateHistory(o.form.id, { submittedAt: Date.now() });
                    this.host.rememberEmail(parsed.email);
                    if (result.externalId)
                        this.host.identify(result.externalId, parsed.email).catch(() => undefined);
                    if (result.code)
                        this.applyShopifyDiscount(result.code);
                }
                this.advance();
            }
            catch (err) {
                this.host.log('[Tappd SDK] Signup form submit failed', err);
                this.setError('Could not connect. Check your connection and try again.');
            }
            finally {
                if (this.open === o)
                    o.busy = false;
            }
        });
    }
    /** Next page, or close when the form has no more pages. */
    advance() {
        const o = this.open;
        if (!o)
            return;
        if (o.pageIndex + 1 < this.pages().length) {
            o.pageIndex += 1;
            this.render();
        }
        else {
            this.close('completed');
        }
    }
    setError(message) {
        var _a;
        const root = (_a = this.open) === null || _a === void 0 ? void 0 : _a.element;
        if (!root)
            return;
        const scope = root.closest('.tappd-message-overlay') || root;
        scope.querySelectorAll('.tappd-form-error').forEach((el) => el.remove());
        if (!message)
            return;
        const form = scope.querySelector('.tappd-block-form');
        const note = document.createElement('div');
        note.className = 'tappd-form-error';
        note.setAttribute('role', 'alert');
        note.textContent = message;
        note.style.cssText = 'margin-top:8px;font-size:13px;line-height:1.4;color:#b42318;';
        (form || scope).appendChild(note);
    }
    close(reason) {
        var _a;
        const o = this.open;
        if (!o)
            return;
        removeRendered(o.element);
        this.open = null;
        this.host.releaseSlot(o.slotId);
        if (!o.submitted) {
            this.updateHistory(o.form.id, { closedAt: Date.now() });
            this.sendEvents(o.form.id, [{ type: 'close' }]);
            if (((_a = o.form.teaser) === null || _a === void 0 ? void 0 : _a.enabled) && o.form.teaser.showAfterClose !== false && reason !== 'completed') {
                this.showTeaser(o.form);
            }
        }
    }
    showTeaser(form) {
        if (this.teaserHiddenThisSession || this.teaserEl)
            return;
        const t = form.teaser || {};
        const right = t.position === 'bottom_right' || t.position === 'right';
        const side = t.position === 'left' || t.position === 'right';
        const wrap = document.createElement('div');
        wrap.className = 'tappd-form-teaser';
        wrap.style.cssText = [
            'position:fixed', 'z-index:2147483000', 'display:flex', 'align-items:center', 'gap:4px',
            side ? 'top:50%' : 'bottom:16px',
            right ? 'right:16px' : 'left:16px',
            side ? `transform:translateY(-50%) rotate(${right ? -90 : 90}deg)` : '',
            side ? `transform-origin:${right ? 'right' : 'left'} center` : '',
        ].filter(Boolean).join(';');
        const open = document.createElement('button');
        open.type = 'button';
        open.textContent = t.text || 'Get 10% off';
        open.style.cssText = 'border:0;border-radius:999px;padding:10px 16px;font:600 14px/1.2 system-ui,sans-serif;background:#111;color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.18);';
        open.addEventListener('click', () => {
            this.removeTeaser();
            this.shownThisPage.delete(form.id);
            this.tryShow(form, 0);
        });
        const hide = document.createElement('button');
        hide.type = 'button';
        hide.setAttribute('aria-label', 'Hide offer');
        hide.textContent = '×';
        hide.style.cssText = 'border:0;border-radius:999px;width:28px;height:28px;font:600 16px/1 system-ui,sans-serif;background:#fff;color:#111;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);';
        hide.addEventListener('click', () => {
            this.teaserHiddenThisSession = true;
            this.removeTeaser();
        });
        wrap.appendChild(open);
        wrap.appendChild(hide);
        document.body.appendChild(wrap);
        this.teaserEl = wrap;
    }
    removeTeaser() {
        var _a;
        (_a = this.teaserEl) === null || _a === void 0 ? void 0 : _a.remove();
        this.teaserEl = null;
    }
    /** On Shopify storefronts, visiting /discount/CODE stores the code for checkout. */
    applyShopifyDiscount(code) {
        var _a;
        if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.shop))
            return;
        fetch(`/discount/${encodeURIComponent(code)}`, { credentials: 'same-origin', redirect: 'manual' }).catch(() => undefined);
    }
    sendEvents(formId, events) {
        fetch(`${this.host.apiUrl}/forms/${encodeURIComponent(formId)}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-App-Id': this.host.appId },
            body: JSON.stringify({ events }),
            keepalive: true,
        }).catch(() => undefined);
    }
}
//# sourceMappingURL=signupForms.js.map