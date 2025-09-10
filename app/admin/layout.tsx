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
      <Sidebar isAdmin={true} />
      <div className="lg:pl-72">
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 shadow-sm lg:hidden">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Mobile spacing for hamburger */}
                <div className="w-12"></div>
                
                {/* Center logo for mobile */}
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-gray-900">Jemea Bot Admin</h1>
                </div>
                
                {/* Right side icons */}
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <BellIcon className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <UserCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            <div className="py-8">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
          
          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-500">
                    © 2024 Jemea Bot. Built with Next.js and Tailwind CSS.
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">
                      Documentation
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
    </div>
  );
}


