/**
 * Client-side attribution touch store.
 * Persists engagement touches in localStorage for conversion attribution,
 * with offline queue + sync to the server.
 */

export type AttributionChannel = 'email' | 'push' | 'in_app_message' | 'card';
export type AttributionTouchType = 'click' | 'impression';

export interface AttributionTouchRecord {
  clientTouchId: string;
  messageId?: string;
  deliveryLogId?: string;
  journeyId?: string;
  enrollmentId?: string;
  stepId?: string;
  channel: AttributionChannel;
  touchType: AttributionTouchType;
  timestamp: string;
  isMachine?: boolean;
  isTest?: boolean;
  source?: string;
  sessionId?: string;
}

const TOUCHES_KEY = '_tappd_attribution_touches';
const QUEUE_KEY = '_tappd_attribution_queue';
const MAX_TOUCHES = 100;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function pruneTouches(touches: AttributionTouchRecord[]): AttributionTouchRecord[] {
  const cutoff = Date.now() - MAX_AGE_MS;
  return touches
    .filter((t) => {
      const ts = new Date(t.timestamp).getTime();
      return Number.isFinite(ts) && ts >= cutoff;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, MAX_TOUCHES);
}

export function loadAttributionTouches(): AttributionTouchRecord[] {
  try {
    const touches = safeParse<AttributionTouchRecord[]>(localStorage.getItem(TOUCHES_KEY), []);
    return pruneTouches(Array.isArray(touches) ? touches : []);
  } catch {
    return [];
  }
}

export function saveAttributionTouches(touches: AttributionTouchRecord[]): void {
  try {
    localStorage.setItem(TOUCHES_KEY, JSON.stringify(pruneTouches(touches)));
  } catch {
    // ignore quota / private mode
  }
}

export function recordLocalTouch(
  partial: Omit<AttributionTouchRecord, 'clientTouchId' | 'timestamp'> & {
    clientTouchId?: string;
    timestamp?: string | Date;
  }
): AttributionTouchRecord {
  const timestamp = partial.timestamp
    ? new Date(partial.timestamp).toISOString()
    : new Date().toISOString();
  const clientTouchId = partial.clientTouchId
    || `${partial.channel}:${partial.messageId || partial.deliveryLogId || 'unknown'}:${partial.touchType}:${timestamp}`;

  const touch: AttributionTouchRecord = {
    ...partial,
    clientTouchId,
    timestamp,
  };

  const existing = loadAttributionTouches();
  const withoutDup = existing.filter((t) => t.clientTouchId !== touch.clientTouchId);
  withoutDup.unshift(touch);
  saveAttributionTouches(withoutDup);
  enqueueOffline({ type: 'touch', touch });
  return touch;
}

export function getTouchesForConversion(): AttributionTouchRecord[] {
  return loadAttributionTouches();
}

interface QueueItem {
  type: 'touch' | 'merge';
  touch?: AttributionTouchRecord;
  payload?: Record<string, unknown>;
  createdAt: string;
}

function loadQueue(): QueueItem[] {
  try {
    return safeParse<QueueItem[]>(localStorage.getItem(QUEUE_KEY), []);
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueItem[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-200)));
  } catch {
    // ignore
  }
}

export function enqueueOffline(item: Omit<QueueItem, 'createdAt'>): void {
  const queue = loadQueue();
  queue.push({ ...item, createdAt: new Date().toISOString() });
  saveQueue(queue);
}

export type SyncPoster = (path: string, body: Record<string, unknown>) => Promise<any>;

/**
 * Flush offline queue + current touches to the server.
 */
export async function flushAttributionSync(
  post: SyncPoster,
  context: { anonymousId?: string; userId?: string | null; externalId?: string | null }
): Promise<void> {
  const touches = loadAttributionTouches();
  if (touches.length) {
    try {
      await post('/attribution/touches', {
        touches,
        anonymousId: context.anonymousId,
        userId: context.userId || undefined,
        external_id: context.externalId || undefined,
      });
    } catch {
      // keep local; will retry
      return;
    }
  }

  const queue = loadQueue();
  if (!queue.length) return;

  const remaining: QueueItem[] = [];
  for (const item of queue) {
    try {
      if (item.type === 'touch' && item.touch) {
        await post('/attribution/touches', {
          touches: [item.touch],
          anonymousId: context.anonymousId,
          userId: context.userId || undefined,
          external_id: context.externalId || undefined,
        });
      } else if (item.type === 'merge' && item.payload) {
        await post('/attribution/identify-merge', {
          ...item.payload,
          anonymousId: context.anonymousId,
          userId: context.userId || undefined,
          external_id: context.externalId || undefined,
        });
      }
    } catch {
      remaining.push(item);
    }
  }
  saveQueue(remaining);
}

export async function syncIdentifyMerge(
  post: SyncPoster,
  context: { anonymousId: string; userId?: string | null; externalId?: string | null; customerId?: string }
): Promise<void> {
  const payload = {
    anonymousId: context.anonymousId,
    userId: context.userId || undefined,
    external_id: context.externalId || undefined,
    customerId: context.customerId,
  };
  try {
    await post('/attribution/identify-merge', payload);
  } catch {
    enqueueOffline({ type: 'merge', payload });
  }
}
