import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
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
  FiMoon
} from 'react-icons/fi';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: FiHome
  },
  { 
    name: 'Dokumen', 
    href: '/invoices', 
    icon: FiFileText
  },
  { 
    name: 'Pelanggan', 
    href: '/customers', 
    icon: FiUsers
  },
  { 
    name: 'Laporan', 
    href: '/reports', 
    icon: FiBarChart2
  },
  { 
    name: 'Profile', 
    href: '/profile', 
    icon: FiUser
  },
  { 
    name: 'Tetapan', 
    href: '/settings', 
    icon: FiSettings
  },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen, collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ invoices: [], customers: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [draftInvoices, setDraftInvoices] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_BASE_URL || API_BASE_URL;

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

  // Load draft invoices for notifications
  useEffect(() => {
    fetchDraftInvoices();
  }, []);

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

  // Fetch draft invoices for notifications
  const fetchDraftInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/invoices`, {
        params: { status: 'draft', limit: 10 },
        headers: { Authorization: `Bearer ${token}` }
      });
      setDraftInvoices(response.data?.invoices || []);
    } catch (error) {
      console.error('Error fetching draft invoices:', error);
      setDraftInvoices([]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      navigate(`/invoices?search=${encodeURIComponent(query)}`);
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
      setSearchResults({ invoices: [], customers: [] });
      setShowSearchDropdown(false);
    }
  };

  const performGlobalSearch = async (query, isDesktop = false) => {
    if (query.length < 2) return;
    
    setIsSearching(true);
    try {
      // Search in both invoices and customers
      const token = localStorage.getItem('token');
      const [invoicesRes, customersRes] = await Promise.all([
        axios.get(`${API_BASE}/api/invoices`, { params: { search: query, limit: 5 }, headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/api/customers`, { params: { search: query, limit: 5 }, headers: { Authorization: `Bearer ${token}` } })
      ]);
      const invoices = invoicesRes.data?.invoices || [];
      const customers = customersRes.data?.customers || [];
      setSearchResults({ invoices, customers });
      setShowSearchDropdown(invoices.length > 0 || customers.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ invoices: [], customers: [] });
      setShowSearchDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = (type, id, isDesktop = false) => {
    if (type === 'invoice') {
      navigate(`/invoices/view/${id}`);
    } else if (type === 'customer') {
      navigate(`/customers/${id}`);
    }
    setSearchQuery('');
    setShowSearchDropdown(false);
    if (!isDesktop) setSidebarOpen(false);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    setSearchResults({ invoices: [], customers: [] });
    setShowSearchDropdown(false);
  };

  const handleQuickAction = (action, isDesktop = false) => {
    switch (action) {
      case 'new-invoice':
        navigate('/invoices/new');
        break;
      case 'new-customer':
        navigate('/customers/new');
        break;
      default:
        break;
    }
    if (!isDesktop) setSidebarOpen(false);
  };

  const handleNotificationClick = async () => {
    setIsLoadingNotifications(true);
    await fetchDraftInvoices(); // Refresh draft invoices when opening modal
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
          : 'border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs">SI</span>
          </div>
          {(!isDesktop || !collapsed) && (
            <div>
              <h1 className={`font-semibold text-base transition-colors duration-200 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>Sistem Dokumen</h1>
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
                placeholder="Cari dokumen, pelanggan..."
                autoComplete="off"
                spellCheck={false}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setShowSearchDropdown(true);
                }}
                className={`w-full pl-9 pr-10 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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
          {showSearchDropdown && (searchResults.invoices.length > 0 || searchResults.customers.length > 0) && (
            <div className={`absolute top-full left-3 right-3 mt-1 border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-200'
            }`}>
              {/* Invoices Results */}
              {searchResults.invoices.length > 0 && (
                <div className="p-2">
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-2 px-2 transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Dokumen ({searchResults.invoices.length})
                  </div>
                  {searchResults.invoices.map((invoice) => (
                    <button
                      key={invoice._id}
                      onClick={() => handleSearchResultClick('invoice', invoice._id, isDesktop)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`font-medium transition-colors duration-200 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>{invoice.invoiceNumber}</div>
                      <div className={`text-xs transition-colors duration-200 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>{invoice.clientName}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Customers Results */}
              {searchResults.customers.length > 0 && (
                <div className="p-2">
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-2 px-2 transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Pelanggan ({searchResults.customers.length})
                  </div>
                  {searchResults.customers.map((customer) => (
                    <button
                      key={customer._id}
                      onClick={() => handleSearchResultClick('customer', customer._id, isDesktop)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`font-medium transition-colors duration-200 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>{customer.name}</div>
                      <div className={`text-xs transition-colors duration-200 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>{customer.email}</div>
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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
                    return `${baseClasses} bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm`;
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
                onClick={() => handleQuickAction('new-invoice', isDesktop)}
                className="flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-sm"
                title="Cipta Dokumen Baru"
              >
                <FiPlus className="w-3 h-3 mr-1" />
                Dokumen Baru
              </button>
              <button
                onClick={() => handleQuickAction('new-customer', isDesktop)}
                className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Tambah Pelanggan Baru"
              >
                <FiUsers className="w-3 h-3 mr-1" />
                Pelanggan
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
      
      {/* User Section */}
      <div className={`px-3 py-3 border-t transition-colors duration-200 ${
        isDarkMode 
          ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' 
          : 'border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100'
      }`}>
        <div className={`flex items-center ${collapsed && isDesktop ? 'flex-col space-y-2' : 'space-x-3'}`}>
          <div className="flex-shrink-0 group relative">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-600 to-gray-500' 
                : 'bg-gradient-to-br from-gray-200 to-gray-300'
            }`}>
              <span className={`font-semibold text-xs transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            {collapsed && isDesktop && (
              <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                {user?.fullName || 'Pengguna'} @{user?.username}
              </div>
            )}
          </div>
          {(!isDesktop || !collapsed) && (
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate transition-colors duration-200 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>{user?.fullName}</p>
              <p className={`text-xs truncate transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>@{user?.username}</p>
            </div>
          )}
          <div className={`flex items-center space-x-1 ${collapsed && isDesktop ? 'flex-col space-y-1' : 'ml-auto'}`}>
            {/* Notifications */}
            <button
              onClick={handleNotificationClick}
              className={`group relative p-1.5 rounded-md transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="Notifikasi"
            >
              <FiBell className="w-4 h-4" />
              {/* Notification badge - show only if there are draft invoices */}
              {draftInvoices.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                  {draftInvoices.length > 9 ? '9+' : draftInvoices.length}
                </span>
              )}
              {collapsed && isDesktop && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                  Notifikasi {draftInvoices.length > 0 && `(${draftInvoices.length})`}
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
                  Adakah anda pasti mahu log keluar dari sistem?
                </p>
                <p className="text-sm text-gray-500">
                  Anda perlu log masuk semula untuk mengakses akaun anda.
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
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiBell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Notifikasi</h3>
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Memuatkan notifikasi...</p>
                </div>
              ) : draftInvoices.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Dokumen Draf ({draftInvoices.length})
                    </h4>
                    <span className="text-sm text-gray-500">
                      Perlu diselesaikan
                    </span>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {draftInvoices.map((invoice) => (
                      <div
                        key={invoice._id}
                        className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer"
                        onClick={() => {
                          navigate(`/invoices/edit/${invoice._id}`);
                          setShowNotificationModal(false);
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <FiFileText className="w-4 h-4 text-yellow-600" />
                            <span className="font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {invoice.clientName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Dicipta: {new Date(invoice.createdAt).toLocaleDateString('ms-MY')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full">
                            Draf
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/invoices/edit/${invoice._id}`);
                              setShowNotificationModal(false);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Selesaikan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiBell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-700 mb-2">
                    Tiada dokumen draf
                  </p>
                  <p className="text-sm text-gray-500">
                    Semua dokumen anda telah diselesaikan.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              {draftInvoices.length > 0 && (
                <button
                  onClick={() => {
                    navigate('/invoices?status=draft');
                    setShowNotificationModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Lihat Semua Draf
                </button>
              )}
              <button
                onClick={closeNotificationModal}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
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
                  <h3 className="text-lg font-semibold text-gray-900">Bantuan</h3>
                  <p className="text-sm text-gray-500">Panduan penggunaan sistem</p>
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
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiFileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Mencipta Dokumen</h4>
                    <p className="text-sm text-gray-600">Klik "Dokumen Baru" untuk mencipta sebut harga atau invois baharu</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiUsers className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Mengurus Pelanggan</h4>
                    <p className="text-sm text-gray-600">Tambah dan edit maklumat pelanggan di bahagian Pelanggan</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiBarChart2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Laporan</h4>
                    <p className="text-sm text-gray-600">Lihat analisis dan laporan dokumen di bahagian Laporan</p>
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

export default Sidebar;
