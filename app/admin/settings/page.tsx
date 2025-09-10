import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  CogIcon,
  InformationCircleIcon,
  KeyIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as any)?.isAdmin) redirect("/");

  const groupId = process.env.TELEGRAM_GROUP_ID || "Not configured";
  const botToken = process.env.TELEGRAM_BOT_TOKEN ? "Configured" : "Not configured";
  const isGroupConfigured = process.env.TELEGRAM_GROUP_ID ? true : false;
  const isBotConfigured = process.env.TELEGRAM_BOT_TOKEN ? true : false;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Bot Settings</h1>
            <p className="page-subtitle">
              Configure your Telegram bot settings and environment variables.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary">
              <DocumentTextIcon className="h-4 w-4" />
              Documentation
            </button>
            <button className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isBotConfigured ? 'bg-green-50' : 'bg-red-50'}`}>
                <KeyIcon className={`h-6 w-6 ${isBotConfigured ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Bot Token</div>
                <div className="text-sm text-gray-500">Authentication token</div>
              </div>
            </div>
            <span className={`badge ${isBotConfigured ? 'badge-green' : 'badge-red'}`}>
              {isBotConfigured ? (
                <><CheckCircleIcon className="h-3 w-3" /> Configured</>
              ) : (
                <><ExclamationTriangleIcon className="h-3 w-3" /> Missing</>
              )}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {isBotConfigured ? 'Bot token is properly configured.' : 'Bot token is required for operation.'}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isGroupConfigured ? 'bg-green-50' : 'bg-amber-50'}`}>
                <ChatBubbleLeftRightIcon className={`h-6 w-6 ${isGroupConfigured ? 'text-green-600' : 'text-amber-600'}`} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Target Group</div>
                <div className="text-sm text-gray-500">Message destination</div>
              </div>
            </div>
            <span className={`badge ${isGroupConfigured ? 'badge-green' : 'badge-yellow'}`}>
              {isGroupConfigured ? (
                <><CheckCircleIcon className="h-3 w-3" /> Configured</>
              ) : (
                <><ExclamationTriangleIcon className="h-3 w-3" /> Optional</>
              )}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {isGroupConfigured ? 'Group ID is configured for scheduled messages.' : 'Configure for scheduled messaging.'}
          </div>
        </div>
      </div>

      {/* Bot Configuration */}
      <div className="card-elevated">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <CogIcon className="h-6 w-6 text-indigo-600" />
            <div>
              <h3 className="card-title">Telegram Bot Configuration</h3>
              <p className="card-subtitle">Manage your bot's connection settings</p>
            </div>
          </div>
        </div>
        <div className="card-body space-y-6">
          {/* Bot Token Section */}
          <div className="form-group">
            <label className="form-label">Bot Token</label>
            <div className="relative">
              <input
                type="password"
                value={isBotConfigured ? "••••••••••••••••••••••••••••••••••••••••" : ""}
                className="form-input pr-12"
                placeholder="Enter your Telegram bot token"
                disabled
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className={`badge ${isBotConfigured ? 'badge-green' : 'badge-red'}`}>
                  {botToken}
                </span>
              </div>
            </div>
            <div className="form-help">
              Set <code className="bg-gray-100 px-1 rounded text-xs">TELEGRAM_BOT_TOKEN</code> in your environment variables.
            </div>
          </div>

          {/* Group ID Section */}
          <div className="form-group">
            <label className="form-label">Target Group ID</label>
            <div className="relative">
              <input
                type="text"
                value={groupId}
                className="form-input pr-12 font-mono"
                placeholder="-1001234567890"
                disabled
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className={`badge ${isGroupConfigured ? 'badge-green' : 'badge-yellow'}`}>
                  {isGroupConfigured ? 'Set' : 'Not Set'}
                </span>
              </div>
            </div>
            <div className="form-help">
              Set <code className="bg-gray-100 px-1 rounded text-xs">TELEGRAM_GROUP_ID</code> in your .env file to enable scheduled messaging to a specific group.
            </div>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="card-elevated">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <InformationCircleIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="card-title">Setup Instructions</h3>
              <p className="card-subtitle">How to configure your Telegram bot</p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-6">
            {/* Bot Token Instructions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold">1</span>
                Getting Your Bot Token
              </h4>
              <div className="ml-8 space-y-2 text-sm text-gray-700">
                <p>• Message <code className="bg-gray-100 px-1 rounded">@BotFather</code> on Telegram</p>
                <p>• Use the command <code className="bg-gray-100 px-1 rounded">/newbot</code> to create a new bot</p>
                <p>• Follow the instructions to choose a name and username</p>
                <p>• Copy the bot token provided by BotFather</p>
                <p>• Add it to your <code className="bg-gray-100 px-1 rounded">.env</code> file as <code className="bg-gray-100 px-1 rounded">TELEGRAM_BOT_TOKEN=your_token_here</code></p>
              </div>
            </div>

            {/* Group ID Instructions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold">2</span>
                Getting Group ID (Optional)
              </h4>
              <div className="ml-8 space-y-2 text-sm text-gray-700">
                <p>• Add your bot to the target group</p>
                <p>• Make the bot an admin (required for sending messages)</p>
                <p>• Send any message in the group</p>
                <p>• Visit: <code className="bg-gray-100 px-1 rounded text-xs break-all">https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getUpdates</code></p>
                <p>• Find the "chat" object in the response and copy the "id" value</p>
                <p>• Add it to your <code className="bg-gray-100 px-1 rounded">.env</code> file as <code className="bg-gray-100 px-1 rounded">TELEGRAM_GROUP_ID=your_group_id</code></p>
              </div>
            </div>

            {/* API Documentation Link */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <LinkIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900">Telegram Bot API Documentation</h5>
                  <p className="text-sm text-blue-700 mt-1">
                    For more advanced configuration options, visit the official Telegram Bot API documentation.
                  </p>
                  <a 
                    href="https://core.telegram.org/bots/api" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    View Documentation
                    <LinkIcon className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


