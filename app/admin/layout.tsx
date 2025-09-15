import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as any)?.isAdmin) redirect("/");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <Sidebar isAdmin={true} />
      
      {/* Main layout container */}
      <div className="lg:pl-72">
        {/* Mobile header - positioned to work with sidebar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 lg:hidden">
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between h-12">
              {/* Left spacing for mobile menu button */}
              <div className="w-10"></div>
              
              {/* Center branding */}
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-gray-900">Admin</h1>
              </div>
              
              {/* Right side actions */}
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
                  <BellIcon className="h-4 w-4" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
                  <UserCircleIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="min-h-[calc(100vh-3rem)] lg:min-h-screen">
          <div className="pt-4 pb-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-white/95 backdrop-blur-sm border-t border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="py-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-xs text-gray-500">
                  © 2024 Jemea Bot. Built with Next.js
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">
                    Docs
                  </a>
                  <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">
                    Support
                  </a>
                  <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">
                    API
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}


