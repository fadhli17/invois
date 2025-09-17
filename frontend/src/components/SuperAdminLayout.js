import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import { FiMenu } from 'react-icons/fi';
import './SuperAdminLayout.css';

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="superadmin-layout">
      {/* Mobile menu button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(true)}
      >
        <FiMenu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <SuperAdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main content */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default SuperAdminLayout;
