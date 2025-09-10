'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  HomeIcon, 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  ChartBarIcon, 
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isAdmin?: boolean;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon, description: 'Overview and analytics' },
  { name: 'Users', href: '/admin/users', icon: UsersIcon, description: 'User management' },
  { name: 'Messages', href: '/admin/messages', icon: ChatBubbleLeftRightIcon, description: 'Message center' },
  { name: 'Analytics', href: '/admin/stats', icon: ChartBarIcon, description: 'Statistics and metrics' },
  { name: 'Settings', href: '/admin/settings', icon: CogIcon, description: 'Configuration' },
];

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <h1 className="text-lg font-bold text-white">Jemea Bot</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Mobile navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-link ${
                  isActive ? 'active' : ''
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* Mobile footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <UserCircleIcon className="h-8 w-8 text-gray-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Admin User</div>
              <div className="text-xs text-gray-600">admin@jemea.bot</div>
            </div>
            <BellIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm overflow-y-auto">
            {/* Desktop header */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Jemea Bot</h1>
                <p className="text-sm text-indigo-100">Admin Dashboard</p>
              </div>
            </div>
            
            {/* Desktop navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              <div className="mb-4">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Main
                </h3>
              </div>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-link group ${
                      isActive ? 'active' : ''
                    }`}
                    title={item.description}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs opacity-75 group-hover:opacity-100 transition-opacity">
                        {item.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
            
            {/* Desktop footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <UserCircleIcon className="h-10 w-10 text-gray-600" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Admin User</div>
                  <div className="text-xs text-gray-600">admin@jemea.bot</div>
                </div>
                <div className="relative">
                  <BellIcon className="h-5 w-5 text-gray-400" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white/90 bg-white shadow-lg backdrop-blur-sm transition-all duration-200 border border-gray-200"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}

