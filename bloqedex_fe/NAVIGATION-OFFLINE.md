# Navigating When Server is Down

When using a PWA (Progressive Web App), you should be able to navigate between pages even when the server is down, as long as those pages have been cached by the service worker.

## How the Fix Works

We've implemented several improvements to fix the navigation issues when the server is down:

1. **Precaching Critical Routes**: The service worker now precaches important routes during installation
2. **StaleWhileRevalidate Strategy**: Pages are served from cache first (fast) while updating in the background
3. **Offline Fallback**: If a page isn't cached, we show a dedicated offline page
4. **More Robust Cache Strategy**: Better handling of navigation requests

## Testing Navigation When Server is Down

### Method 1: Stop the Next.js Server

1. Visit the app and navigate to several pages to ensure they're cached
2. Stop the Next.js development server (Ctrl+C in terminal)
3. Try navigating between pages - they should still work!

### Method 2: Use the Test Controls

1. Go to http://localhost:3000/pwa-test
2. Check the "Simulate Server Unreachable" box
3. Try navigating to different pages using the test links

### Method 3: Serve Static Files

For a more realistic test, you can serve just the static files without the Next.js server:

1. Build the app: `npm run build`
2. Run our simple HTTP server: `.\serve-offline.ps1`
3. This will serve just the static files from the 'public' folder
4. Try navigating between pages

## Troubleshooting

If navigation still doesn't work:

1. Make sure you've visited the pages at least once while online (so they get cached)
2. Check that the service worker is registered (DevTools > Application > Service Workers)
3. Try clearing the cache and reloading: DevTools > Application > Storage > Clear Site Data
4. Refresh and try again

Remember: Only pages you've previously visited will be available offline!
