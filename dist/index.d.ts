/**
 * Tappd Web SDK
 * Customer Data Platform SDK for web applications
 */
export interface TappdConfig {
    appId: string;
    apiUrl?: string;
    autoTrack?: boolean;
    sessionTimeout?: number;
    enableAutoCapture?: boolean;
    debug?: boolean;
    enableInAppMessages?: boolean;
    autoDisplayMessages?: boolean;
    messagePollingInterval?: number;
    inactivityThreshold?: number;
    messageContainerId?: string;
}
export interface CustomerAttributes {
    external_id: string;
    name?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
}
export interface EventProperties {
    [key: string]: any;
}
export declare class TappdSDK {
    private appId;
    private apiUrl;
    private autoTrack;
    private sessionTimeout;
    private enableAutoCapture;
    private debug;
    private enableInAppMessages;
    private autoDisplayMessages;
    private messagePollingInterval;
    private messageContainerId?;
    private currentUserId;
    private anonymousId;
    private session;
    private pageTracker;
    private displayedMessages;
    private shownMessages;
    private messagePageIndices;
    private messageContainers;
    private messagePollingTimer;
    private activityTimer;
    private lastActivityTime;
    private isUserActive;
    private inactivityThreshold;
    private messageCache;
    private cacheKey;
    private lastFetchTime;
    private eventListeners;
    private recentEvents;
    private eventTriggeredMessages;
    private pushSubscription;
    private serviceWorkerRegistration;
    private promptElement;
    private renderedBanners;
    constructor(config: TappdConfig);
    /**
     * Get or create anonymous ID (stored in localStorage)
     */
    private getOrCreateAnonymousId;
    /**
     * Start a new session (client-side only)
     */
    private startNewSession;
    /**
     * Check if session has expired and start a new one if needed
     */
    private checkAndRefreshSession;
    /**
     * Update session activity
     */
    private updateSessionActivity;
    /**
     * Setup auto tracking
     */
    private setupAutoTracking;
    /**
     * Handle visibility changes (page hidden/shown)
     */
    private handleVisibilityChange;
    /**
     * Handle page unload (send final data)
     */
    private handleUnload;
    /**
     * Track page view on navigation (SPA support)
     */
    private trackPageViewOnNavigation;
    /**
     * Setup auto capture (clicks, form submits, etc.)
     */
    private setupAutoCapture;
    /**
     * Extract UTM parameters from URL
     */
    private extractUTMParams;
    /**
     * Get comprehensive device information
     */
    private getDeviceInfo;
    private getBrowserName;
    private getBrowserVersion;
    private getOSName;
    private getOSVersion;
    private getDeviceType;
    /**
     * Identify a user
     * Requires external_id in attributes - SDK will generate internal userId automatically
     */
    identify(attributes: CustomerAttributes): Promise<void>;
    /**
     * Update user attributes
     */
    setUserAttributes(attributes: Partial<CustomerAttributes>): Promise<void>;
    /**
     * Set custom attributes only (doesn't require external_id)
     */
    setCustomAttributes(attributes: Record<string, any>): Promise<void>;
    /**
     * Get stored external ID
     */
    private getExternalId;
    /**
     * Store external ID
     */
    private setExternalId;
    /**
     * Track an event with automatic session management
     */
    track(eventName: string, properties?: EventProperties): Promise<void>;
    /**
     * Track push notification interaction (opened/clicked)
     * Convenience wrapper around track() for push events
     */
    trackPushInteraction(type: 'opened' | 'clicked', properties?: EventProperties): Promise<void>;
    /**
     * Track page view
     */
    trackPageView(url?: string, properties?: EventProperties): Promise<void>;
    /**
     * Get session ID
     */
    getSessionId(): string | null;
    /**
     * Get anonymous ID
     */
    getAnonymousId(): string;
    /**
     * Reset SDK (clear user data)
     */
    reset(): void;
    /**
     * Get current timezone
     */
    private getCurrentTimezone;
    /**
     * Get stored timezone from localStorage
     */
    private getStoredTimezone;
    /**
     * Store timezone in localStorage
     */
    private setStoredTimezone;
    /**
     * Check if timezone has changed and return current timezone if changed
     */
    private checkTimezoneChange;
    /**
     * Extract custom attributes (exclude standard fields)
     */
    private extractCustomAttributes;
    /**
     * Make POST request
     */
    private post;
    /**
     * Log debug messages
     */
    private log;
    /**
     * Initialize in-app messages - sync on launch and smart polling
     */
    private initializeInAppMessages;
    /**
     * Setup smart polling - only polls when user is active
     */
    private setupSmartPolling;
    /**
     * Start message polling (only when user is active)
     * Polling is a fallback mechanism - primary sync happens on app launch
     */
    private startMessagePolling;
    /**
     * Stop message polling
     */
    private stopMessagePolling;
    /**
     * Setup activity detection
     * Tracks user activity and stops/starts polling accordingly
     */
    private setupActivityDetection;
    /**
     * Load cached messages from localStorage
     */
    /**
     * Load messages from localStorage cache
     * Messages are stored locally and evaluated for triggers immediately
     * Filters out expired messages based on each message's expiresAt
     */
    private loadMessageCache;
    /**
     * Save shown messages to localStorage
     */
    private saveShownMessages;
    /**
     * Save messages to localStorage cache
     */
    private saveMessageCache;
    /**
     * Get pending in-app messages (with caching)
     * Filters out expired messages based on each message's expiresAt
     */
    getInAppMessages(forceRefresh?: boolean): Promise<any[]>;
    /**
     * Display a single in-app message
     */
    displayInAppMessage(message: any): Promise<void>;
    /**
     * Display all pending messages
     */
    displayPendingMessages(forceRefresh?: boolean): Promise<void>;
    /**
     * Dismiss an in-app message
     */
    dismissMessage(messageId: string): Promise<void>;
    /**
     * Close IAM (alias for dismissMessage with tracking)
     */
    closeIAM(messageId?: string): Promise<void>;
    /**
     * Navigate to specific page in a message
     */
    navigateToPage(messageId: string, pageIndex: number): Promise<void>;
    /**
     * Navigate to next page
     */
    nextPage(messageId?: string): Promise<void>;
    /**
     * Navigate to previous page
     */
    previousPage(messageId?: string): Promise<void>;
    /**
     * Track message event
     */
    trackMessageEvent(messageId: string, eventType: string, metadata: Record<string, any>): Promise<void>;
    /**
     * Mark message as delivered
     */
    private markMessageDelivered;
    /**
     * Mark message as dismissed
     */
    private markMessageDismissed;
    /**
     * Handle bridge action (Braze-like functionality)
     */
    private handleBridgeAction;
    /**
     * Capture form data from in-app messages
     */
    private captureFormData;
    /**
     * Get email (if user is identified)
     */
    private getEmail;
    /**
     * Get phone (if user is identified)
     */
    private getPhone;
    /**
     * Evaluate trigger conditions
     */
    private evaluateTrigger;
    /**
     * Check if message has expired
     */
    private checkMessageExpiration;
    /**
     * Check if an event has occurred recently
     */
    private hasEventOccurred;
    /**
     * Clean old events from recent events map (older than 1 hour)
     */
    private cleanOldEvents;
    /**
     * Register a message to wait for a specific event
     */
    private registerEventTrigger;
    /**
     * Check if any pending messages are waiting for a tracked event
     */
    private checkEventTriggers;
    /**
     * Remove message from DOM
     */
    private removeMessage;
    /**
     * Inject CSS styles for message rendering
     */
    private injectStyles;
    /**
     * Web Push Methods
     */
    /**
     * Get VAPID public key from server
     * @returns {Promise<string>} VAPID public key
     */
    getVapidPublicKey(): Promise<string>;
    /**
     * Check if user is subscribed to push notifications
     * @returns {Promise<boolean>} True if subscribed
     */
    isSubscribed(): Promise<boolean>;
    /**
     * Subscribe to push notifications
     * @param {PushSubscriptionOptions} options - Optional subscription options
     * @returns {Promise<PushSubscription>} Push subscription object
     */
    subscribeToPush(options?: PushSubscriptionOptions): Promise<PushSubscription>;
    /**
     * Unsubscribe from push notifications
     * @returns {Promise<void>}
     */
    unsubscribeFromPush(): Promise<void>;
    /**
     * Show permission prompt (slidedown, bell, or native)
     * @param {string} type - Prompt type: 'slidedown', 'bell', or 'native'
     * @returns {Promise<void>}
     */
    showPermissionPrompt(type?: 'slidedown' | 'bell' | 'native'): Promise<void>;
    /**
     * Hide permission prompt
     */
    hidePermissionPrompt(): void;
    /**
     * Show slidedown prompt
     */
    private showSlidedownPrompt;
    /**
     * Show bell prompt (persistent widget)
     */
    private showBellPrompt;
    /**
     * Convert URL-safe base64 to Uint8Array
     */
    private urlBase64ToUint8Array;
    /**
     * Convert ArrayBuffer to base64
     */
    private arrayBufferToBase64;
    /**
     * Banner API
     */
    banners: {
        /**
         * Manually track banner display
         * @param bannerId - Banner ID
         * @param variantId - Variant ID
         * @param selector - Placement selector
         * @returns Promise<string> - Display ID for use with click/dismiss
         */
        display: (bannerId: string, variantId: string, selector: string) => Promise<string>;
        /**
         * Manually track banner click
         */
        click: (bannerId: string, displayId: string) => Promise<void>;
        /**
         * Manually track banner dismiss
         */
        dismiss: (bannerId: string, displayId: string) => Promise<void>;
    };
    /**
     * Get banners for a selector and auto-render them
     * @param selector - CSS selector or data attribute selector
     * @param options - Optional configuration
     * @returns Promise<Banner[]> - Array of banner data (for custom rendering)
     */
    getBanners(selector: string, options?: {
        autoRender?: boolean;
    }): Promise<any[]>;
    /**
     * Fetch banners from API
     */
    private fetchBannersFromAPI;
    /**
     * Render a banner in the DOM
     */
    private renderBanner;
    /**
     * Dismiss banner element
     */
    private dismissBannerElement;
    /**
     * Track banner display
     */
    private trackBannerDisplay;
    /**
     * Track banner click
     */
    private trackBannerClick;
    /**
     * Track banner dismiss
     */
    private trackBannerDismiss;
}
export default TappdSDK;
//# sourceMappingURL=index.d.ts.map