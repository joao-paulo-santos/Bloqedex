# Testing Offline Mode

You can test the offline functionality of this PWA directly in development mode without needing to build for production. Here's how:

## Prerequisites

1. Run the development server as usual:
```bash
npm run dev
```

2. Navigate to the app in your browser (typically http://localhost:3000)

## Testing Methods

### Method 1: Browser DevTools Network Panel

1. Open browser DevTools (F12 or Right-click > Inspect)
2. Go to the Network tab
3. Check the "Offline" checkbox to simulate offline mode
4. Refresh the page or navigate to different pages to test behavior

![Browser DevTools Offline Mode](https://i.imgur.com/example-image.png)

### Method 2: Actual Network Disconnection

1. Physically disconnect your computer from the internet (turn off Wi-Fi/unplug ethernet)
2. Observe how the app responds - the offline indicator should turn red
3. Try navigating between pages

### Method 3: Server Connectivity Tests

1. Keep your device connected to the internet
2. Stop the Next.js development server (Ctrl+C in terminal)
3. The app should show "Server Unreachable" status
4. Test navigation and cached content availability

## What to Check

- Does the offline indicator correctly show your connection status?
- Can you navigate to previously visited pages while offline?
- Do API requests fail gracefully with appropriate error messages?
- Does the app recover properly when you go back online?

## PWA Test Page

Visit the `/pwa-test` page for a dedicated interface to test various PWA features including:

- Network status detection
- API calls in offline mode
- Navigation tests
- Installation prompts

## Troubleshooting

If the service worker isn't updating:
1. Go to DevTools > Application > Service Workers
2. Check "Update on reload"
3. Click "Unregister" to remove existing service workers
4. Reload the page

If you still have issues, try clearing the browser cache and storage:
1. DevTools > Application > Storage
2. Click "Clear site data"
