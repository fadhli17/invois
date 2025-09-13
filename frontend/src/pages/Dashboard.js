import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import { 
  FiPlus, 
  FiSearch, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiFileText, 
  FiUsers, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle,
  FiBarChart2,
  FiPieChart,
  FiCalendar,
  FiEye,
  FiEdit,
  FiDownload,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

// Hook untuk animasi nombor
const useAnimatedNumber = (targetValue, duration = 2000) => {
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (targetValue === 0) {
      setCurrentValue(0);
      return;
    }

    setIsAnimating(true);
    setCurrentValue(0);

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function untuk animasi yang lebih smooth
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const newValue = targetValue * easeOutQuart;
      
      setCurrentValue(newValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
        setIsAnimating(false);
        startTimeRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return { currentValue, isAnimating };
};

// Komponen untuk memaparkan nombor dengan animasi
const AnimatedNumber = ({ value, duration = 2000, className = "", isCurrency = false }) => {
  const { currentValue, isAnimating } = useAnimatedNumber(value, duration);
  
  const displayValue = isCurrency 
    ? formatCurrency(Math.round(currentValue))
    : Math.round(currentValue).toLocaleString('ms-MY');

  return (
    <span className={`${className} ${isAnimating ? 'animate-pulse' : ''}`}>
      {displayValue}
    </span>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    paidInvoices: 0,
    paidAmount: 0,
    pendingInvoices: 0,
    pendingAmount: 0,
    overdueInvoices: 0,
    overdueAmount: 0,
    // Breakdown by document type
    quotesCount: 0,
    quotesAmount: 0,
    invoicesCount: 0,
    invoicesAmount: 0
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [allInvoices, setAllInvoices] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search debouncing
    const timeout = setTimeout(() => {
      if (search) {
        setSearching(true);
      }
      fetchDashboardData();
    }, search ? 300 : 0); // 300ms delay for search, immediate for status

    setSearchTimeout(timeout);

    // Cleanup timeout on unmount
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [search, status]);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: 1,
        limit: 1000,
        ...(search && { search }),
        ...(status && { status })
      });
      
      // For recent invoices, use same search parameters but limit to 5
      const recentParams = new URLSearchParams({
        page: 1,
        limit: 5,
        ...(search && { search }),
        ...(status && { status })
      });
      
      const [invoicesRes, recentRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/invoices?${params.toString()}`),
        axios.get(`${API_BASE_URL}/api/invoices?${recentParams.toString()}`)
      ]);

      const invoices = invoicesRes.data.invoices;
      setRecentInvoices(recentRes.data.invoices);
      setAllInvoices(invoices);

      const quotes = invoices.filter(inv => inv.documentType === 'quote');
      const realInvoices = invoices.filter(inv => inv.documentType === 'invoice');

      // Helper function to check if invoice is overdue based on dueDate
      const isOverdue = (invoice) => {
        if (invoice.status === 'paid') return false; // Paid invoices are never overdue
        if (invoice.status === 'overdue') return true; // Already marked as overdue
        if (!invoice.dueDate) return false; // No due date means not overdue
        
        const today = new Date();
        const dueDate = new Date(invoice.dueDate);
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        dueDate.setHours(0, 0, 0, 0); // Reset time to start of day
        
        return dueDate < today; // Overdue if due date is before today
      };

      // Calculate overdue invoices (both marked as overdue and automatically calculated)
      const overdueInvoices = invoices.filter(inv => isOverdue(inv));
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

      const stats = {
        totalInvoices: invoices.length,
        totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
        paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
        paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
        pendingInvoices: invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length,
        pendingAmount: invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').reduce((sum, inv) => sum + inv.total, 0),
        overdueInvoices: overdueInvoices.length,
        overdueAmount: overdueAmount,
        quotesCount: quotes.length,
        quotesAmount: quotes.reduce((sum, inv) => sum + inv.total, 0),
        invoicesCount: realInvoices.length,
        invoicesAmount: realInvoices.reduce((sum, inv) => sum + inv.total, 0)
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSearching(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshSuccess(false);
    await fetchDashboardData(true);
    setRefreshSuccess(true);
    // Reset success state after 2 seconds
    setTimeout(() => setRefreshSuccess(false), 2000);
  };

  // Add ripple effect for refresh button
  const createRipple = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(59, 130, 246, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
      z-index: 1;
    `;
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Dibayar';
      case 'sent': return 'Dihantar';
      case 'draft': return 'Draf';
      case 'overdue': return 'Lewat Tempoh';
      default: return status;
    }
  };

  // ===== Minimalist charts helpers =====
  const buildMonthlyTrend = () => {
    // Return last 6 months labels and totals
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, label: d.toLocaleString('ms-MY', { month: 'short' }), total: 0 });
    }
    const map = new Map(months.map(m => [m.key, m]));
    allInvoices.forEach(inv => {
      const d = new Date(inv.issueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (map.has(key)) {
        map.get(key).total += inv.total || 0;
      }
    });
    return months;
  };

  const monthlyTrend = buildMonthlyTrend();
  const trendValues = monthlyTrend.map(m => m.total);
  const trendMax = Math.max(1, ...trendValues);

  // Helper function to check if invoice is overdue (same as above)
  const isOverdue = (invoice) => {
    if (invoice.status === 'paid') return false;
    if (invoice.status === 'overdue') return true;
    if (!invoice.dueDate) return false;
    
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    return dueDate < today;
  };

  const statusCounts = {
    paid: allInvoices.filter(i => i.status === 'paid').length,
    sent: allInvoices.filter(i => i.status === 'sent' && !isOverdue(i)).length,
    draft: allInvoices.filter(i => i.status === 'draft').length,
    overdue: allInvoices.filter(i => isOverdue(i)).length
  };
  const statusTotal = Math.max(1, Object.values(statusCounts).reduce((a,b)=>a+b,0));

  const getDocTypeBadge = (type) => {
    if (type === 'quote') {
      return <span className="ml-2 inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-primary-50 text-primary-700">Sebut Harga</span>;
    }
    return <span className="ml-2 inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-700">Invois</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="mb-8">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1,2,3,4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
            
            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* CSS Animations */}
      <style jsx>{`
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Selamat Salam, <span className="text-blue-600">{user?.fullName}</span>!
              </h1>
              <p className="text-lg text-gray-600">
                Ringkasan pantas aktiviti dokumen anda
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString('ms-MY', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={(e) => {
                  if (!refreshing) {
                    createRipple(e);
                    handleRefresh();
                  }
                }}
                disabled={refreshing}
                className={`inline-flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 disabled:cursor-not-allowed relative overflow-hidden ${
                  refreshing 
                    ? 'bg-blue-50 text-blue-600 border-blue-200 refresh-pulse' 
                    : refreshSuccess 
                      ? 'bg-green-50 text-green-600 border-green-200 animate-bounce' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
                title="Segar semula data"
              >
                {/* Animated background effect */}
                {refreshing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-blue-500/20 to-blue-400/20 animate-pulse"></div>
                )}
                {refreshSuccess && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-green-500/20 to-green-400/20 animate-pulse"></div>
                )}
                
                <div className="relative z-10 flex items-center gap-2">
                  <FiRefreshCw className={`w-5 h-5 transition-all duration-300 ${
                    refreshing 
                      ? 'animate-spin text-blue-600' 
                      : refreshSuccess 
                        ? 'text-green-600 scale-110' 
                        : 'text-gray-600'
                  }`} />
                  <span className="transition-all duration-300">
                    {refreshing ? (
                      <span className="flex items-center gap-1">
                        Menyegar
                        <span className="flex gap-1">
                          <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                          <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                          <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                        </span>
                      </span>
                    ) : refreshSuccess ? 'Berjaya!' : 'Segar Semula'}
                  </span>
                </div>
              </button>
             
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            {(search || status) && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <FiSearch className="w-4 h-4" />
                    <span>
                      {search && status 
                        ? `Mencari "${search}" dengan status "${getStatusText(status)}"`
                        : search 
                          ? `Mencari "${search}"`
                          : `Menapis status "${getStatusText(status)}"`
                      }
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSearch('');
                      setStatus('');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Kosongkan semua
                  </button>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  Menunjukkan {allInvoices.length} hasil
                </div>
              </div>
            )}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari invois, pelanggan, atau nombor dokumen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {searching && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}
                {search && !searching && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    title="Kosongkan carian"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="lg:w-64">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiFilter className="h-5 w-5 text-gray-400" />
                  </div>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)} 
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="">Semua Status</option>
                    <option value="draft">Draf</option>
                    <option value="sent">Dihantar</option>
                    <option value="paid">Dibayar</option>
                    <option value="overdue">Lewat Tempoh</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Documents */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Jumlah Dokumen</p>
                <p className="text-3xl font-bold text-gray-900">
                  <AnimatedNumber value={stats.totalInvoices} duration={1500} />
                </p>
                <p className="text-xs text-gray-500 mt-1">Semua dokumen</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiFileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Paid Amount */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Jumlah Dibayar</p>
                <p className="text-3xl font-bold text-green-600">
                  <AnimatedNumber value={stats.paidAmount} duration={1800} isCurrency={true} />
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <AnimatedNumber value={stats.paidInvoices} duration={1200} /> dokumen
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Pending Amount */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Menunggu Bayaran</p>
                <p className="text-3xl font-bold text-amber-600">
                  <AnimatedNumber value={stats.pendingAmount} duration={2000} isCurrency={true} />
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <AnimatedNumber value={stats.pendingInvoices} duration={1400} /> dokumen
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <FiClock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Overdue Amount */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative group">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-600 mb-1">Lewat Tempoh</p>
                  <div className="relative">
                    <FiAlertCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Dikira secara automatik berdasarkan tarikh jatuh tempo
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  <AnimatedNumber value={stats.overdueAmount} duration={2200} isCurrency={true} />
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <AnimatedNumber value={stats.overdueInvoices} duration={1600} /> dokumen
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link 
            to="/invoices/new" 
            className="group bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <FiPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Cipta Dokumen</h3>
                <p className="text-blue-100 text-sm">Buat invois baru</p>
              </div>
            </div>
          </Link>
          
          <Link 
            to="/customers/new" 
            className="group bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <FiUsers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Tambah Pelanggan</h3>
                <p className="text-indigo-100 text-sm">Daftar pelanggan baru</p>
              </div>
            </div>
          </Link>
          
          <Link 
            to="/invoices" 
            className="group bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <FiFileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Senarai Dokumen</h3>
                <p className="text-emerald-100 text-sm">Lihat semua invois</p>
              </div>
            </div>
          </Link>
          
          <Link 
            to="/reports" 
            className="group bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <FiBarChart2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Laporan</h3>
                <p className="text-purple-100 text-sm">Analisis & statistik</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiTrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Trend Bulanan</h3>
                  <p className="text-sm text-gray-500">6 bulan terakhir</p>
                </div>
              </div>
            </div>
            
            <div className="h-40 flex items-end gap-3">
              {monthlyTrend.map((m, idx) => {
                const height = Math.max(8, Math.round((m.total / trendMax) * 120));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                      style={{ height: `${height}px` }}
                      title={`${m.label}: ${formatCurrency(m.total)}`}
                    ></div>
                    <div className="mt-2 text-xs text-gray-600 font-medium">{m.label}</div>
                    <div className="text-xs text-gray-400">{formatCurrency(m.total)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FiPieChart className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Agihan Status</h3>
                  <p className="text-sm text-gray-500">Bilangan dokumen</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Dibayar</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    <AnimatedNumber value={statusCounts.paid} duration={1300} />
                  </div>
                  <div className="text-xs text-gray-500">
                    <AnimatedNumber value={Math.round((statusCounts.paid / statusTotal) * 100)} duration={1500} />%
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(statusCounts.paid / statusTotal) * 100}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Dihantar</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    <AnimatedNumber value={statusCounts.sent} duration={1400} />
                  </div>
                  <div className="text-xs text-gray-500">
                    <AnimatedNumber value={Math.round((statusCounts.sent / statusTotal) * 100)} duration={1600} />%
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(statusCounts.sent / statusTotal) * 100}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Draf</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    <AnimatedNumber value={statusCounts.draft} duration={1500} />
                  </div>
                  <div className="text-xs text-gray-500">
                    <AnimatedNumber value={Math.round((statusCounts.draft / statusTotal) * 100)} duration={1700} />%
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(statusCounts.draft / statusTotal) * 100}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Lewat Tempoh</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    <AnimatedNumber value={statusCounts.overdue} duration={1600} />
                  </div>
                  <div className="text-xs text-gray-500">
                    <AnimatedNumber value={Math.round((statusCounts.overdue / statusTotal) * 100)} duration={1800} />%
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(statusCounts.overdue / statusTotal) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        {/* Document Type Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <FiFileText className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Sebut Harga</h3>
                  <p className="text-sm text-gray-500">Dokumen sebut harga</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-600">
                  <AnimatedNumber value={stats.quotesCount} duration={1700} />
                </div>
                <div className="text-sm text-gray-500">
                  <AnimatedNumber value={stats.quotesAmount} duration={1900} isCurrency={true} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FiDollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Invois</h3>
                  <p className="text-sm text-gray-500">Dokumen invois</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  <AnimatedNumber value={stats.invoicesCount} duration={1800} />
                </div>
                <div className="text-sm text-gray-500">
                  <AnimatedNumber value={stats.invoicesAmount} duration={2000} isCurrency={true} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Documents Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiEye className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Dokumen Terkini</h3>
                  <p className="text-sm text-gray-500">5 dokumen terbaru</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`text-sm font-medium flex items-center gap-1 disabled:cursor-not-allowed transition-all duration-300 px-2 py-1 rounded-lg ${
                    refreshing 
                      ? 'text-blue-600 bg-blue-50 animate-pulse' 
                      : refreshSuccess 
                        ? 'text-green-600 bg-green-50 animate-bounce' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Segar semula data"
                >
                  <FiRefreshCw className={`w-4 h-4 transition-all duration-300 ${
                    refreshing 
                      ? 'animate-spin text-blue-600' 
                      : refreshSuccess 
                        ? 'text-green-600 scale-110' 
                        : 'text-gray-500'
                  }`} />
                  <span className="transition-all duration-300">
                    {refreshing ? (
                      <span className="flex items-center gap-1">
                        Menyegar
                        <span className="flex gap-0.5">
                          <span className="w-0.5 h-0.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                          <span className="w-0.5 h-0.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                          <span className="w-0.5 h-0.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                        </span>
                      </span>
                    ) : refreshSuccess ? 'Berjaya!' : 'Segar'}
                  </span>
                </button>
                <Link 
                  to="/invoices" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  Lihat Semua
                  <FiEye className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. Dokumen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pelanggan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarikh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tindakan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <FiFileText className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Belum ada dokumen</p>
                          <p className="text-gray-400 text-sm">Mula dengan membuat invois pertama anda</p>
                        </div>
                        <button
                          onClick={() => navigate('/invoices/new')}
                          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <FiPlus className="w-4 h-4" />
                          Buat Invois
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</span>
                          {getDocTypeBadge(invoice.documentType)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.clientName}</div>
                        <div className="text-sm text-gray-500">{invoice.clientEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.total)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.issueDate).toLocaleDateString('ms-MY')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/invoices/view/${invoice._id}`}
                            className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                            title="Lihat"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/invoices/edit/${invoice._id}`}
                            className="text-gray-600 hover:text-gray-700 p-1 rounded hover:bg-gray-50"
                            title="Edit"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
