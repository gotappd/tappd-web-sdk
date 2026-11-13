/**
 * Watches the page for a form's open conditions and calls `onFire` once when they are met.
 * match 'any' fires on the first satisfied rule; 'all' waits until every rule has been
 * satisfied at least once on this page. Call destroy() on route change or after firing.
 */
import type { TriggerRule } from './rules';
export interface TriggerEnv {
    /** Pages viewed this session, including the current one. */
    pageCount: number;
    mobile: boolean;
    now?: () => number;
}
export declare class TriggerEngine {
    private rules;
    private match;
    private env;
    private onFire;
    private satisfied;
    private cleanups;
    private fired;
    private readonly startedAt;
    private readonly now;
    constructor(rules: TriggerRule[], match: 'any' | 'all', env: TriggerEnv, onFire: () => void);
    start(): void;
    /** Feed tracked event names in (from sdk.track). */
    notifyEvent(name: string): void;
    destroy(): void;
    private mark;
    private watch;
    /** Counts only time the tab is visible. */
    private watchVisibleTime;
    private watchScroll;
    /**
     * Desktop: pointer leaves through the top edge (towards tabs or the address bar).
     * Mobile: a fast scroll back up after reading part of the page.
     */
    private watchExitIntent;
}
//# sourceMappingURL=triggers.d.ts.map