# Tappd Web SDK - Usage Guide

## Two Ways to Use the SDK

The SDK is distributed in two formats:

### 1. **CDN/UMD Version** (`tappd-sdk.min.js`)
- **Size:** ~9.7KB (minified)
- **Use:** Direct `<script>` tag in HTML
- **Global:** `TappdSDK` variable
- **Best for:** Quick integration, vanilla JavaScript, legacy sites

### 2. **ES Module Version** (`index.js`)
- **Use:** `import` or `require` in build tools
- **Best for:** Webpack, Vite, Next.js, React, Vue, Angular

---

## CDN Usage

### Basic HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Load SDK from CDN -->
  <script src="https://cdn.tappd.io/web-sdk/v1/tappd-sdk.min.js"></script>
  
  <script>
    // Initialize SDK
    const tappd = new TappdSDK({
      appId: 'YOUR_APP_ID', // Get from dashboard
      apiUrl: 'https://sdk.tappd.io/api/v1/sdk',
      autoTrack: true,
      debug: false
    });

    // Identify user
    tappd.identify('user_123', {
      email: 'john@example.com',
      name: 'John Doe'
    });

    // Track events
    tappd.track('button_click', {
      buttonId: 'cta-button'
    });
  </script>
</body>
</html>
```

### Local File Example

```html
<script src="./tappd-sdk.min.js"></script>
<script>
  const tappd = new TappdSDK({
    appId: 'YOUR_APP_ID'
  });
</script>
```

---

## NPM Usage

### Installation

```bash
npm install @tappd/web-sdk
```

### ES Modules (Modern JavaScript)

```javascript
import { TappdSDK } from '@tappd/web-sdk';

const tappd = new TappdSDK({
  appId: 'YOUR_APP_ID',
  apiUrl: 'https://api.tappd.io/api/v1/sdk'
});

// Identify user
await tappd.identify('user_123', {
  email: 'john@example.com',
  name: 'John Doe'
});

// Track events
await tappd.track('purchase', {
  amount: 99.99
});
```

### CommonJS (Node.js)

```javascript
const { TappdSDK } = require('@tappd/web-sdk');

const tappd = new TappdSDK({
  appId: 'YOUR_APP_ID',
  apiUrl: 'https://api.tappd.io/api/v1/sdk'
});
```

---

## Framework Examples

### React

```javascript
import { TappdSDK } from '@tappd/web-sdk';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Initialize SDK
    const tappd = new TappdSDK({
      appId: 'YOUR_APP_ID',
      apiUrl: 'https://sdk.tappd.io/api/v1/sdk',
      autoTrack: true
    });

    // Store in window or context
    window.tappd = tappd;
  }, []);

  const handlePurchase = async () => {
    await window.tappd.track('purchase', {
      amount: 99.99
    });
  };

  return <button onClick={handlePurchase}>Buy Now</button>;
}
```

### Vue.js

```javascript
import { TappdSDK } from '@tappd/web-sdk';

export default {
  mounted() {
    this.tappd = new TappdSDK({
      appId: 'YOUR_APP_ID',
      autoTrack: true
    });
  },
  methods: {
    async trackEvent(eventName, properties) {
      await this.tappd.track(eventName, properties);
    }
  }
}
```

### Next.js

```javascript
import { TappdSDK } from '@tappd/web-sdk';
import { useEffect } from 'react';

function MyPage() {
  useEffect(() => {
    const tappd = new TappdSDK({
      appId: 'YOUR_APP_ID',
      autoTrack: true
    });

    // Cleanup on unmount
    return () => {
      tappd.reset();
    };
  }, []);

  return <div>My Page</div>;
}
```

---

## Choosing Between CDN and NPM

### Use CDN (`tappd-sdk.min.js`) if:
- ✅ You want quick integration
- ✅ You're using vanilla JavaScript
- ✅ You don't use build tools
- ✅ You want to avoid npm/node_modules
- ✅ You're adding to an existing legacy site

### Use NPM (`@tappd/web-sdk`) if:
- ✅ You use Webpack, Vite, or similar build tools
- ✅ You're building with React, Vue, Angular, etc.
- ✅ You want TypeScript support
- ✅ You want tree-shaking and optimized builds
- ✅ You prefer ES modules

---

## File Structure

```
packages/web-sdk/
├── dist/
│   ├── tappd-sdk.min.js    # CDN/UMD version (~9.7KB)
│   ├── index.js            # ES Module version
│   ├── index.d.ts          # TypeScript definitions
│   └── *.map               # Source maps
├── examples/
│   ├── basic.html          # ES module example
│   └── basic-cdn.html      # CDN example
├── src/
│   └── index.ts            # Source code
└── package.json
```

---

## Quick Comparison

| Feature | CDN | NPM |
|---------|-----|-----|
| **Installation** | `<script>` tag | `npm install` |
| **Load Time** | Immediate | Requires bundling |
| **Size** | 9.7KB minified | Optimized by bundler |
| **Type Safety** | ❌ | ✅ TypeScript |
| **Tree Shaking** | ❌ | ✅ |
| **Build Tools** | Not needed | Required |
| **Easy to use** | ✅ Very easy | ✅ Easy with tools |

---

## Examples

Check out the examples directory:

- `examples/basic.html` - ES module usage
- `examples/basic-cdn.html` - CDN/UMD usage

Both examples demonstrate:
- SDK initialization
- User identification
- Event tracking
- Session management
- Page view tracking

---

## Getting Your App ID

1. Log into your Tappd dashboard
2. Navigate to **Settings > Apps**
3. Find your web app
4. Copy the **App ID** (looks like: `a1b2c3d4-e5f6-...`)

---

## Need Help?

- 📚 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/gotappd/tappd-web-sdk/issues)
- 💬 [Get Support](https://support.tappd.io)

