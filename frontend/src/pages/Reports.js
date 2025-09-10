import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FiBarChart2, FiCalendar, FiDownload, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';

const Reports = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          page: 1,
          limit: 1000,
          ...(search && { search })
        });

        const [invRes, custRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/invoices?${params.toString()}`),
          axios.get(`${API_BASE_URL}/api/customers?page=1&limit=1000`)
        ]);

        setInvoices(invRes.data.invoices || []);
        setCustomers(custRes.data.customers || []);
      } catch (err) {
        console.error('Gagal memuat data laporan:', err);
        setError('Gagal memuat data laporan');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [search, refreshTick]);

  const filteredInvoices = useMemo(() => {
    let list = invoices;
    if (dateFrom) {
      const fromTs = new Date(dateFrom).getTime();
      list = list.filter((i) => new Date(i.issueDate).getTime() >= fromTs);
    }
    if (dateTo) {
      const toTs = new Date(dateTo).getTime();
      list = list.filter((i) => new Date(i.issueDate).getTime() <= toTs);
    }
    return list;
  }, [invoices, dateFrom, dateTo]);

  const metrics = useMemo(() => {
    const totalDocs = filteredInvoices.length;
    const totalCustomers = customers.length;
    const totalAmount = filteredInvoices.reduce((s, i) => s + (i.total || 0), 0);
    const totalPaid = filteredInvoices
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + (i.total || 0), 0);
    const overdueCount = filteredInvoices.filter((i) => i.status === 'overdue').length;
    const quotesCount = filteredInvoices.filter((i) => i.documentType === 'quote').length;
    const invoicesCount = filteredInvoices.filter((i) => i.documentType !== 'quote').length;
    return { totalDocs, totalCustomers, totalAmount, totalPaid, overdueCount, quotesCount, invoicesCount };
  }, [filteredInvoices, customers]);

  const formatCurrency = (num) =>
    new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2 }).format(num || 0);

  return (
    <div className="relative w-full bg-gradient-to-br from-primary-50 via-white to-primary-100/60 px-4 py-6 md:py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#e5e7eb_1px,transparent_1.5px)] [background-size:20px_20px]"></div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary-600 text-white flex items-center justify-center">
              <FiBarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
              <p className="text-sm text-gray-600">Ringkasan statistik dokumen dan pelanggan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRefreshTick((x) => x + 1)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <FiRefreshCw className="w-4 h-4" /> Segar Semula
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700 shadow-sm hover:bg-primary-100"
            >
              <FiDownload className="w-4 h-4" /> Cetak/PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white/80 backdrop-blur p-4 md:p-6 shadow-lg ring-1 ring-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            <div className="col-span-1 md:col-span-2">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FiSearch className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan pelanggan, nombor dokumen..."
                  className="input pl-9"
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FiCalendar className="h-4 w-4" />
                </div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input pl-9"
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FiCalendar className="h-4 w-4" />
                </div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metric cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-blue-50/40 backdrop-blur p-5 shadow ring-1 ring-blue-100 border-l-4 border-blue-400">
            <div className="text-sm font-medium text-blue-700">Jumlah Dokumen</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{metrics.totalDocs}</div>
            <div className="mt-1 text-xs text-blue-700/70">Invois: {metrics.invoicesCount} • Sebut Harga: {metrics.quotesCount}</div>
          </div>
          <div className="rounded-2xl bg-indigo-50/40 backdrop-blur p-5 shadow ring-1 ring-indigo-100 border-l-4 border-indigo-400">
            <div className="text-sm font-medium text-indigo-700">Jumlah Pelanggan</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{metrics.totalCustomers}</div>
            <div className="mt-1 text-xs text-indigo-700/70">Aktifkan carian untuk menapis mengikut pelanggan</div>
          </div>
          <div className="rounded-2xl bg-emerald-50/40 backdrop-blur p-5 shadow ring-1 ring-emerald-100 border-l-4 border-emerald-400">
            <div className="text-sm font-medium text-emerald-700">Jumlah Nilai</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalAmount)}</div>
            <div className="mt-1 text-xs text-emerald-700/70">Termasuk semua dokumen dalam julat tarikh</div>
          </div>
          <div className="rounded-2xl bg-green-50/40 backdrop-blur p-5 shadow ring-1 ring-green-100 border-l-4 border-green-400">
            <div className="text-sm font-medium text-green-700">Jumlah Dibayar</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalPaid)}</div>
            <div className="mt-1 text-xs text-green-700/70">Berdasarkan status Dokumen = Dibayar</div>
          </div>
          <div className="rounded-2xl bg-rose-50/40 backdrop-blur p-5 shadow ring-1 ring-rose-100 border-l-4 border-rose-400">
            <div className="text-sm font-medium text-rose-700">Lewat Tempoh</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{metrics.overdueCount}</div>
            <div className="mt-1 text-xs text-rose-700/70">Bilangan dokumen berstatus Overdue</div>
          </div>
        </div>

        {/* Top items */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/80 backdrop-blur p-5 shadow ring-1 ring-gray-200">
            <div className="flex items-center justify-between mb-3 border-b border-blue-100 pb-2">
              <h3 className="font-semibold text-blue-800">Invois Terkini</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredInvoices.slice(0, 8).map((inv) => (
                <div key={inv._id} className="py-2 flex items-center justify-between text-sm">
                  <div className="truncate">
                    <div className="font-medium text-gray-900 truncate">{inv.invoiceNumber}</div>
                    <div className="text-gray-600 truncate">{inv.clientName}{inv.clientCompany ? ` • ${inv.clientCompany}` : ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-800">{formatCurrency(inv.total)}</div>
                    <div className="text-xs text-gray-500">{new Date(inv.issueDate).toLocaleDateString('ms-MY')}</div>
                  </div>
                </div>
              ))}
              {filteredInvoices.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-500">Tiada data untuk paparan</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 backdrop-blur p-5 shadow ring-1 ring-gray-200">
            <div className="flex items-center justify-between mb-3 border-b border-indigo-100 pb-2">
              <h3 className="font-semibold text-indigo-800">Pelanggan (Top 8)</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {customers.slice(0, 8).map((c) => (
                <div key={c._id} className="py-2 flex items-center justify-between text-sm">
                  <div className="truncate">
                    <div className="font-medium text-gray-900 truncate">{c.name}</div>
                    <div className="text-gray-600 truncate">{c.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-indigo-700/70">{new Date(c.createdAt).toLocaleDateString('ms-MY')}</div>
                  </div>
                </div>
              ))}
              {customers.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-500">Tiada data untuk paparan</div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 p-4">{error}</div>
        )}
      </div>
    </div>
  );
};

export default Reports;


