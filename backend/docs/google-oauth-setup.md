# Google OAuth Integration Setup

This document explains how to set up and use Google OAuth authentication in the book review platform.

## Prerequisites

1. Google Cloud Console project with OAuth 2.0 credentials
2. Environment variables configured
3. Frontend application to handle OAuth callbacks

## Environment Variables

Add the following variables to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client IDs
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)

## API Endpoints

### Initiate Google OAuth
```
GET /api/auth/google
```
Redirects user to Google OAuth consent screen.

### OAuth Callback
```
GET /api/auth/google/callback
```
Handles Google OAuth callback and redirects to frontend with tokens.

### Link Google Account
```
POST /api/auth/google/link
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "googleId": "google-user-id"
}
```

### Unlink Google Account
```
POST /api/auth/google/unlink
Authorization: Bearer <jwt-token>
```

## Frontend Integration

### Initiate OAuth Flow
```javascript
// Redirect user to Google OAuth
window.location.href = '/api/auth/google'
```

### Handle OAuth Success
```javascript
// Parse URL parameters after redirect
const urlParams = new URLSearchParams(window.location.search)
const token = urlParams.get('token')
const refreshToken = urlParams.get('refreshToken')

if (token) {
  // Store tokens and redirect to dashboard
  localStorage.setItem('token', token)
  localStorage.setItem('refreshToken', refreshToken)
  window.location.href = '/dashboard'
}
```

### Handle OAuth Error
```javascript
const errorMessage = urlParams.get('message')
if (errorMessage) {
  // Display error to user
  console.error('OAuth error:', errorMessage)
}
```

## User Flow

1. **New User with Google OAuth:**
   - User clicks "Sign in with Google"
   - Redirected to Google consent screen
   - After consent, new user account is created
   - User is redirected to frontend with tokens

2. **Existing User with Google OAuth:**
   - User clicks "Sign in with Google"
   - If email matches existing account, Google ID is linked
   - User is redirected to frontend with tokens

3. **Link Google Account:**
   - Authenticated user can link their Google account
   - Prevents duplicate accounts with same email

4. **Unlink Google Account:**
   - User can unlink Google account if they have a password set
   - Ensures user always has a way to log in

## Error Handling

The system handles various error scenarios:

- **No email from Google:** User is redirected with error message
- **Database errors:** Logged and user redirected with generic error
- **Account linking conflicts:** Prevents linking Google ID already used by another user
- **Unlinking without password:** Prevents users from losing access to their account

## Security Considerations

1. **JWT Tokens:** Short-lived access tokens with refresh token rotation
2. **HTTPS Only:** OAuth callbacks should use HTTPS in production
3. **State Parameter:** Consider adding CSRF protection with state parameter
4. **Scope Limitation:** Only requests necessary scopes (profile, email)
5. **Token Storage:** Frontend should store tokens securely

## Testing

The integration includes comprehensive tests:

- **Unit Tests:** Service layer methods for OAuth operations
- **Integration Tests:** API endpoints and error scenarios
- **Strategy Tests:** Passport Google OAuth strategy configuration

Run tests with:
```bash
npm test -- --testPathPattern="googleOAuth|passport"
```

## Troubleshooting

### Common Issues

1. **Invalid Client ID/Secret:**
   - Verify credentials in Google Cloud Console
   - Check environment variables

2. **Redirect URI Mismatch:**
   - Ensure callback URL matches Google Cloud Console settings
   - Check for trailing slashes and protocol (http vs https)

3. **Scope Issues:**
   - Verify Google+ API is enabled
   - Check requested scopes in strategy configuration

4. **Database Errors:**
   - Ensure database is running and accessible
   - Check User model constraints (unique email, username)

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will provide detailed logs for OAuth operations and errors.