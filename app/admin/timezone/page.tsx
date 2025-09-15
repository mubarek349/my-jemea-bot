import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TimezoneStatus } from "@/components/TimezoneStatus";
import { 
  ClockIcon,
  GlobeAltIcon,
  CogIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default async function AdminTimezone() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as any)?.isAdmin) redirect("/");

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <GlobeAltIcon className="h-8 w-8 text-indigo-600" />
              Timezone Management
            </h1>
            <p className="page-subtitle">
              Monitor and manage timezone settings for accurate message scheduling and delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Professional Timezone Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TimezoneStatus showDetailed={true} />
        </div>
        
        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="stat-label">Server Status</div>
                <div className="text-lg font-semibold text-green-600">Online</div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GlobeAltIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="stat-label">Timezone Detection</div>
                <div className="text-lg font-semibold text-blue-600">Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notices */}
      <div className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-medium text-amber-800 mb-1">Timezone Changes</h4>
          <p className="text-sm text-amber-700">
            Check the preview carefully during spring/fall transitions.
          </p>
        </div>
        
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-1">Browser Timezone Changes</h4>
          <p className="text-sm text-red-700">
            If you change your system timezone, refresh the page to ensure accurate detection.  
            Existing scheduled messages maintain their original UTC time.
          </p>
        </div>
        
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-1">International Audiences</h4>
          <p className="text-sm text-blue-700">
            Consider your audience's timezone when scheduling. Messages are delivered based on  
            the scheduled UTC time regardless of recipients' locations.
          </p>
        </div>
      </div>

      {/* Technical Implementation */}
      <div className="card-elevated">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <CogIcon className="h-6 w-6 text-gray-600" />
            <div>
              <h3 className="card-title">Technical Implementation</h3>
              <p className="card-subtitle">How the timezone system works</p>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Client Detection</h4>
              <p className="text-sm text-gray-600">
                Browser automatically detects your timezone using the Intl.DateTimeFormat API for accurate local time display.
              </p>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <GlobeAltIcon className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">UTC Storage</h4>
              <p className="text-sm text-gray-600">
                All scheduled times are converted to UTC before storage, ensuring consistency across different timezones.
              </p>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Precise Delivery</h4>
              <p className="text-sm text-gray-600">
                Cron jobs check every minute for scheduled messages, with delivery precision of ±1 second for optimal timing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
