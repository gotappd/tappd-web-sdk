/**
 * Pure rules for signup forms: page targeting, device and audience checks, and how often a
 * form may show. No DOM access here, so these are easy to test.
 */
export type UrlRule = {
    op: 'equals' | 'contains' | 'starts_with' | 'regex';
    value: string;
    exclude?: boolean;
};
export type TriggerRule = {
    type: 'immediate' | 'time_on_page' | 'scroll_depth' | 'exit_intent' | 'page_count' | 'event';
    value?: number | string;
};
export interface PublicSignupForm {
    id: string;
    name: string;
    config: any;
    teaser?: {
        enabled?: boolean;
        text?: string;
        position?: string;
        showBeforeOpen?: boolean;
        showAfterClose?: boolean;
    };
    triggers?: {
        match?: 'any' | 'all';
        rules?: TriggerRule[];
    };
    targeting?: {
        urlRules?: UrlRule[];
        devices?: 'all' | 'desktop' | 'mobile';
        audience?: 'all' | 'anonymous' | 'not_subscribed';
    };
    frequency?: {
        hideDaysAfterClose?: number;
        hideAfterSubmit?: boolean;
    };
    wheel?: {
        label: string;
    }[];
    hasOffer?: boolean;
    consent?: {
        emailText?: string;
        smsText?: string;
    };
    /** Double opt-in: the code arrives after the email is confirmed. */
    doubleOptIn?: boolean;
    /** Shown in place of {{ discount_code }} while the signup awaits confirmation. */
    pendingNotice?: string;
    /** Running A/B test: each design with its share of traffic. `key` changes per test. */
    experiment?: {
        key: string;
        variants: {
            id: string;
            weight: number;
            config: any;
        }[];
    };
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
/**
 * Include rules: page must match at least one (no include rules = every page).
 * Exclude rules: page must match none.
 */
export declare function urlMatches(rules: UrlRule[] | undefined, url: string): boolean;
export declare function isMobileViewport(width: number, userAgent: string): boolean;
export declare function deviceMatches(devices: string | undefined, mobile: boolean): boolean;
/**
 * known: the visitor is identified (has an external id).
 * subscribed: they already gave us an email through a form or identify.
 */
export declare function audienceMatches(audience: string | undefined, visitor: {
    known: boolean;
    subscribed: boolean;
}): boolean;
/** True when frequency settings say the form must stay hidden for now. */
export declare function isSnoozed(form: PublicSignupForm, history: FormHistory | undefined, now: number): boolean;
export interface EligibilityContext {
    url: string;
    mobile: boolean;
    visitor: {
        known: boolean;
        subscribed: boolean;
    };
    history: FormHistoryMap;
    now: number;
}
/** FNV-1a: a small, stable string hash for assigning designs. */
export declare function hashString(s: string): number;
/**
 * Picks a design for a visitor. The same seed always gets the same design, and designs
 * are chosen in proportion to their weights. Returns null when no design has weight.
 */
export declare function pickVariant(variants: {
    id: string;
    weight: number;
}[], seed: string): string | null;
export declare function isEligible(form: PublicSignupForm, ctx: EligibilityContext): boolean;
/**
 * Replaces {{ discount_code }} and {{ wheel_prize }} in every string of a form config.
 * Text blocks show plain text while HTML blocks and notices use markup, so values are
 * stripped of markup characters instead of escaped (escaping would show up twice in text).
 */
export declare function fillPlaceholders(config: any, values: {
    discount_code?: string | null;
    wheel_prize?: string | null;
}): any;
/** Every form field on a page, including forms nested in rows. */
export declare function collectFormFields(page: any): {
    name: string;
    type: string;
}[];
/** What a form page asks for, based on its fields: an email step, a phone step, or neither. */
export declare function pageStep(page: any): 'email' | 'phone' | null;
/** Splits submitted form values into what the API expects for each step. */
export declare function readSubmission(step: 'email' | 'phone', data: Record<string, any>, fields: {
    name: string;
    type: string;
}[]): {
    email: string;
    fields: Record<string, any>;
    phone?: undefined;
    smsConsent?: undefined;
} | {
    phone: string;
    smsConsent: boolean;
    email?: undefined;
    fields?: undefined;
};
//# sourceMappingURL=rules.d.ts.map