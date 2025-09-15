/**
 * Professional Timezone Utilities
 * Handles timezone conversion, validation, and formatting for the Jemea Bot application
 */

export interface TimezoneInfo {
  local: string;
  utc: string;
  iso: string;
  timezone: string;
  offset: string;
  offsetMinutes: number;
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
  warning: string | null;
  timeUntilDelivery?: string;
}

export class TimezoneManager {
  private static cachedTimezone: string | null = null;
  private static lastDetectionTime: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get user's timezone information with caching
   */
  static getUserTimezone(): string {
    const now = Date.now();
    
    // Return cached timezone if still valid
    if (this.cachedTimezone && (now - this.lastDetectionTime) < this.CACHE_DURATION) {
      return this.cachedTimezone;
    }

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      this.cachedTimezone = timezone;
      this.lastDetectionTime = now;
      return timezone;
    } catch {
      this.cachedTimezone = 'Unknown';
      this.lastDetectionTime = now;
      return 'Unknown';
    }
  }

  /**
   * Reset timezone detection and clear cache
   */
  static resetTimezoneDetection(): void {
    this.cachedTimezone = null;
    this.lastDetectionTime = 0;
  }

  /**
   * Force refresh timezone detection
   */
  static refreshTimezoneDetection(): string {
    this.resetTimezoneDetection();
    return this.getUserTimezone();
  }

  /**
   * Get formatted timezone offset
   */
  static getTimezoneOffset(): string {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? '+' : '-';
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Format a date with comprehensive timezone information
   */
  static formatWithTimezone(date: Date): TimezoneInfo {
    return {
      local: date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      }),
      utc: date.toUTCString(),
      iso: date.toISOString(),
      timezone: this.getUserTimezone(),
      offset: this.getTimezoneOffset(),
      offsetMinutes: date.getTimezoneOffset()
    };
  }

  /**
   * Convert local datetime-local input to UTC for storage
   */
  static convertLocalToUTC(localDateTimeString: string): string | null {
    if (!localDateTimeString) return null;
    
    try {
      // The datetime-local input gives us a local time
      // We need to create a Date object that represents this local time
      const localDate = new Date(localDateTimeString);
      
      // Check if the date is valid
      if (isNaN(localDate.getTime())) {
        return null;
      }
      
      // Return the ISO string which is already in UTC
      return localDate.toISOString();
    } catch {
      return null;
    }
  }

  /**
   * Format date for datetime-local input (in local timezone)
   */
  static formatForInput(date: Date): string {
    try {
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      return localDate.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  }

  /**
   * Get minimum datetime for reliable scheduling (2 minutes from now)
   */
  static getMinDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 2);
    return this.formatForInput(now);
  }

  /**
   * Calculate human-readable time until delivery
   */
  static calculateTimeUntil(targetDate: Date): string {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Past due';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}, ${hours % 24} hour${(hours % 24) !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes % 60} minute${(minutes % 60) !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Professional validation for scheduled times
   */
  static validateScheduledTime(localTimeString: string): ValidationResult {
    if (!localTimeString) {
      return { isValid: true, error: null, warning: null };
    }
    
    try {
      const localTime = new Date(localTimeString);
      const now = new Date();
      const timeDiff = localTime.getTime() - now.getTime();
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));
      
      // Error conditions
      if (localTime <= now) {
        return { 
          isValid: false, 
          error: "Scheduled time must be in the future", 
          warning: null 
        };
      }
      
      if (minutesDiff < 2) {
        return { 
          isValid: false, 
          error: "Schedule at least 2 minutes in the future for reliable delivery", 
          warning: null 
        };
      }
      
      // Check if it's too far in the future (max 1 year)
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (localTime > oneYearFromNow) {
        return { 
          isValid: false, 
          error: "Scheduled time cannot be more than 1 year in the future", 
          warning: null 
        };
      }
      
      // Warning conditions
      let warning = null;
      if (minutesDiff < 5) {
        warning = "Message scheduled very soon. Consider allowing more processing time.";
      } else if (minutesDiff > 60 * 24 * 30) { // More than 30 days
        warning = "Message scheduled more than 30 days in the future.";
      }
      
      return { 
        isValid: true, 
        error: null, 
        warning,
        timeUntilDelivery: this.calculateTimeUntil(localTime)
      };
    } catch (error) {
      return {
        isValid: false,
        error: "Invalid date format",
        warning: null
      };
    }
  }

  /**
   * Get comprehensive timezone status for diagnostics
   */
  static getTimezoneStatus(): {
    current: TimezoneInfo;
    system: {
      timezone: string;
      offset: string;
      offsetMinutes: number;
      isDST: boolean;
      dstTransition?: {
        next: Date | null;
        type: 'spring' | 'fall' | null;
      };
    };
  } {
    const now = new Date();
    const january = new Date(now.getFullYear(), 0, 1);
    const july = new Date(now.getFullYear(), 6, 1);
    const isDST = now.getTimezoneOffset() !== Math.max(january.getTimezoneOffset(), july.getTimezoneOffset());

    // Calculate next DST transition (simplified)
    let nextTransition = null;
    let transitionType = null;
    
    try {
      const currentYear = now.getFullYear();
      // Common DST transition dates (this is simplified - real implementation would need timezone data)
      const springTransition = new Date(currentYear, 2, 14); // Second Sunday in March (approximation)
      const fallTransition = new Date(currentYear, 10, 7);   // First Sunday in November (approximation)
      
      if (now < springTransition) {
        nextTransition = springTransition;
        transitionType = 'spring';
      } else if (now < fallTransition) {
        nextTransition = fallTransition;
        transitionType = 'fall';
      } else {
        nextTransition = new Date(currentYear + 1, 2, 14);
        transitionType = 'spring';
      }
    } catch {
      // Ignore DST calculation errors
    }

    return {
      current: this.formatWithTimezone(now),
      system: {
        timezone: this.getUserTimezone(),
        offset: this.getTimezoneOffset(),
        offsetMinutes: now.getTimezoneOffset(),
        isDST,
        dstTransition: {
          next: nextTransition,
          type: transitionType as 'spring' | 'fall' | null
        }
      }
    };
  }

  /**
   * Format duration in a human-readable way
   */
  static formatDuration(milliseconds: number): string {
    if (milliseconds <= 0) return 'now';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    
    if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else if (weeks > 0) {
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Check if a given time is during business hours
   */
  static isBusinessHours(date: Date, businessStart = 9, businessEnd = 17): boolean {
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // Monday = 1, Sunday = 0
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isDuringHours = hour >= businessStart && hour < businessEnd;
    
    return isWeekday && isDuringHours;
  }
}

// Export individual functions for backward compatibility
export const getUserTimezone = TimezoneManager.getUserTimezone;
export const getTimezoneOffset = TimezoneManager.getTimezoneOffset;
export const formatTimeWithTimezone = TimezoneManager.formatWithTimezone;
export const convertLocalToUTC = TimezoneManager.convertLocalToUTC;
export const formatDateTimeForInput = TimezoneManager.formatForInput;
export const validateScheduledTime = TimezoneManager.validateScheduledTime;
export const getMinDateTime = TimezoneManager.getMinDateTime;
export const formatDuration = TimezoneManager.formatDuration;
export const isBusinessHours = TimezoneManager.isBusinessHours;