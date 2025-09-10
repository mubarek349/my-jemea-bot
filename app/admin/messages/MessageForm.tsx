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
  XMarkIcon
} from '@heroicons/react/24/outline';

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
  const [formData, setFormData] = useState({
    title: message?.title || "",
    content: message?.content || "",
    scheduledFor: message?.scheduledFor 
      ? new Date(message.scheduledFor).toISOString().slice(0, 16)
      : ""
  });

  const isFormValid = formData.content.trim().length > 0;
  const characterCount = formData.content.length;
  const maxLength = 4096; // Telegram message limit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const url = message ? `/api/messages/${message.id}` : "/api/messages";
      const method = message ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title || null,
          content: formData.content,
          scheduledFor: formData.scheduledFor ? new Date(formData.scheduledFor).toISOString() : null,
        }),
      });

      if (response.ok) {
        setSuccess(message ? "Message updated successfully!" : "Message created successfully!");
        setTimeout(() => {
          router.push("/admin/messages");
          router.refresh();
        }, 1500);
      } else {
        const errorText = await response.text();
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

            {/* Schedule Field */}
            <div className="form-group">
              <label htmlFor="scheduledFor" className="form-label">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Schedule for Later <span className="text-gray-400">(optional)</span>
                </div>
              </label>
              <input
                type="datetime-local"
                id="scheduledFor"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                className="form-input"
                disabled={isSubmitting}
                min={new Date().toISOString().slice(0, 16)}
              />
              <div className="form-help">
                Leave empty to send immediately, or select a future date and time to schedule the message.
              </div>
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
