/**
 * Tappd Web SDK
 * Customer Data Platform SDK for web applications
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { renderMessage } from './renderers/messageRenderer';
import { getStyles } from './renderers/styles';
export class TappdSDK {
    constructor(config) {
        this.currentUserId = null;
        this.session = null;
        this.pageTracker = null;
        this.displayedMessages = new Set();
        this.messagePollingTimer = null;
        this.activityTimer = null;
        this.lastActivityTime = Date.now();
        this.isUserActive = true;
        this.messageCache = new Map();
        this.cacheKey = '_tappd_message_cache';
        this.lastFetchTime = 0;
        // No hardcoded cache expiry - each message has its own expiresAt from journey configuration
        this.eventListeners = new Map();
        this.recentEvents = new Map(); // eventName -> timestamp (for event triggers)
        this.eventTriggeredMessages = new Map(); // eventName -> Set of messageIds waiting for this event
        this.pushSubscription = null;
        this.serviceWorkerRegistration = null;
        this.promptElement = null;
        this.renderedBanners = new Map();
        /**
         * Banner API
         */
        this.banners = {
            /**
             * Manually track banner display
             * @param bannerId - Banner ID
             * @param variantId - Variant ID
             * @param selector - Placement selector
             * @returns Promise<string> - Display ID for use with click/dismiss
             */
            display: (bannerId, variantId, selector) => __awaiter(this, void 0, void 0, function* () {
                return yield this.trackBannerDisplay(bannerId, variantId, selector);
            }),
            /**
             * Manually track banner click
             */
            click: (bannerId, displayId) => __awaiter(this, void 0, void 0, function* () {
                yield this.trackBannerClick(bannerId, displayId);
            }),
            /**
             * Manually track banner dismiss
             */
            dismiss: (bannerId, displayId) => __awaiter(this, void 0, void 0, function* () {
                yield this.trackBannerDismiss(bannerId, displayId);
            }),
        };
        this.appId = config.appId;
        this.apiUrl = config.apiUrl || 'https://sdk.gotappd.com/api/v1/sdk';
        this.autoTrack = config.autoTrack !== false;
        this.sessionTimeout = config.sessionTimeout || 30;
        this.enableAutoCapture = config.enableAutoCapture || false;
        this.debug = config.debug || false;
        this.enableInAppMessages = config.enableInAppMessages !== false;
        this.autoDisplayMessages = config.autoDisplayMessages !== false;
        this.messagePollingInterval = config.messagePollingInterval || 300; // Default: 5 minutes (300 seconds)
        this.inactivityThreshold = (config.inactivityThreshold || 300) * 1000; // Convert to milliseconds, default: 5 minutes
        this.messageContainerId = config.messageContainerId;
        if (!this.appId) {
            throw new Error('App ID is required');
        }
        // Initialize anonymous ID (persists across sessions)
        this.anonymousId = this.getOrCreateAnonymousId();
        // Start new session
        this.startNewSession();
        if (this.autoTrack) {
            this.setupAutoTracking();
        }
        if (this.enableAutoCapture) {
            this.setupAutoCapture();
        }
        // Initialize in-app messages if enabled
        if (this.enableInAppMessages) {
            this.initializeInAppMessages();
        }
        this.log('[Tappd SDK] Initialized with App ID:', this.appId.substring(0, 15) + '...');
    }
    /**
     * Get or create anonymous ID (stored in localStorage)
     */
    getOrCreateAnonymousId() {
        const key = '_tappd_anonymous_id';
        let anonymousId = localStorage.getItem(key);
        if (!anonymousId) {
            anonymousId = 'anon_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
            localStorage.setItem(key, anonymousId);
        }
        return anonymousId;
    }
    /**
     * Start a new session (client-side only)
     */
    startNewSession() {
        const sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        this.session = {
            sessionId,
            startedAt: Date.now(),
            lastActivityAt: Date.now()
        };
        this.log('[Tappd SDK] New session started:', sessionId.substring(0, 15));
    }
    /**
     * Check if session has expired and start a new one if needed
     */
    checkAndRefreshSession() {
        if (!this.session) {
            this.startNewSession();
            return;
        }
        const elapsed = Date.now() - this.session.lastActivityAt;
        const timeoutMs = this.sessionTimeout * 60 * 1000;
        if (elapsed > timeoutMs) {
            this.log('[Tappd SDK] Session expired, starting new session');
            this.startNewSession();
        }
    }
    /**
     * Update session activity
     */
    updateSessionActivity() {
        if (this.session) {
            this.session.lastActivityAt = Date.now();
        }
    }
    /**
     * Setup auto tracking
     */
    setupAutoTracking() {
        // Track initial page view
        this.trackPageView();
        // Track page views on navigation (SPA support)
        this.trackPageViewOnNavigation();
        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        // Send final data on unload
        window.addEventListener('beforeunload', () => {
            this.handleUnload();
        });
    }
    /**
     * Handle visibility changes (page hidden/shown)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page went to background - session is paused
            this.log('[Tappd SDK] Page hidden - session paused');
            // Can optionally send a "session paused" event here
        }
        else {
            // Page came to foreground - check if session expired
            this.checkAndRefreshSession();
            // Track page view on visibility
            this.trackPageView();
        }
    }
    /**
     * Handle page unload (send final data)
     */
    handleUnload() {
        var _a, _b;
        // Send final page view data using sendBeacon (reliable even on close)
        if (this.pageTracker) {
            const duration = Math.floor((Date.now() - this.pageTracker.startTime) / 1000);
            const eventData = {
                appId: this.appId,
                eventName: 'page_unload',
                properties: {},
                sessionId: (_a = this.session) === null || _a === void 0 ? void 0 : _a.sessionId,
                sessionStartTime: (_b = this.session) === null || _b === void 0 ? void 0 : _b.startedAt,
                sessionDuration: this.session ? Math.floor((Date.now() - this.session.startedAt) / 1000) : 0,
                userId: this.currentUserId || this.anonymousId,
                pageUrl: this.pageTracker.url,
                pageTitle: this.pageTracker.title,
                duration
            };
            // Use sendBeacon for reliability (works even if tab closes)
            navigator.sendBeacon(`${this.apiUrl}/track`, JSON.stringify(eventData));
            this.log('[Tappd SDK] Final data sent on unload');
        }
    }
    /**
     * Track page view on navigation (SPA support)
     */
    trackPageViewOnNavigation() {
        // Track pushState/replaceState
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        history.pushState = (...args) => {
            originalPushState.apply(history, args);
            this.trackPageView();
        };
        history.replaceState = (...args) => {
            originalReplaceState.apply(history, args);
            this.trackPageView();
        };
        // Track popstate
        window.addEventListener('popstate', () => {
            this.trackPageView();
        });
    }
    /**
     * Setup auto capture (clicks, form submits, etc.)
     */
    setupAutoCapture() {
        // Track link clicks
        document.addEventListener('click', (e) => {
            var _a;
            const target = e.target;
            const link = target.closest('a');
            if (link) {
                this.track('link_click', {
                    url: link.href,
                    text: (_a = link.textContent) === null || _a === void 0 ? void 0 : _a.trim()
                });
            }
        });
        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            this.track('form_submit', {
                formId: form.id,
                formAction: form.action,
                formMethod: form.method
            });
        });
    }
    /**
     * Extract UTM parameters from URL
     */
    extractUTMParams(url) {
        try {
            const urlObj = new URL(url);
            const utm = {};
            ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
                const value = urlObj.searchParams.get(param);
                if (value) {
                    utm[param.replace('utm_', '')] = value;
                }
            });
            return Object.keys(utm).length > 0 ? utm : undefined;
        }
        catch (e) {
            return undefined;
        }
    }
    /**
     * Get comprehensive device information
     */
    getDeviceInfo() {
        var _a;
        const screen = window.screen;
        return {
            userAgent: navigator.userAgent,
            browser: {
                name: this.getBrowserName(),
                version: this.getBrowserVersion()
            },
            os: {
                name: this.getOSName(),
                version: this.getOSVersion()
            },
            device: {
                type: this.getDeviceType()
            },
            screenSize: {
                width: screen.width,
                height: screen.height,
                pixelRatio: window.devicePixelRatio
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            connection: (_a = navigator.connection) === null || _a === void 0 ? void 0 : _a.effectiveType
        };
    }
    getBrowserName() {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('firefox'))
            return 'Firefox';
        if (ua.includes('chrome'))
            return 'Chrome';
        if (ua.includes('safari'))
            return 'Safari';
        if (ua.includes('edge'))
            return 'Edge';
        if (ua.includes('opera'))
            return 'Opera';
        return 'Unknown';
    }
    getBrowserVersion() {
        const ua = navigator.userAgent;
        const match = ua.match(/(firefox|chrome|safari|edge|opera)[\/:\s](\d+)/i);
        return match ? match[2] : 'Unknown';
    }
    getOSName() {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('windows'))
            return 'Windows';
        if (ua.includes('mac'))
            return 'macOS';
        if (ua.includes('linux'))
            return 'Linux';
        if (ua.includes('android'))
            return 'Android';
        if (ua.includes('ios'))
            return 'iOS';
        return 'Unknown';
    }
    getOSVersion() {
        const ua = navigator.userAgent;
        const match = ua.match(/(windows nt|android|iphone os|mac os x)[\s\/:](\d+\.\d+)/i);
        return match ? match[2] : 'Unknown';
    }
    getDeviceType() {
        const ua = navigator.userAgent.toLowerCase();
        if (/(tablet|ipad|playbook|silk)/i.test(ua))
            return 'tablet';
        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua))
            return 'mobile';
        return 'desktop';
    }
    /**
     * Identify a user
     * Requires external_id in attributes - SDK will generate internal userId automatically
     */
    identify(attributes) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!(attributes === null || attributes === void 0 ? void 0 : attributes.external_id)) {
                    throw new Error('external_id is required in attributes');
                }
                // Store external_id for future use
                this.setExternalId(attributes.external_id);
                // Generate internal userId (use external_id as base)
                // API will create/find customer by external_id and return/create userId
                const internalUserId = `usr_${attributes.external_id}`;
                this.currentUserId = internalUserId;
                const response = yield this.post('/identify', {
                    external_id: attributes.external_id,
                    name: attributes === null || attributes === void 0 ? void 0 : attributes.name,
                    email: attributes === null || attributes === void 0 ? void 0 : attributes.email,
                    phone: attributes === null || attributes === void 0 ? void 0 : attributes.phone,
                    // Include anonymousId so the API can merge pre-login events/sessions
                    anonymousId: this.anonymousId,
                    attributes: this.extractCustomAttributes(attributes)
                });
                // Store the returned userId if API generates one
                if ((_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.userId) {
                    this.currentUserId = response.data.userId;
                }
                this.log('[Tappd SDK] Customer identified:', attributes.external_id);
                // After identification, fetch messages immediately
                if (this.enableInAppMessages && this.autoDisplayMessages) {
                    setTimeout(() => {
                        this.displayPendingMessages(true).catch(() => { });
                    }, 500);
                }
                return response;
            }
            catch (error) {
                this.log('[Tappd SDK] Identify error:', error);
                throw error;
            }
        });
    }
    /**
     * Update user attributes
     */
    setUserAttributes(attributes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentUserId) {
                throw new Error('User must be identified first. Call identify() first.');
            }
            // Get existing external_id from storage or require it
            const existingExternalId = this.getExternalId();
            if (!existingExternalId && !attributes.external_id) {
                throw new Error('external_id is required. User must be identified first.');
            }
            return this.identify(Object.assign({ external_id: attributes.external_id || existingExternalId }, attributes));
        });
    }
    /**
     * Set custom attributes only (doesn't require external_id)
     */
    setCustomAttributes(attributes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentUserId) {
                throw new Error('User must be identified first. Call identify() first.');
            }
            const existingExternalId = this.getExternalId();
            if (!existingExternalId) {
                throw new Error('User must be identified first. Call identify() first.');
            }
            return this.identify(Object.assign({ external_id: existingExternalId }, attributes));
        });
    }
    /**
     * Get stored external ID
     */
    getExternalId() {
        try {
            return localStorage.getItem('_tappd_external_id');
        }
        catch (_a) {
            return null;
        }
    }
    /**
     * Store external ID
     */
    setExternalId(externalId) {
        try {
            localStorage.setItem('_tappd_external_id', externalId);
        }
        catch (_a) {
            // localStorage not available
        }
    }
    /**
     * Track an event with automatic session management
     */
    track(eventName, properties) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // Check if session expired
                this.checkAndRefreshSession();
                if (!this.session) {
                    this.startNewSession();
                }
                // Update session activity
                this.updateSessionActivity();
                const deviceInfo = this.getDeviceInfo();
                const pageUrl = window.location.href;
                const pageTitle = document.title;
                const pagePath = window.location.pathname;
                const referrer = document.referrer;
                // Always use userId (either identified or anonymous)
                const userId = this.currentUserId || this.anonymousId;
                // If identified, also send external_id for lookup
                const externalId = this.getExternalId();
                // Calculate session duration
                const sessionDuration = this.session ? Math.floor((Date.now() - this.session.startedAt) / 1000) : 0;
                const response = yield this.post('/track', {
                    eventName,
                    properties: properties || {},
                    sessionId: (_a = this.session) === null || _a === void 0 ? void 0 : _a.sessionId,
                    sessionStartTime: (_b = this.session) === null || _b === void 0 ? void 0 : _b.startedAt,
                    sessionDuration,
                    userId,
                    external_id: externalId, // Include external_id if available
                    pageUrl,
                    pageTitle,
                    pagePath,
                    referrer
                });
                // Store event for trigger evaluation
                this.recentEvents.set(eventName, Date.now());
                // Clean old events (older than 1 hour)
                this.cleanOldEvents();
                // Check if any pending messages are waiting for this event
                this.checkEventTriggers(eventName);
                this.log('[Tappd SDK] Event tracked:', eventName);
                return response;
            }
            catch (error) {
                this.log('[Tappd SDK] Track error:', error);
                throw error;
            }
        });
    }
    /**
     * Track push notification interaction (opened/clicked)
     * Convenience wrapper around track() for push events
     */
    trackPushInteraction(type, properties) {
        return __awaiter(this, void 0, void 0, function* () {
            const eventName = `push_notification.${type}`;
            yield this.track(eventName, properties);
        });
    }
    /**
     * Track page view
     */
    trackPageView(url, properties) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // End previous page tracking if exists
                if (this.pageTracker) {
                    const duration = Math.floor((Date.now() - this.pageTracker.startTime) / 1000);
                    // Optionally send the previous page view data
                }
                // Check if session expired
                this.checkAndRefreshSession();
                if (!this.session) {
                    this.startNewSession();
                }
                // Update session activity
                this.updateSessionActivity();
                // Start new page tracking
                const currentUrl = url || window.location.href;
                const currentTitle = document.title;
                this.pageTracker = {
                    url: currentUrl,
                    title: currentTitle,
                    startTime: Date.now()
                };
                const deviceInfo = this.getDeviceInfo();
                const pagePath = new URL(currentUrl).pathname;
                const referrer = url ? document.referrer : undefined;
                const utm = this.extractUTMParams(currentUrl);
                // Always use userId (either identified or anonymous)
                const userId = this.currentUserId || this.anonymousId;
                // If identified, also send external_id for lookup
                const externalId = this.getExternalId();
                // Calculate session duration
                const sessionDuration = this.session ? Math.floor((Date.now() - this.session.startedAt) / 1000) : 0;
                const response = yield this.post('/page', {
                    url: currentUrl,
                    path: pagePath,
                    title: currentTitle,
                    referrer,
                    duration: 0, // Current page duration is 0
                    sessionId: (_a = this.session) === null || _a === void 0 ? void 0 : _a.sessionId,
                    sessionStartTime: (_b = this.session) === null || _b === void 0 ? void 0 : _b.startedAt,
                    sessionDuration,
                    userId,
                    external_id: externalId // Include external_id if available
                });
                this.log('[Tappd SDK] Page view tracked:', currentUrl);
                return response;
            }
            catch (error) {
                this.log('[Tappd SDK] Track page view error:', error);
                throw error;
            }
        });
    }
    /**
     * Get session ID
     */
    getSessionId() {
        var _a;
        return ((_a = this.session) === null || _a === void 0 ? void 0 : _a.sessionId) || null;
    }
    /**
     * Get anonymous ID
     */
    getAnonymousId() {
        return this.anonymousId;
    }
    /**
     * Reset SDK (clear user data)
     */
    reset() {
        this.currentUserId = null;
        this.anonymousId = this.getOrCreateAnonymousId();
        this.pageTracker = null;
        this.startNewSession();
        // Stop polling
        this.stopMessagePolling();
        // Clear activity timer
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
            this.activityTimer = null;
        }
        // Clear cache
        this.messageCache.clear();
        this.recentEvents.clear();
        this.eventTriggeredMessages.clear();
        try {
            localStorage.removeItem('_tappd_external_id');
            localStorage.removeItem(this.cacheKey);
        }
        catch (_a) {
            // localStorage not available
        }
        this.log('[Tappd SDK] Reset');
    }
    /**
     * Extract custom attributes (exclude standard fields)
     */
    extractCustomAttributes(attributes) {
        const { external_id, name, email, phone } = attributes, custom = __rest(attributes, ["external_id", "name", "email", "phone"]);
        return custom;
    }
    /**
     * Make POST request
     */
    post(endpoint, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Add appId to the payload
                const payload = Object.assign(Object.assign({}, data), { appId: this.appId });
                const response = yield fetch(`${this.apiUrl}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    throw new Error(`Request failed: ${response.statusText}`);
                }
                return yield response.json();
            }
            catch (error) {
                this.log('Request error:', error);
                throw error;
            }
        });
    }
    /**
     * Log debug messages
     */
    log(...args) {
        if (this.debug) {
            console.log('[Tappd SDK]', ...args);
        }
    }
    /**
     * Initialize in-app messages - sync on launch and smart polling
     */
    initializeInAppMessages() {
        // Inject styles for message rendering
        this.injectStyles();
        // Load cached messages immediately (from previous session)
        this.loadMessageCache();
        // Start polling if auto-display is enabled
        if (this.autoDisplayMessages) {
            // Always sync messages on app launch (immediate)
            // This ensures messages are downloaded as soon as app opens
            setTimeout(() => {
                this.displayPendingMessages(true).catch((error) => {
                    this.log('[Tappd SDK] Error fetching messages on launch:', error);
                });
            }, 1000);
            // Set up smart polling (only when active) - reduced frequency as fallback
            this.setupSmartPolling();
            // Set up activity detection
            this.setupActivityDetection();
        }
    }
    /**
     * Setup smart polling - only polls when user is active
     */
    setupSmartPolling() {
        // Start polling if user is active
        if (this.isUserActive) {
            this.startMessagePolling();
        }
    }
    /**
     * Start message polling (only when user is active)
     * Polling is a fallback mechanism - primary sync happens on app launch
     */
    startMessagePolling() {
        // Clear existing timer
        if (this.messagePollingTimer) {
            clearInterval(this.messagePollingTimer);
        }
        // Only poll if user is active
        if (!this.isUserActive) {
            this.log('[Tappd SDK] Polling stopped - user inactive');
            return;
        }
        // Reduced polling frequency - now 5 minutes (300s) instead of 30s
        // Primary sync happens on app launch, polling is just a fallback
        const pollingInterval = Math.max(this.messagePollingInterval, 300); // Minimum 5 minutes
        this.log('[Tappd SDK] Starting message polling (fallback, interval: ' + pollingInterval + 's)');
        this.messagePollingTimer = window.setInterval(() => {
            // Check if user is still active before polling
            if (this.isUserActive) {
                this.displayPendingMessages(false).catch((error) => {
                    this.log('[Tappd SDK] Error polling messages:', error);
                });
            }
            else {
                // Stop polling if user became inactive
                this.stopMessagePolling();
            }
        }, pollingInterval * 1000);
    }
    /**
     * Stop message polling
     */
    stopMessagePolling() {
        if (this.messagePollingTimer) {
            clearInterval(this.messagePollingTimer);
            this.messagePollingTimer = null;
            this.log('[Tappd SDK] Message polling stopped');
        }
    }
    /**
     * Setup activity detection
     * Tracks user activity and stops/starts polling accordingly
     */
    setupActivityDetection() {
        // Track various user activities
        const activityEvents = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click',
            'focus',
        ];
        // Activity handler
        const handleActivity = () => {
            const wasInactive = !this.isUserActive;
            this.lastActivityTime = Date.now();
            // If user was inactive, resume polling
            if (wasInactive) {
                this.isUserActive = true;
                this.log('[Tappd SDK] User became active - resuming polling');
                // Fetch immediately when user returns
                this.displayPendingMessages(true).catch((error) => {
                    this.log('[Tappd SDK] Error fetching messages on activity:', error);
                });
                // Resume polling
                this.startMessagePolling();
            }
        };
        // Attach activity listeners
        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });
        // Check for inactivity periodically
        this.activityTimer = window.setInterval(() => {
            const timeSinceActivity = Date.now() - this.lastActivityTime;
            if (timeSinceActivity >= this.inactivityThreshold && this.isUserActive) {
                // User has been inactive for threshold time
                this.isUserActive = false;
                this.log('[Tappd SDK] User inactive for ' + Math.floor(timeSinceActivity / 1000) + 's - stopping polling');
                this.stopMessagePolling();
            }
        }, 60000); // Check every minute
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden - stop polling
                this.log('[Tappd SDK] Page hidden - stopping polling');
                this.stopMessagePolling();
            }
            else {
                // Page is visible - user is back
                this.log('[Tappd SDK] Page visible - fetching messages and resuming polling');
                this.lastActivityTime = Date.now();
                this.isUserActive = true;
                // Fetch immediately when page becomes visible
                this.displayPendingMessages(true).catch((error) => {
                    this.log('[Tappd SDK] Error fetching messages on visibility:', error);
                });
                // Resume polling
                this.startMessagePolling();
            }
        });
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.stopMessagePolling();
            if (this.activityTimer) {
                clearInterval(this.activityTimer);
            }
        });
    }
    /**
     * Load cached messages from localStorage
     */
    /**
     * Load messages from localStorage cache
     * Messages are stored locally and evaluated for triggers immediately
     * Filters out expired messages based on each message's expiresAt
     */
    loadMessageCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                const now = new Date();
                // Filter out expired messages based on their individual expiresAt
                const validMessages = (data.messages || []).filter(([messageId, message]) => {
                    if (!message.expiresAt) {
                        return true; // No expiry, keep message
                    }
                    const expiresAt = new Date(message.expiresAt);
                    return expiresAt > now; // Keep if not expired
                });
                if (validMessages.length > 0) {
                    this.messageCache = new Map(validMessages);
                    this.lastFetchTime = data.timestamp;
                    this.log('[Tappd SDK] Loaded ' + this.messageCache.size + ' valid cached messages (filtered ' + ((data.messages || []).length - validMessages.length) + ' expired)');
                    // Save filtered cache back to localStorage
                    this.saveMessageCache();
                    // Display cached messages immediately (if auto-display enabled)
                    if (this.autoDisplayMessages) {
                        this.displayPendingMessages(false).catch(() => { });
                    }
                }
                else {
                    // No valid messages, clear cache
                    if ((data.messages || []).length > 0) {
                        this.log('[Tappd SDK] All cached messages expired, clearing cache');
                    }
                    localStorage.removeItem(this.cacheKey);
                    this.messageCache.clear();
                }
            }
        }
        catch (e) {
            this.log('Failed to load message cache:', e);
        }
    }
    /**
     * Save messages to localStorage cache
     */
    saveMessageCache() {
        try {
            const data = {
                messages: Array.from(this.messageCache.entries()),
                timestamp: Date.now(),
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
        }
        catch (e) {
            this.log('Failed to save message cache:', e);
        }
    }
    /**
     * Get pending in-app messages (with caching)
     * Filters out expired messages based on each message's expiresAt
     */
    getInAppMessages() {
        return __awaiter(this, arguments, void 0, function* (forceRefresh = false) {
            var _a;
            // Filter expired messages from cache
            const now = new Date();
            const validCachedMessages = Array.from(this.messageCache.values()).filter((msg) => {
                if (!msg.expiresAt) {
                    return true; // No expiry, keep message
                }
                const expiresAt = new Date(msg.expiresAt);
                return expiresAt > now; // Keep if not expired
            });
            // Remove expired messages from cache
            if (validCachedMessages.length < this.messageCache.size) {
                const expiredCount = this.messageCache.size - validCachedMessages.length;
                this.messageCache.clear();
                validCachedMessages.forEach((msg) => {
                    this.messageCache.set(msg._id, msg);
                });
                if (expiredCount > 0) {
                    this.log(`[Tappd SDK] Removed ${expiredCount} expired message(s) from cache`);
                    this.saveMessageCache();
                }
            }
            // Use cache if not forcing refresh and we have valid messages
            if (!forceRefresh && validCachedMessages.length > 0) {
                this.log('[Tappd SDK] Using cached messages');
                return validCachedMessages;
            }
            // Fetch from API
            try {
                const userId = this.currentUserId || this.anonymousId;
                const externalId = this.getExternalId();
                // Build query parameters
                const params = {};
                if (userId)
                    params.userId = userId;
                if (externalId)
                    params.externalId = externalId;
                // Email would be in customer attributes, but we don't store it in SDK
                // API will look it up from customer record
                const queryString = new URLSearchParams(params).toString();
                const url = `${this.apiUrl}/in-app-messages${queryString ? `?${queryString}` : ''}`;
                const response = yield fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-Id': this.appId,
                    },
                });
                if (!response.ok) {
                    throw new Error(`Request failed: ${response.statusText}`);
                }
                const result = yield response.json();
                const messages = ((_a = result.data) === null || _a === void 0 ? void 0 : _a.messages) || [];
                // Filter out expired messages (API should already filter, but double-check)
                const now = new Date();
                const validMessages = messages.filter((msg) => {
                    if (!msg.expiresAt) {
                        return true; // No expiry, keep message
                    }
                    const expiresAt = new Date(msg.expiresAt);
                    return expiresAt > now; // Keep if not expired
                });
                // Update cache with valid messages only
                // Keep existing non-expired messages that weren't in this fetch
                const fetchedMessageIds = new Set(validMessages.map((msg) => msg._id));
                const existingValidMessages = Array.from(this.messageCache.values()).filter((msg) => {
                    // Keep if not in fetched messages and not expired
                    if (fetchedMessageIds.has(msg._id)) {
                        return false; // Will be replaced by fetched version
                    }
                    if (!msg.expiresAt) {
                        return true;
                    }
                    const expiresAt = new Date(msg.expiresAt);
                    return expiresAt > now;
                });
                this.messageCache.clear();
                // Add existing valid messages
                existingValidMessages.forEach((msg) => {
                    this.messageCache.set(msg._id, msg);
                });
                // Add/update fetched messages
                validMessages.forEach((msg) => {
                    var _a;
                    this.messageCache.set(msg._id, msg);
                    // Register event-triggered messages to wait for events
                    const triggerConfig = msg.triggerConfig || ((_a = msg.config) === null || _a === void 0 ? void 0 : _a.triggerConfig);
                    if ((triggerConfig === null || triggerConfig === void 0 ? void 0 : triggerConfig.type) === 'event' && triggerConfig.eventName) {
                        // Check if event already occurred
                        if (!this.hasEventOccurred(triggerConfig.eventName)) {
                            this.registerEventTrigger(triggerConfig.eventName, msg._id);
                        }
                    }
                });
                this.lastFetchTime = Date.now();
                this.saveMessageCache();
                this.log('[Tappd SDK] Fetched ' + messages.length + ' messages from API');
                return messages;
            }
            catch (error) {
                // Fallback to stale cache if API fails (filter expired messages)
                if (this.messageCache.size > 0) {
                    const now = new Date();
                    const validCachedMessages = Array.from(this.messageCache.values()).filter((msg) => {
                        if (!msg.expiresAt) {
                            return true; // No expiry, keep message
                        }
                        const expiresAt = new Date(msg.expiresAt);
                        return expiresAt > now; // Keep if not expired
                    });
                    if (validCachedMessages.length > 0) {
                        this.log('[Tappd SDK] API failed, using stale cache (filtered expired messages)');
                        return validCachedMessages;
                    }
                }
                this.log('[Tappd SDK] Get in-app messages error:', error);
                throw error;
            }
        });
    }
    /**
     * Display a single in-app message
     */
    displayInAppMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Check if message has expired
                if (this.checkMessageExpiration(message)) {
                    this.log('[Tappd SDK] Message expired, skipping:', message._id);
                    return;
                }
                // Check if message is already displayed
                if (this.displayedMessages.has(message._id)) {
                    this.log('[Tappd SDK] Message already displayed:', message._id);
                    return;
                }
                // Evaluate trigger (pass message for event trigger registration)
                const triggerConfig = message.triggerConfig || ((_a = message.config) === null || _a === void 0 ? void 0 : _a.triggerConfig);
                if (!this.evaluateTrigger(triggerConfig, message)) {
                    this.log('[Tappd SDK] Trigger condition not met for message:', message._id);
                    return;
                }
                // Render the message
                const container = renderMessage(message, {
                    onDismiss: (messageId) => {
                        this.dismissMessage(messageId);
                    },
                    onButtonClick: (messageId, buttonLink, buttonText, action) => __awaiter(this, void 0, void 0, function* () {
                        var _a, _b;
                        // Track button click event
                        yield this.trackMessageEvent(messageId, 'clicked', {
                            buttonText,
                            buttonLink,
                            actionType: action === null || action === void 0 ? void 0 : action.type,
                        });
                        // Handle bridge actions
                        if (action && action.type !== 'none') {
                            if (action.type === 'close') {
                                // Close the message
                                this.dismissMessage(messageId);
                            }
                            else if (action.type === 'track_event') {
                                // Track custom event
                                yield this.handleBridgeAction(messageId, 'track_event', {
                                    eventName: action.eventName,
                                    eventProperties: action.eventProperties,
                                });
                            }
                            else if (action.type === 'update_profile') {
                                // Update customer profile
                                yield this.handleBridgeAction(messageId, 'update_profile', {
                                    profileAttributes: action.profileAttributes,
                                });
                            }
                            else if (action.type === 'link') {
                                // Handle link
                                const link = action.link || buttonLink;
                                if (link && link !== '#') {
                                    const linkBehavior = ((_b = (_a = message.config) === null || _a === void 0 ? void 0 : _a.button) === null || _b === void 0 ? void 0 : _b.linkBehavior) || 'browser';
                                    if (linkBehavior === 'browser') {
                                        window.open(link, '_blank');
                                    }
                                    else {
                                        window.location.href = link;
                                    }
                                }
                            }
                        }
                        else {
                            // Legacy: handle link behavior
                            if (buttonLink && buttonLink !== '#') {
                                window.open(buttonLink, '_blank');
                            }
                        }
                    }),
                    containerId: this.messageContainerId,
                });
                // Mark as displayed
                this.displayedMessages.add(message._id);
                // Track viewed event
                yield this.trackMessageEvent(message._id, 'viewed', {});
                // Mark as delivered in API
                yield this.markMessageDelivered(message._id);
                this.log('[Tappd SDK] Message displayed:', message._id);
            }
            catch (error) {
                this.log('[Tappd SDK] Display message error:', error);
            }
        });
    }
    /**
     * Display all pending messages
     */
    displayPendingMessages() {
        return __awaiter(this, arguments, void 0, function* (forceRefresh = false) {
            if (!this.enableInAppMessages) {
                return;
            }
            try {
                const messages = yield this.getInAppMessages(forceRefresh);
                // Filter out already displayed messages
                const newMessages = messages.filter((msg) => !this.displayedMessages.has(msg._id));
                // Display messages one by one (or could display multiple)
                for (const message of newMessages) {
                    yield this.displayInAppMessage(message);
                }
            }
            catch (error) {
                this.log('[Tappd SDK] Display pending messages error:', error);
            }
        });
    }
    /**
     * Dismiss an in-app message
     */
    dismissMessage(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Remove from displayed set
                this.displayedMessages.delete(messageId);
                // Remove from DOM
                this.removeMessage(messageId);
                // Track dismissed event
                yield this.trackMessageEvent(messageId, 'dismissed', {});
                // Mark as dismissed in API
                yield this.markMessageDismissed(messageId);
                this.log('[Tappd SDK] Message dismissed:', messageId);
            }
            catch (error) {
                this.log('[Tappd SDK] Dismiss message error:', error);
            }
        });
    }
    /**
     * Track message event
     */
    trackMessageEvent(messageId, eventType, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.track(`message.${eventType}`, Object.assign({ messageId }, metadata));
            }
            catch (error) {
                this.log('[Tappd SDK] Track message event error:', error);
            }
        });
    }
    /**
     * Mark message as delivered
     */
    markMessageDelivered(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.apiUrl}/in-app-messages/${messageId}/delivered`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-Id': this.appId,
                    },
                });
                if (!response.ok) {
                    throw new Error(`Request failed: ${response.statusText}`);
                }
            }
            catch (error) {
                this.log('[Tappd SDK] Mark message delivered error:', error);
            }
        });
    }
    /**
     * Mark message as dismissed
     */
    markMessageDismissed(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.apiUrl}/in-app-messages/${messageId}/dismiss`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-Id': this.appId,
                    },
                });
                if (!response.ok) {
                    throw new Error(`Request failed: ${response.statusText}`);
                }
            }
            catch (error) {
                this.log('[Tappd SDK] Mark message dismissed error:', error);
            }
        });
    }
    /**
     * Handle bridge action (Braze-like functionality)
     */
    handleBridgeAction(messageId, actionType, actionData, formData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = this.currentUserId || this.anonymousId;
                const externalId = this.getExternalId() || undefined;
                const email = this.getEmail();
                const phone = this.getPhone();
                const response = yield fetch(`${this.apiUrl}/bridge/action`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-Id': this.appId,
                    },
                    body: JSON.stringify({
                        messageId,
                        actionType,
                        actionData,
                        formData,
                        userId,
                        external_id: externalId,
                        email,
                        phone,
                    }),
                });
                if (!response.ok) {
                    throw new Error(`Bridge action failed: ${response.statusText}`);
                }
                const result = yield response.json();
                this.log('[Tappd SDK] Bridge action processed:', result);
            }
            catch (error) {
                this.log('[Tappd SDK] Bridge action error:', error);
            }
        });
    }
    /**
     * Capture form data from in-app messages
     */
    captureFormData(messageId, formData, submitAction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = this.currentUserId || this.anonymousId;
                const externalId = this.getExternalId() || undefined;
                const email = this.getEmail();
                const phone = this.getPhone();
                const response = yield fetch(`${this.apiUrl}/bridge/capture`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-Id': this.appId,
                    },
                    body: JSON.stringify({
                        messageId,
                        formData,
                        submitAction,
                        userId,
                        external_id: externalId,
                        email,
                        phone,
                    }),
                });
                if (!response.ok) {
                    throw new Error(`Form capture failed: ${response.statusText}`);
                }
                const result = yield response.json();
                this.log('[Tappd SDK] Form data captured:', result);
            }
            catch (error) {
                this.log('[Tappd SDK] Form capture error:', error);
            }
        });
    }
    /**
     * Get email (if user is identified)
     */
    getEmail() {
        try {
            return localStorage.getItem('_tappd_email') || undefined;
        }
        catch (_a) {
            return undefined;
        }
    }
    /**
     * Get phone (if user is identified)
     */
    getPhone() {
        try {
            return localStorage.getItem('_tappd_phone') || undefined;
        }
        catch (_a) {
            return undefined;
        }
    }
    /**
     * Evaluate trigger conditions
     */
    evaluateTrigger(triggerConfig, message) {
        if (!triggerConfig || triggerConfig.type === 'immediate') {
            return true;
        }
        if (triggerConfig.type === 'delay') {
            // Delay triggers are handled server-side (triggeredAt)
            // If message has triggeredAt and it's in the past, trigger is met
            return true;
        }
        if (triggerConfig.type === 'page_visit') {
            const currentPath = window.location.pathname;
            const targetPath = triggerConfig.pagePath;
            if (targetPath) {
                return currentPath === targetPath || currentPath.startsWith(targetPath);
            }
        }
        if (triggerConfig.type === 'event') {
            // Check if the event has occurred recently (within last hour)
            if (!triggerConfig.eventName) {
                return false;
            }
            const hasEventOccurred = this.hasEventOccurred(triggerConfig.eventName, 3600000); // 1 hour window
            if (!hasEventOccurred) {
                // Event hasn't occurred yet - register this message to wait for the event
                if (message && message._id) {
                    this.registerEventTrigger(triggerConfig.eventName, message._id);
                }
                return false; // Don't display yet
            }
            return true; // Event occurred, display message
        }
        return true;
    }
    /**
     * Check if message has expired
     */
    checkMessageExpiration(message) {
        if (!message.expiresAt) {
            return false;
        }
        const expiresAt = new Date(message.expiresAt);
        const now = new Date();
        return now > expiresAt;
    }
    /**
     * Check if an event has occurred recently
     */
    hasEventOccurred(eventName, withinMs = 3600000) {
        const timestamp = this.recentEvents.get(eventName);
        if (!timestamp) {
            return false;
        }
        return (Date.now() - timestamp) < withinMs;
    }
    /**
     * Clean old events from recent events map (older than 1 hour)
     */
    cleanOldEvents() {
        const oneHourAgo = Date.now() - 3600000;
        for (const [eventName, timestamp] of this.recentEvents.entries()) {
            if (timestamp < oneHourAgo) {
                this.recentEvents.delete(eventName);
            }
        }
    }
    /**
     * Register a message to wait for a specific event
     */
    registerEventTrigger(eventName, messageId) {
        if (!this.eventTriggeredMessages.has(eventName)) {
            this.eventTriggeredMessages.set(eventName, new Set());
        }
        this.eventTriggeredMessages.get(eventName).add(messageId);
        this.log('[Tappd SDK] Message ' + messageId + ' registered to wait for event: ' + eventName);
    }
    /**
     * Check if any pending messages are waiting for a tracked event
     */
    checkEventTriggers(eventName) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const waitingMessageIds = this.eventTriggeredMessages.get(eventName);
            if (!waitingMessageIds || waitingMessageIds.size === 0) {
                return; // No messages waiting for this event
            }
            this.log('[Tappd SDK] Event ' + eventName + ' occurred, checking ' + waitingMessageIds.size + ' waiting messages');
            // Get messages from cache
            const messagesToDisplay = [];
            for (const messageId of waitingMessageIds) {
                const message = this.messageCache.get(messageId);
                if (message && !this.displayedMessages.has(messageId)) {
                    // Verify trigger still matches
                    const triggerConfig = message.triggerConfig || ((_a = message.config) === null || _a === void 0 ? void 0 : _a.triggerConfig);
                    if ((triggerConfig === null || triggerConfig === void 0 ? void 0 : triggerConfig.type) === 'event' && triggerConfig.eventName === eventName) {
                        messagesToDisplay.push(message);
                    }
                }
            }
            // Display messages that were waiting for this event
            for (const message of messagesToDisplay) {
                yield this.displayInAppMessage(message);
            }
            // Remove displayed messages from waiting list
            for (const messageId of waitingMessageIds) {
                if (this.displayedMessages.has(messageId)) {
                    waitingMessageIds.delete(messageId);
                }
            }
            // Clean up empty event entries
            if (waitingMessageIds.size === 0) {
                this.eventTriggeredMessages.delete(eventName);
            }
        });
    }
    /**
     * Remove message from DOM
     */
    removeMessage(messageId) {
        // Try to find the message container
        const container = document.getElementById(`tappd-message-${messageId}`);
        if (container) {
            // For popup/modal, container might be inside an overlay
            const overlay = container.closest('.tappd-message-overlay');
            if (overlay) {
                // Animate out before removing
                overlay.style.transition = 'opacity 0.2s ease-out';
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                }, 200);
            }
            else {
                // For banners, just remove the container
                const htmlContainer = container;
                htmlContainer.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
                if (container.classList.contains('tappd-message-top')) {
                    htmlContainer.style.transform = 'translateY(-100%)';
                }
                else if (container.classList.contains('tappd-message-bottom')) {
                    htmlContainer.style.transform = 'translateY(100%)';
                }
                else {
                    htmlContainer.style.opacity = '0';
                }
                setTimeout(() => {
                    container.remove();
                }, 200);
            }
        }
    }
    /**
     * Inject CSS styles for message rendering
     */
    injectStyles() {
        // Check if styles already injected
        if (document.getElementById('tappd-message-styles')) {
            return;
        }
        const style = document.createElement('style');
        style.id = 'tappd-message-styles';
        style.textContent = getStyles();
        document.head.appendChild(style);
    }
    /**
     * Web Push Methods
     */
    /**
     * Get VAPID public key from server
     * @returns {Promise<string>} VAPID public key
     */
    getVapidPublicKey() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield fetch(`${this.apiUrl}/web-push/vapid-public-key`, {
                    method: 'GET',
                    headers: {
                        'X-App-Id': this.appId
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to get VAPID public key: ${response.statusText}`);
                }
                const data = yield response.json();
                return ((_a = data.data) === null || _a === void 0 ? void 0 : _a.publicKey) || data.publicKey;
            }
            catch (error) {
                this.log('Error getting VAPID public key:', error);
                throw error;
            }
        });
    }
    /**
     * Check if user is subscribed to push notifications
     * @returns {Promise<boolean>} True if subscribed
     */
    isSubscribed() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Check browser support
                if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                    this.log('Push notifications are not supported in this browser');
                    return false;
                }
                // Get service worker registration
                if (!this.serviceWorkerRegistration) {
                    this.serviceWorkerRegistration = yield navigator.serviceWorker.ready;
                }
                // Get existing subscription
                const subscription = yield this.serviceWorkerRegistration.pushManager.getSubscription();
                if (!subscription) {
                    return false;
                }
                // Check with server
                const endpoint = subscription.endpoint;
                const response = yield fetch(`${this.apiUrl}/web-push/subscription-status?endpoint=${encodeURIComponent(endpoint)}`, {
                    method: 'GET',
                    headers: {
                        'X-App-Id': this.appId
                    }
                });
                if (!response.ok) {
                    return false;
                }
                const data = yield response.json();
                return ((_a = data.data) === null || _a === void 0 ? void 0 : _a.subscribed) === true;
            }
            catch (error) {
                this.log('Error checking subscription status:', error);
                return false;
            }
        });
    }
    /**
     * Subscribe to push notifications
     * @param {PushSubscriptionOptions} options - Optional subscription options
     * @returns {Promise<PushSubscription>} Push subscription object
     */
    subscribeToPush(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check browser support
                if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                    throw new Error('Push notifications are not supported in this browser');
                }
                // Check permission
                const permission = yield Notification.requestPermission();
                if (permission !== 'granted') {
                    throw new Error('Notification permission denied');
                }
                // Get or register service worker
                if (!this.serviceWorkerRegistration) {
                    // Try to register service worker (should be at root: /sw.js)
                    try {
                        this.serviceWorkerRegistration = yield navigator.serviceWorker.register('/sw.js');
                    }
                    catch (error) {
                        // If service worker doesn't exist, we'll still try to subscribe
                        // The browser will handle it
                        this.serviceWorkerRegistration = yield navigator.serviceWorker.ready;
                    }
                }
                // Get VAPID public key
                const vapidPublicKey = yield this.getVapidPublicKey();
                // Convert VAPID key to Uint8Array
                const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);
                // Subscribe to push
                const subscriptionOptions = Object.assign({ userVisibleOnly: true, applicationServerKey: applicationServerKey.buffer }, options);
                const subscription = yield this.serviceWorkerRegistration.pushManager.subscribe(subscriptionOptions);
                this.pushSubscription = subscription;
                // Register subscription with server
                const subscriptionObj = {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
                        auth: this.arrayBufferToBase64(subscription.getKey('auth'))
                    }
                };
                yield this.post('/web-push/subscribe', {
                    subscription: subscriptionObj
                });
                this.log('[Tappd SDK] Successfully subscribed to push notifications');
                return subscription;
            }
            catch (error) {
                this.log('Error subscribing to push:', error);
                throw error;
            }
        });
    }
    /**
     * Unsubscribe from push notifications
     * @returns {Promise<void>}
     */
    unsubscribeFromPush() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.serviceWorkerRegistration) {
                    this.serviceWorkerRegistration = yield navigator.serviceWorker.ready;
                }
                const subscription = yield this.serviceWorkerRegistration.pushManager.getSubscription();
                if (subscription) {
                    // Unsubscribe from browser
                    yield subscription.unsubscribe();
                    // Notify server
                    try {
                        const subscriptionObj = {
                            endpoint: subscription.endpoint,
                            keys: {
                                p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
                                auth: this.arrayBufferToBase64(subscription.getKey('auth'))
                            }
                        };
                        yield this.post('/web-push/unsubscribe', {
                            subscription: subscriptionObj
                        });
                    }
                    catch (error) {
                        this.log('Error notifying server of unsubscribe:', error);
                    }
                    this.pushSubscription = null;
                    this.log('[Tappd SDK] Successfully unsubscribed from push notifications');
                }
            }
            catch (error) {
                this.log('Error unsubscribing from push:', error);
                throw error;
            }
        });
    }
    /**
     * Show permission prompt (slidedown, bell, or native)
     * @param {string} type - Prompt type: 'slidedown', 'bell', or 'native'
     * @returns {Promise<void>}
     */
    showPermissionPrompt() {
        return __awaiter(this, arguments, void 0, function* (type = 'slidedown') {
            try {
                // Check if already subscribed
                const isSubscribed = yield this.isSubscribed();
                if (isSubscribed) {
                    this.log('[Tappd SDK] User is already subscribed to push notifications');
                    return;
                }
                // Check permission status
                if (Notification.permission === 'denied') {
                    throw new Error('Notification permission has been denied. Please enable it in browser settings.');
                }
                if (type === 'native') {
                    // Show native browser prompt
                    yield this.subscribeToPush();
                    return;
                }
                // Get app config to get prompt settings
                // For now, we'll use default settings
                // In a full implementation, you'd fetch app config from server
                if (type === 'slidedown') {
                    this.showSlidedownPrompt();
                }
                else if (type === 'bell') {
                    this.showBellPrompt();
                }
            }
            catch (error) {
                this.log('Error showing permission prompt:', error);
                throw error;
            }
        });
    }
    /**
     * Hide permission prompt
     */
    hidePermissionPrompt() {
        if (this.promptElement) {
            this.promptElement.remove();
            this.promptElement = null;
        }
    }
    /**
     * Show slidedown prompt
     */
    showSlidedownPrompt() {
        // Remove existing prompt if any
        this.hidePermissionPrompt();
        const prompt = document.createElement('div');
        prompt.id = 'tappd-slidedown-prompt';
        prompt.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      padding: 16px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    `;
        const message = document.createElement('div');
        message.textContent = 'Stay updated with push notifications';
        message.style.cssText = 'flex: 1; font-size: 14px; color: #374151;';
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 8px;';
        const allowButton = document.createElement('button');
        allowButton.textContent = 'Allow';
        allowButton.style.cssText = `
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
        allowButton.onclick = () => __awaiter(this, void 0, void 0, function* () {
            this.hidePermissionPrompt();
            try {
                yield this.subscribeToPush();
            }
            catch (error) {
                this.log('Error subscribing:', error);
            }
        });
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Not now';
        cancelButton.style.cssText = `
      padding: 8px 16px;
      background: #f3f4f6;
      color: #374151;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
        cancelButton.onclick = () => {
            this.hidePermissionPrompt();
        };
        buttonContainer.appendChild(allowButton);
        buttonContainer.appendChild(cancelButton);
        prompt.appendChild(message);
        prompt.appendChild(buttonContainer);
        document.body.appendChild(prompt);
        this.promptElement = prompt;
    }
    /**
     * Show bell prompt (persistent widget)
     */
    showBellPrompt() {
        // Remove existing prompt if any
        this.hidePermissionPrompt();
        const bell = document.createElement('div');
        bell.id = 'tappd-bell-prompt';
        bell.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      background: #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      transition: transform 0.2s;
    `;
        bell.onmouseenter = () => {
            bell.style.transform = 'scale(1.1)';
        };
        bell.onmouseleave = () => {
            bell.style.transform = 'scale(1)';
        };
        bell.onclick = () => __awaiter(this, void 0, void 0, function* () {
            this.hidePermissionPrompt();
            try {
                yield this.subscribeToPush();
            }
            catch (error) {
                this.log('Error subscribing:', error);
            }
        });
        const bellIcon = document.createElement('div');
        bellIcon.textContent = '🔔';
        bellIcon.style.cssText = 'font-size: 24px;';
        bell.appendChild(bellIcon);
        document.body.appendChild(bell);
        this.promptElement = bell;
    }
    /**
     * Convert URL-safe base64 to Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
    /**
     * Convert ArrayBuffer to base64
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
    /**
     * Get banners for a selector and auto-render them
     * @param selector - CSS selector or data attribute selector
     * @param options - Optional configuration
     * @returns Promise<Banner[]> - Array of banner data (for custom rendering)
     */
    getBanners(selector_1) {
        return __awaiter(this, arguments, void 0, function* (selector, options = {}) {
            const autoRender = options.autoRender !== false; // Default to true
            try {
                // Fetch banners from API
                const banners = yield this.fetchBannersFromAPI(selector);
                if (autoRender) {
                    // Auto-render banners
                    for (const bannerData of banners) {
                        yield this.renderBanner(bannerData, selector);
                    }
                }
                return banners;
            }
            catch (error) {
                this.log('[Tappd SDK] Get banners error:', error);
                throw error;
            }
        });
    }
    /**
     * Fetch banners from API
     */
    fetchBannersFromAPI(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = this.currentUserId || this.anonymousId;
            const externalId = this.getExternalId();
            const params = { selector };
            if (userId)
                params.userId = userId;
            if (externalId)
                params.externalId = externalId;
            const queryString = new URLSearchParams(params).toString();
            const url = `${this.apiUrl}/banners?${queryString}`;
            const response = yield fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-Id': this.appId,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch banners: ${response.statusText}`);
            }
            const result = yield response.json();
            return ((_a = result.data) === null || _a === void 0 ? void 0 : _a.banners) || [];
        });
    }
    /**
     * Render a banner in the DOM
     */
    renderBanner(bannerData, selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const { banner, variant } = bannerData;
            // Find target element
            let targetElement = null;
            // Try CSS selector first
            if (selector.startsWith('#') || selector.startsWith('.') || selector.includes(' ')) {
                targetElement = document.querySelector(selector);
            }
            else {
                // Try data attribute
                const dataAttrMatch = selector.match(/^data-([\w-]+)(?:="([^"]+)")?$/);
                if (dataAttrMatch) {
                    const attrName = dataAttrMatch[1];
                    const attrValue = dataAttrMatch[2];
                    if (attrValue) {
                        targetElement = document.querySelector(`[data-${attrName}="${attrValue}"]`);
                    }
                    else {
                        targetElement = document.querySelector(`[data-${attrName}]`);
                    }
                }
                else {
                    // Fallback to querySelector
                    targetElement = document.querySelector(selector);
                }
            }
            if (!targetElement) {
                this.log(`[Tappd SDK] Banner placement element not found: ${selector}`);
                return;
            }
            // Check if banner already rendered
            const existingBanner = this.renderedBanners.get(banner._id);
            if (existingBanner) {
                this.log(`[Tappd SDK] Banner already rendered: ${banner._id}`);
                return;
            }
            // Create banner element
            const bannerEl = document.createElement('div');
            bannerEl.id = `tappd-banner-${banner._id}`;
            bannerEl.className = 'tappd-banner';
            // Apply design styles
            const design = variant.design || {};
            bannerEl.style.backgroundColor = design.backgroundColor || '#ffffff';
            bannerEl.style.color = design.textColor || '#000000';
            bannerEl.style.padding = design.padding || '16px';
            bannerEl.style.margin = design.margin || '0';
            bannerEl.style.borderRadius = design.borderRadius || '4px';
            bannerEl.style.fontFamily = design.fontFamily || 'Arial, sans-serif';
            bannerEl.style.fontSize = design.fontSize || '16px';
            bannerEl.style.display = 'flex';
            bannerEl.style.alignItems = 'center';
            bannerEl.style.justifyContent = 'space-between';
            bannerEl.style.width = '100%';
            bannerEl.style.boxSizing = 'border-box';
            // Create content container
            const contentContainer = document.createElement('div');
            contentContainer.style.display = 'flex';
            contentContainer.style.alignItems = 'center';
            contentContainer.style.flex = '1';
            contentContainer.style.gap = '16px';
            // Add image if present
            const content = variant.content || {};
            if (content.imageUrl) {
                const img = document.createElement('img');
                img.src = content.imageUrl;
                img.alt = content.title || '';
                img.style.maxHeight = '60px';
                img.style.maxWidth = '100px';
                img.style.objectFit = 'contain';
                contentContainer.appendChild(img);
            }
            // Add text content
            const textContainer = document.createElement('div');
            textContainer.style.flex = '1';
            if (content.title) {
                const title = document.createElement('h3');
                title.textContent = content.title;
                title.style.margin = '0 0 8px 0';
                title.style.fontSize = design.fontSize || '16px';
                title.style.fontWeight = 'bold';
                textContainer.appendChild(title);
            }
            if (content.message) {
                const message = document.createElement('p');
                message.textContent = content.message;
                message.style.margin = '0';
                textContainer.appendChild(message);
            }
            contentContainer.appendChild(textContainer);
            // Add CTA button if present
            if (content.cta && content.cta.text) {
                const ctaButton = document.createElement('button');
                ctaButton.textContent = content.cta.text;
                ctaButton.style.backgroundColor = design.ctaBackgroundColor || '#007bff';
                ctaButton.style.color = design.ctaTextColor || '#ffffff';
                ctaButton.style.border = 'none';
                ctaButton.style.padding = '8px 16px';
                ctaButton.style.borderRadius = '4px';
                ctaButton.style.cursor = 'pointer';
                ctaButton.style.marginLeft = '16px';
                ctaButton.style.fontSize = design.fontSize || '16px';
                ctaButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                    const stored = this.renderedBanners.get(banner._id);
                    if (stored) {
                        yield this.trackBannerClick(banner._id, stored.displayId);
                    }
                    // Handle CTA action
                    if (content.cta.action === 'link' && content.cta.link) {
                        window.location.href = content.cta.link;
                    }
                    else if (content.cta.action === 'close') {
                        yield this.dismissBannerElement(banner._id);
                    }
                }));
                contentContainer.appendChild(ctaButton);
            }
            bannerEl.appendChild(contentContainer);
            // Add close button if dismissible
            const config = variant.config || {};
            if (config.dismissible && config.closeButton !== false) {
                const closeButton = document.createElement('button');
                closeButton.innerHTML = '×';
                closeButton.style.background = 'none';
                closeButton.style.border = 'none';
                closeButton.style.fontSize = '24px';
                closeButton.style.cursor = 'pointer';
                closeButton.style.padding = '0 8px';
                closeButton.style.marginLeft = '16px';
                closeButton.style.color = design.textColor || '#000000';
                closeButton.setAttribute('aria-label', 'Dismiss');
                closeButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                    yield this.dismissBannerElement(banner._id);
                }));
                bannerEl.appendChild(closeButton);
            }
            // Add animation
            const animation = config.animation || 'fade';
            if (animation === 'fade') {
                bannerEl.style.opacity = '0';
                bannerEl.style.transition = 'opacity 0.3s ease-out';
                setTimeout(() => {
                    bannerEl.style.opacity = '1';
                }, 10);
            }
            else if (animation === 'slide') {
                bannerEl.style.transform = 'translateY(-100%)';
                bannerEl.style.transition = 'transform 0.3s ease-out';
                setTimeout(() => {
                    bannerEl.style.transform = 'translateY(0)';
                }, 10);
            }
            // Append to container
            targetElement.appendChild(bannerEl);
            // Track display and store displayId
            const displayId = yield this.trackBannerDisplay(banner._id, variant._id, selector);
            this.renderedBanners.set(banner._id, { displayId, element: bannerEl });
            // Auto-hide if configured
            if (config.autoHide && config.autoHideDelay) {
                setTimeout(() => {
                    this.dismissBannerElement(banner._id);
                }, config.autoHideDelay);
            }
        });
    }
    /**
     * Dismiss banner element
     */
    dismissBannerElement(bannerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const stored = this.renderedBanners.get(bannerId);
            if (stored) {
                yield this.trackBannerDismiss(bannerId, stored.displayId);
                stored.element.remove();
                this.renderedBanners.delete(bannerId);
            }
        });
    }
    /**
     * Track banner display
     */
    trackBannerDisplay(bannerId, variantId, selector) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = this.currentUserId || this.anonymousId;
                const externalId = this.getExternalId();
                const response = yield fetch(`${this.apiUrl}/banners/${bannerId}/display`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-Id': this.appId,
                    },
                    body: JSON.stringify({
                        variantId,
                        selector,
                        userId,
                        externalId,
                    }),
                });
                if (!response.ok) {
                    throw new Error(`Failed to track display: ${response.statusText}`);
                }
                const result = yield response.json();
                return ((_a = result.data) === null || _a === void 0 ? void 0 : _a.displayId) || '';
            }
            catch (error) {
                this.log('[Tappd SDK] Track banner display error:', error);
                return '';
            }
        });
    }
    /**
     * Track banner click
     */
    trackBannerClick(bannerId, displayId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.apiUrl}/banners/${bannerId}/click`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-Id': this.appId,
                    },
                    body: JSON.stringify({ displayId }),
                });
                if (!response.ok) {
                    throw new Error(`Failed to track click: ${response.statusText}`);
                }
            }
            catch (error) {
                this.log('[Tappd SDK] Track banner click error:', error);
            }
        });
    }
    /**
     * Track banner dismiss
     */
    trackBannerDismiss(bannerId, displayId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.apiUrl}/banners/${bannerId}/dismiss`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-Id': this.appId,
                    },
                    body: JSON.stringify({ displayId }),
                });
                if (!response.ok) {
                    throw new Error(`Failed to track dismiss: ${response.statusText}`);
                }
            }
            catch (error) {
                this.log('[Tappd SDK] Track banner dismiss error:', error);
            }
        });
    }
}
export default TappdSDK;
//# sourceMappingURL=index.js.map