# Refresh Token Implementation - SaveMyMeal Mobile App

## Overview
Implemented a comprehensive three-layer token refresh system to keep users authenticated indefinitely:

1. **Background Auto-Refresh** (50-minute interval)
2. **Request Interceptor** (Proactive refresh before API calls)
3. **Response Interceptor** (Handle 401 errors with request queue)

---

## Files Created/Modified

### New Files:
1. **`lib/utils/jwt.ts`** - JWT token utilities
2. **`lib/hooks/useTokenRefresh.ts`** - Background auto-refresh hook

### Modified Files:
1. **`lib/api/client.ts`** - Updated interceptors with proactive refresh and request queue
2. **`lib/atoms/auth.ts`** - Added `updateTokensAtom` for token updates
3. **`lib/hooks/index.ts`** - Exported useTokenRefresh
4. **`app/_layout.tsx`** - Integrated useTokenRefresh hook

---

## How It Works

### 1. Background Auto-Refresh (50 minutes)
The `useTokenRefresh` hook runs automatically when the app loads:
- Checks if token is expired on mount
- Sets up a 50-minute interval to refresh tokens
- Continues refreshing even during user inactivity
- Handles visibility changes (when user returns to app)

```typescript
// Usage (already added to app/_layout.tsx)
useTokenRefresh();
```

### 2. Request Interceptor (Proactive Refresh)
Before every API request, the interceptor checks the token:

**Scenario A - Token Expired:**
```
Token expired → Refresh immediately → Wait → Use new token
```

**Scenario B - Token Expiring Soon (< 10 minutes):**
```
Token expiring soon → Start background refresh → Use current token
```

**Scenario C - Token Fresh:**
```
Token fresh → Add to Authorization header → Proceed
```

### 3. Response Interceptor (Request Queue)
When API returns 401:

```
API returns 401 → Check if already refreshing:
  
  If YES:
    → Add request to queue
    → Wait for refresh
    → Retry with new token
  
  If NO:
    → Start refresh
    → Process queued requests
    → Retry original request
```

---

## Token Update Flow

```
Refresh triggered → Call /auth/refresh
  ↓
Success: { token: "new...", refreshToken: "new..." }
  ↓
SecureStore updated (tokenManager.setTokens)
  ↓
Jotai store updated (updateTokensAtom)
  ↓
All queued requests retried with new token
```

---

## API Endpoint

**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_TOKEN...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_REFRESH..."
  }
}
```

---

## Token Storage

- **SecureStore**: `auth_access_token`, `auth_refresh_token`
- **Jotai Store**: `authAtom` (reactive state)

---

## Example Scenarios

### Scenario 1: User Inactive for 2 Hours
```
00:00 - User logs in
00:50 - Background refresh → New tokens
01:40 - Background refresh → New tokens
02:30 - Background refresh → New tokens

User returns at 02:35:
  - Token is fresh (refreshed at 02:30)
  - All API calls work seamlessly ✅
```

### Scenario 2: User Makes API Call with Expired Token
```
Token expired → Request interceptor detects
  ↓
Refresh API called
  ↓
New tokens stored
  ↓
Original request retried
  ↓
Success ✅
```

### Scenario 3: Multiple Concurrent Requests with 401
```
Request 1 → 401 → Start refresh
Request 2 → 401 → Add to queue
Request 3 → 401 → Add to queue
  ↓
Refresh completes
  ↓
All 3 requests retried with new token
  ↓
All succeed ✅
```

---

## Key Features

✅ **Automatic Background Refresh** - Runs every 50 minutes
✅ **Proactive Refresh** - Refreshes before token expires (10-minute buffer)
✅ **Request Queue** - Handles concurrent 401 errors efficiently
✅ **Visibility Handling** - Checks token when user returns to app
✅ **Error Recovery** - Gracefully handles refresh failures
✅ **Type Safe** - Full TypeScript support
✅ **Secure Storage** - Uses expo-secure-store for tokens

---

## Testing

To test the implementation:

1. **Login** - Tokens should be stored
2. **Make API calls** - Should automatically add Authorization header
3. **Wait 50 minutes** - Should see auto-refresh in console
4. **Manually expire token** - Should trigger refresh before request
5. **Multiple concurrent calls** - Should queue properly

---

## Console Logs

You'll see these logs during operation:

- `✅ Token refresh interval initialized (50 minutes)`
- `⏰ Background token refresh triggered (50-minute interval)`
- `🔄 Refreshing access token...`
- `✅ Token refreshed successfully`
- `⚠️ Token expired, refreshing before request...`
- `⏰ Token expiring soon, refreshing in background...`

---

## Benefits

1. **Seamless UX** - Users stay logged in indefinitely
2. **No Unexpected Logouts** - Even during long inactivity
3. **Efficient** - Non-blocking background refresh
4. **Reliable** - Handles edge cases and concurrent requests
5. **Secure** - Tokens stored in SecureStore

---

This implementation ensures users remain authenticated as long as the app is open, providing a superior user experience!
