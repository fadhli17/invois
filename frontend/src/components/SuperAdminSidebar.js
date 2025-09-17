import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiLogOut, 
  FiX, 
  FiAlertTriangle, 
  FiHome, 
  FiFileText, 
  FiUser,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiBarChart2,
  FiSettings,
  FiHelpCircle,
  FiBell,
  FiSearch,
  FiSun,
  FiMoon,
  FiShield,
  FiActivity,
  FiDollarSign,
  FiDatabase,
  FiCpu,
  FiFilter,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiToggleLeft,
  FiToggleRight,
  FiTrash2,
  FiEdit,
  FiEye
} from 'react-icons/fi';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/superadmin/dashboard', 
    icon: FiHome
  },
  { 
    name: 'Pengurusan Pengguna', 
    href: '/superadmin/users', 
    icon: FiUsers
  },
  { 
    name: 'Dokumen Sistem', 
    href: '/superadmin/documents', 
    icon: FiFileText
  },
  { 
    name: 'Laporan', 
    href: '/superadmin/reports', 
    icon: FiBarChart2
  },
  { 
    name: 'Tetapan Sistem', 
    href: '/superadmin/settings', 
    icon: FiSettings
  },
];

const SuperAdminSidebar = ({ sidebarOpen, setSidebarOpen, collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], documents: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [systemStats, setSystemStats] = useState(null);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  // User Management States
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatus, setUserStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

  // Handle click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keep focus on input while typing (avoid losing focus on re-render)
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      // Only refocus if user has interacted with search before
      if (searchQuery.length > 0) {
        inputRef.current.focus({ preventScroll: true });
      }
    }
  }, [searchQuery, showSearchDropdown]);

  // Load theme setting from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      // ignore malformed theme setting
    }
  }, []);

  // Load system stats for notifications
  useEffect(() => {
    fetchSystemStats();
  }, []);

  // Load users when user management modal is opened
  useEffect(() => {
    if (showUserManagementModal) {
      fetchUsers();
    }
  }, [showUserManagementModal, userSearchTerm, userStatus, currentPage]);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Fetch system stats for notifications
  const fetchSystemStats = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await axios.get(`${API_BASE}/api/superadmin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSystemStats(response.data?.stats || null);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      setSystemStats(null);
    }
  };

  // Fetch users for user management
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem('superAdminToken');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: userSearchTerm,
        status: userStatus
      });
      
      const response = await axios.get(`${API_BASE}/api/superadmin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId) => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await axios.patch(`${API_BASE}/api/superadmin/users/${userId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        fetchUsers();
        fetchSystemStats();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    const user = users.find(u => u._id === userId);
    const userName = user ? user.fullName : 'pengguna ini';
    
    if (!window.confirm(`Adakah anda pasti ingin memadam ${userName}? Tindakan ini tidak boleh dibatalkan.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await axios.delete(`${API_BASE}/api/superadmin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        fetchUsers();
        fetchSystemStats();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdmin');
    navigate('/superadmin/login');
    setShowLogoutModal(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleSearch = (e, isDesktop = false) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      navigate(`/superadmin/users?search=${encodeURIComponent(query)}`);
      setShowSearchDropdown(false);
      if (!isDesktop) setSidebarOpen(false);
    }
  };

  const handleSearchInputChange = (e, isDesktop = false) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        performGlobalSearch(value.trim(), isDesktop);
      }, 300);
    } else {
      setSearchResults({ users: [], documents: [] });
      setShowSearchDropdown(false);
    }
  };

  const performGlobalSearch = async (query, isDesktop = false) => {
    if (query.length < 2) return;
    
    setIsSearching(true);
    try {
      // Search in both users and documents
      const token = localStorage.getItem('superAdminToken');
      const [usersRes, documentsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/superadmin/users`, { 
          params: { search: query, limit: 5 }, 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get(`${API_BASE}/api/superadmin/documents`, { 
          params: { search: query, limit: 5 }, 
          headers: { Authorization: `Bearer ${token}` } 
        }).catch(() => ({ data: { documents: [] } })) // Handle if documents endpoint doesn't exist
      ]);
      const users = usersRes.data?.users || [];
      const documents = documentsRes.data?.documents || [];
      setSearchResults({ users, documents });
      setShowSearchDropdown(users.length > 0 || documents.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ users: [], documents: [] });
      setShowSearchDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = (type, id, isDesktop = false) => {
    if (type === 'user') {
      navigate(`/superadmin/users?userId=${id}`);
    } else if (type === 'document') {
      navigate(`/superadmin/documents?documentId=${id}`);
    }
    setSearchQuery('');
    setShowSearchDropdown(false);
    if (!isDesktop) setSidebarOpen(false);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    setSearchResults({ users: [], documents: [] });
    setShowSearchDropdown(false);
  };

  const handleQuickAction = (action, isDesktop = false) => {
    switch (action) {
      case 'new-user':
        navigate('/superadmin/users/new');
        break;
      case 'view-reports':
        navigate('/superadmin/reports');
        break;
      default:
        break;
    }
    if (!isDesktop) setSidebarOpen(false);
  };

  const handleNotificationClick = async () => {
    setIsLoadingNotifications(true);
    await fetchSystemStats(); // Refresh system stats when opening modal
    setShowNotificationModal(true);
    setIsLoadingNotifications(false);
  };

  const handleHelpClick = () => {
    setShowHelpModal(true);
  };

  const closeNotificationModal = () => {
    setShowNotificationModal(false);
  };

  const closeHelpModal = () => {
    setShowHelpModal(false);
  };

  const handleUserManagementClick = () => {
    setShowUserManagementModal(true);
  };

  const closeUserManagementModal = () => {
    setShowUserManagementModal(false);
    setUserSearchTerm('');
    setUserStatus('all');
    setCurrentPage(1);
  };

  const SidebarContent = ({ isDesktop = false }) => (
    <div className={`flex flex-col h-full border-r shadow-sm transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-4 border-b transition-colors duration-200 ${
        isDarkMode 
          ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' 
          : 'border-gray-200 bg-gradient-to-r from-red-50 to-orange-50'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
            <FiShield className="text-white w-4 h-4" />
          </div>
          {(!isDesktop || !collapsed) && (
            <div>
              <h1 className={`font-semibold text-base transition-colors duration-200 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>SuperAdmin</h1>
            </div>
          )}
        </div>

        {isDesktop && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
            }`}
            title={collapsed ? 'Kembangkan' : 'Lipat'}
          >
            {collapsed ? (
              <FiChevronRight className="w-4 h-4" />
            ) : (
              <FiChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
        
        {!isDesktop && (
          <button
            onClick={() => setSidebarOpen(false)}
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
            }`}
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Bar */}
      {(!isDesktop || !collapsed) && (
        <div ref={searchRef} className={`px-3 py-3 border-b relative transition-colors duration-200 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <form onSubmit={(e) => handleSearch(e, isDesktop)} className="relative">
            <div className="relative">
              <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e, isDesktop)}
                placeholder="Cari pengguna, dokumen..."
                autoComplete="off"
                spellCheck={false}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setShowSearchDropdown(true);
                }}
                className={`w-full pl-9 pr-10 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400 focus:bg-gray-700' 
                    : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-white'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showSearchDropdown && (searchResults.users.length > 0 || searchResults.documents.length > 0) && (
            <div className={`absolute top-full left-3 right-3 mt-1 border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-200'
            }`}>
              {/* Users Results */}
              {searchResults.users.length > 0 && (
                <div className="p-2">
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-2 px-2 transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Pengguna ({searchResults.users.length})
                  </div>
                  {searchResults.users.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleSearchResultClick('user', user._id, isDesktop)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`font-medium transition-colors duration-200 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>{user.fullName}</div>
                      <div className={`text-xs transition-colors duration-200 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>{user.email}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Documents Results */}
              {searchResults.documents.length > 0 && (
                <div className="p-2">
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-2 px-2 transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Dokumen ({searchResults.documents.length})
                  </div>
                  {searchResults.documents.map((document) => (
                    <button
                      key={document._id}
                      onClick={() => handleSearchResultClick('document', document._id, isDesktop)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`font-medium transition-colors duration-200 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>{document.invoiceNumber || document.title}</div>
                      <div className={`text-xs transition-colors duration-200 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>{document.clientName || document.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isSearching && (
            <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                <span className="ml-2 text-sm text-gray-600">Mencari...</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => !isDesktop && setSidebarOpen(false)}
                className={({ isActive }) => {
                  const baseClasses = `group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    collapsed && isDesktop ? 'justify-center' : ''
                  }`;
                  
                  if (isActive) {
                    return `${baseClasses} bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm`;
                  }
                  
                  return `${baseClasses} transition-colors duration-200 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`;
                }}
                title={collapsed && isDesktop ? item.name : ''}
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex-shrink-0 ${collapsed && isDesktop ? 'mr-0' : 'mr-3'}`}>
                      <IconComponent className={`w-4 h-4 transition-colors duration-200 ${
                        isActive 
                          ? 'text-white' 
                          : isDarkMode 
                            ? 'text-gray-400 group-hover:text-gray-200' 
                            : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                    </div>
                    
                    {(!isDesktop || !collapsed) && (
                      <span className="truncate font-medium">
                        {item.name}
                      </span>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {collapsed && isDesktop && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                        {item.name}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Quick Actions */}
      {(!isDesktop || !collapsed) && (
        <div className="px-3 py-3 border-t border-gray-200">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tindakan Pantas
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/superadmin/users')}
                className="flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-lg hover:from-red-600 hover:to-orange-600 transition-all duration-200 shadow-sm"
                title="Pengurusan Pengguna"
              >
                <FiUsers className="w-3 h-3 mr-1" />
                Kelola Pengguna
              </button>
              <button
                onClick={() => handleQuickAction('view-reports', isDesktop)}
                className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Lihat Laporan"
              >
                <FiBarChart2 className="w-3 h-3 mr-1" />
                Laporan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Toggle */}
      {(!isDesktop || !collapsed) && (
        <div className={`px-3 py-2 border-b transition-colors duration-200 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              isDarkMode 
                ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title={isDarkMode ? 'Tukar ke mod cerah' : 'Tukar ke mod gelap'}
          >
            {isDarkMode ? (
              <FiSun className="w-4 h-4" />
            ) : (
              <FiMoon className="w-4 h-4" />
            )}
            {(!isDesktop || !collapsed) && (
              <span>{isDarkMode ? 'Mod Cerah' : 'Mod Gelap'}</span>
            )}
          </button>
        </div>
      )}
      
      {/* SuperAdmin Section */}
      <div className={`px-3 py-3 border-t transition-colors duration-200 ${
        isDarkMode 
          ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' 
          : 'border-gray-200 bg-gradient-to-r from-red-50 to-orange-50'
      }`}>
        <div className={`flex items-center ${collapsed && isDesktop ? 'flex-col space-y-2' : 'space-x-3'}`}>
          <div className="flex-shrink-0 group relative">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-red-600 to-orange-600' 
                : 'bg-gradient-to-br from-red-200 to-orange-200'
            }`}>
              <FiShield className={`w-4 h-4 transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-red-700'
              }`} />
            </div>
            {collapsed && isDesktop && (
              <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                SuperAdmin
              </div>
            )}
          </div>
          {(!isDesktop || !collapsed) && (
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate transition-colors duration-200 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>SuperAdmin</p>
              <p className={`text-xs truncate transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Sistem Pengurusan</p>
            </div>
          )}
          <div className={`flex items-center space-x-1 ${collapsed && isDesktop ? 'flex-col space-y-1' : 'ml-auto'}`}>
            {/* Notifications */}
            <button
              onClick={handleNotificationClick}
              className={`group relative p-1.5 rounded-md transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
              }`}
              title="Notifikasi Sistem"
            >
              <FiBell className="w-4 h-4" />
              {/* Notification badge - show if there are system alerts */}
              {systemStats && systemStats.users && systemStats.users.inactive > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                  {systemStats.users.inactive > 9 ? '9+' : systemStats.users.inactive}
                </span>
              )}
              {collapsed && isDesktop && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                  Notifikasi Sistem
                </div>
              )}
            </button>

            {/* Help */}
            <button
              onClick={handleHelpClick}
              className={`group relative p-1.5 rounded-md transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-green-400 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
              }`}
              title="Bantuan"
            >
              <FiHelpCircle className="w-4 h-4" />
              {collapsed && isDesktop && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                  Bantuan
                </div>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogoutClick}
              className={`group relative p-1.5 rounded-md transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
              }`}
              title="Log Keluar"
            >
              <FiLogOut className="w-4 h-4" />
              {collapsed && isDesktop && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                  Log Keluar
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleCancelLogout}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Log Keluar</h3>
                  <p className="text-sm text-gray-500">Tindakan ini tidak boleh dibatalkan</p>
                </div>
              </div>
              <button
                onClick={handleCancelLogout}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  Adakah anda pasti mahu log keluar dari SuperAdmin?
                </p>
                <p className="text-sm text-gray-500">
                  Anda perlu log masuk semula untuk mengakses panel SuperAdmin.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
              >
                <FiLogOut className="w-4 h-4" />
                <span>Log Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeNotificationModal}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FiBell className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Notifikasi Sistem</h3>
                  <p className="text-sm text-gray-500">Pemberitahuan terkini</p>
                </div>
              </div>
              <button
                onClick={closeNotificationModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoadingNotifications ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Memuatkan notifikasi...</p>
                </div>
              ) : systemStats ? (
                <div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FiUsers className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900">
                          Jumlah Pengguna: {systemStats.users?.total || 0}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {systemStats.users?.active || 0} aktif
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FiFileText className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-900">
                          Jumlah Dokumen: {systemStats.documents?.totalInvoices || 0}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {systemStats.documents?.recentInvoices || 0} bulan ini
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FiDollarSign className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-gray-900">
                          Jumlah Pendapatan: RM{systemStats.revenue?.total?.toLocaleString() || 0}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        RM{systemStats.revenue?.paid?.toLocaleString() || 0} dibayar
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiBell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-700 mb-2">
                    Tiada notifikasi sistem
                  </p>
                  <p className="text-sm text-gray-500">
                    Sistem berjalan dengan normal.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={closeNotificationModal}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeHelpModal}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FiHelpCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Bantuan SuperAdmin</h3>
                  <p className="text-sm text-gray-500">Panduan penggunaan panel SuperAdmin</p>
                </div>
              </div>
              <button
                onClick={closeHelpModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiUsers className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Pengurusan Pengguna</h4>
                    <p className="text-sm text-gray-600">Lihat, aktifkan, nyahaktifkan atau padam pengguna sistem</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiFileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Dokumen Sistem</h4>
                    <p className="text-sm text-gray-600">Pantau semua dokumen yang dicipta oleh pengguna</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiBarChart2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Laporan & Analisis</h4>
                    <p className="text-sm text-gray-600">Lihat statistik dan analisis penggunaan sistem</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiSettings className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Tetapan Sistem</h4>
                    <p className="text-sm text-gray-600">Konfigurasi dan tetapan sistem</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={closeHelpModal}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Faham
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagementModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeUserManagementModal}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 transform transition-all duration-300 scale-100 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Pengurusan Pengguna</h3>
                  <p className="text-sm text-gray-500">Kelola dan pantau semua pengguna sistem</p>
                </div>
              </div>
              <button
                onClick={closeUserManagementModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Controls */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari pengguna..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="min-w-48">
                  <div className="relative">
                    <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={userStatus}
                      onChange={(e) => setUserStatus(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="all">Semua Status</option>
                      <option value="active">Aktif</option>
                      <option value="inactive">Tidak Aktif</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={fetchUsers}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  Muat Semula
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Syarikat</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarikh Daftar</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingUsers ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center">
                          <div className="flex items-center justify-center">
                            <FiRefreshCw className="w-4 h-4 animate-spin mr-2" />
                            Memuatkan pengguna...
                          </div>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                          Tiada pengguna ditemui
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-red-600 font-medium text-sm">
                                  {user.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.company || '-'}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(user.createdAt)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => toggleUserStatus(user._id)}
                                className={`p-1 rounded ${
                                  user.isActive 
                                    ? 'text-red-600 hover:bg-red-100' 
                                    : 'text-green-600 hover:bg-green-100'
                                }`}
                                title={user.isActive ? 'Nyahaktifkan' : 'Aktifkan'}
                              >
                                {user.isActive ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => deleteUser(user._id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Padam"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Halaman {currentPage} dari {pagination.pages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Sebelum
                    </button>
                    <button
                      disabled={currentPage === pagination.pages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Seterusnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-900/50 transition-opacity duration-200" 
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 transform transition-transform duration-200 ease-out">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-200 ease-in-out ${
        collapsed ? 'lg:w-14' : 'lg:w-64'
      }`}>
        <SidebarContent isDesktop={true} />
      </div>
    </>
  );
};

export default SuperAdminSidebar;
