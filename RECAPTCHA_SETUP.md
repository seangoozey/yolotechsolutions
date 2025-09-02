# Google reCAPTCHA Enterprise v3 Integration

This document describes the implementation of Google reCAPTCHA Enterprise v3 on the S&S Computer Repair contact form.

## Configuration

### Site Key
- **Site Key**: `6Leg-rorAAAAAHmNOisI0o5uQyx4YN1dDrSutJDr`
- **Secret Key**: `6Leg-rorAAAAAPDEfdwEGFWKetkos6ePS0gPobD9`

## Implementation Details

### Frontend (HTML/JavaScript)

1. **Script Loading**: The reCAPTCHA script is loaded in `index.html`:
   ```html
   <script src="https://www.google.com/recaptcha/enterprise.js?render=6Leg-rorAAAAAHmNOisI0o5uQyx4YN1dDrSutJDr"></script>
   ```

2. **Form Integration**: A hidden input field is added to store the reCAPTCHA token:
   ```html
   <input type="hidden" name="recaptcha_token" id="recaptcha_token">
   ```

3. **JavaScript Handling**: The form submission process in `js/main.js`:
   - Executes reCAPTCHA with action 'contact_form'
   - Sends token to backend via AJAX
   - Handles success/error responses
   - Shows loading states and notifications

### Backend (PHP)

1. **Token Verification**: The `content/contact.php` file:
   - Verifies the reCAPTCHA token using Google's API
   - Uses a score threshold of 0.5 (configurable)
   - Returns JSON responses for AJAX handling

2. **Security Features**:
   - Validates token presence
   - Checks reCAPTCHA score
   - Handles verification failures gracefully

## Features

### User Experience
- **Invisible**: No user interaction required
- **Loading States**: Visual feedback during verification
- **Error Handling**: Clear error messages for users
- **Responsive**: Works on all device sizes

### Security
- **Score-based**: Uses Google's risk assessment (0.0-1.0)
- **Token Validation**: Server-side verification
- **Rate Limiting**: Built into reCAPTCHA Enterprise
- **Bot Protection**: Advanced bot detection

## Testing

### Local Testing
1. Ensure you have a local PHP server running
2. Test form submission with valid data
3. Check browser console for any JavaScript errors
4. Verify reCAPTCHA token generation

### Production Testing
1. Deploy to production server
2. Test with real user interactions
3. Monitor reCAPTCHA analytics in Google Console
4. Check email delivery

## Troubleshooting

### Common Issues

1. **reCAPTCHA not loading**:
   - Check internet connection
   - Verify site key is correct
   - Check browser console for errors

2. **Verification failures**:
   - Check secret key in PHP file
   - Verify domain is registered in reCAPTCHA console
   - Check score threshold settings

3. **Form submission errors**:
   - Check PHP error logs
   - Verify email configuration
   - Test AJAX response handling

### Debug Mode

To enable debug mode, add this to the PHP file:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## Maintenance

### Regular Tasks
1. Monitor reCAPTCHA analytics
2. Check for failed verifications
3. Update score thresholds if needed
4. Review security logs

### Updates
1. Keep reCAPTCHA script updated
2. Monitor Google's reCAPTCHA documentation
3. Test after any website updates

## Security Notes

- **Never expose the secret key** in client-side code
- **Use HTTPS** in production for secure token transmission
- **Monitor** reCAPTCHA analytics for unusual patterns
- **Backup** configuration before making changes

## Support

For reCAPTCHA-specific issues, refer to:
- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [reCAPTCHA Enterprise Console](https://console.cloud.google.com/security/recaptcha)
- [Google Cloud Support](https://cloud.google.com/support)
