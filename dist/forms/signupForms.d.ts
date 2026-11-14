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
export declare class SignupForms {
    private host;
    private forms;
    private engines;
    private open;
    private teaserEl;
    private teaserHiddenThisSession;
    private shownThisPage;
    private started;
    private loaded;
    constructor(host: SignupFormHost);
    start(): Promise<void>;
    /** Call on every page view (including SPA route changes). */
    onPageView(): void;
    /** Call on every tracked event so event triggers can fire. */
    onEvent(name: string): void;
    /** True while a form is on screen (the SDK routes close/next/previous links here). */
    isOpen(): boolean;
    closeFromButton(): void;
    /** Next-page links only move past pages without a form step, so nobody skips the email step. */
    nextFromButton(): void;
    previousFromButton(): void;
    destroy(): void;
    private history;
    private updateHistory;
    private eligibleForms;
    private evaluate;
    private tryShow;
    private show;
    private render;
    private pages;
    private handleSubmit;
    /** Next page, or close when the form has no more pages. */
    private advance;
    /** Greys out the form's controls while the wheel spins. */
    private setSubmitting;
    private setError;
    private close;
    private showTeaser;
    private removeTeaser;
    /** On Shopify storefronts, visiting /discount/CODE stores the code for checkout. */
    private applyShopifyDiscount;
    /**
     * The A/B design for this visitor. Stored per form so it survives identify() changing the
     * anonymous id; a new test (new key) assigns again.
     */
    private chooseVariant;
    private sendEvents;
}
//# sourceMappingURL=signupForms.d.ts.map