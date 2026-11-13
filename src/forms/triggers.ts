/**
 * Watches the page for a form's open conditions and calls `onFire` once when they are met.
 * match 'any' fires on the first satisfied rule; 'all' waits until every rule has been
 * satisfied at least once on this page. Call destroy() on route change or after firing.
 */
import type { TriggerRule } from './rules';

const EXIT_MIN_DWELL_MS = 5000;
const MOBILE_EXIT_SCROLL_PX = 120;
const MOBILE_EXIT_WINDOW_MS = 250;

export interface TriggerEnv {
  /** Pages viewed this session, including the current one. */
  pageCount: number;
  mobile: boolean;
  now?: () => number;
}

export class TriggerEngine {
  private satisfied = new Set<number>();
  private cleanups: Array<() => void> = [];
  private fired = false;
  private readonly startedAt: number;
  private readonly now: () => number;

  constructor(
    private rules: TriggerRule[],
    private match: 'any' | 'all',
    private env: TriggerEnv,
    private onFire: () => void,
  ) {
    this.now = env.now || (() => Date.now());
    this.startedAt = this.now();
  }

  start(): void {
    if (!this.rules.length) return;
    this.rules.forEach((rule, i) => this.watch(rule, i));
  }

  /** Feed tracked event names in (from sdk.track). */
  notifyEvent(name: string): void {
    this.rules.forEach((rule, i) => {
      if (rule.type === 'event' && String(rule.value) === name) this.mark(i);
    });
  }

  destroy(): void {
    this.cleanups.forEach((fn) => {
      try { fn(); } catch { /* ignore */ }
    });
    this.cleanups = [];
  }

  private mark(index: number): void {
    if (this.fired) return;
    this.satisfied.add(index);
    const done = this.match === 'all' ? this.satisfied.size >= this.rules.length : true;
    if (done) {
      this.fired = true;
      this.destroy();
      this.onFire();
    }
  }

  private watch(rule: TriggerRule, i: number): void {
    switch (rule.type) {
      case 'immediate':
        // Next tick so all watchers are set up before an 'all' check.
        setTimeout(() => this.mark(i), 0);
        break;
      case 'page_count':
        if (this.env.pageCount >= Math.max(1, Number(rule.value) || 1)) setTimeout(() => this.mark(i), 0);
        break;
      case 'time_on_page':
        this.watchVisibleTime(Math.max(0, Number(rule.value) || 0) * 1000, i);
        break;
      case 'scroll_depth':
        this.watchScroll(Math.min(100, Math.max(1, Number(rule.value) || 50)), i);
        break;
      case 'exit_intent':
        this.watchExitIntent(i);
        break;
      case 'event':
        // Satisfied via notifyEvent.
        break;
    }
  }

  /** Counts only time the tab is visible. */
  private watchVisibleTime(ms: number, i: number): void {
    let remaining = ms;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let resumedAt = this.now();
    const arm = () => {
      resumedAt = this.now();
      timer = setTimeout(() => this.mark(i), remaining);
    };
    const onVisibility = () => {
      if (document.hidden) {
        if (timer) clearTimeout(timer);
        timer = null;
        remaining = Math.max(0, remaining - (this.now() - resumedAt));
      } else if (!timer) {
        arm();
      }
    };
    if (!document.hidden) arm();
    document.addEventListener('visibilitychange', onVisibility);
    this.cleanups.push(() => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  }

  private watchScroll(percent: number, i: number): void {
    let ticking = false;
    const check = () => {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = Math.max(doc.scrollHeight, document.body?.scrollHeight || 0) - window.innerHeight;
      const depth = scrollable <= 0 ? 100 : ((window.scrollY || doc.scrollTop) / scrollable) * 100;
      if (depth >= percent) this.mark(i);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(check);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    this.cleanups.push(() => window.removeEventListener('scroll', onScroll));
  }

  /**
   * Desktop: pointer leaves through the top edge (towards tabs or the address bar).
   * Mobile: a fast scroll back up after reading part of the page.
   */
  private watchExitIntent(i: number): void {
    const dwellOk = () => this.now() - this.startedAt >= EXIT_MIN_DWELL_MS;
    if (!this.env.mobile) {
      const onOut = (e: MouseEvent) => {
        if (!e.relatedTarget && e.clientY <= 0 && dwellOk()) this.mark(i);
      };
      document.addEventListener('mouseout', onOut);
      this.cleanups.push(() => document.removeEventListener('mouseout', onOut));
      return;
    }
    let lastY = window.scrollY;
    let lastT = this.now();
    let maxY = lastY;
    const onScroll = () => {
      const y = window.scrollY;
      const t = this.now();
      maxY = Math.max(maxY, y);
      const up = lastY - y;
      if (up >= MOBILE_EXIT_SCROLL_PX && t - lastT <= MOBILE_EXIT_WINDOW_MS && maxY > window.innerHeight * 0.5 && dwellOk()) {
        this.mark(i);
      }
      if (t - lastT > MOBILE_EXIT_WINDOW_MS || y > lastY) {
        lastY = y;
        lastT = t;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    this.cleanups.push(() => window.removeEventListener('scroll', onScroll));
  }
}
