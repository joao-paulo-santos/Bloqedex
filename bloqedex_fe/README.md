This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## PWA Features

This project is configured as a Progressive Web App (PWA) using `next-pwa`. This enables:

- **Offline Access**: The app works even without an internet connection
- **Installable**: Users can install the app on their devices
- **Responsive**: Works on various screen sizes and devices
- **Reliable**: Uses service workers for caching and offline functionality

### Offline Capabilities

The app implements several offline-first strategies:

1. **Network Status Detection**: Uses both browser's `navigator.onLine` API and active server pinging
2. **Offline Indicator**: Shows the current connection status with visual feedback
3. **Cached Content**: Critical assets are cached for offline use
4. **Offline Fallback**: Shows a dedicated offline page when content can't be loaded
5. **Zustand Persistence**: State is persisted locally to enable offline data access

### Testing PWA Features

To test the PWA features:
1. Visit the `/pwa-test` page
2. Try enabling/disabling your network connection
3. Stop the server to test server reachability detection
4. Test the "Install App" functionality 

### Implementation Details

- **Service Worker**: Configured with different caching strategies (Network-First, Cache-First)
- **Manifest**: Defines app metadata for installation
- **NetworkStore**: Uses Zustand for managing network state
- **Offline API**: Simulated API responses when offline

### In Production

Before deploying to production:
- Generate proper icons in PNG format (currently using SVG placeholders)
- Update the manifest.json with your app's specific details
- Configure caching strategies as needed in next.config.ts
- Test thoroughly on multiple devices and browsers
- Implement proper offline fallback content for all critical pages

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Folder Structure

    src/
    ├── app/                       # App Router pages & layouts
    │   ├── layout.tsx
    │   └── dashboard/
    │       ├── layout.tsx
    │       └── page.tsx
    ├── components/                # Global reusable components
    │   ├── Button.tsx
    │   └── Modal.tsx
    ├── core/                      # Domain logic (framework-agnostic)
    │   ├── entities/
    │   │   └── User.ts
    │   ├── interfaces/
    │   │   └── IUserRepository.ts
    │   └── use-cases/
    │       └── getUser.ts
    ├── infrastructure/            # External integrations
    │   ├── api/
    │   │   └── userApi.ts
    │   ├── cache/
    │   │   └── redisClient.ts
    │   └── repositories/
    │       └── userRepository.ts
    ├── features/                  # Domain-specific logic per feature
    │   └── user/
    │       ├── components/
    │       │   └── UserCard.tsx
    │       ├── hooks/
    │       │   └── useUser.ts
    │       ├── pages/             # Feature-level routing
    │       │   └── profile/
    │       │       └── page.tsx
    │       ├── tests/
    │       │   └── useUser.test.ts
    │       └── index.ts
    ├── config/                    # Global configuration
    │   └── env.ts
    ├── common/                    # Shared types/constants/utils
    │   ├── types.ts
    │   ├── constants.ts
    │   └── utils.ts


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
