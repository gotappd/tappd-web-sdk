/**
 * Client-side attribution touch store.
 * Persists engagement touches in localStorage for conversion attribution,
 * with offline queue + sync to the server.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const TOUCHES_KEY = '_tappd_attribution_touches';
const QUEUE_KEY = '_tappd_attribution_queue';
const MAX_TOUCHES = 100;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
function safeParse(raw, fallback) {
    if (!raw)
        return fallback;
    try {
        return JSON.parse(raw);
    }
    catch (_a) {
        return fallback;
    }
}
function pruneTouches(touches) {
    const cutoff = Date.now() - MAX_AGE_MS;
    return touches
        .filter((t) => {
        const ts = new Date(t.timestamp).getTime();
        return Number.isFinite(ts) && ts >= cutoff;
    })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, MAX_TOUCHES);
}
export function loadAttributionTouches() {
    try {
        const touches = safeParse(localStorage.getItem(TOUCHES_KEY), []);
        return pruneTouches(Array.isArray(touches) ? touches : []);
    }
    catch (_a) {
        return [];
    }
}
export function saveAttributionTouches(touches) {
    try {
        localStorage.setItem(TOUCHES_KEY, JSON.stringify(pruneTouches(touches)));
    }
    catch (_a) {
        // ignore quota / private mode
    }
}
export function recordLocalTouch(partial) {
    const timestamp = partial.timestamp
        ? new Date(partial.timestamp).toISOString()
        : new Date().toISOString();
    const clientTouchId = partial.clientTouchId
        || `${partial.channel}:${partial.messageId || partial.deliveryLogId || 'unknown'}:${partial.touchType}:${timestamp}`;
    const touch = Object.assign(Object.assign({}, partial), { clientTouchId,
        timestamp });
    const existing = loadAttributionTouches();
    const withoutDup = existing.filter((t) => t.clientTouchId !== touch.clientTouchId);
    withoutDup.unshift(touch);
    saveAttributionTouches(withoutDup);
    enqueueOffline({ type: 'touch', touch });
    return touch;
}
export function getTouchesForConversion() {
    return loadAttributionTouches();
}
function loadQueue() {
    try {
        return safeParse(localStorage.getItem(QUEUE_KEY), []);
    }
    catch (_a) {
        return [];
    }
}
function saveQueue(queue) {
    try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-200)));
    }
    catch (_a) {
        // ignore
    }
}
export function enqueueOffline(item) {
    const queue = loadQueue();
    queue.push(Object.assign(Object.assign({}, item), { createdAt: new Date().toISOString() }));
    saveQueue(queue);
}
/**
 * Flush offline queue + current touches to the server.
 */
export function flushAttributionSync(post, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const touches = loadAttributionTouches();
        if (touches.length) {
            try {
                yield post('/attribution/touches', {
                    touches,
                    anonymousId: context.anonymousId,
                    userId: context.userId || undefined,
                    external_id: context.externalId || undefined,
                });
            }
            catch (_a) {
                // keep local; will retry
                return;
            }
        }
        const queue = loadQueue();
        if (!queue.length)
            return;
        const remaining = [];
        for (const item of queue) {
            try {
                if (item.type === 'touch' && item.touch) {
                    yield post('/attribution/touches', {
                        touches: [item.touch],
                        anonymousId: context.anonymousId,
                        userId: context.userId || undefined,
                        external_id: context.externalId || undefined,
                    });
                }
                else if (item.type === 'merge' && item.payload) {
                    yield post('/attribution/identify-merge', Object.assign(Object.assign({}, item.payload), { anonymousId: context.anonymousId, userId: context.userId || undefined, external_id: context.externalId || undefined }));
                }
            }
            catch (_b) {
                remaining.push(item);
            }
        }
        saveQueue(remaining);
    });
}
export function syncIdentifyMerge(post, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = {
            anonymousId: context.anonymousId,
            userId: context.userId || undefined,
            external_id: context.externalId || undefined,
            customerId: context.customerId,
        };
        try {
            yield post('/attribution/identify-merge', payload);
        }
        catch (_a) {
            enqueueOffline({ type: 'merge', payload });
        }
    });
}
//# sourceMappingURL=attributionStore.js.map