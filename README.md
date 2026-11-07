# Tappd Web SDK

Customer Data Platform SDK for web applications. Track user behavior, sessions, page visits, and custom events with automatic session management and anonymous user tracking.

## Features

✅ **Automatic Session Management** - Hybrid approach with browser and time-based sessions  
✅ **Anonymous User Tracking** - Track users before identification, automatically merge data  
✅ **Auto Page View Tracking** - Automatic page visit tracking with SPA support  
✅ **Manual Event Tracking** - Track custom events throughout your application  
✅ **Auto-Capture** - Optional automatic click and form tracking  
✅ **Comprehensive Device Info** - Browser, OS, screen, timezone, language tracking  
✅ **UTM Parameter Tracking** - Automatic UTM parameter extraction  
✅ **Duration Tracking** - Track time spent on pages  

## Installation

You can use the SDK via CDN (recommended for quick integration) or NPM (for build tools).

### Option 1: CDN (Recommended for Quick Start)

Add this script tag to your HTML:

```html
<!-- Load from CDN -->
<script src="https://cdn.tappd.io/web-sdk/v1/tappd-sdk.min.js"></script>
<script>
  // SDK is now available as TappdSDK global variable
  const tappd = new TappdSDK.TappdSDK({
    appId: 'YOUR_APP_ID',
    apiUrl: 'https://api.tappd.io/api/v1/sdk'
  });
</script>
```

Or load from your local server:

```html
<script src="./path/to/tappd-sdk.min.js"></script>
<script>
  const tappd = new TappdSDK({
    appId: 'YOUR_APP_ID'
  });
</script>
```

### Option 2: NPM (For Build Tools)

```bash
npm install @tappd/web-sdk
```

Then in your JavaScript:

```javascript
// ES Module
import { TappdSDK } from '@tappd/web-sdk';

const tappd = new TappdSDK({
  appId: 'YOUR_APP_ID',
  apiUrl: 'https://api.tappd.io/api/v1/sdk'
});

// CommonJS
const { TappdSDK } = require('@tappd/web-sdk');

const tappd = new TappdSDK({
  appId: 'YOUR_APP_ID',
  apiUrl: 'https://api.tappd.io/api/v1/sdk'
});
```

## Quick Start

### 1. Get Your App ID

1. Log into your Tappd dashboard
2. Navigate to Settings > Apps
3. Copy the App ID for your web app

### 2. Initialize the SDK

```javascript
import TappdSDK from '@tappd/web-sdk';

const tappd = new TappdSDK({
  appId: 'YOUR_APP_ID',
  apiUrl: 'https://sdk.gotappd.com/api/v1/sdk', // Optional
  autoTrack: true, // Auto-track page views (default: true)
  sessionTimeout: 30, // Session timeout in minutes (default: 30)
  enableAutoCapture: false, // Auto-capture clicks/forms (default: false)
  debug: false // Enable debug logging (default: false)
});
```

### 3. Identify Users

```javascript
// When user logs in or signs up
await tappd.identify('user_123', {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  external_id: 'ext_123',
  // Custom attributes
  age: 28,
  plan: 'premium',
  company: 'Acme Corp'
});
```

### 4. Track Custom Events

We recommend using standard event names for consistency:

```javascript
// Ecommerce events
await tappd.track('ecommerce.product_viewed', {
  productId: 'prod_123',
  productName: 'Pro Plan',
  price: 99.99
});

await tappd.track('ecommerce.add_to_cart', {
  productId: 'prod_123',
  quantity: 1,
  price: 99.99,
  currency: 'USD'
});

await tappd.track('ecommerce.purchase', {
  orderId: 'ord_123',
  total: 99.99,
  currency: 'USD',
  items: [...]
});

// Web interaction events
await tappd.track('web.interaction.click', {
  element: 'button',
  text: 'Get Started',
  location: 'hero'
});

await tappd.track('web.form.submitted', {
  formId: 'contact-form',
  formName: 'Contact Us',
  success: true
});

// User events
await tappd.track('user.signup', {
  method: 'email',
  source: 'landing-page'
});
```

## Configuration

### TappdConfig Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appId` | string | **Required** | Your App ID from the dashboard |
| `apiUrl` | string | `https://sdk.gotappd.com/api/v1/sdk` | Custom API URL |
| `autoTrack` | boolean | `true` | Auto-track page views |
| `sessionTimeout` | number | `30` | Session timeout in minutes |
| `enableAutoCapture` | boolean | `false` | Auto-capture clicks/forms |
| `debug` | boolean | `false` | Enable debug logging |

## API Reference

### Core Methods

#### `identify(userId, attributes?)`

Identify or update a customer. Automatically merges anonymous data if user was previously anonymous.

```javascript
await tappd.identify('user_123', {
  name: 'John Doe',
  email: 'john@example.com',
  // Custom attributes
  age: 28,
  plan: 'premium'
});
```

**Returns:** `Promise<void>`

---

#### `track(eventName, properties?)`

Track a custom event. We recommend using standard event names (see [Standard Events](#standard-events)).

```javascript
// Using standard event names
await tappd.track('ecommerce.add_to_cart', {
  productId: 'prod_123',
  quantity: 1,
  price: 99.99,
  currency: 'USD'
});

// Or custom event names
await tappd.track('custom_event', {
  customProperty: 'value'
});
```

**Returns:** `Promise<void>`

---

#### `trackPageView(url?, properties?)`

Manually track a page view.

```javascript
await tappd.trackPageView('https://example.com/pricing');
```

**Returns:** `Promise<void>`

---

#### `setExternalId(externalId)`

Set the external ID for the current user.

```javascript
await tappd.setExternalId('ext_user_123');
```

**Returns:** `Promise<void>`

---

#### `setUserAttributes(attributes)`

Update user attributes.

```javascript
await tappd.setUserAttributes({
  plan: 'enterprise',
  lastLogin: new Date()
});
```

**Returns:** `Promise<void>`

---

#### `setCustomAttributes(attributes)`

Set custom user attributes.

```javascript
await tappd.setCustomAttributes({
  preferences: { theme: 'dark', language: 'en' }
});
```

**Returns:** `Promise<void>`

---

### Utility Methods

#### `getSessionId()`

Get the current session ID.

```javascript
const sessionId = tappd.getSessionId();
console.log('Session ID:', sessionId);
```

**Returns:** `string | null`

---

#### `getAnonymousId()`

Get the anonymous ID (persists across sessions).

```javascript
const anonymousId = tappd.getAnonymousId();
console.log('Anonymous ID:', anonymousId);
```

**Returns:** `string`

---

#### `reset()`

Reset the SDK state (clear user data, useful for logout).

```javascript
tappd.reset();
```

**Returns:** `void`

---

## Session Management

### How Sessions Work

The SDK uses a **hybrid session approach**:

1. **Browser-based**: New session per browser tab/window (stored in `sessionStorage`)
2. **Time-based**: Session expires after 30 minutes of inactivity (configurable)

### Session Lifecycle

1. **Session Start**: Automatically when SDK initializes
2. **Heartbeat**: Every 30 seconds to keep session alive
3. **Session End**: On page unload or after timeout

### Manual Session Control

```javascript
// Get current session ID
const sessionId = tappd.getSessionId();

// Sessions are managed automatically
// No manual start/end needed
```

---

## Anonymous User Tracking

### How Anonymous Tracking Works

1. **First Visit**: SDK generates an `anonymousId` and stores it in `localStorage`
2. **Anonymous Tracking**: All events, pages, and sessions are tracked with `anonymousId`
3. **Identification**: When `identify()` is called, all anonymous data is automatically merged
4. **Data Persistence**: Anonymous ID persists across browser sessions until identification

### Example Flow

```javascript
// User visits site (anonymous)
// SDK generates anonymousId and tracks page views, events

// Later, user logs in
await tappd.identify('user_123', {
  email: 'john@example.com',
  name: 'John Doe'
});

// All previous anonymous data is now associated with user_123
```

---

## Page View Tracking

### Automatic Tracking

Page views are **automatically tracked** when:
- SDK initializes on page load
- User navigates (SPA support via History API)
- Browser back/forward button is used

### Manual Tracking

```javascript
// Manually track a page view
await tappd.trackPageView('https://example.com/pricing');
```

### SPA Support

The SDK automatically tracks page views in Single Page Applications (SPAs) by:
- Overriding `history.pushState()` and `history.replaceState()`
- Listening for `popstate` events
- Tracking browser back/forward navigation

---

## Auto-Capture

### Enable Auto-Capture

```javascript
const tappd = new TappdSDK({
  appId: 'YOUR_APP_ID',
  enableAutoCapture: true // Enable automatic event capture
});
```

### What Gets Auto-Captured

- **Link Clicks**: All `<a>` tags clicked
- **Form Submissions**: All form submissions
- **Page Views**: (Always enabled if `autoTrack: true`)

---

## Device Information

The SDK automatically collects comprehensive device information:

```javascript
{
  userAgent: "Mozilla/5.0...",
  browser: { name: "Chrome", version: "120" },
  os: { name: "macOS", version: "14.0" },
  device: { type: "desktop" },
  screenSize: { width: 1920, height: 1080, pixelRatio: 2 },
  timezone: "America/New_York",
  language: "en-US",
  platform: "MacIntel",
  connection: "4g"
}
```

---

## UTM Parameter Tracking

UTM parameters are **automatically extracted** from page URLs:

```javascript
// If URL is: https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=summer
// SDK automatically extracts:
{
  source: "google",
  medium: "cpc",
  campaign: "summer"
}
```

---

## Standard Events

We've pre-defined standard event names for common use cases. These are automatically available in your workspace:

### Web Events

| Event Name | Description | Properties |
|------------|-------------|------------|
| `web.pageView` | User viewed a page | page, title, referrer |
| `web.interaction.click` | User clicked an element | element, text, location |
| `web.form.viewed` | User viewed a form | formId, formName |
| `web.form.started` | User started filling a form | formId, formName |
| `web.form.filled` | User filled out a form | formId, formName, fields |
| `web.form.submitted` | User submitted a form | formId, formName, success |

### Ecommerce Events

| Event Name | Description | Required Properties |
|------------|-------------|---------------------|
| `ecommerce.product_viewed` | User viewed a product | productId |
| `ecommerce.add_to_cart` | User added to cart | productId |
| `ecommerce.remove_from_cart` | User removed from cart | productId |
| `ecommerce.checkout_started` | User started checkout | - |
| `ecommerce.checkout_step_completed` | User completed checkout step | step |
| `ecommerce.purchase` | User completed purchase | orderId, total, currency |

### User Events

| Event Name | Description | Properties |
|------------|-------------|------------|
| `user.signup` | User signed up | method, source |
| `user.login` | User logged in | method |
| `user.logout` | User logged out | - |

### Usage

```javascript
// Ecommerce example
await tappd.track('ecommerce.product_viewed', {
  productId: 'prod_123',
  productName: 'Pro Plan',
  category: 'Subscription',
  price: 99.99
});

// Web interaction example
await tappd.track('web.interaction.click', {
  element: 'button',
  text: 'Get Started',
  location: 'hero'
});

// User event example
await tappd.track('user.signup', {
  method: 'email',
  source: 'landing-page'
});
```

**Note:** You can still use custom event names (e.g., `custom.event_name`), but using standard names ensures consistency and better analytics.

---

## Examples

### Example 1: E-commerce Purchase

```javascript
// Track product viewed
await tappd.track('ecommerce.product_viewed', {
  productId: 'prod_123',
  productName: 'iPhone 15',
  price: 999,
  category: 'Electronics'
});

// Track add to cart
await tappd.track('ecommerce.add_to_cart', {
  productId: 'prod_123',
  quantity: 1,
  price: 999,
  currency: 'USD'
});

// Track purchase
await tappd.track('ecommerce.purchase', {
  orderId: 'order_456',
  total: 999,
  currency: 'USD',
  items: [{ productId: 'prod_123', name: 'iPhone 15', price: 999, quantity: 1 }]
});
```

### Example 2: User Journey

```javascript
// User visits site (anonymous)
// SDK automatically tracks page views

// User signs up
await tappd.identify('user_123', {
  email: 'john@example.com',
  name: 'John Doe'
});

// All previous anonymous data is now linked to user_123

// Track signup event
await tappd.track('user.signup', {
  source: 'homepage',
  plan: 'free'
});

// User upgrades
await tappd.track('upgrade', {
  from: 'free',
  to: 'pro',
  amount: 99
});

// Update user attributes
await tappd.setUserAttributes({
  plan: 'pro',
  upgradedAt: new Date()
});
```

### Example 3: SPA Integration

```javascript
// Initialize in main app file
const tappd = new TappdSDK({
  appId: 'YOUR_APP_ID',
  autoTrack: true // SPA navigation is automatically tracked
});

// In your router
router.onRouteChange = async (to) => {
  // Optional: Manually track route change
  await tappd.track('route_change', {
    from: router.previousRoute,
    to: to.path,
    title: to.meta.title
  });
};
```

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Debugging

Enable debug logging to see SDK activity:

```javascript
const tappd = new TappdSDK({
  appId: 'YOUR_APP_ID',
  debug: true // Enable debug logging
});

// Check browser console for SDK logs
// [Tappd SDK] Initialized with App ID: a1b2c3d4...
// [Tappd SDK] Customer identified: user_123
// [Tappd SDK] Event tracked: button_click
```

---

## API Endpoints

The SDK uses these API endpoints on `https://sdk.gotappd.com/api/v1/sdk` (automatically configured):

```
POST /identify                    # Identify user
POST /track                       # Track event
POST /page                        # Track page view
POST /session/start               # Start session
POST /session/heartbeat           # Session heartbeat
GET  /in-app-messages             # Get pending messages
POST /in-app-messages/:id/delivered  # Mark message delivered
POST /in-app-messages/:id/dismiss    # Dismiss message
GET  /banners                     # Get eligible banners
POST /banners/:id/display          # Track banner display
POST /banners/:id/click           # Track banner click
POST /banners/:id/dismiss         # Track banner dismiss
POST /bridge/action               # Execute bridge action
POST /bridge/capture              # Capture form data
GET  /web-push/vapid-public-key   # Get VAPID key
GET  /web-push/subscription-status # Check push status
```

For detailed endpoint documentation, see [API_ENDPOINTS.md](../API_ENDPOINTS.md)
```

---

## Data Privacy

- All data is sent securely via HTTPS
- Anonymous IDs are stored in browser localStorage
- Session IDs are stored in sessionStorage (cleared when browser closes)
- No sensitive data is stored in the SDK
- Comply with GDPR, CCPA, and other privacy regulations

---

## Troubleshooting

### SDK not tracking events

1. Check App ID is correct
2. Enable debug mode: `debug: true`
3. Check browser console for errors
4. Verify API endpoint is accessible

### Anonymous data not merging

1. Ensure `identify()` is called with the same `userId`
2. Check that `anonymousId` is passed during identification
3. Verify anonymous tracking happened before identification

### Session not starting

1. Check browser console for errors
2. Verify session initialization completed
3. Look for network errors in Network tab

---

---

## In-App Messages

The SDK supports displaying in-app messages (banners, popups, modals, notifications, multi-page layouts, row/form/input blocks, etc.) from the Tappd dashboard. Pending messages are fetched over the network on each poll (not skipped just because the local cache already has messages), so **test sends and new IAM appear within the polling interval** while the page is active.

### Configuration

```javascript
const tappd = new TappdSDK({
  appId: 'YOUR_APP_ID',
  enableInAppMessages: true, // Enable in-app message rendering (default: true)
  autoDisplayMessages: true, // Automatically display pending messages (default: true)
  messagePollingInterval: 60, // Seconds between polls when active (default: 60)
  minMessagePollingIntervalSeconds: 15, // Floor for the poll timer (default: 15)
  messageFetchDedupeMs: 2000, // Skip duplicate GETs within this window (default: 2000; set 0 to always hit network)
  inactivityThreshold: 300, // Stop polling after 300 seconds (5 minutes) of inactivity (default: 300)
  messageContainerId: 'custom-container' // Optional: Custom DOM container ID
});
```

Call `await tappd.syncInAppMessages()` (alias for `displayPendingMessages(true)`) after identify or when you need an immediate refresh (for example after sending a test IAM from the dashboard).

### Web push and IAM sync

When a **web push** is delivered with data fields from `packages/shared/PUSH_IAM.md` (`tappd_message_type`, `iamId`, `tappd_iam_sync`), handle it in your service worker / client listener:

- **Tab focused / visible:** post a message to your app or call `await tappd.syncInAppMessages()` (and `await tappd.triggerInAppMessageById(iamId, true)` if `iamId` is set) without showing a notification if you want silent sync.
- **User clicks the notification:** call `trackPushOpen` if you track opens, then `syncInAppMessages` / `triggerInAppMessageById(iamId, true)`.

### Smart Polling Strategy

1. **Fetch on launch** - Messages are fetched shortly after SDK init when auto-display is on
2. **Poll when active** - Interval defaults to 60s (minimum 15s) while the user is active
3. **Stop when inactive** - Stops polling after the inactivity threshold
4. **Resume on activity** - Fetches again when the user returns
5. **Short dedupe window** - Avoids hammering the API on burst calls; polling still retrieves new pending messages

**Activity Detection:**
- Tracks user interactions: clicks, scrolls, keyboard input, mouse movement, touch events
- Uses Page Visibility API to detect when page is hidden/visible
- Automatically stops polling when page is hidden or user is inactive

### Automatic Display

When `autoDisplayMessages` is enabled, the SDK will:
1. **Fetch on launch** - Immediately fetch messages when SDK initializes
2. **Load from cache** - Display cached messages instantly (if available)
3. **Poll when active** - Update messages every 5 minutes (configurable) when user is active
4. **Stop when inactive** - Stop polling after 5 minutes (configurable) of inactivity
5. **Resume on return** - Fetch immediately when user returns
6. Evaluate trigger conditions
7. Display messages that are ready to be shown
8. Track message views and interactions

### Manual Control

```javascript
// Fetch pending messages
const messages = await tappd.getInAppMessages();

// Display a specific message
await tappd.displayInAppMessage(message);

// Display all pending messages
await tappd.displayPendingMessages();

// Dismiss a message
await tappd.dismissMessage(messageId);
```

### Message Types

The SDK supports three message types:

1. **Banner** - Fixed position at top, bottom, or center of screen
2. **Popup** - Centered modal with overlay (smaller size)
3. **Modal** - Centered modal with overlay (larger size)

### Message Blocks

Messages can contain multiple blocks:
- **Image** - Display images with alignment options
- **Text** - Text content with styling (font size, weight, color, alignment)
- **Button** - Clickable buttons with links and custom styling
- **HTML** - Raw HTML content (sanitized)

### Event Tracking

The SDK automatically tracks message events:
- `message.viewed` - When a message is displayed
- `message.clicked` - When a button in the message is clicked
- `message.dismissed` - When a message is dismissed

### Example

```javascript
// Initialize SDK with in-app messages
const tappd = new TappdSDK({
  appId: 'YOUR_APP_ID',
  enableInAppMessages: true,
  autoDisplayMessages: true
});

// Identify user (messages will be fetched automatically)
await tappd.identify({
  external_id: 'user_123',
  email: 'john@example.com',
  name: 'John Doe'
});

// Messages are now being fetched and displayed automatically
// You can also manually fetch and display:
const messages = await tappd.getInAppMessages();
await tappd.displayPendingMessages();
```

---

## License

MIT

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/gotappd/web-sdk/issues
- Documentation: https://docs.gotappd.com/web-sdk
- Email: dev-support@gotappd.com
