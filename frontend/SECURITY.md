# Frontend Security Documentation 🔒

> **Security Guidelines, Best Practices & Implementation Details**

## 🛡️ **Security Overview**

The BaseBadge frontend implements comprehensive security measures to protect users, prevent client-side vulnerabilities, and ensure secure communication with backend services. This document outlines our security framework, best practices, and implementation details.

## 🔐 **Authentication & Authorization**

### **Wallet Connection Security**
```typescript
// Secure wallet connection
const useWalletConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Validate wallet connection
      if (!window.ethereum) {
        throw new Error('No wallet detected');
      }
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      // Validate account format
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      const address = accounts[0];
      if (!isValidEthereumAddress(address)) {
        throw new Error('Invalid address format');
      }
      
      return address;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  return { connectWallet, isConnecting, error };
};
```

### **JWT Token Management**
```typescript
// Secure token storage
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_KEY = 'refresh_token';

  // Store token securely
  static setToken(token: string): void {
    try {
      // Encrypt token before storage
      const encryptedToken = this.encryptToken(token);
      sessionStorage.setItem(this.TOKEN_KEY, encryptedToken);
    } catch (error) {
      console.error('Failed to store token:', error);
      throw new Error('Token storage failed');
    }
  }

  // Retrieve token securely
  static getToken(): string | null {
    try {
      const encryptedToken = sessionStorage.getItem(this.TOKEN_KEY);
      if (!encryptedToken) return null;
      
      // Decrypt token
      return this.decryptToken(encryptedToken);
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      this.clearTokens();
      return null;
    }
  }

  // Clear all tokens
  static clearTokens(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);
  }

  // Encrypt token
  private static encryptToken(token: string): string {
    // Use Web Crypto API for encryption
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    
    // Generate encryption key
    const key = crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    return btoa(JSON.stringify({ token, key }));
  }

  // Decrypt token
  private static decryptToken(encryptedToken: string): string {
    try {
      const { token, key } = JSON.parse(atob(encryptedToken));
      return token;
    } catch (error) {
      throw new Error('Token decryption failed');
    }
  }
}
```

### **Role-Based Access Control**
```typescript
// Frontend RBAC implementation
interface UserPermissions {
  canViewProfile: boolean;
  canEditProfile: boolean;
  canManageBadges: boolean;
  canAccessAdmin: boolean;
}

const usePermissions = (userRole: string): UserPermissions => {
  const permissions: Record<string, UserPermissions> = {
    user: {
      canViewProfile: true,
      canEditProfile: true,
      canManageBadges: false,
      canAccessAdmin: false
    },
    moderator: {
      canViewProfile: true,
      canEditProfile: true,
      canManageBadges: true,
      canAccessAdmin: false
    },
    admin: {
      canViewProfile: true,
      canEditProfile: true,
      canManageBadges: true,
      canAccessAdmin: true
    }
  };

  return permissions[userRole] || permissions.user;
};

// Permission-based component rendering
const ProtectedComponent: React.FC<{ 
  permission: keyof UserPermissions;
  children: React.ReactNode;
}> = ({ permission, children }) => {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role || 'user');

  if (!permissions[permission]) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};
```

## 🚫 **Input Validation & Sanitization**

### **Form Validation**
```typescript
// Comprehensive form validation
import * as yup from 'yup';

const userProfileSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email format')
    .max(255, 'Email is too long'),
  
  bio: yup
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .transform((value) => {
      // Sanitize HTML content
      return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
    }),
  
  website: yup
    .string()
    .url('Invalid URL format')
    .max(255, 'URL is too long')
    .transform((value) => {
      // Ensure HTTPS
      if (value && !value.startsWith('https://')) {
        return `https://${value}`;
      }
      return value;
    })
});

// Validation hook
const useFormValidation = <T>(schema: yup.Schema<T>) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validate = async (data: T): Promise<boolean> => {
    try {
      await schema.validate(data, { abortEarly: false });
      setErrors({});
      setIsValid(true);
      return true;
    } catch (validationError) {
      if (validationError instanceof yup.ValidationError) {
        const newErrors: Record<string, string> = {};
        validationError.inner.forEach((error) => {
          if (error.path) {
            newErrors[error.path] = error.message;
          }
        });
        setErrors(newErrors);
        setIsValid(false);
      }
      return false;
    }
  };

  return { validate, errors, isValid };
};
```

### **XSS Prevention**
```typescript
// XSS-safe content rendering
import DOMPurify from 'dompurify';

// Safe HTML rendering component
const SafeHTML: React.FC<{ 
  html: string;
  allowedTags?: string[];
}> = ({ html, allowedTags = [] }) => {
  const sanitizedHTML = useMemo(() => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: ['class', 'id', 'style'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });
  }, [html, allowedTags]);

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      className="safe-html-content"
    />
  );
};

// Safe text input
const SafeInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove potentially dangerous characters
    const sanitizedValue = inputValue
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
    
    onChange(sanitizedValue);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className="safe-input"
    />
  );
};
```

### **CSRF Protection**
```typescript
// CSRF token management
class CSRFProtection {
  private static readonly TOKEN_KEY = 'csrf_token';

  // Generate CSRF token
  static generateToken(): string {
    const token = crypto.randomUUID();
    sessionStorage.setItem(this.TOKEN_KEY, token);
    return token;
  }

  // Get stored token
  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  // Validate token
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken === token;
  }

  // Clear token
  static clearToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
}

// API request with CSRF protection
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const csrfToken = CSRFProtection.getToken();
  
  if (!csrfToken) {
    throw new Error('CSRF token not found');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json'
    }
  });

  // Validate response
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};
```

## 🌐 **API Security**

### **Secure API Communication**
```typescript
// Secure API service
class SecureApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '';
    this.timeout = 30000; // 30 seconds
  }

  // Secure GET request
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getSecureHeaders(),
        signal: controller.signal,
        credentials: 'include'
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  // Secure POST request
  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = this.buildUrl(endpoint);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getSecureHeaders(),
        body: JSON.stringify(data),
        signal: controller.signal,
        credentials: 'include'
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  // Build secure URL
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  }

  // Get secure headers
  private getSecureHeaders(): HeadersInit {
    const token = TokenManager.getToken();
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    };
  }

  // Handle errors securely
  private handleError(error: any): Error {
    if (error.name === 'AbortError') {
      return new Error('Request timeout');
    }
    
    // Don't expose internal errors to users
    if (error.message.includes('Internal Server Error')) {
      return new Error('Service temporarily unavailable');
    }
    
    return error;
  }
}
```

### **Request Rate Limiting**
```typescript
// Client-side rate limiting
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  // Check if request is allowed
  canMakeRequest(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const requestTimes = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = requestTimes.filter(time => time > windowStart);
    this.requests.set(identifier, validRequests);
    
    // Check if we can make another request
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    return true;
  }

  // Wait for next available slot
  async waitForSlot(identifier: string): Promise<void> {
    while (!this.canMakeRequest(identifier)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Rate-limited API service
const rateLimitedApi = new RateLimiter(5, 60000); // 5 requests per minute

const makeApiRequest = async (endpoint: string) => {
  const identifier = 'api-requests';
  
  if (!rateLimitedApi.canMakeRequest(identifier)) {
    await rateLimitedApi.waitForSlot(identifier);
  }
  
  return await apiService.get(endpoint);
};
```

## 🔒 **Data Protection**

### **Local Storage Security**
```typescript
// Secure local storage wrapper
class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'basebadge_secure_key';

  // Encrypt data before storage
  private static encrypt(data: string): string {
    try {
      // Simple encryption for sensitive data
      const encoded = btoa(data);
      return encoded.split('').reverse().join('');
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }

  // Decrypt data after retrieval
  private static decrypt(encryptedData: string): string {
    try {
      // Simple decryption
      const reversed = encryptedData.split('').reverse().join('');
      return atob(reversed);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData;
    }
  }

  // Store data securely
  static setItem(key: string, value: string): void {
    try {
      const encryptedValue = this.encrypt(value);
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Failed to store data:', error);
    }
  }

  // Retrieve data securely
  static getItem(key: string): string | null {
    try {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return null;
      
      return this.decrypt(encryptedValue);
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  }

  // Remove data
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove data:', error);
    }
  }

  // Clear all data
  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}
```

### **Sensitive Data Handling**
```typescript
// PII data protection
class DataProtection {
  // Mask sensitive information
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + 
      '*'.repeat(Math.max(0, username.length - 2)) + 
      username.charAt(username.length - 1);
    
    return `${maskedUsername}@${domain}`;
  }

  // Mask wallet address
  static maskAddress(address: string): string {
    if (!address || address.length < 10) return address;
    
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Mask phone number
  static maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone;
    
    return phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2');
  }

  // Safe logging
  static safeLog(message: string, data: any): void {
    const sanitizedData = this.sanitizeForLogging(data);
    console.log(message, sanitizedData);
  }

  // Sanitize data for logging
  private static sanitizeForLogging(data: any): any {
    if (typeof data === 'string') {
      // Check if it looks like sensitive data
      if (data.includes('@') && data.includes('.')) {
        return this.maskEmail(data);
      }
      if (data.startsWith('0x') && data.length === 42) {
        return this.maskAddress(data);
      }
      if (/\d{3}-\d{3}-\d{4}/.test(data)) {
        return this.maskPhone(data);
      }
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      Object.keys(data).forEach(key => {
        sanitized[key] = this.sanitizeForLogging(data[key]);
      });
      return sanitized;
    }
    
    return data;
  }
}
```

## 🚨 **Security Monitoring**

### **Error Tracking & Monitoring**
```typescript
// Security event monitoring
class SecurityMonitor {
  private static events: SecurityEvent[] = [];
  private static maxEvents = 1000;

  // Log security event
  static logEvent(event: SecurityEvent): void {
    this.events.push({
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent
    });

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(event);
    }
  }

  // Get session ID
  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  // Send to monitoring service
  private static async sendToMonitoringService(event: SecurityEvent): Promise<void> {
    try {
      await fetch('/api/security/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send security event:', error);
    }
  }

  // Get security events
  static getEvents(): SecurityEvent[] {
    return [...this.events];
  }

  // Clear events
  static clearEvents(): void {
    this.events = [];
  }
}

// Security event types
interface SecurityEvent {
  type: 'authentication' | 'authorization' | 'input_validation' | 'api_request' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  timestamp: string;
  sessionId: string;
  userAgent: string;
}

// Usage examples
SecurityMonitor.logEvent({
  type: 'authentication',
  severity: 'medium',
  message: 'Failed login attempt',
  details: { email: DataProtection.maskEmail('user@example.com') }
});

SecurityMonitor.logEvent({
  type: 'input_validation',
  severity: 'high',
  message: 'XSS attempt detected',
  details: { input: '<script>alert("xss")</script>' }
});
```

### **Performance Monitoring**
```typescript
// Performance and security monitoring
class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];

  // Monitor API response times
  static monitorApiCall(endpoint: string, startTime: number): () => void {
    return () => {
      const duration = performance.now() - startTime;
      
      this.metrics.push({
        type: 'api_call',
        endpoint,
        duration,
        timestamp: new Date().toISOString()
      });

      // Alert on slow responses
      if (duration > 5000) { // 5 seconds
        SecurityMonitor.logEvent({
          type: 'api_request',
          severity: 'medium',
          message: 'Slow API response detected',
          details: { endpoint, duration }
        });
      }
    };
  }

  // Monitor component render times
  static monitorComponentRender(componentName: string, startTime: number): void {
    const duration = performance.now() - startTime;
    
    this.metrics.push({
      type: 'component_render',
      component: componentName,
      duration,
      timestamp: new Date().toISOString()
    });

    // Alert on slow renders
    if (duration > 100) { // 100ms
      SecurityMonitor.logEvent({
        type: 'error',
        severity: 'low',
        message: 'Slow component render detected',
        details: { component: componentName, duration }
      });
    }
  }

  // Get performance metrics
  static getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Clear metrics
  static clearMetrics(): void {
    this.metrics = [];
  }
}

interface PerformanceMetric {
  type: 'api_call' | 'component_render';
  endpoint?: string;
  component?: string;
  duration: number;
  timestamp: string;
}

// Usage examples
const apiCall = async (endpoint: string) => {
  const startTime = performance.now();
  const cleanup = PerformanceMonitor.monitorApiCall(endpoint, startTime);
  
  try {
    const result = await apiService.get(endpoint);
    cleanup();
    return result;
  } catch (error) {
    cleanup();
    throw error;
  }
};

const ComponentWithMonitoring: React.FC = () => {
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    PerformanceMonitor.monitorComponentRender('ComponentWithMonitoring', startTime.current);
  }, []);

  return <div>Component content</div>;
};
```

## 🔍 **Vulnerability Management**

### **Security Testing**
```typescript
// Security test utilities
class SecurityTester {
  // Test XSS prevention
  static testXSSPrevention(): boolean {
    const testInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      'onclick="alert(\'xss\')"',
      '<iframe src="javascript:alert(\'xss\')"></iframe>'
    ];

    return testInputs.every(input => {
      const sanitized = DOMPurify.sanitize(input);
      return !sanitized.includes('<script>') && 
             !sanitized.includes('javascript:') &&
             !sanitized.includes('onclick=');
    });
  }

  // Test input validation
  static testInputValidation(): boolean {
    const testCases = [
      { input: 'normal@email.com', expected: true },
      { input: 'invalid-email', expected: false },
      { input: '0x1234567890123456789012345678901234567890', expected: true },
      { input: '0xinvalid', expected: false }
    ];

    return testCases.every(testCase => {
      try {
        userProfileSchema.validateSync({ email: testCase.input });
        return testCase.expected;
      } catch {
        return !testCase.expected;
      }
    });
  }

  // Run all security tests
  static runAllTests(): SecurityTestResult {
    const results = {
      xssPrevention: this.testXSSPrevention(),
      inputValidation: this.testInputValidation(),
      timestamp: new Date().toISOString()
    };

    // Log results
    SecurityMonitor.logEvent({
      type: 'error',
      severity: 'low',
      message: 'Security tests completed',
      details: results
    });

    return results;
  }
}

interface SecurityTestResult {
  xssPrevention: boolean;
  inputValidation: boolean;
  timestamp: string;
}

// Run security tests in development
if (process.env.NODE_ENV === 'development') {
  SecurityTester.runAllTests();
}
```

## 📋 **Security Checklist**

### **Development Phase**
- [ ] Input validation implemented
- [ ] Output sanitization configured
- [ ] XSS prevention measures
- [ ] CSRF protection enabled
- [ ] Secure storage implementation
- [ ] Error handling secured
- [ ] Rate limiting configured
- [ ] Security monitoring enabled

### **Testing Phase**
- [ ] Security tests written
- [ ] XSS prevention tested
- [ ] Input validation tested
- [ ] CSRF protection tested
- [ ] Performance monitoring tested
- [ ] Error handling tested

### **Deployment Phase**
- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Monitoring configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active

## 🚨 **Incident Response**

### **Security Incident Types**
1. **XSS Attack** - Malicious script injection
2. **CSRF Attack** - Unauthorized actions
3. **Data Breach** - Sensitive data exposure
4. **Performance Attack** - Resource exhaustion
5. **Authentication Bypass** - Unauthorized access

### **Response Procedures**
1. **Immediate Response**
   - Isolate affected components
   - Preserve evidence
   - Notify security team

2. **Investigation**
   - Analyze logs and events
   - Identify attack vector
   - Assess impact scope

3. **Remediation**
   - Fix vulnerabilities
   - Restore functionality
   - Implement preventive measures

4. **Communication**
   - Notify stakeholders
   - Update users if necessary
   - Document lessons learned

## 📚 **Security Resources**

### **Documentation**
- [OWASP Frontend Security](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://reactjs.org/docs/security.html)
- [TypeScript Security](https://www.typescriptlang.org/docs/)

### **Tools**
- [DOMPurify](https://github.com/cure53/DOMPurify) - XSS prevention
- [Yup](https://github.com/jquense/yup) - Schema validation
- [Helmet](https://helmetjs.github.io/) - Security headers

### **Training**
- Security awareness training for developers
- Regular security workshops
- Code review best practices
- Incident response drills

---

**This security documentation is regularly updated to reflect current threats and best practices.**
