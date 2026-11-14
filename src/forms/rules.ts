/**
 * Pure rules for signup forms: page targeting, device and audience checks, and how often a
 * form may show. No DOM access here, so these are easy to test.
 */

export type UrlRule = { op: 'equals' | 'contains' | 'starts_with' | 'regex'; value: string; exclude?: boolean };
export type TriggerRule = {
  type: 'immediate' | 'time_on_page' | 'scroll_depth' | 'exit_intent' | 'page_count' | 'event';
  value?: number | string;
};

export interface PublicSignupForm {
  id: string;
  name: string;
  config: any;
  teaser?: { enabled?: boolean; text?: string; position?: string; showBeforeOpen?: boolean; showAfterClose?: boolean };
  triggers?: { match?: 'any' | 'all'; rules?: TriggerRule[] };
  targeting?: { urlRules?: UrlRule[]; devices?: 'all' | 'desktop' | 'mobile'; audience?: 'all' | 'anonymous' | 'not_subscribed' };
  frequency?: { hideDaysAfterClose?: number; hideAfterSubmit?: boolean };
  wheel?: { label: string }[];
  hasOffer?: boolean;
  consent?: { emailText?: string; smsText?: string };
  /** Double opt-in: the code arrives after the email is confirmed. */
  doubleOptIn?: boolean;
  /** Shown in place of {{ discount_code }} while the signup awaits confirmation. */
  pendingNotice?: string;
  /** Running A/B test: each design with its share of traffic. `key` changes per test. */
  experiment?: { key: string; variants: { id: string; weight: number; config: any }[] };
  publishedAt?: string;
}

export interface FormHistory {
  closedAt?: number;
  submittedAt?: number;
  views?: number;
  /** A/B test assignment, "<experiment key>:<variant id>", so a visitor keeps seeing one design. */
  variant?: string;
}

export type FormHistoryMap = Record<string, FormHistory>;

const DAY_MS = 24 * 60 * 60 * 1000;

function normalizePath(url: string): string {
  try {
    const u = new URL(url, 'https://x.invalid');
    return `${u.pathname}${u.search}`;
  } catch {
    return url;
  }
}

function matchesOne(rule: UrlRule, url: string): boolean {
  const value = String(rule.value || '');
  if (!value) return false;
  const path = normalizePath(url);
  switch (rule.op) {
    case 'equals':
      return path === value || url === value || path.replace(/\/$/, '') === value.replace(/\/$/, '');
    case 'starts_with':
      return path.startsWith(value) || url.startsWith(value);
    case 'regex':
      try {
        return new RegExp(value).test(url);
      } catch {
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
export function urlMatches(rules: UrlRule[] | undefined, url: string): boolean {
  const list = Array.isArray(rules) ? rules.filter((r) => r && r.value) : [];
  const includes = list.filter((r) => !r.exclude);
  const excludes = list.filter((r) => r.exclude);
  if (excludes.some((r) => matchesOne(r, url))) return false;
  return includes.length === 0 || includes.some((r) => matchesOne(r, url));
}

export function isMobileViewport(width: number, userAgent: string): boolean {
  return width < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
}

export function deviceMatches(devices: string | undefined, mobile: boolean): boolean {
  if (devices === 'desktop') return !mobile;
  if (devices === 'mobile') return mobile;
  return true;
}

/**
 * known: the visitor is identified (has an external id).
 * subscribed: they already gave us an email through a form or identify.
 */
export function audienceMatches(audience: string | undefined, visitor: { known: boolean; subscribed: boolean }): boolean {
  if (audience === 'anonymous') return !visitor.known;
  if (audience === 'not_subscribed') return !visitor.subscribed;
  return true;
}

/** True when frequency settings say the form must stay hidden for now. */
export function isSnoozed(form: PublicSignupForm, history: FormHistory | undefined, now: number): boolean {
  if (!history) return false;
  const freq = form.frequency || {};
  if (history.submittedAt && freq.hideAfterSubmit !== false) return true;
  const days = Number(freq.hideDaysAfterClose ?? 7);
  if (history.closedAt && days > 0 && now - history.closedAt < days * DAY_MS) return true;
  return false;
}

export interface EligibilityContext {
  url: string;
  mobile: boolean;
  visitor: { known: boolean; subscribed: boolean };
  history: FormHistoryMap;
  now: number;
}

/** FNV-1a: a small, stable string hash for assigning designs. */
export function hashString(s: string): number {
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
export function pickVariant(variants: { id: string; weight: number }[], seed: string): string | null {
  const live = variants.filter((v) => Number(v.weight) > 0);
  const total = live.reduce((sum, v) => sum + Number(v.weight), 0);
  if (!(total > 0)) return null;
  let point = (hashString(seed) % 10000) / 10000 * total;
  for (const v of live) {
    point -= Number(v.weight);
    if (point < 0) return v.id;
  }
  return live[live.length - 1].id;
}

export function isEligible(form: PublicSignupForm, ctx: EligibilityContext): boolean {
  if (!form?.id || !form.config) return false;
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
export function fillPlaceholders(config: any, values: { discount_code?: string | null; wheel_prize?: string | null }): any {
  const clean = (s: string) => s.replace(/[<>&"'`]/g, '');
  const swap = (s: string) => s
    .replace(/\{\{\s*discount_code\s*\}\}/g, clean(values.discount_code || ''))
    .replace(/\{\{\s*wheel_prize\s*\}\}/g, clean(values.wheel_prize || ''));
  const walk = (v: any): any => {
    if (typeof v === 'string') return swap(v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: any = {};
      for (const k of Object.keys(v)) out[k] = walk(v[k]);
      return out;
    }
    return v;
  };
  return walk(config);
}

/** Child blocks of a block: rows keep them in config.row.cells (columns of blocks). */
function childBlocks(b: any): any[] {
  const out: any[] = [];
  if (Array.isArray(b?.children)) out.push(...b.children);
  if (Array.isArray(b?.config?.children)) out.push(...b.config.children);
  const cells = b?.config?.row?.cells;
  if (Array.isArray(cells)) for (const cell of cells) if (Array.isArray(cell)) out.push(...cell);
  return out;
}

/** Every form field on a page, including forms nested in rows. */
export function collectFormFields(page: any): { name: string; type: string }[] {
  const fields: { name: string; type: string }[] = [];
  const walk = (blocks: any[]) => {
    for (const b of blocks || []) {
      if (b?.type === 'form') fields.push(...(b.config?.form?.fields || []));
      walk(childBlocks(b));
    }
  };
  walk(page?.blocks || []);
  return fields;
}

/** What a form page asks for, based on its fields: an email step, a phone step, or neither. */
export function pageStep(page: any): 'email' | 'phone' | null {
  const fields = collectFormFields(page);
  if (fields.some((f) => f?.type === 'email')) return 'email';
  if (fields.some((f) => f?.type === 'tel')) return 'phone';
  return null;
}

/** Splits submitted form values into what the API expects for each step. */
export function readSubmission(step: 'email' | 'phone', data: Record<string, any>, fields: { name: string; type: string }[]) {
  const byType = (type: string) => fields.find((f) => f.type === type)?.name;
  if (step === 'email') {
    const emailKey = byType('email');
    const email = emailKey ? String(data[emailKey] || '').trim() : '';
    const extra: Record<string, any> = {};
    for (const f of fields) if (f.name !== emailKey) extra[f.name] = data[f.name];
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
