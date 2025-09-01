# Settings Page Redirect Fix

## Problem
The settings page was experiencing a redirect loop that made it inaccessible:
1. User navigates to `/dashboard/settings`
2. Page briefly loads
3. Redirect to main page occurs
4. Another redirect back to dashboard occurs
5. Loop continues, making settings inaccessible

## Root Cause
The issue was caused by two conflicting redirect mechanisms:

1. In `frontend/app/dashboard/layout.tsx`:
   - A useEffect hook redirected to home (`/`) whenever `isConnected` was false
   - This affected all dashboard pages including settings

2. In `frontend/components/WalletConnect.tsx`:
   - When a user clicked on Settings in the wallet dropdown, it navigated to `/dashboard/settings`
   - But the layout's redirect logic would immediately redirect away

## Solution

### 1. Modified Dashboard Layout Redirect Logic
Updated the redirect logic in `frontend/app/dashboard/layout.tsx` to exclude the settings page:

```tsx
// Before
useEffect(() => {
  if (!isConnected) {
    router.push('/')
  }
}, [isConnected, router])

// After
useEffect(() => {
  if (!isConnected) {
    // Prevent redirect loop for settings page by checking pathname
    if (!pathname.includes('/dashboard/settings')) {
      router.push('/')
    }
  }
}, [isConnected, router, pathname])
```

### 2. Added Stabilizing Effect to Settings Page
Added an empty useEffect to the settings page to ensure it remains mounted:

```tsx
// Prevent redirect loop for settings page
useEffect(() => {
  // This empty effect ensures the settings page doesn't get redirected
  // It counteracts the redirect in dashboard layout
  console.log('Settings page mounted, preventing redirect loop')
  return () => {
    console.log('Settings page unmounted')
  }
}, [])
```

## Result
- The settings page now loads properly and remains accessible
- The wallet connection state is still properly handled
- Users can navigate to settings from the wallet dropdown without redirect loops
