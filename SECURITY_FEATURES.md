# Security Features Documentation

## Contact Form Security Implementation

This document outlines all security measures implemented to protect the contact form from spam, bots, and malicious attacks.

## 🔒 **Bot Protection**

### **1. Google reCAPTCHA Enterprise v3**
- **Implementation**: Invisible reCAPTCHA that runs in the background
- **Site Key**: `6Leg-rorAAAAAHmNOisI0o5uQyx4YN1dDrSutJDr`
- **Secret Key**: `6Leg-rorAAAAAPDEfdwEGFWKetkos6ePS0gPobD9`
- **Score Threshold**: 0.5 (moderate security)
- **Action**: `contact_form`
- **Features**:
  - Invisible to users
  - Score-based verification
  - No user interaction required
  - Advanced bot detection

### **2. Rate Limiting**
- **Window**: 5 minutes
- **Max Requests**: 3 submissions per window
- **Implementation**: Session-based tracking
- **Protection**: Prevents spam flooding

## ✅ **Form Validation**

### **Client-Side Validation (JavaScript)**
- **Real-time validation** on field blur
- **Email validation** with regex pattern
- **Phone validation** (optional field)
- **Message length** validation (10-1000 characters)
- **Required field** validation
- **Input sanitization** (removes HTML tags)

### **Server-Side Validation (PHP)**
- **Input sanitization** using `htmlspecialchars()`
- **Email validation** using `filter_var()`
- **Name validation** (2-50 characters, letters only)
- **Phone validation** (10-15 digits)
- **Message validation** (10-1000 characters)
- **Suspicious content detection**

### **HTML5 Validation**
- **Pattern attributes** for names and phone
- **Min/max length** attributes
- **Required attributes**
- **Type validation** (email, tel, text)

## 🛡️ **Security Headers**

### **Content Security Policy (CSP)**
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https:;
connect-src 'self' https://www.google.com;
```

### **Additional Security Headers**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 🚫 **Malicious Content Detection**

### **Suspicious Pattern Detection**
The server checks for and blocks:
- URLs and links (`http://`, `https://`, `www.`)
- JavaScript code (`script`, `javascript`)
- Event handlers (`onclick`, `onload`)
- Dangerous functions (`eval()`, `document.`)

### **Input Sanitization**
- **HTML encoding** of special characters
- **Whitespace trimming**
- **Slash removal**
- **XSS prevention**

## 📧 **Email Security**

### **Email Headers**
- **Content-Type**: `text/plain; charset="UTF-8"`
- **From**: `Contact Form <support@yolotechsolutions.com>`
- **Reply-To**: User's email address
- **Return-Path**: System email address

### **Email Content**
- **Sanitized data** only
- **No HTML** in email body
- **Structured format** for easy reading
- **No sensitive data** exposure

## 🔄 **Error Handling**

### **User-Friendly Messages**
- **Validation errors** with specific field names
- **Rate limit messages** with wait time
- **reCAPTCHA errors** with retry instructions
- **Network errors** with retry options

### **Security Through Obscurity**
- **No system information** in error messages
- **Generic error messages** for security issues
- **No stack traces** exposed to users

## 📊 **Monitoring & Logging**

### **Session Tracking**
- **Submission timestamps** stored in session
- **Rate limit enforcement** per session
- **Automatic cleanup** of old entries

### **Error Logging**
- **PHP error reporting** disabled for production
- **Exception handling** with proper responses
- **JSON responses** for AJAX requests

## 🚀 **Performance Optimizations**

### **Client-Side**
- **Debounced validation** to reduce API calls
- **Efficient DOM manipulation**
- **Minimal reCAPTCHA impact**

### **Server-Side**
- **Fast validation** functions
- **Efficient regex patterns**
- **Minimal database operations**

## 🔧 **Configuration**

### **reCAPTCHA Settings**
```javascript
// Site key for frontend
6Leg-rorAAAAAHmNOisI0o5uQyx4YN1dDrSutJDr

// Secret key for backend
6Leg-rorAAAAAPDEfdwEGFWKetkos6ePS0gPobD9
```

### **Rate Limiting Settings**
```php
$rate_limit_window = 300; // 5 minutes
$max_requests = 3; // Max 3 requests per window
```

### **Validation Rules**
```php
// Name validation
min: 2 characters, max: 50 characters
pattern: letters, spaces, hyphens, periods only

// Email validation
standard email format validation

// Phone validation (optional)
min: 10 digits, max: 15 digits
pattern: international format supported

// Message validation
min: 10 characters, max: 1000 characters
```

## 🛠️ **Maintenance**

### **Regular Updates**
- **reCAPTCHA keys** should be rotated periodically
- **Security headers** should be reviewed regularly
- **Validation patterns** should be updated as needed

### **Monitoring**
- **Check reCAPTCHA analytics** for bot activity
- **Monitor rate limiting** effectiveness
- **Review error logs** for attack patterns

## ✅ **Compliance**

### **GDPR Compliance**
- **No unnecessary data** collection
- **Clear purpose** for data collection
- **Secure data handling**
- **User consent** through reCAPTCHA

### **Accessibility**
- **Screen reader** compatible
- **Keyboard navigation** support
- **Clear error messages**
- **Alternative validation** methods

---

**Last Updated**: January 2025
**Version**: 1.0
**Security Level**: High
