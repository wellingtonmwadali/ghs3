/**
 * Utility functions for formatting data across the application
 */

/**
 * Format currency in Kenyan Shillings
 * @param amount - The amount to format
 * @param includeSymbol - Whether to include the Ksh symbol
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | undefined | null, includeSymbol: boolean = true): string {
  const safeAmount = amount || 0;
  const formatted = safeAmount.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return includeSymbol ? `Ksh ${formatted}` : formatted;
}

/**
 * Format date to localized string
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  if (!date) return 'N/A';
  
  try {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    return parsedDate.toLocaleDateString('en-KE', options);
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Format date with time
 * @param date - The date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return 'N/A';
  
  try {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    return parsedDate.toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Format relative time (e.g., "2 days ago")
 * @param date - The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date | undefined | null): string {
  if (!date) return 'N/A';
  
  try {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - parsedDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Format phone number to Kenyan format
 * @param phone - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return 'N/A';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as +254 XXX XXX XXX
  if (digits.length === 12 && digits.startsWith('254')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  
  // Format as 0XXX XXX XXX
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  
  return phone;
}

/**
 * Truncate text with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string | undefined | null, maxLength: number = 50): string {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Format percentage
 * @param value - The value to format as percentage
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | undefined | null, decimals: number = 1): string {
  const safeValue = value || 0;
  return `${safeValue.toFixed(decimals)}%`;
}

/**
 * Safely get numeric value with fallback
 * @param value - The value to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Safe numeric value
 */
export function safeNumber(value: any, fallback: number = 0): number {
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}
