import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FiUsers, FiFileText, FiDollarSign, FiShield, 
  FiActivity, FiTrendingUp, FiAlertCircle, FiSettings,
  FiLogOut, FiRefreshCw, FiEye, FiToggleLeft, FiToggleRight,
  FiTrash2, FiEdit, FiPlus, FiSearch, FiFilter,
  FiChevronLeft, FiChevronRight, FiCheckCircle,
  FiXCircle, FiClock, FiDatabase, FiCpu, FiCalendar, FiEyeOff
} from 'react-icons/fi';
import './SuperAdminDashboard.css';
import { API_BASE_URL } from '../config/api';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userStatus, setUserStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [health, setHealth] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);
  const [aiKeyInput, setAiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [testingAI, setTestingAI] = useState(false);
  const [aiAccessEnabled, setAiAccessEnabled] = useState(true);
  const [togglingAccess, setTogglingAccess] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [backupStatus, setBackupStatus] = useState(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [serverUptime, setServerUptime] = useState(null);
  const [errorLogs, setErrorLogs] = useState([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current active tab from URL path
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 'users';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/documents')) return 'documents';
    if (path.includes('/reports')) return 'reports';
    return 'overview';
  };
  
  const activeTab = getCurrentTab();

  useEffect(() => {
    checkAuth();
    fetchStats();
    // Preload settings data if user is on settings route
    if (location.pathname.includes('/settings')) {
      fetchHealth();
      fetchAIConfig();
      fetchDatabaseStatus();
      fetchSystemStatus();
      fetchSystemMetrics();
      fetchRecentActivities();
      fetchSecurityLogs();
      fetchBackupStatus();
      fetchErrorLogs();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
    if (activeTab === 'settings') {
      fetchHealth();
      fetchAIConfig();
      fetchDatabaseStatus();
      fetchSystemStatus();
    }
  }, [location.pathname, searchTerm, userStatus, currentPage]);

  // Load additional data when needed
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchSystemMetrics();
      fetchRecentActivities();
      fetchSecurityLogs();
      fetchBackupStatus();
      fetchErrorLogs();
    }
  }, [activeTab]);

  const checkAuth = () => {
    const token = localStorage.getItem('superAdminToken');
    if (!token) {
      navigate('/superadmin/login');
    }
  };

  const fetchHealth = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`${API_BASE_URL}/api/superadmin/health`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (data?.success) setHealth(data.health);
    } catch (e) {
      console.error('Error fetching health:', e);
    }
  };

  const fetchAIConfig = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      if (!token) {
        return;
      }
      
      const res = await fetch(`${API_BASE_URL}/api/superadmin/ai-config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setAiConfig(data);
        setAiKeyInput('');
        setAiAccessEnabled(data.enabled !== undefined ? data.enabled : true);
      }
    } catch (e) {
      console.error('Error fetching AI config:', e);
    }
  };

  const fetchDatabaseStatus = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      if (!token) {
        return;
      }
      
      const res = await fetch(`${API_BASE_URL}/api/superadmin/db-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setDbStatus(data);
      }
    } catch (e) {
      console.error('Error fetching database status:', e);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      if (!token) {
        return;
      }
      
      const res = await fetch(`${API_BASE_URL}/api/superadmin/system-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setSystemStatus(data);
      }
    } catch (e) {
      console.error('Error fetching system status:', e);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      if (!token) return;
      
      const res = await fetch(`${API_BASE_URL}/api/superadmin/system-metrics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setSystemMetrics(data.metrics);
        setServerUptime(data.uptime);
      }
    } catch (e) {
      console.error('Error fetching system metrics:', e);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      if (!token) return;
      
      const res = await fetch(`${API_BASE_URL}/api/superadmin/recent-activities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setRecentActivities(data.activities || []);
      }
    } catch (e) {
      console.error('Error fetching recent activities:', e);
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      if (!token) return;
      
      const res = await fetch(`${API_BASE_URL}/api/superadmin/security-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setSecurityLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Error fetching security logs:', e);
    }
  };

  const fetchBackupStatus = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      if (!token) return;
      
      const res = await fetch(`${API_BASE_URL}/api/superadmin/backup-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setBackupStatus(data);
      }
    } catch (e) {
      console.error('Error fetching backup status:', e);
    }
  };

  const fetchErrorLogs = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      if (!token) return;
      
      const res = await fetch(`${API_BASE_URL}/api/superadmin/error-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setErrorLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Error fetching error logs:', e);
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`${API_BASE_URL}/api/superadmin/maintenance-mode`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !maintenanceMode })
      });
      
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setMaintenanceMode(!maintenanceMode);
        toast.success(
          <div className="toast-content">
            <FiCheckCircle className="toast-icon success" />
            <span>Maintenance mode {!maintenanceMode ? 'diaktifkan' : 'dinonaktifkan'}</span>
          </div>
        );
      }
    } catch (e) {
      console.error('Error toggling maintenance mode:', e);
      toast.error(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Ralat mengubah maintenance mode</span>
        </div>
      );
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const saveAIKey = async () => {
    if (!aiKeyInput || aiKeyInput.length < 8) {
      toast(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Masukkan API key yang sah</span>
        </div>
      );
      return;
    }
    
    const token = localStorage.getItem('superAdminToken');
    if (!token) {
      toast(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Sila log masuk sebagai SuperAdmin terlebih dahulu</span>
        </div>
      );
      navigate('/superadmin/login');
      return;
    }
    
    setSavingKey(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/superadmin/ai-config`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: aiKeyInput })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText}. ${text?.slice(0,120)}`);
      }
      const data = await res.json().catch(() => null);
      if (data.success) {
        toast.success(
          <div className="toast-content">
            <FiCheckCircle className="toast-icon success" />
            <span>API key dikemas kini</span>
          </div>
        );
        setAiKeyInput('');
        fetchAIConfig();
        fetchHealth();
      } else {
        toast(
          <div className="toast-content">
            <FiAlertCircle className="toast-icon error" />
            <span>{data.message || 'Gagal mengemas kini API key'}</span>
          </div>
        );
      }
    } catch (e) {
      console.error('Save AI key error:', e);
      toast(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Ralat semasa menyimpan: {String(e.message || e)}</span>
        </div>
      );
    } finally {
      setSavingKey(false);
    }
  };

  const testAIConnection = async () => {
    setTestingAI(true);
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`${API_BASE_URL}/api/superadmin/ai-test`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => null);
      if (data?.success) {
        if (data.reachable) {
          toast.success(
            <div className="toast-content">
              <FiCheckCircle className="toast-icon success" />
              <span>{data.message || 'Sambungan AI berjaya'}</span>
            </div>
          );
        } else {
          toast(
            <div className="toast-content">
              <FiAlertCircle className="toast-icon error" />
              <span>{data.message || 'Sambungan AI gagal'}</span>
            </div>
          );
        }
      }
      fetchHealth();
    } catch (e) {
      console.error('AI test error:', e);
    } finally {
      setTestingAI(false);
    }
  };

  const toggleAIAccess = async () => {
    setTogglingAccess(true);
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`${API_BASE_URL}/api/superadmin/ai-config`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !aiAccessEnabled })
      });
      
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText}. ${text?.slice(0,120)}`);
      }
      
      const data = await res.json().catch(() => null);
      if (data.success) {
        setAiAccessEnabled(!aiAccessEnabled);
        toast.success(
          <div className="toast-content">
            <FiCheckCircle className="toast-icon success" />
            <span>Capaian AI {!aiAccessEnabled ? 'diaktifkan' : 'dinonaktifkan'}</span>
          </div>
        );
        fetchAIConfig();
        fetchHealth();
      } else {
        toast(
          <div className="toast-content">
            <FiAlertCircle className="toast-icon error" />
            <span>{data.message || 'Gagal mengubah capaian AI'}</span>
          </div>
        );
      }
    } catch (e) {
      console.error('Toggle AI access error:', e);
      toast(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Ralat semasa mengubah capaian AI: {String(e.message || e)}</span>
        </div>
      );
    } finally {
      setTogglingAccess(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_BASE_URL}/api/superadmin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error(
          <div className="toast-content">
            <FiAlertCircle className="toast-icon error" />
            <span>Ralat memuatkan statistik</span>
          </div>
        );
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Ralat memuatkan statistik</span>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: userStatus
      });
      
      const response = await fetch(`${API_BASE_URL}/api/superadmin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        toast.error(
          <div className="toast-content">
            <FiAlertCircle className="toast-icon error" />
            <span>Ralat memuatkan senarai pengguna</span>
          </div>
        );
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Ralat memuatkan senarai pengguna</span>
        </div>
      );
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_BASE_URL}/api/superadmin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
        
        // Show success toast with appropriate styling
        if (data.user.isActive) {
          toast.success(
            <div className="toast-content">
              <FiCheckCircle className="toast-icon success" />
              <span>{data.message}</span>
            </div>,
            {
              duration: 4000,
              style: {
                background: '#f0fff4',
                color: '#22543d',
                border: '1px solid #68d391'
              }
            }
          );
        } else {
          toast.error(
            <div className="toast-content">
              <FiXCircle className="toast-icon error" />
              <span>{data.message}</span>
            </div>,
            {
              duration: 4000,
              style: {
                background: '#fed7d7',
                color: '#c53030',
                border: '1px solid #fc8181'
              }
            }
          );
        }
      } else {
        toast.error(
          <div className="toast-content">
            <FiAlertCircle className="toast-icon error" />
            <span>{data.message}</span>
          </div>,
          {
            duration: 4000,
            style: {
              background: '#fed7d7',
              color: '#c53030',
              border: '1px solid #fc8181'
            }
          }
        );
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Ralat semasa mengubah status pengguna</span>
        </div>,
        {
          duration: 4000,
          style: {
            background: '#fed7d7',
            color: '#c53030',
            border: '1px solid #fc8181'
          }
        }
      );
    }
  };

  const deleteUser = async (userId) => {
    // Find user details for confirmation
    const user = users.find(u => u._id === userId);
    const userName = user ? user.fullName : 'pengguna ini';
    
    if (!window.confirm(`Adakah anda pasti ingin memadam ${userName}? Tindakan ini tidak boleh dibatalkan.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_BASE_URL}/api/superadmin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
        
        toast.success(
          <div className="toast-content">
            <FiCheckCircle className="toast-icon success" />
            <span>{data.message}</span>
          </div>,
          {
            duration: 4000,
            style: {
              background: '#f0fff4',
              color: '#22543d',
              border: '1px solid #68d391'
            }
          }
        );
      } else {
        toast.error(
          <div className="toast-content">
            <FiAlertCircle className="toast-icon error" />
            <span>{data.message}</span>
          </div>,
          {
            duration: 4000,
            style: {
              background: '#fed7d7',
              color: '#c53030',
              border: '1px solid #fc8181'
            }
          }
        );
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Ralat semasa memadam pengguna</span>
        </div>,
        {
          duration: 4000,
          style: {
            background: '#fed7d7',
            color: '#c53030',
            border: '1px solid #fc8181'
          }
        }
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdmin');
    navigate('/superadmin/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Overview Section Component
  const OverviewSection = () => (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jumlah Pengguna</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.users?.total || 0}</p>
              <div className="flex items-center mt-2">
                <FiCheckCircle className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-gray-500">{stats?.users?.active || 0} aktif</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Total Invoices Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jumlah Invois</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.documents?.totalInvoices || 0}</p>
              <div className="flex items-center mt-2">
                <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-gray-500">{stats?.documents?.recentInvoices || 0} bulan ini</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <FiFileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jumlah Pendapatan</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.revenue?.total || 0)}</p>
              <div className="flex items-center mt-2">
                <FiDollarSign className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-gray-500">{formatCurrency(stats?.revenue?.paid || 0)} dibayar</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* System Status Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status Sistem</p>
              <p className="text-2xl font-bold text-green-600">Aktif</p>
              <div className="flex items-center mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-gray-500">
                  {serverUptime ? formatUptime(serverUptime) : 'Semua perkhidmatan normal'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <FiCpu className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional System Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Server Uptime */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Server Uptime</p>
              <p className="text-2xl font-bold text-gray-900">
                {serverUptime ? formatUptime(serverUptime) : 'N/A'}
              </p>
              <div className="flex items-center mt-2">
                <FiClock className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-sm text-gray-500">Masa aktif</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FiClock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* CPU Usage */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CPU Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {systemMetrics?.cpu ? `${systemMetrics.cpu}%` : 'N/A'}
              </p>
              <div className="flex items-center mt-2">
                <FiCpu className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-sm text-gray-500">Penggunaan CPU</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <FiCpu className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {systemMetrics?.memory ? formatBytes(systemMetrics.memory) : 'N/A'}
              </p>
              <div className="flex items-center mt-2">
                <FiDatabase className="w-4 h-4 text-purple-500 mr-1" />
                <span className="text-sm text-gray-500">Penggunaan RAM</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FiDatabase className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Error Count */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ralat Terkini</p>
              <p className="text-2xl font-bold text-gray-900">{errorLogs.length}</p>
              <div className="flex items-center mt-2">
                <FiAlertCircle className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-sm text-gray-500">Log ralat</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <FiAlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Analisis Pendapatan</h3>
            <FiDollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <FiCheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Dibayar</p>
                  <p className="text-sm text-gray-500">{formatCurrency(stats?.revenue?.paid || 0)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  {stats?.revenue?.total > 0 ? Math.round((stats.revenue.paid / stats.revenue.total) * 100) : 0}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
                  <FiClock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Belum Dibayar</p>
                  <p className="text-sm text-gray-500">{formatCurrency(stats?.revenue?.pending || 0)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-yellow-600">
                  {stats?.revenue?.total > 0 ? Math.round((stats.revenue.pending / stats.revenue.total) * 100) : 0}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                  <FiAlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Overdue</p>
                  <p className="text-sm text-gray-500">{formatCurrency(stats?.revenue?.overdue || 0)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">
                  {stats?.revenue?.total > 0 ? Math.round((stats.revenue.overdue / stats.revenue.total) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Status Sistem</h3>
            <FiCpu className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                <div>
                  <p className="font-medium text-gray-900">Sistem Aktif</p>
                  <p className="text-sm text-gray-500">Semua perkhidmatan berjalan normal</p>
                </div>
              </div>
              <FiCheckCircle className="w-5 h-5 text-green-500" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                <div>
                  <p className="font-medium text-gray-900">Database</p>
                  <p className="text-sm text-gray-500">Sambungan database stabil</p>
                </div>
              </div>
              <FiDatabase className="w-5 h-5 text-green-500" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                <div>
                  <p className="font-medium text-gray-900">API Services</p>
                  <p className="text-sm text-gray-500">Semua API berfungsi dengan baik</p>
                </div>
              </div>
              <FiActivity className="w-5 h-5 text-green-500" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                <div>
                  <p className="font-medium text-gray-900">AI Services</p>
                  <p className="text-sm text-gray-500">
                    {aiConfig?.configured ? 'AI dikonfigurasi' : 'AI belum dikonfigurasi'}
                  </p>
                </div>
              </div>
              <FiCpu className="w-5 h-5 text-blue-500" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3 animate-pulse"></div>
                <div>
                  <p className="font-medium text-gray-900">Backup Status</p>
                  <p className="text-sm text-gray-500">
                    {backupStatus?.status === 'success' ? 'Backup berjaya' : 'Backup tidak tersedia'}
                  </p>
                </div>
              </div>
              <FiShield className="w-5 h-5 text-purple-500" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3 animate-pulse"></div>
                <div>
                  <p className="font-medium text-gray-900">Maintenance Mode</p>
                  <p className="text-sm text-gray-500">
                    {maintenanceMode ? 'Aktif - Sistem dalam penyelenggaraan' : 'Tidak aktif - Sistem normal'}
                  </p>
                </div>
              </div>
              <FiSettings className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Metrik Sistem</h3>
            <FiActivity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <FiCpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">CPU Usage</p>
                  <p className="text-sm text-gray-500">
                    {systemMetrics?.cpu ? `${systemMetrics.cpu}%` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-blue-500 rounded-full" 
                    style={{ width: `${systemMetrics?.cpu || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <FiDatabase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Memory Usage</p>
                  <p className="text-sm text-gray-500">
                    {systemMetrics?.memory ? formatBytes(systemMetrics.memory) : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-purple-500 rounded-full" 
                    style={{ width: `${systemMetrics?.memoryPercent || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                  <FiDatabase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Disk Usage</p>
                  <p className="text-sm text-gray-500">
                    {systemMetrics?.disk ? formatBytes(systemMetrics.disk) : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-orange-500 rounded-full" 
                    style={{ width: `${systemMetrics?.diskPercent || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <FiActivity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Load Average</p>
                  <p className="text-sm text-gray-500">
                    {systemMetrics?.loadAverage || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-green-500 rounded-full" 
                    style={{ width: `${Math.min((systemMetrics?.loadAverage || 0) * 20, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                  <FiClock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Process Count</p>
                  <p className="text-sm text-gray-500">
                    {systemMetrics?.processCount || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-indigo-500 rounded-full" 
                    style={{ width: `${Math.min((systemMetrics?.processCount || 0) * 2, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities Overview */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Aktiviti Terkini</h3>
            <FiActivity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivities.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action || 'Unknown Action'}</p>
                  <p className="text-xs text-gray-500">
                    {activity.user || 'System'} • {activity.timestamp ? formatDate(activity.timestamp) : 'Unknown Time'}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Tiada aktiviti terkini</p>
            )}
          </div>
        </div>

        {/* Security & Error Overview */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Keselamatan & Ralat</h3>
            <FiShield className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                  <FiAlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Ralat Terkini</p>
                  <p className="text-sm text-gray-500">{errorLogs.length} ralat</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">{errorLogs.length}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
                  <FiShield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Log Keselamatan</p>
                  <p className="text-sm text-gray-500">{securityLogs.length} log</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-yellow-600">{securityLogs.length}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <FiCheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Status Backup</p>
                  <p className="text-sm text-gray-500">
                    {backupStatus?.status === 'success' ? 'Berjaya' : 'Tidak tersedia'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${backupStatus?.status === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
                  {backupStatus?.status === 'success' ? 'OK' : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Users Section Component
  const UsersSection = () => (
    <div className="users-section">
      <div className="users-header">
        <div className="users-title">
          <FiUsers className="icon-md" />
          <div>
            <h2>Pengurusan Pengguna</h2>
            <p>Kelola dan pantau semua pengguna sistem</p>
          </div>
        </div>
        <div className="users-controls">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Cari pengguna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <FiFilter className="filter-icon" />
            <select
              value={userStatus}
              onChange={(e) => setUserStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
          <button 
            className="add-user-btn"
            onClick={() => {
              toast.success(
                <div className="toast-content">
                  <FiPlus className="toast-icon info" />
                  <span>Fungsi tambah pengguna akan datang</span>
                </div>
              );
            }}
            title="Tambah pengguna baru"
          >
            <FiPlus className="icon-sm" />
            <span>Tambah Pengguna</span>
          </button>
          <button 
            className="refresh-users-btn"
            onClick={() => {
              fetchUsers();
              toast.success(
                <div className="toast-content">
                  <FiRefreshCw className="toast-icon info" />
                  <span>Senarai pengguna dimuat semula</span>
                </div>
              );
            }}
            title="Muat semula senarai pengguna"
          >
            <FiRefreshCw className="icon-sm" />
            <span>Muat Semula</span>
          </button>
        </div>
      </div>

      {/* Users Statistics */}
      {stats && (
        <div className="users-stats">
          <div className="stat-item">
            <div className="stat-icon">
              <FiUsers className="icon-sm" />
            </div>
            <div className="stat-content">
              <span className="stat-number">{stats.users.total}</span>
              <span className="stat-label">Jumlah Pengguna</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon active">
              <FiCheckCircle className="icon-sm" />
            </div>
            <div className="stat-content">
              <span className="stat-number">{stats.users.active}</span>
              <span className="stat-label">Aktif</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon inactive">
              <FiXCircle className="icon-sm" />
            </div>
            <div className="stat-content">
              <span className="stat-number">{stats.users.total - stats.users.active}</span>
              <span className="stat-label">Tidak Aktif</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon recent">
              <FiClock className="icon-sm" />
            </div>
            <div className="stat-content">
              <span className="stat-number">{stats.users.recent}</span>
              <span className="stat-label">Baru Bulan Ini</span>
            </div>
          </div>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Syarikat</th>
              <th>Status</th>
              <th>Tarikh Daftar</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.fullName}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.company || '-'}</td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn toggle"
                      onClick={() => toggleUserStatus(user._id)}
                      title={user.isActive ? 'Nyahaktifkan' : 'Aktifkan'}
                    >
                      {user.isActive ? <FiToggleRight className="icon-sm" /> : <FiToggleLeft className="icon-sm" />}
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => deleteUser(user._id)}
                      title="Padam"
                    >
                      <FiTrash2 className="icon-sm" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="pagination-btn"
          >
            <FiChevronLeft className="icon-sm" />
            <span>Sebelum</span>
          </button>
          <div className="pagination-info">
            <span>Halaman {currentPage} dari {pagination.pages}</span>
          </div>
          <button
            disabled={currentPage === pagination.pages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="pagination-btn"
          >
            <span>Seterusnya</span>
            <FiChevronRight className="icon-sm" />
          </button>
        </div>
      )}
    </div>
  );

  // Settings Section Component
  const SettingsSection = () => (
    <div className="settings-section">
      <div className="settings-header">
        <FiSettings className="icon-md" />
        <h2>Tetapan Sistem</h2>
      </div>
      <div className="settings-grid">
        {/* Maklumat Sistem & Database */}
        <div className="setting-card">
          <div className="setting-card-header">
            <FiDatabase className="icon-md" />
            <h3>Maklumat Sistem</h3>
          </div>
          <div className="setting-item">
            <FiCpu className="icon-sm" />
            <span>Versi: 1.0.0</span>
          </div>
          <div className="setting-item">
            <FiCheckCircle className="icon-sm" />
            <span>Status Sistem: {systemStatus?.active ? 'Aktif' : 'Tidak Aktif'}</span>
            <span className={`ml-2 status-indicator ${systemStatus?.active ? 'online' : 'offline'}`}>
              {systemStatus?.active ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="setting-item">
            <FiDatabase className="icon-sm" />
            <span>Database: {dbStatus?.connected ? 'Connected' : 'Disconnected'}</span>
            <span className={`ml-2 status-indicator ${dbStatus?.connected ? 'online' : 'offline'}`}>
              {dbStatus?.connected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="setting-item">
            <FiDatabase className="icon-sm" />
            <span>DB Host: {dbStatus?.host || health?.services?.database?.host || '-'}</span>
          </div>
          <div className="setting-item">
            <FiDatabase className="icon-sm" />
            <span>DB Name: {dbStatus?.name || health?.services?.database?.name || '-'}</span>
          </div>
          <div className="setting-item">
            <FiDatabase className="icon-sm" />
            <span>DB Port: {dbStatus?.port || health?.services?.database?.port || '-'}</span>
          </div>
          <div className="setting-item">
            <FiDatabase className="icon-sm" />
            <span>Connection Time: {dbStatus?.connectionTime ? `${dbStatus.connectionTime}ms` : '-'}</span>
          </div>
          <div className="setting-item">
            <FiClock className="icon-sm" />
            <span>Server Uptime: {serverUptime ? formatUptime(serverUptime) : '-'}</span>
          </div>
          <div className="setting-item">
            <FiRefreshCw className="icon-sm" />
            <button onClick={() => { 
              fetchHealth(); 
              fetchDatabaseStatus(); 
              fetchSystemStatus();
              fetchSystemMetrics();
              toast(<div className="toast-content"><FiRefreshCw className="toast-icon info" /><span>Status dimuat semula</span></div>); 
            }} className="px-3 py-1 text-sm rounded-lg border bg-white hover:bg-gray-50">
              Muat Semula Status
            </button>
          </div>
        </div>

        {/* System Performance */}
        <div className="setting-card">
          <div className="setting-card-header">
            <FiActivity className="icon-md" />
            <h3>Prestasi Sistem</h3>
          </div>
          <div className="setting-item">
            <FiCpu className="icon-sm" />
            <span>CPU Usage: {systemMetrics?.cpu ? `${systemMetrics.cpu}%` : 'N/A'}</span>
            <div className="w-20 h-2 bg-gray-200 rounded-full ml-2">
              <div 
                className="h-2 bg-blue-500 rounded-full" 
                style={{ width: `${systemMetrics?.cpu || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="setting-item">
            <FiDatabase className="icon-sm" />
            <span>Memory: {systemMetrics?.memory ? formatBytes(systemMetrics.memory) : 'N/A'}</span>
            <div className="w-20 h-2 bg-gray-200 rounded-full ml-2">
              <div 
                className="h-2 bg-purple-500 rounded-full" 
                style={{ width: `${systemMetrics?.memoryPercent || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="setting-item">
            <FiDatabase className="icon-sm" />
            <span>Disk: {systemMetrics?.disk ? formatBytes(systemMetrics.disk) : 'N/A'}</span>
            <div className="w-20 h-2 bg-gray-200 rounded-full ml-2">
              <div 
                className="h-2 bg-orange-500 rounded-full" 
                style={{ width: `${systemMetrics?.diskPercent || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="setting-item">
            <FiActivity className="icon-sm" />
            <span>Load Average: {systemMetrics?.loadAverage || 'N/A'}</span>
          </div>
          <div className="setting-item">
            <FiClock className="icon-sm" />
            <span>Process Count: {systemMetrics?.processCount || 'N/A'}</span>
          </div>
        </div>

        {/* Backup & Maintenance */}
        <div className="setting-card">
          <div className="setting-card-header">
            <FiShield className="icon-md" />
            <h3>Backup & Maintenance</h3>
          </div>
          <div className="setting-item">
            <FiShield className="icon-sm" />
            <span>Last Backup: {backupStatus?.lastBackup ? formatDate(backupStatus.lastBackup) : 'N/A'}</span>
          </div>
          <div className="setting-item">
            <FiDatabase className="icon-sm" />
            <span>Backup Size: {backupStatus?.size ? formatBytes(backupStatus.size) : 'N/A'}</span>
          </div>
          <div className="setting-item">
            <FiCheckCircle className="icon-sm" />
            <span>Backup Status: {backupStatus?.status || 'Unknown'}</span>
            <span className={`ml-2 status-indicator ${backupStatus?.status === 'success' ? 'online' : 'offline'}`}>
              {backupStatus?.status === 'success' ? 'SUCCESS' : 'FAILED'}
            </span>
          </div>
          <div className="setting-item">
            <FiSettings className="icon-sm" />
            <div className="flex items-center gap-2">
              <span>Maintenance Mode:</span>
              <button
                onClick={toggleMaintenanceMode}
                className={`px-3 py-1 text-sm rounded-lg border ${
                  maintenanceMode 
                    ? 'bg-red-100 text-red-700 border-red-300' 
                    : 'bg-green-100 text-green-700 border-green-300'
                }`}
              >
                {maintenanceMode ? 'Aktif' : 'Tidak Aktif'}
              </button>
            </div>
          </div>
          <div className="setting-item">
            <FiRefreshCw className="icon-sm" />
            <button onClick={() => { 
              fetchBackupStatus();
              toast(<div className="toast-content"><FiRefreshCw className="toast-icon info" /><span>Status backup dimuat semula</span></div>); 
            }} className="px-3 py-1 text-sm rounded-lg border bg-white hover:bg-gray-50">
              Muat Semula Backup
            </button>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="setting-card">
          <div className="setting-card-header">
            <FiCpu className="icon-md" />
            <h3>AI Configuration</h3>
          </div>
          
          {/* AI Access Toggle */}
          <div className="setting-item">
            <div className="ai-toggle-container">
              <div className="ai-toggle-info">
                <FiActivity className="icon-sm" />
                <div>
                  <span className="ai-toggle-label">Capaian AI</span>
                  <p className="ai-toggle-description">Aktifkan/nyahaktifkan semua fungsi AI</p>
                </div>
              </div>
              <button
                onClick={toggleAIAccess}
                disabled={togglingAccess}
                className={`ai-toggle-switch ${aiAccessEnabled ? 'enabled' : 'disabled'}`}
              >
                <span className={`ai-toggle-thumb ${aiAccessEnabled ? 'enabled' : 'disabled'}`} />
              </button>
            </div>
          </div>
          
          <div className="setting-item">
            <FiShield className="icon-sm" />
            <span>Groq API: {(aiConfig?.configured ?? health?.services?.ai?.configured) ? 'Configured' : 'Not Configured'}</span>
          </div>
          <div className="setting-item">
            <FiCpu className="icon-sm" />
            <span>Model: {health?.services?.ai?.model || aiConfig?.model || 'llama-3.1-8b-instant'}</span>
          </div>
          <div className="setting-item"><FiActivity className="icon-sm" /><span>Reachable: {health?.services?.ai?.reachable ? 'Yes' : 'No'}</span></div>
          <div className="setting-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiShield className="icon-sm" />
            <span>Kunci Semasa: {aiConfig?.maskedKey || '-'}</span>
          </div>
          <div className="setting-item">
            <div className="w-full">
              <label className="block text-sm text-gray-700 mb-1">Kemas Kini Groq API Key</label>
              <div className="flex gap-2">
                <input type={showApiKey ? 'text' : 'password'} value={aiKeyInput} onChange={(e) => setAiKeyInput(e.target.value)} placeholder="Masukkan API key baharu" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:ring-red-400" />
                <button onClick={() => setShowApiKey((s) => !s)} type="button" className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
                  {showApiKey ? <FiEyeOff className="icon-sm" /> : <FiEye className="icon-sm" />}
                </button>
                <button onClick={saveAIKey} disabled={savingKey} className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-sm">
                  {savingKey ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
          <div className="setting-item">
            <button onClick={testAIConnection} disabled={testingAI} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm">
              {testingAI ? 'Menguji...' : 'Uji Sambungan AI'}
            </button>
          </div>
        </div>

        {/* Recent Activities & Logs */}
        <div className="setting-card">
          <div className="setting-card-header">
            <FiActivity className="icon-md" />
            <h3>Aktiviti & Log Terkini</h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivities.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action || 'Unknown Action'}</p>
                  <p className="text-xs text-gray-500">
                    {activity.user || 'System'} • {activity.timestamp ? formatDate(activity.timestamp) : 'Unknown Time'}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Tiada aktiviti terkini</p>
            )}
          </div>
          <div className="setting-item">
            <FiRefreshCw className="icon-sm" />
            <button onClick={() => { 
              fetchRecentActivities();
              toast(<div className="toast-content"><FiRefreshCw className="toast-icon info" /><span>Aktiviti dimuat semula</span></div>); 
            }} className="px-3 py-1 text-sm rounded-lg border bg-white hover:bg-gray-50">
              Muat Semula Aktiviti
            </button>
          </div>
        </div>

        {/* Security Logs */}
        <div className="setting-card">
          <div className="setting-card-header">
            <FiShield className="icon-md" />
            <h3>Log Keselamatan</h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {securityLogs.slice(0, 5).map((log, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  log.level === 'error' ? 'bg-red-500' : 
                  log.level === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{log.message || 'Unknown Event'}</p>
                  <p className="text-xs text-gray-500">
                    {log.level?.toUpperCase() || 'INFO'} • {log.timestamp ? formatDate(log.timestamp) : 'Unknown Time'}
                  </p>
                </div>
              </div>
            ))}
            {securityLogs.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Tiada log keselamatan</p>
            )}
          </div>
          <div className="setting-item">
            <FiRefreshCw className="icon-sm" />
            <button onClick={() => { 
              fetchSecurityLogs();
              toast(<div className="toast-content"><FiRefreshCw className="toast-icon info" /><span>Log keselamatan dimuat semula</span></div>); 
            }} className="px-3 py-1 text-sm rounded-lg border bg-white hover:bg-gray-50">
              Muat Semula Log
            </button>
          </div>
        </div>

        {/* Error Logs */}
        <div className="setting-card">
          <div className="setting-card-header">
            <FiAlertCircle className="icon-md" />
            <h3>Log Ralat</h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {errorLogs.slice(0, 5).map((log, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{log.error || 'Unknown Error'}</p>
                  <p className="text-xs text-gray-500">
                    {log.timestamp ? formatDate(log.timestamp) : 'Unknown Time'}
                  </p>
                </div>
              </div>
            ))}
            {errorLogs.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Tiada ralat terkini</p>
            )}
          </div>
          <div className="setting-item">
            <FiRefreshCw className="icon-sm" />
            <button onClick={() => { 
              fetchErrorLogs();
              toast(<div className="toast-content"><FiRefreshCw className="toast-icon info" /><span>Log ralat dimuat semula</span></div>); 
            }} className="px-3 py-1 text-sm rounded-lg border bg-white hover:bg-gray-50">
              Muat Semula Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="superadmin-dashboard">
        <div className="loading-container">
          <FiRefreshCw className="loading-icon icon-md" />
          <p>Memuatkan data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-red-50 to-orange-100">
      {/* CSS Animations */}
      <style>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        @keyframes refreshPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .refresh-pulse {
          animation: refreshPulse 1s ease-in-out infinite;
        }
      `}</style>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard <span className="text-red-600">SuperAdmin</span>
              </h1>
              <p className="text-lg text-gray-600">
                Sistem pengurusan invois - Pantau dan kelola keseluruhan sistem
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString('ms-MY', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiShield className="w-4 h-4" />
                  <span>SuperAdmin Access</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiActivity className="w-4 h-4" />
                  <span>{stats?.users?.total || 0} pengguna aktif</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiClock className="w-4 h-4" />
                  <span>Uptime: {serverUptime ? formatUptime(serverUptime) : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiCpu className="w-4 h-4" />
                  <span>CPU: {systemMetrics?.cpu ? `${systemMetrics.cpu}%` : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiDatabase className="w-4 h-4" />
                  <span>RAM: {systemMetrics?.memory ? formatBytes(systemMetrics.memory) : 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  fetchStats();
                  fetchUsers();
                  fetchSystemMetrics();
                  fetchRecentActivities();
                  fetchSecurityLogs();
                  fetchErrorLogs();
                  toast.success(
                    <div className="toast-content">
                      <FiRefreshCw className="toast-icon info" />
                      <span>Semua data dimuat semula</span>
                    </div>
                  );
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                title="Muat semula semua data"
              >
                <FiRefreshCw className="w-5 h-5 text-gray-600" />
                <span>Muat Semula Semua</span>
              </button>
              
              <button
                onClick={() => {
                  fetchSystemMetrics();
                  fetchHealth();
                  toast.success(
                    <div className="toast-content">
                      <FiActivity className="toast-icon info" />
                      <span>Status sistem dimuat semula</span>
                    </div>
                  );
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                title="Muat semula status sistem"
              >
                <FiActivity className="w-5 h-5 text-blue-600" />
                <span>Status Sistem</span>
              </button>
              
              <button
                onClick={() => {
                  fetchRecentActivities();
                  fetchSecurityLogs();
                  fetchErrorLogs();
                  toast.success(
                    <div className="toast-content">
                      <FiShield className="toast-icon info" />
                      <span>Log dimuat semula</span>
                    </div>
                  );
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                title="Muat semula log"
              >
                <FiShield className="w-5 h-5 text-red-600" />
                <span>Log & Audit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="space-y-8">
          {activeTab === 'overview' && <OverviewSection />}
          {activeTab === 'users' && <UsersSection />}
          {activeTab === 'settings' && <SettingsSection />}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
