"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PaperAirplaneIcon,
  TrashIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { TimezoneManager } from '@/lib/timezone';

interface Message {
  id: string;
  title?: string | null;
  content: string;
  scheduledFor?: Date | null;
}

interface MessageFormProps {
  message?: Message;
}

export function MessageForm({ message }: MessageFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null);
  const [timeValidationWarning, setTimeValidationWarning] = useState<string | null>(null);
  const [showTimezoneInfo, setShowTimezoneInfo] = useState(false);
  
  // Professional datetime formatting using TimezoneManager
  const formatDateTimeForDisplay = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return TimezoneManager.formatWithTimezone(date);
  };
  
  const [formData, setFormData] = useState({
    title: message?.title || "",
    content: message?.content || "",
    scheduledFor: message?.scheduledFor 
      ? TimezoneManager.formatForInput(new Date(message.scheduledFor))
      : ""
  });

  const isFormValid = formData.content.trim().length > 0 && !timeValidationError;
  const characterCount = formData.content.length;
  const maxLength = 4096; // Telegram message limit

  // Handle scheduled time changes with professional validation
  const handleScheduledTimeChange = (value: string) => {
    setFormData({ ...formData, scheduledFor: value });
    const validation = TimezoneManager.validateScheduledTime(value);
    setTimeValidationError(validation.error);
    setTimeValidationWarning(validation.warning);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    
    // Final validation before submission
    const timeValidation = TimezoneManager.validateScheduledTime(formData.scheduledFor);
    if (!timeValidation.isValid) {
      setTimeValidationError(timeValidation.error);
      setError("Please fix the scheduled time before submitting.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setTimeValidationError(null);
    setTimeValidationWarning(null);

    try {
      const url = message ? `/api/messages/${message.id}` : "/api/messages";
      const method = message ? "PUT" : "POST";
      
      const requestBody = {
        title: formData.title || null,
        content: formData.content,
        scheduledFor: TimezoneManager.convertLocalToUTC(formData.scheduledFor),
      };
      
      console.log("Making request to:", url);
      console.log("Request method:", method);
      console.log("Request body:", JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        setSuccess(message ? "Message updated successfully!" : "Message created successfully!");
        setTimeout(() => {
          router.push("/admin/messages");
          router.refresh();
        }, 1500);
      } else {
        const errorText = await response.text();
        console.log("Error response text:", errorText);
        setError(errorText || "Failed to save message");
      }
    } catch (error) {
      console.error("Error saving message:", error);
      setError("An unexpected error occurred while saving the message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!message) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to delete this message? This action cannot be undone."
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/messages/${message.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Message deleted successfully!");
        setTimeout(() => {
          router.push("/admin/messages");
          router.refresh();
        }, 1000);
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      setError("An unexpected error occurred while deleting the message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">
              {message ? "Edit Message" : "Create New Message"}
            </h1>
            <p className="page-subtitle">
              {message ? "Update your message content and settings." : "Compose a new message to send to your users."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${
              characterCount > maxLength ? 'text-red-600' : 
              characterCount > maxLength * 0.8 ? 'text-amber-600' : 'text-gray-500'
            }`}>
              {characterCount}/{maxLength} characters
            </span>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationCircleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Message Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card-elevated">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
              <div>
                <h3 className="card-title">Message Content</h3>
                <p className="card-subtitle">Enter your message details below</p>
              </div>
            </div>
          </div>
          <div className="card-body space-y-6">
            {/* Title Field */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Title <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="form-input"
                placeholder="Enter a title for your message"
                disabled={isSubmitting}
              />
              <div className="form-help">
                A descriptive title to help you identify this message in the admin panel.
              </div>
            </div>

            {/* Content Field */}
            <div className="form-group">
              <label htmlFor="content" className="form-label">
                Message Content <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                rows={8}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className={`form-textarea resize-none ${
                  characterCount > maxLength ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                }`}
                placeholder="Enter your message content here..."
                required
                disabled={isSubmitting}
                maxLength={maxLength}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="form-help">
                  The main content of your message. Supports Telegram formatting.
                </div>
                <div className={`text-xs font-medium ${
                  characterCount > maxLength ? 'text-red-600' : 
                  characterCount > maxLength * 0.8 ? 'text-amber-600' : 'text-gray-500'
                }`}>
                  {characterCount > maxLength && 'Character limit exceeded'}
                </div>
              </div>
            </div>

            {/* Professional Schedule Field */}
            <div className="form-group">
              <label htmlFor="scheduledFor" className="form-label">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    Schedule Delivery <span className="text-gray-400">(optional)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500">
                      {TimezoneManager.getUserTimezone()} ({TimezoneManager.getTimezoneOffset()})
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTimezoneInfo(!showTimezoneInfo)}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors"
                      title="Toggle timezone information"
                    >
                      <InformationCircleIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </label>
              
              <input
                type="datetime-local"
                id="scheduledFor"
                value={formData.scheduledFor}
                onChange={(e) => handleScheduledTimeChange(e.target.value)}
                className={`form-input transition-colors ${
                  timeValidationError 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : timeValidationWarning
                    ? 'border-amber-300 focus:ring-amber-500 focus:border-amber-500'
                    : 'focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                disabled={isSubmitting}
                min={TimezoneManager.getMinDateTime()}
                step="60"
              />
              
              <div className="mt-2 space-y-2">
                <div className="form-help">
                  Leave empty to send immediately. Schedule for future delivery with automatic timezone handling.
                </div>
                
                {/* Professional Timezone Information Panel */}
                {showTimezoneInfo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Timezone Information</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-blue-700">Detected Timezone:</span>
                          <div className="text-blue-600 font-mono">{TimezoneManager.getUserTimezone()}</div>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">UTC Offset:</span>
                          <div className="text-blue-600 font-mono">{TimezoneManager.getTimezoneOffset()}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-blue-700">Current Local Time:</span>
                          <div className="text-blue-600 font-mono">{TimezoneManager.formatWithTimezone(new Date()).local}</div>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Current UTC Time:</span>
                          <div className="text-blue-600 font-mono">{new Date().toUTCString()}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-600">
                        💡 <strong>Tip:</strong> The system automatically converts your local time to UTC for storage and delivery scheduling.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Current time display - simplified when timezone info is hidden */}
                {!showTimezoneInfo && (
                  <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                    <span className="font-medium">Current time:</span> {TimezoneManager.formatWithTimezone(new Date()).local}
                  </div>
                )}
              </div>
              
              {/* Validation Error */}
              {timeValidationError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ExclamationCircleIcon className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700">
                      <strong>Error:</strong> {timeValidationError}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Validation Warning */}
              {timeValidationWarning && !timeValidationError && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ExclamationCircleIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-700">
                      <strong>Warning:</strong> {timeValidationWarning}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Professional Time Preview */}
              {formData.scheduledFor && !timeValidationError && (() => {
                const timeInfo = formatDateTimeForDisplay(formData.scheduledFor);
                const validation = TimezoneManager.validateScheduledTime(formData.scheduledFor);
                return timeInfo ? (
                  <div className="mt-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-800">Scheduled Delivery Preview</span>
                      </div>
                      {validation.timeUntilDelivery && (
                        <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                          in {validation.timeUntilDelivery}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Your Local Time</div>
                          <div className="font-mono text-gray-900 bg-white px-2 py-1 rounded border">{timeInfo.local}</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Timezone</div>
                          <div className="font-mono text-gray-700">{timeInfo.timezone}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Server UTC Time</div>
                          <div className="font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded border">{timeInfo.utc}</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">UTC Offset</div>
                          <div className="font-mono text-gray-700">{timeInfo.offset}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-indigo-200">
                      <div className="flex items-start gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-green-700">
                          <strong>Delivery confirmed:</strong> Message will be sent at the scheduled time in your local timezone.
                          The system automatically handles timezone conversion for precise delivery.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            {message && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="btn btn-danger"
              >
                <TrashIcon className="h-4 w-4" />
                {isSubmitting ? "Deleting..." : "Delete Message"}
              </button>
            )}
          </div>
          
          <div className="flex gap-3 sm:ml-auto">
            <button
              type="button"
              onClick={() => router.push("/admin/messages")}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid || characterCount > maxLength}
              className="btn btn-primary"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              {isSubmitting ? (
                message ? "Updating..." : "Creating..."
              ) : (
                message ? "Update Message" : "Create Message"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
