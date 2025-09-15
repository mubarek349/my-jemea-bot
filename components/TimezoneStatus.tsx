"use client";

import { useState, useEffect } from 'react';
import { TimezoneManager } from '@/lib/timezone';
import { 
  ClockIcon, 
  GlobeAltIcon, 
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface TimezoneStatusProps {
  className?: string;
  showDetailed?: boolean;
}

export function TimezoneStatus({ className = "", showDetailed = false }: TimezoneStatusProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timezoneStatus, setTimezoneStatus] = useState(() => TimezoneManager.getTimezoneStatus());
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setTimezoneStatus(TimezoneManager.getTimezoneStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleResetTimezone = async () => {
    setIsResetting(true);
    try {
      // Reset timezone detection
      TimezoneManager.resetTimezoneDetection();
      
      // Force refresh the timezone status
      const newStatus = TimezoneManager.getTimezoneStatus();
      setTimezoneStatus(newStatus);
      
      // Update current time
      setCurrentTime(new Date());
      
      // Show success message
      console.log('Timezone detection reset successfully');
    } catch (error) {
      console.error('Error resetting timezone:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const timeInfo = TimezoneManager.formatWithTimezone(currentTime);

  if (!showDetailed) {
    return (
      <div className={`inline-flex items-center gap-2 text-sm text-gray-600 ${className}`}>
        <ClockIcon className="h-4 w-4" />
        <span className="font-mono">{timeInfo.local}</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
          {timezoneStatus.system.offset}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GlobeAltIcon className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">System Timezone Status</h3>
          </div>
          <button
            onClick={handleResetTimezone}
            disabled={isResetting}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Reset timezone detection"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Resetting...' : 'Reset'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current Time Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Local Time
            </label>
            <div className="mt-1 font-mono text-lg text-gray-900">
              {timeInfo.local}
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              UTC Time
            </label>
            <div className="mt-1 font-mono text-lg text-gray-700">
              {timeInfo.utc}
            </div>
          </div>
        </div>

        {/* Timezone Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Timezone
            </label>
            <div className="mt-1 font-mono text-sm text-gray-900">
              {timezoneStatus.system.timezone}
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              UTC Offset
            </label>
            <div className="mt-1 font-mono text-sm text-gray-900">
              {timezoneStatus.system.offset}
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              DST Status
            </label>
            <div className="mt-1 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                timezoneStatus.system.isDST ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-900">
                {timezoneStatus.system.isDST ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* DST Information */}
        {timezoneStatus.system.dstTransition?.next && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-start gap-2">
              <InformationCircleIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-gray-900">Next DST transition:</span>
                <div className="text-gray-600 mt-1">
                  {timezoneStatus.system.dstTransition.type === 'spring' ? 'Spring Forward' : 'Fall Back'} on{' '}
                  {timezoneStatus.system.dstTransition.next.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Business Hours Indicator */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">Business Hours</span>
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                TimezoneManager.isBusinessHours(currentTime)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {TimezoneManager.isBusinessHours(currentTime) ? 'Open' : 'Closed'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Mon-Fri, 9:00 AM - 5:00 PM
            </div>
          </div>
        </div>

        {/* Warning for DST periods */}
        {timezoneStatus.system.isDST && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-700">
                <span className="font-medium">DST Active:</span> Be aware that scheduled messages 
                during DST transitions may be affected. The system uses UTC for precision.
              </div>
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div className="pt-4 border-t border-gray-200">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              <InformationCircleIcon className="h-4 w-4" />
              Technical Details
            </summary>
            <div className="mt-3 pl-6 space-y-2 text-xs text-gray-600">
              <div>
                <span className="font-medium">ISO Format:</span>
                <span className="ml-2 font-mono">{timeInfo.iso}</span>
              </div>
              <div>
                <span className="font-medium">Offset Minutes:</span>
                <span className="ml-2 font-mono">{timezoneStatus.system.offsetMinutes}</span>
              </div>
              <div>
                <span className="font-medium">Timezone Detection:</span>
                <span className="ml-2">Automatic via browser API</span>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}