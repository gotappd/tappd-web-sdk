# Running the Web SDK Examples

## Quick Start

### Method 1: Python HTTP Server (Recommended)

```bash
cd /var/www/tappd.io/packages/web-sdk/examples
python3 -m http.server 8000
```

Then open in your browser:
- **CDN Example:** http://localhost:8000/basic-cdn.html
- **ES Module Example:** http://localhost:8000/basic.html

### Method 2: Node.js HTTP Server

```bash
cd /var/www/tappd.io/packages/web-sdk/examples
npx http-server -p 8000
```

Then open in your browser:
- **CDN Example:** http://localhost:8000/basic-cdn.html
- **ES Module Example:** http://localhost:8000/basic.html

### Method 3: PHP Built-in Server

```bash
cd /var/www/tappd.io/packages/web-sdk/examples
php -S localhost:8000
```

### Method 4: Using Live Server (VS Code Extension)

1. Install "Live Server" extension in VS Code
2. Right-click on `basic-cdn.html` or `basic.html`
3. Select "Open with Live Server"

---

## Important Notes

### Before Testing

1. **Update App ID**: Replace `YOUR_APP_ID` in the HTML files with your actual App ID from the dashboard
2. **Update API URL**: Change `apiUrl` if needed (default: `https://sdk.tappd.io/api/v1/sdk`)

### Windows Access

If running in WSL2:
- Access from Windows browser: http://localhost:8000/basic-cdn.html
- Access from WSL2: http://localhost:8000/basic-cdn.html

### Browser Console

Open browser DevTools (F12) to see SDK logs and debug information when `debug: true` is enabled.

---

## Example Files

### 1. `basic-cdn.html`
- Uses CDN/UMD version of SDK
- Loads via `<script src="../dist/tappd-sdk.min.js"></script>`
- Uses global `TappdSDK` variable
- Best for: Quick testing, vanilla JavaScript

### 2. `basic.html`
- Uses ES module version of SDK
- Imports: `import { TappdSDK } from '../dist/index.js'`
- Best for: Modern browser testing, build tool integration

---

## Troubleshooting

### "Failed to load resource" error
- Make sure you're accessing via `http://` not `file://`
- Check that the server is running on the correct port

### "CORS error"
- Make sure your API server is running
- Check API URL matches in the HTML files

### SDK not loading
- Check browser console for errors
- Verify the path to `tappd-sdk.min.js` or `index.js` is correct

### No App ID error
- Replace `YOUR_APP_ID` with actual App ID from dashboard

---

## Testing Checklist

- [ ] Server started (port 8000)
- [ ] App ID updated in HTML files
- [ ] API URL configured correctly
- [ ] Browser console open (F12)
- [ ] API server accessible at `https://sdk.tappd.io` (or custom URL configured)
- [ ] Test identify functionality
- [ ] Test track event functionality
- [ ] Check session ID and anonymous ID
- [ ] Verify page views are being tracked

---

## Next Steps

After testing the examples:

1. Copy integration code to your project
2. Update App ID with your actual App ID
3. Deploy to production
4. Monitor data in dashboard

---

## Support

For issues or questions:
- 📚 Check [README.md](../README.md)
- 📖 See [USAGE.md](../USAGE.md) for detailed usage guide
- 🐛 Report issues on GitHub

