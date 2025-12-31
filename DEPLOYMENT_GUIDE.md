# YVI-Tech Deployment Guide

This guide explains how to properly deploy the YVI-Tech application to prevent common issues related to environment variables and configuration.

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
VITE_SUPABASE_URL=your_supabase_project_url

# Groq Configuration
GROQ_API_KEY=your_groq_api_key

# Email Configuration
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_email_app_password
EMAIL_TO=recipient_email@domain.com

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yvitech.com
```

### Frontend Environment Variables

For frontend builds, ensure environment variables are available during the build process:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment to GoDaddy

### For Static Frontend Deployment

When deploying the frontend to GoDaddy:

1. **Build with Environment Variables**: Make sure to set environment variables during the build process:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url VITE_SUPABASE_ANON_KEY=your_anon_key npm run build
   ```

2. **Environment Variables in Production**: If GoDaddy doesn't support environment variables for static sites, you may need to build with the actual values or use a configuration file approach.

3. **Backend API Endpoint**: Ensure the frontend can reach the backend API at the correct URL. Update the `API_BASE` in `frontend/src/config/api.js` if needed.

## Common Issues and Solutions

### Issue: "Supabase URL is not set correctly!" and "Supabase ANON KEY is not set correctly!"

**Cause**: Environment variables are not properly set in the production environment.

**Solution**:
1. Ensure the Supabase URL and ANON KEY are correctly configured in environment variables
2. For static deployments, make sure to set these variables during the build process
3. Verify that the Supabase project URL and keys are valid and active

### Issue: "JSON.parse: unexpected character at line 1 column 1 of the JSON data"

**Cause**: The backend is returning non-JSON responses (like HTML error pages) when the frontend expects JSON.

**Solution**:
1. Ensure all backend endpoints return proper JSON responses
2. The frontend now includes better error handling to catch these cases
3. Check backend logs for any unhandled errors that might return HTML instead of JSON

### Issue: "AI service is temporarily unavailable" or similar errors

**Cause**: API keys are not properly configured or have reached rate limits.

**Solution**:
1. Verify that GROQ_API_KEY is correctly set in backend environment
2. Check that Supabase configuration is correct
3. Monitor API usage and upgrade if needed

## Best Practices for Deployment

1. **Environment Variable Management**:
   - Never commit actual API keys to version control
   - Use environment variables for sensitive data
   - Have separate configuration for development, staging, and production

2. **Error Handling**:
   - The frontend now has improved error handling for network issues
   - Both frontend and backend have better error responses
   - Graceful degradation when services are unavailable

3. **Testing**:
   - Test the deployed application thoroughly
   - Verify all functionality works in the production environment
   - Test error scenarios to ensure proper fallback behavior

## Troubleshooting Checklist

- [ ] Verify all required environment variables are set in production
- [ ] Check that Supabase project is active and not suspended
- [ ] Verify API keys have not expired or been revoked
- [ ] Confirm backend server is running and accessible
- [ ] Test that API endpoints return proper JSON responses
- [ ] Verify frontend can communicate with backend API
- [ ] Check browser console for any JavaScript errors
- [ ] Review server logs for any error messages