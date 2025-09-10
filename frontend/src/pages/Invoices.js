import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../utils/helpers';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [compactMode, setCompactMode] = useState(false);
  const [showFreeformInfo, setShowFreeformInfo] = useState(true);
  const [countdown, setCountdown] = useState(7);
  const [showDocumentModeStats, setShowDocumentModeStats] = useState(true);
  const [showOverdueAlert, setShowOverdueAlert] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, [pagination.page, search, status]);

  // Load compact mode setting
  useEffect(() => {
    try {
      const raw = localStorage.getItem('app_settings');
      if (raw) {
        const s = JSON.parse(raw);
        setCompactMode(s.compactTables || false);
      }
    } catch (e) {
      // ignore malformed settings
    }
  }, []);

  // Auto-hide freeform info card with countdown
  useEffect(() => {
    if (!showFreeformInfo) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setShowFreeformInfo(false);
          return 7;
        }
        return prev - 1;
      });
    }, 1000); // Update every second

    return () => clearInterval(countdownInterval);
  }, [showFreeformInfo]);

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 10,
        ...(search && { search }),
        ...(status && { status })
      });

      const response = await axios.get(`${API_BASE_URL}/api/invoices?${params}`);
      setInvoices(response.data.invoices);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Gagal memuat dokumen');
    } finally {
      setLoading(false);
    }
  };

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, invoice: null });
  const [actionMenu, setActionMenu] = useState({ isOpen: false, invoice: null });

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/invoices/${id}`);
      toast.success('Dokumen berjaya dipadam');
      fetchInvoices();
      setDeleteModal({ isOpen: false, invoice: null });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Gagal memadamkan dokumen');
    }
  };

  const openDeleteModal = (invoice) => {
    setDeleteModal({ isOpen: true, invoice });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, invoice: null });
  };

  const openActionMenu = (invoice) => {
    setActionMenu({ isOpen: true, invoice });
  };

  const closeActionMenu = () => {
    setActionMenu({ isOpen: false, invoice: null });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
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

  // Consistent payment computations (align with InvoiceForm/InvoiceView)
  const getTotalPaid = (inv) => {
    if (inv && Array.isArray(inv.payments) && inv.payments.length > 0) {
      const sum = inv.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
      return sum;
    }
    return parseFloat(inv?.amountPaid) || 0;
  };

  const getSubtotal = (inv) => {
    if (!inv) return 0;
    return parseFloat(inv.subtotal) || 0;
  };

  const getDiscountAmount = (inv) => {
    if (!inv) return 0;
    return parseFloat(inv.discount) || 0;
  };

  const getTaxAmount = (inv) => {
    if (!inv) return 0;
    return parseFloat(inv.tax) || 0;
  };

  const getTotal = (inv) => {
    if (!inv) return 0;
    return parseFloat(inv.total) || 0;
  };

  const getOutstanding = (inv) => {
    const total = getTotal(inv);
    const paid = getTotalPaid(inv);
    return Math.max(0, total - paid);
  };

  // Helper function to check if invoice is overdue (same logic as Dashboard)
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

  if (loading) {
    return (
      <div className="relative w-full bg-gradient-to-br from-primary-50 via-white to-primary-100/60 px-4 py-6 md:py-10">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gradient-to-br from-primary-50 via-white to-primary-100/60 px-4 py-6 md:py-10">
      {/* Corak latar halus */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#e5e7eb_1px,transparent_1.5px)] [background-size:20px_20px]"></div>
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary-200/50 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary-300/40 blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Senarai Dokumen</h1>
            <p className="mt-1 text-sm text-gray-600">Urus semua dokumen anda</p>
          </div>
          <Link to="/invoices/new" className="inline-flex items-center gap-2 btn-primary">
            <FiPlus className="h-4 w-4" /> Tambah Dokumen Baru
          </Link>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Documents Card */}
          <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Jumlah Dokumen</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>

          {/* Paid Documents Card */}
          <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dibayar</p>
                <p className="text-2xl font-bold text-green-600">
                  {invoices.filter(inv => inv.status === 'paid').length}
                </p>
              </div>
            </div>
          </div>

          {/* Outstanding Amount Card */}
          <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Baki Tertunggak</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(invoices.reduce((sum, inv) => sum + getOutstanding(inv), 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Overdue Documents Card */}
          <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lewat Tempoh</p>
                <p className="text-2xl font-bold text-red-600">
                  {invoices.filter(inv => isOverdue(inv)).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Info Card */}
        {showFreeformInfo && (
          <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 mb-6 relative animate-in slide-in-from-top-2 duration-300">
            <button
              onClick={() => {
                setShowFreeformInfo(false);
                setCountdown(7); // Reset countdown
              }}
              className="absolute top-4 right-4 text-blue-400 hover:text-blue-600 transition-colors duration-200"
              title="Tutup maklumat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 pr-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Mod Teks Bebas Tersedia!</h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Sekarang anda boleh menggunakan <strong>Mod Teks Bebas</strong> untuk menaip item invois dengan format yang fleksibel. 
                  Sistem akan mengesan harga (RM) dan kuantiti secara automatik. Cukup klik "Tambah Dokumen Baru" dan pilih "Teks Bebas" dalam bahagian Item Invois.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ✨ Format Fleksibel
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    🤖 Auto-Detection
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    📱 Mobile Friendly
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
                  <span>💡 Maklumat ini akan hilang dalam:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-800 animate-pulse">
                      {countdown}
                    </div>
                    <span>saat</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Statistics Card */}
        <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📊 Statistik Pembayaran</h3>
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Data Real-time
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Revenue */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(invoices.reduce((sum, inv) => sum + getTotal(inv), 0))}
              </div>
              <div className="text-sm text-gray-600">Jumlah Pendapatan</div>
              <div className="mt-2 text-xs text-gray-500">
                {invoices.filter(inv => inv.documentType !== 'quote').length} invois
              </div>
            </div>

            {/* Total Paid */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatCurrency(invoices.reduce((sum, inv) => sum + getTotalPaid(inv), 0))}
              </div>
              <div className="text-sm text-gray-600">Jumlah Dibayar</div>
              <div className="mt-2 text-xs text-gray-500">
                {invoices.filter(inv => getTotalPaid(inv) > 0).length} dokumen
              </div>
            </div>

            {/* Payment Rate */}
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {invoices.length > 0 ? Math.round((invoices.filter(inv => getTotalPaid(inv) > 0).length / invoices.length) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Kadar Pembayaran</div>
              <div className="mt-2 text-xs text-gray-500">
                {invoices.filter(inv => getTotalPaid(inv) > 0).length} / {invoices.length} dokumen
              </div>
            </div>
          </div>
        </div>

        {/* Document Mode Statistics */}
        <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📝 Statistik Mod Dokumen</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Format Analysis
              </div>
              <button
                onClick={() => setShowDocumentModeStats(!showDocumentModeStats)}
                className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title={showDocumentModeStats ? "Tutup" : "Buka"}
              >
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${showDocumentModeStats ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          
          {showDocumentModeStats && (
            <div className="transition-all duration-300 ease-in-out">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Structured Mode */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-lg font-semibold text-gray-900">
                      {invoices.filter(inv => !inv.freeformItems || inv.freeformItems.trim() === '').length}
                    </div>
                    <div className="text-sm text-gray-600">Mod Jadual</div>
                    <div className="text-xs text-gray-500 mt-1">Format table tradisional</div>
                  </div>
                </div>

                {/* Freeform Mode */}
                <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-lg font-semibold text-blue-900">
                      {invoices.filter(inv => inv.freeformItems && inv.freeformItems.trim() !== '').length}
                    </div>
                    <div className="text-sm text-blue-700">Mod Teks Bebas</div>
                    <div className="text-xs text-blue-600 mt-1">Format fleksibel baru</div>
                  </div>
                </div>
              </div>
              
              {invoices.filter(inv => inv.freeformItems && inv.freeformItems.trim() !== '').length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-green-800">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">
                      🎉 Anda telah menggunakan Mod Teks Bebas! Sistem akan auto-detect format yang betul.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Overdue Details Card */}
        {invoices.filter(inv => isOverdue(inv)).length > 0 && showOverdueAlert && (
          <div className="rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Perhatian: Dokumen Lewat Tempoh</h3>
                  <p className="text-red-800 text-sm leading-relaxed mb-3">
                    Anda mempunyai <strong>{invoices.filter(inv => isOverdue(inv)).length} dokumen</strong> yang telah lewat tempoh pembayaran. 
                    Jumlah tertunggak: <strong>{formatCurrency(invoices.filter(inv => isOverdue(inv)).reduce((sum, inv) => sum + getOutstanding(inv), 0))}</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      🚨 {invoices.filter(inv => isOverdue(inv)).length} Dokumen Lewat
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      💰 {formatCurrency(invoices.filter(inv => isOverdue(inv)).reduce((sum, inv) => sum + getOutstanding(inv), 0))} Tertunggak
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      📅 Dikira Automatik
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowOverdueAlert(false)}
                className="inline-flex items-center justify-center w-8 h-8 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                title="Tutup amaran"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white/80 backdrop-blur p-4 md:p-6 shadow-lg ring-1 ring-gray-200">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FiSearch className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Cari invois..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9"
              />
            </div>
            <div className="md:w-56">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input"
              >
                <option value="">Semua Status</option>
                <option value="draft">Draf</option>
                <option value="sent">Dihantar</option>
                <option value="paid">Dibayar</option>
                <option value="overdue">Lewat Tempoh</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">Cari</button>
          </form>
        </div>

        {/* Mobile cards (no horizontal scroll) */}
        <div className="mt-6 space-y-3 md:hidden">
          {invoices.length === 0 ? (
            <div className="rounded-2xl bg-white/80 backdrop-blur p-4 ring-1 ring-gray-200 text-center text-gray-500">
              Tiada dokumen dijumpai
            </div>
          ) : (
            invoices.map((invoice) => (
              <div key={invoice._id} className="rounded-2xl bg-white/80 backdrop-blur p-4 ring-1 ring-gray-200 shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</div>
                    <div className="mt-1 text-sm text-gray-900 truncate max-w-[14rem]">{invoice.clientName}</div>
                    {invoice.clientCompany && (
                      <div className="text-xs text-gray-600 truncate max-w-[14rem]">{invoice.clientCompany}</div>
                    )}
                    <div className="text-xs text-gray-500 truncate max-w-[14rem]">{invoice.clientEmail}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(getTotal(invoice))}</div>
                    {invoice.documentType !== 'quote' && (
                      <div className="text-[11px] mt-0.5">
                        <span className={`${getTotalPaid(invoice) > 0 ? 'text-green-600' : 'text-gray-500'} font-medium`}>
                          Dibayar {formatCurrency(getTotalPaid(invoice))}
                        </span>
                        <span className="mx-1 text-gray-300">•</span>
                        <span className={`${getOutstanding(invoice) > 0 ? 'text-amber-600' : 'text-gray-500'} font-medium`}>
                          Baki {formatCurrency(getOutstanding(invoice))}
                        </span>
                      </div>
                    )}
                    <span className={`mt-1 inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Terbit: {formatDate(invoice.issueDate)}</span>
                  <span>J.Tempo: {formatDate(invoice.dueDate)}</span>
                </div>
                {invoice.documentType !== 'quote' && invoice.payments && invoice.payments.length > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="text-xs text-gray-700 font-medium mb-1">Rekod Pembayaran:</div>
                    <div className="space-y-1">
                      {invoice.payments.slice(0, 2).map((payment, index) => (
                        <div key={payment._id || payment.id || index} className="flex justify-between text-xs">
                          <span className="text-gray-900">RM {formatCurrency(payment.amount)}</span>
                          <span className="text-gray-500">{payment.date ? formatDate(payment.date) : 'Tarikh tidak tersedia'}</span>
                        </div>
                      ))}
                      {invoice.payments.length > 2 && (
                        <div className="text-xs text-gray-500 italic">
                          +{invoice.payments.length - 2} pembayaran lagi
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="mt-3 flex justify-end">
                  <div className="relative">
                    <button
                      onClick={() => openActionMenu(invoice)}
                      className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="mt-6 overflow-x-auto rounded-2xl bg-white/80 backdrop-blur ring-1 ring-gray-200 shadow-lg hidden md:block">
          <table className={`min-w-full table-fixed divide-y divide-gray-200 ${compactMode ? 'text-sm' : ''}`}>
            <thead className="bg-primary-50/80">
              <tr>
                <th className={`text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40 ${compactMode ? 'px-3 py-2' : 'px-6 py-3'}`}>
                  No. Dokumen
                </th>
                <th className={`text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72 ${compactMode ? 'px-3 py-2' : 'px-6 py-3'}`}>
                  Pelanggan
                </th>
                <th className={`text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 ${compactMode ? 'px-3 py-2' : 'px-6 py-3'}`}>
                  Jumlah
                </th>
                <th className={`text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 ${compactMode ? 'px-3 py-2' : 'px-6 py-3'}`}>
                  Status
                </th>
                <th className={`text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell w-40 ${compactMode ? 'px-3 py-2' : 'px-6 py-3'}`}>
                  Tarikh Terbit
                </th>
                <th className={`text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40 ${compactMode ? 'px-3 py-2' : 'px-6 py-3'}`}>
                  Tarikh Jatuh Tempo
                </th>
                <th className={`text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-44 sticky right-0 bg-primary-50/80 backdrop-blur z-10 ${compactMode ? 'px-3 py-2' : 'px-6 py-3'}`}>
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/80 divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className={`text-center text-gray-500 ${compactMode ? 'px-3 py-2' : 'px-6 py-4'}`}>
                    Tiada dokumen dijumpai
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-primary-50/40">
                    <td className={`whitespace-nowrap text-sm font-medium text-gray-900 ${compactMode ? 'px-3 py-2' : 'px-6 py-4'}`}>
                      {invoice.invoiceNumber}
                    </td>
                    <td className={`whitespace-nowrap ${compactMode ? 'px-3 py-2' : 'px-6 py-4'}`}>
                      <div className="text-sm text-gray-900 truncate">{invoice.clientName}</div>
                      {invoice.clientCompany && (
                        <div className="text-xs text-gray-600 truncate">{invoice.clientCompany}</div>
                      )}
                      <div className="text-xs text-gray-500 truncate">{invoice.clientEmail}</div>
                    </td>
                    <td className={`whitespace-nowrap text-sm text-gray-900 text-right ${compactMode ? 'px-3 py-2' : 'px-6 py-4'}`}>
                      <div className="font-semibold">{formatCurrency(getTotal(invoice))}</div>
                      {invoice.documentType !== 'quote' && (
                        <div className="text-xs mt-0.5">
                          <span className={`${getTotalPaid(invoice) > 0 ? 'text-green-600' : 'text-gray-500'} font-medium`}>
                            Dibayar {formatCurrency(getTotalPaid(invoice))}
                          </span>
                          <span className="mx-1 text-gray-300">•</span>
                          <span className={`${getOutstanding(invoice) > 0 ? 'text-amber-600' : 'text-gray-500'} font-medium`}>
                            Baki {formatCurrency(getOutstanding(invoice))}
                          </span>
                        </div>
                      )}
                      {invoice.documentType !== 'quote' && invoice.payments && invoice.payments.length > 0 && (
                        <div className="mt-1 text-xs text-gray-600">
                          {invoice.payments.length} pembayaran direkodkan
                        </div>
                      )}
                    </td>
                    <td className={`whitespace-nowrap ${compactMode ? 'px-3 py-2' : 'px-6 py-4'}`}>
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell ${compactMode ? 'px-3 py-2' : 'px-6 py-4'}`}>
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className={`whitespace-nowrap text-sm text-gray-500 ${compactMode ? 'px-3 py-2' : 'px-6 py-4'}`}>
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className={`whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white/90 backdrop-blur ${compactMode ? 'px-3 py-2' : 'px-6 py-4'}`}>
                      <div className="flex justify-end">
                        <div className="relative">
                          <button
                            onClick={() => openActionMenu(invoice)}
                            className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="mt-4 rounded-2xl bg-white/80 backdrop-blur px-4 md:px-6 py-3 flex items-center justify-between ring-1 ring-gray-200 shadow">
            <div className="flex-1 flex justify-between md:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Seterusnya
              </button>
            </div>
            <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Menunjukkan <span className="font-medium">{((pagination.page - 1) * 10) + 1}</span> hingga{' '}
                  <span className="font-medium">{Math.min(pagination.page * 10, pagination.total)}</span>{' '}
                  daripada <span className="font-medium">{pagination.total}</span> hasil
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2.5 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.page === i + 1
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center px-2.5 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Seterusnya
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Padam Dokumen</h3>
                  <p className="text-sm text-gray-600">Tindakan ini tidak boleh dibatalkan</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Adakah anda pasti ingin memadam dokumen ini?
                </p>
                {deleteModal.invoice && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-sm font-medium text-gray-900">{deleteModal.invoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-600">{deleteModal.invoice.clientName}</div>
                    <div className="text-sm text-gray-600">{formatCurrency(deleteModal.invoice.total)}</div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteModal.invoice._id)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 hover:border-red-700 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Padam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Menu Modal */}
      {actionMenu.isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeActionMenu}>
          <div className="bg-white rounded-xl shadow-2xl max-w-xs w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-2">
              <div className="text-sm font-medium text-gray-900 mb-2 px-3 py-2">
                {actionMenu.invoice?.invoiceNumber}
              </div>
              
              <div className="space-y-1">
                <Link
                  to={`/invoices/view/${actionMenu.invoice?._id}`}
                  onClick={closeActionMenu}
                  className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Papar Dokumen
                </Link>
                
                <Link
                  to={`/invoices/edit/${actionMenu.invoice?._id}`}
                  onClick={closeActionMenu}
                  className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Dokumen
                </Link>
                
                <button
                  onClick={() => {
                    closeActionMenu();
                    openDeleteModal(actionMenu.invoice);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Padam Dokumen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
