const EXIT_MIN_DWELL_MS = 5000;
const MOBILE_EXIT_SCROLL_PX = 120;
const MOBILE_EXIT_WINDOW_MS = 250;
export class TriggerEngine {
    constructor(rules, match, env, onFire) {
        this.rules = rules;
        this.match = match;
        this.env = env;
        this.onFire = onFire;
        this.satisfied = new Set();
        this.cleanups = [];
        this.fired = false;
        this.now = env.now || (() => Date.now());
        this.startedAt = this.now();
    }
    start() {
        if (!this.rules.length)
            return;
        this.rules.forEach((rule, i) => this.watch(rule, i));
    }
    /** Feed tracked event names in (from sdk.track). */
    notifyEvent(name) {
        this.rules.forEach((rule, i) => {
            if (rule.type === 'event' && String(rule.value) === name)
                this.mark(i);
        });
    }
    destroy() {
        this.cleanups.forEach((fn) => {
            try {
                fn();
            }
            catch ( /* ignore */_a) { /* ignore */ }
        });
        this.cleanups = [];
    }
    mark(index) {
        if (this.fired)
            return;
        this.satisfied.add(index);
        const done = this.match === 'all' ? this.satisfied.size >= this.rules.length : true;
        if (done) {
            this.fired = true;
            this.destroy();
            this.onFire();
        }
    }
    watch(rule, i) {
        switch (rule.type) {
            case 'immediate':
                // Next tick so all watchers are set up before an 'all' check.
                setTimeout(() => this.mark(i), 0);
                break;
            case 'page_count':
                if (this.env.pageCount >= Math.max(1, Number(rule.value) || 1))
                    setTimeout(() => this.mark(i), 0);
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
    watchVisibleTime(ms, i) {
        let remaining = ms;
        let timer = null;
        let resumedAt = this.now();
        const arm = () => {
            resumedAt = this.now();
            timer = setTimeout(() => this.mark(i), remaining);
        };
        const onVisibility = () => {
            if (document.hidden) {
                if (timer)
                    clearTimeout(timer);
                timer = null;
                remaining = Math.max(0, remaining - (this.now() - resumedAt));
            }
            else if (!timer) {
                arm();
            }
        };
        if (!document.hidden)
            arm();
        document.addEventListener('visibilitychange', onVisibility);
        this.cleanups.push(() => {
            if (timer)
                clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisibility);
        });
    }
    watchScroll(percent, i) {
        let ticking = false;
        const check = () => {
            var _a;
            ticking = false;
            const doc = document.documentElement;
            const scrollable = Math.max(doc.scrollHeight, ((_a = document.body) === null || _a === void 0 ? void 0 : _a.scrollHeight) || 0) - window.innerHeight;
            const depth = scrollable <= 0 ? 100 : ((window.scrollY || doc.scrollTop) / scrollable) * 100;
            if (depth >= percent)
                this.mark(i);
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
    watchExitIntent(i) {
        const dwellOk = () => this.now() - this.startedAt >= EXIT_MIN_DWELL_MS;
        if (!this.env.mobile) {
            const onOut = (e) => {
                if (!e.relatedTarget && e.clientY <= 0 && dwellOk())
                    this.mark(i);
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
//# sourceMappingURL=triggers.js.map