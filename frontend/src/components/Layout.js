import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AIChat from './AIChat';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ${
        collapsed ? 'lg:ml-16' : 'lg:ml-72'
      }`}>
        {/* Mobile header */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                </button>
                <h1 className="ml-4 text-lg font-semibold text-gray-900">
                  Sistem Invois
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      
      {/* AI Chat Component */}
      <AIChat />
    </div>
  );
};

export default Layout;