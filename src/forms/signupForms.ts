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
import {
  collectFormFields,
  fillPlaceholders,
  isEligible,
  isMobileViewport,
  pageStep,
  readSubmission,
  type FormHistoryMap,
  type PublicSignupForm,
} from './rules';
import { TriggerEngine } from './triggers';

const HISTORY_KEY = '_tappd_forms';
const PAGE_COUNT_KEY = '_tappd_form_pages';
const SLOT_RETRY_MS = 3000;
const SLOT_RETRY_LIMIT = 10;

export interface SignupFormHost {
  appId: string;
  apiUrl: string;
  containerId?: string;
  getAnonymousId(): string;
  getExternalId(): string | null;
  getEmail(): string | undefined;
  /** One message or form on screen at a time. */
  isSlotFree(): boolean;
  claimSlot(id: string): void;
  releaseSlot(id: string): void;
  ensureStyles(): void;
  identify(externalId: string, email: string): Promise<void>;
  rememberEmail(email: string): void;
  log(...args: any[]): void;
}

interface OpenForm {
  form: PublicSignupForm;
  slotId: string;
  element: HTMLElement | null;
  pageIndex: number;
  values: { discount_code?: string | null; wheel_prize?: string | null };
  stepToken?: string;
  submitted: boolean;
  busy: boolean;
}

function storageGet(store: Storage | undefined, key: string): string | null {
  try { return store ? store.getItem(key) : null; } catch { return null; }
}
function storageSet(store: Storage | undefined, key: string, value: string): void {
  try { store?.setItem(key, value); } catch { /* private mode */ }
}

function removeRendered(el: HTMLElement | null, immediate = false): void {
  if (!el) return;
  const overlay = (el.closest('.tappd-message-overlay') as HTMLElement) || el;
  if (immediate) {
    overlay.remove();
    return;
  }
  overlay.style.transition = 'opacity 0.2s ease-out';
  overlay.style.opacity = '0';
  setTimeout(() => overlay.remove(), 200);
}

export class SignupForms {
  private forms: PublicSignupForm[] = [];
  private engines = new Map<string, TriggerEngine>();
  private open: OpenForm | null = null;
  private teaserEl: HTMLElement | null = null;
  private teaserHiddenThisSession = false;
  private shownThisPage = new Set<string>();
  private started = false;
  private loaded = false;

  constructor(private host: SignupFormHost) {}

  async start(): Promise<void> {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    try {
      const res = await fetch(`${this.host.apiUrl}/forms/active`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'X-App-Id': this.host.appId },
      });
      if (!res.ok) return;
      const body = await res.json();
      this.forms = Array.isArray(body?.data?.forms) ? body.data.forms : [];
    } catch (err) {
      this.host.log('[Tappd SDK] Signup forms fetch failed', err);
      return;
    }
    this.loaded = true;
    if (!this.forms.length) return;
    this.host.ensureStyles();
    this.onPageView();
  }

  /** Call on every page view (including SPA route changes). */
  onPageView(): void {
    // Page views before the forms load are covered by start(), which counts the current page.
    if (!this.loaded) return;
    const count = Number(storageGet(window.sessionStorage, PAGE_COUNT_KEY) || 0) + 1;
    storageSet(window.sessionStorage, PAGE_COUNT_KEY, String(count));
    if (!this.forms.length) return;
    this.shownThisPage.clear();
    this.evaluate(count);
  }

  /** Call on every tracked event so event triggers can fire. */
  onEvent(name: string): void {
    this.engines.forEach((engine) => engine.notifyEvent(name));
  }

  /** True while a form is on screen (the SDK routes close/next/previous links here). */
  isOpen(): boolean {
    return Boolean(this.open);
  }

  closeFromButton(): void {
    this.close('button');
  }

  /** Next-page links only move past pages without a form step, so nobody skips the email step. */
  nextFromButton(): void {
    const o = this.open;
    if (!o) return;
    const step = pageStep(this.pages()[o.pageIndex]);
    if (step === 'email' || (step === 'phone' && !o.submitted)) return;
    this.advance();
  }

  previousFromButton(): void {
    const o = this.open;
    if (!o || o.pageIndex === 0 || o.submitted) return;
    o.pageIndex -= 1;
    this.render();
  }

  destroy(): void {
    this.engines.forEach((e) => e.destroy());
    this.engines.clear();
    this.removeTeaser();
  }

  private history(): FormHistoryMap {
    try { return JSON.parse(storageGet(window.localStorage, HISTORY_KEY) || '{}') || {}; } catch { return {}; }
  }

  private updateHistory(formId: string, patch: Record<string, number>): void {
    const all = this.history();
    all[formId] = { ...(all[formId] || {}), ...patch };
    storageSet(window.localStorage, HISTORY_KEY, JSON.stringify(all));
  }

  private eligibleForms(): PublicSignupForm[] {
    const ctx = {
      url: window.location.href,
      mobile: isMobileViewport(window.innerWidth, navigator.userAgent),
      visitor: { known: Boolean(this.host.getExternalId()), subscribed: Boolean(this.host.getEmail()) },
      history: this.history(),
      now: Date.now(),
    };
    return this.forms.filter((f) => isEligible(f, ctx));
  }

  private evaluate(pageCount: number): void {
    this.engines.forEach((e) => e.destroy());
    this.engines.clear();
    const eligible = this.eligibleForms();
    const mobile = isMobileViewport(window.innerWidth, navigator.userAgent);

    for (const form of eligible) {
      const rules = form.triggers?.rules || [];
      if (!rules.length) continue;
      const engine = new TriggerEngine(rules, form.triggers?.match === 'all' ? 'all' : 'any', { pageCount, mobile }, () => {
        this.engines.delete(form.id);
        this.tryShow(form, 0);
      });
      this.engines.set(form.id, engine);
      engine.start();
    }

    const teaserForm = eligible.find((f) => f.teaser?.enabled && f.teaser?.showBeforeOpen);
    if (teaserForm && !this.open) this.showTeaser(teaserForm);
  }

  private tryShow(form: PublicSignupForm, attempt: number): void {
    if (this.open || this.shownThisPage.has(form.id)) return;
    if (!this.host.isSlotFree()) {
      if (attempt < SLOT_RETRY_LIMIT) setTimeout(() => this.tryShow(form, attempt + 1), SLOT_RETRY_MS);
      return;
    }
    this.show(form);
  }

  private show(form: PublicSignupForm): void {
    this.removeTeaser();
    const slotId = `form_${form.id}`;
    this.host.claimSlot(slotId);
    this.shownThisPage.add(form.id);
    this.open = { form, slotId, element: null, pageIndex: 0, values: {}, submitted: false, busy: false };
    this.render();
    this.updateHistory(form.id, { views: (this.history()[form.id]?.views || 0) + 1 });
    this.sendEvents(form.id, [{ type: 'view' }]);
  }

  private render(): void {
    const o = this.open;
    if (!o) return;
    removeRendered(o.element, true);
    const pseudoMessage: any = {
      _id: o.slotId,
      // Steps advance only through a successful submit, so hide the generic Previous/Next buttons.
      config: { ...fillPlaceholders(o.form.config, o.values), showNavigationButtons: false },
    };
    o.element = renderMessage(pseudoMessage, {
      currentPageIndex: o.pageIndex,
      containerId: this.host.containerId,
      onDismiss: () => this.close('dismissed'),
      onNavigatePage: (_id: string, pageIndex: number) => {
        o.pageIndex = pageIndex;
        this.render();
      },
      onButtonClick: (_id: string, link: string, _text: string, action?: any) => {
        if (action?.type === 'close') return this.close('button');
        const href = action?.link || link;
        // tappd.closeIAM() / nextPage() / previousPage() links are routed here by the SDK.
        if (!href || href === '#' || href.includes('tappd.')) return;
        if (action?.type === 'link' || !action) window.location.href = href;
      },
      onFormSubmit: (_id: string, data: Record<string, any>) => {
        this.handleSubmit(data);
      },
    });
  }

  private pages(): any[] {
    return Array.isArray(this.open?.form.config?.pages) ? this.open!.form.config.pages : [];
  }

  private async handleSubmit(data: Record<string, any>): Promise<void> {
    const o = this.open;
    if (!o || o.busy) return;
    const page = this.pages()[o.pageIndex];
    const step = pageStep(page);
    if (!step) return this.advance();
    if (step === 'phone' && !o.stepToken) return this.advance();

    const fields = collectFormFields(page);
    const parsed: any = readSubmission(step, data, fields);
    o.busy = true;
    this.setError(null);
    try {
      const res = await fetch(`${this.host.apiUrl}/forms/${encodeURIComponent(o.form.id)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Id': this.host.appId },
        body: JSON.stringify({
          step,
          ...parsed,
          stepToken: o.stepToken,
          anonymousId: this.host.getAnonymousId(),
          pageUrl: window.location.href,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.success === false) {
        this.setError(body?.message || 'Something went wrong. Please try again.');
        return;
      }
      const result = body?.data || {};
      if (step === 'email') {
        o.submitted = true;
        o.stepToken = result.stepToken;
        o.values = {
          discount_code: result.code || null,
          wheel_prize: result.wheelIndex != null ? o.form.wheel?.[result.wheelIndex]?.label || null : null,
        };
        this.updateHistory(o.form.id, { submittedAt: Date.now() });
        this.host.rememberEmail(parsed.email);
        if (result.externalId) this.host.identify(result.externalId, parsed.email).catch(() => undefined);
        if (result.code) this.applyShopifyDiscount(result.code);
      }
      this.advance();
    } catch (err) {
      this.host.log('[Tappd SDK] Signup form submit failed', err);
      this.setError('Could not connect. Check your connection and try again.');
    } finally {
      if (this.open === o) o.busy = false;
    }
  }

  /** Next page, or close when the form has no more pages. */
  private advance(): void {
    const o = this.open;
    if (!o) return;
    if (o.pageIndex + 1 < this.pages().length) {
      o.pageIndex += 1;
      this.render();
    } else {
      this.close('completed');
    }
  }

  private setError(message: string | null): void {
    const root = this.open?.element;
    if (!root) return;
    const scope = (root.closest('.tappd-message-overlay') as HTMLElement) || root;
    scope.querySelectorAll('.tappd-form-error').forEach((el) => el.remove());
    if (!message) return;
    const form = scope.querySelector('.tappd-block-form');
    const note = document.createElement('div');
    note.className = 'tappd-form-error';
    note.setAttribute('role', 'alert');
    note.textContent = message;
    note.style.cssText = 'margin-top:8px;font-size:13px;line-height:1.4;color:#b42318;';
    (form || scope).appendChild(note);
  }

  private close(reason: 'dismissed' | 'button' | 'completed'): void {
    const o = this.open;
    if (!o) return;
    removeRendered(o.element);
    this.open = null;
    this.host.releaseSlot(o.slotId);
    if (!o.submitted) {
      this.updateHistory(o.form.id, { closedAt: Date.now() });
      this.sendEvents(o.form.id, [{ type: 'close' }]);
      if (o.form.teaser?.enabled && o.form.teaser.showAfterClose !== false && reason !== 'completed') {
        this.showTeaser(o.form);
      }
    }
  }

  private showTeaser(form: PublicSignupForm): void {
    if (this.teaserHiddenThisSession || this.teaserEl) return;
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

  private removeTeaser(): void {
    this.teaserEl?.remove();
    this.teaserEl = null;
  }

  /** On Shopify storefronts, visiting /discount/CODE stores the code for checkout. */
  private applyShopifyDiscount(code: string): void {
    if (!(window as any).Shopify?.shop) return;
    fetch(`/discount/${encodeURIComponent(code)}`, { credentials: 'same-origin', redirect: 'manual' }).catch(() => undefined);
  }

  private sendEvents(formId: string, events: { type: 'view' | 'close' }[]): void {
    fetch(`${this.host.apiUrl}/forms/${encodeURIComponent(formId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Id': this.host.appId },
      body: JSON.stringify({ events }),
      keepalive: true,
    }).catch(() => undefined);
  }
}
