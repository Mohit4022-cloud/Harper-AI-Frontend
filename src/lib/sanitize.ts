// Input sanitization utilities
import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML content to prevent XSS
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

// Remove all HTML tags
export function stripHTML(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

// Sanitize user input for display
export function sanitizeInput(input: string, maxLength?: number): string {
  if (!input) return '';
  
  // Remove any HTML tags
  let sanitized = stripHTML(input);
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Apply max length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

// Sanitize email addresses
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Basic email sanitization
  return email.toLowerCase().trim();
}

// Sanitize phone numbers
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except + (for international)
  return phone.replace(/[^\d+]/g, '');
}

// Sanitize URLs
export function sanitizeURL(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

// Sanitize file names
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';
  
  // Remove any path components
  fileName = fileName.split(/[/\\]/).pop() || '';
  
  // Remove dangerous characters
  fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (fileName.length > 255) {
    const ext = fileName.split('.').pop();
    const base = fileName.substring(0, 250 - (ext?.length || 0) - 1);
    fileName = ext ? `${base}.${ext}` : base;
  }
  
  return fileName;
}

// Sanitize search queries
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  
  // Remove special characters that might break search
  return query
    .replace(/[<>\"']/g, '')
    .trim()
    .substring(0, 100); // Limit length
}

// Sanitize JSON for safe storage
export function sanitizeJSON(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJSON);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip keys that might be dangerous
      if (!key.startsWith('__') && !key.startsWith('$$')) {
        sanitized[sanitizeInput(key, 50)] = sanitizeJSON(value);
      }
    }
    return sanitized;
  }
  
  return obj;
}