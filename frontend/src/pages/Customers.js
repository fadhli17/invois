import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiEye, FiFilter, FiUsers, FiUserCheck, FiUserX, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Customers = () => {
  const { 
    customers, 
    loading, 
    error, 
    pagination, 
    stats, 
    fetchCustomers, 
    deleteCustomer, 
    fetchCustomerStats 
  } = useCustomer();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionMenu, setActionMenu] = useState({ isOpen: false, customer: null });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCustomers({ page: currentPage, search: searchTerm, status: statusFilter });
    fetchCustomerStats();
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDelete = async (customerId, customerName) => {
    const result = await deleteCustomer(customerId);
    
    if (result.success) {
      toast.success(result.message);
      setDeleteConfirm(null);
      fetchCustomers({ page: currentPage, search: searchTerm, status: statusFilter });
      fetchCustomerStats();
    } else {
      toast.error(result.message);
    }
  };

  const openActionMenu = (customer) => {
    setActionMenu({ isOpen: true, customer });
  };

  const closeActionMenu = () => {
    setActionMenu({ isOpen: false, customer: null });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchCustomers({ page: currentPage, search: searchTerm, status: statusFilter }),
        fetchCustomerStats()
      ]);
      toast.success('Data pelanggan telah dikemas kini!');
    } catch (error) {
      toast.error('Gagal mengemas kini data pelanggan');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ms-MY');
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Pelanggan</h1>
            <p className="mt-1 text-blue-600">Urus maklumat pelanggan anda</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`inline-flex items-center px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors ${
                isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Segar semula data"
            >
              <FiRefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Mengemas kini...' : 'Segar Semula'}
            </button>
            <Link
              to="/customers/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Tambah Pelanggan
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-blue-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Jumlah Pelanggan</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-blue-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiUserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Aktif</p>
              <p className="text-2xl font-bold text-green-900">{stats.activeCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-blue-200">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <FiUserX className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tidak Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactiveCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-blue-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiUsers className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Top Pelanggan</p>
              <p className="text-2xl font-bold text-purple-900">{stats.topCustomers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-6 border border-blue-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari pelanggan..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusFilter('')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => handleStatusFilter('active')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'active' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => handleStatusFilter('inactive')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'inactive' 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tidak Aktif
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-blue-600">Memuatkan data...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center">
            <FiUsers className="w-12 h-12 text-blue-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-blue-900 mb-2">Tiada pelanggan dijumpai</h3>
            <p className="text-blue-600 mb-4">Mula tambah pelanggan pertama anda</p>
            <Link
              to="/customers/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Tambah Pelanggan
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                      Pelanggan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                      Syarikat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                      Jumlah Dokumen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                      Jumlah Nilai
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                      Tindakan
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-200">
                  {customers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-blue-900">{customer.name}</div>
                          <div className="text-sm text-blue-600">{customer.email}</div>
                          {customer.phone && (
                            <div className="text-sm text-blue-500">{customer.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-blue-900">{customer.company || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-blue-900">{customer.totalInvoices}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-900">
                          {formatCurrency(customer.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex justify-end">
                          <div className="relative">
                            <button
                              onClick={() => openActionMenu(customer)}
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-blue-50 px-6 py-3 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-600">
                    Menunjukkan {((currentPage - 1) * 10) + 1} hingga {Math.min(currentPage * 10, pagination.total)} daripada {pagination.total} pelanggan
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-white border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sebelum
                    </button>
                    <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                      {currentPage} / {pagination.pages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                      className="px-3 py-1 text-sm bg-white border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Seterusnya
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <FiTrash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Padam Pelanggan</h3>
                  <p className="text-sm text-gray-500">Tindakan ini tidak boleh dibatalkan</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Adakah anda pasti mahu padam pelanggan <strong>{deleteConfirm.name}</strong>?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm._id, deleteConfirm.name)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
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
                {actionMenu.customer?.name}
              </div>
              
              <div className="space-y-1">
                <Link
                  to={`/customers/${actionMenu.customer?._id}`}
                  onClick={closeActionMenu}
                  className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Papar Pelanggan
                </Link>
                
                <Link
                  to={`/customers/${actionMenu.customer?._id}/edit`}
                  onClick={closeActionMenu}
                  className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Pelanggan
                </Link>
                
                <button
                  onClick={() => {
                    closeActionMenu();
                    setDeleteConfirm(actionMenu.customer);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Padam Pelanggan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
