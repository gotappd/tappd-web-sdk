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
export declare function loadAttributionTouches(): AttributionTouchRecord[];
export declare function saveAttributionTouches(touches: AttributionTouchRecord[]): void;
export declare function recordLocalTouch(partial: Omit<AttributionTouchRecord, 'clientTouchId' | 'timestamp'> & {
    clientTouchId?: string;
    timestamp?: string | Date;
}): AttributionTouchRecord;
export declare function getTouchesForConversion(): AttributionTouchRecord[];
interface QueueItem {
    type: 'touch' | 'merge';
    touch?: AttributionTouchRecord;
    payload?: Record<string, unknown>;
    createdAt: string;
}
export declare function enqueueOffline(item: Omit<QueueItem, 'createdAt'>): void;
export type SyncPoster = (path: string, body: Record<string, unknown>) => Promise<any>;
/**
 * Flush offline queue + current touches to the server.
 */
export declare function flushAttributionSync(post: SyncPoster, context: {
    anonymousId?: string;
    userId?: string | null;
    externalId?: string | null;
}): Promise<void>;
export declare function syncIdentifyMerge(post: SyncPoster, context: {
    anonymousId: string;
    userId?: string | null;
    externalId?: string | null;
    customerId?: string;
}): Promise<void>;
export {};
//# sourceMappingURL=attributionStore.d.ts.map