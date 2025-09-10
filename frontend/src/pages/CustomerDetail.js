import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import { 
  FiArrowLeft, 
  FiEdit, 
  FiTrash2, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiBriefcase, 
  FiMapPin, 
  FiFileText, 
  FiHash,
  FiCalendar,
  FiDollarSign,
  FiFile
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCustomer, loading, error, fetchCustomer, deleteCustomer } = useCustomer();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCustomer(id);
    }
  }, [id]);

  const handleDelete = async () => {
    const result = await deleteCustomer(id);
    
    if (result.success) {
      toast.success(result.message);
      navigate('/customers');
    } else {
      toast.error(result.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  // Debug logging for customer data
  useEffect(() => {
    if (currentCustomer) {
      console.log('=== CUSTOMER DETAIL DEBUG ===');
      console.log('Current customer:', currentCustomer);
      console.log('Invoice count:', currentCustomer.invoiceCount);
      console.log('Quote count:', currentCustomer.quoteCount);
      console.log('Total documents:', currentCustomer.totalDocuments);
      console.log('Invoice amount:', currentCustomer.invoiceAmount);
      console.log('Quote amount:', currentCustomer.quoteAmount);
      console.log('Total amount:', currentCustomer.totalAmount);
      console.log('=== END DEBUG ===');
    }
  }, [currentCustomer]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-blue-600">Memuatkan data pelanggan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentCustomer) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <FiUser className="w-12 h-12 text-blue-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-blue-900 mb-2">Pelanggan tidak dijumpai</h3>
          <p className="text-blue-600 mb-4">Pelanggan yang anda cari mungkin telah dipadam</p>
          <Link
            to="/customers"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Senarai
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/customers"
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-blue-900">{currentCustomer.name}</h1>
              <p className="mt-1 text-blue-600">Maklumat lengkap pelanggan</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Link
              to={`/customers/${id}/edit`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiEdit className="w-4 h-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FiTrash2 className="w-4 h-4 mr-2" />
              Padam
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <FiUser className="w-5 h-5 mr-2" />
              Maklumat Asas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-600 mb-1">Nama Penuh</label>
                <p className="text-blue-900 font-medium">{currentCustomer.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-600 mb-1">Email</label>
                <p className="text-blue-900">{currentCustomer.email}</p>
              </div>
              
              {currentCustomer.phone && (
                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-1">Telefon</label>
                  <p className="text-blue-900">{currentCustomer.phone}</p>
                </div>
              )}
              
              {/* Syarikat dipaparkan di bahagian Maklumat Syarikat untuk selari dengan borang pendaftaran */}
              
              <div>
                <label className="block text-sm font-medium text-blue-600 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  currentCustomer.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {currentCustomer.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>
            </div>
          </div>

          {/* Company Information */}
          {(currentCustomer.company || currentCustomer.companyRegistrationNo || currentCustomer.companyTaxNumber || currentCustomer.companyBankName || currentCustomer.companyBankAccount) && (
            <div className="bg-white rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <FiBriefcase className="w-5 h-5 mr-2" />
                Maklumat Syarikat
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentCustomer.company && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-blue-600 mb-1">Nama Syarikat</label>
                    <p className="text-blue-900 font-medium">{currentCustomer.company}</p>
                  </div>
                )}
                
                {currentCustomer.companyRegistrationNo && (
                  <div>
                    <label className="block text-sm font-medium text-blue-600 mb-1">No. Pendaftaran Syarikat</label>
                    <p className="text-blue-900">{currentCustomer.companyRegistrationNo}</p>
                  </div>
                )}
                
                {currentCustomer.companyTaxNumber && (
                  <div>
                    <label className="block text-sm font-medium text-blue-600 mb-1">Nombor Cukai Syarikat</label>
                    <p className="text-blue-900">{currentCustomer.companyTaxNumber}</p>
                  </div>
                )}
                
                {currentCustomer.companyBankName && (
                  <div>
                    <label className="block text-sm font-medium text-blue-600 mb-1">Nama Bank</label>
                    <p className="text-blue-900">{currentCustomer.companyBankName}</p>
                  </div>
                )}
                
                {currentCustomer.companyBankAccount && (
                  <div>
                    <label className="block text-sm font-medium text-blue-600 mb-1">No. Akaun Bank</label>
                    <p className="text-blue-900">{currentCustomer.companyBankAccount}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address Information */}
          {currentCustomer.address && (
            <div className="bg-white rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <FiMapPin className="w-5 h-5 mr-2" />
                Alamat
              </h3>
              
              <div className="space-y-2">
                {currentCustomer.address.street && (
                  <p className="text-blue-900">{currentCustomer.address.street}</p>
                )}
                <p className="text-blue-900">
                  {[
                    currentCustomer.address.city,
                    currentCustomer.address.state,
                    currentCustomer.address.postalCode
                  ].filter(Boolean).join(', ')}
                </p>
                {currentCustomer.address.country && (
                  <p className="text-blue-900">{currentCustomer.address.country}</p>
                )}
              </div>
            </div>
          )}

          {/* Additional Information */}
          {(currentCustomer.taxNumber || currentCustomer.notes) && (
            <div className="bg-white rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <FiFileText className="w-5 h-5 mr-2" />
                Maklumat Tambahan
              </h3>
              
              <div className="space-y-4">
                {currentCustomer.taxNumber && (
                  <div>
                    <label className="block text-sm font-medium text-blue-600 mb-1">Nombor Cukai</label>
                    <p className="text-blue-900">{currentCustomer.taxNumber}</p>
                  </div>
                )}
                
                {currentCustomer.notes && (
                  <div>
                    <label className="block text-sm font-medium text-blue-600 mb-1">Catatan</label>
                    <p className="text-blue-900 whitespace-pre-wrap">{currentCustomer.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Statistics & Actions */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-white rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <FiDollarSign className="w-5 h-5 mr-2" />
              Statistik
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-600">Jumlah Invois</span>
                <span className="text-blue-900 font-semibold">{currentCustomer.invoiceCount || currentCustomer.totalInvoices || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-blue-600">Jumlah Sebut Harga</span>
                <span className="text-blue-900 font-semibold">{currentCustomer.quoteCount || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-blue-600">Jumlah Keseluruhan</span>
                <span className="text-blue-900 font-semibold">{currentCustomer.totalDocuments || currentCustomer.totalInvoices || 0}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-medium">Nilai Invois</span>
                  <span className="text-blue-900 font-semibold">{formatCurrency(currentCustomer.invoiceAmount || 0)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-medium">Nilai Sebut Harga</span>
                <span className="text-blue-900 font-semibold">{formatCurrency(currentCustomer.quoteAmount || 0)}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-medium">Jumlah Nilai Keseluruhan</span>
                  <span className="text-blue-900 font-bold text-lg">{formatCurrency((currentCustomer.invoiceAmount || 0) + (currentCustomer.quoteAmount || 0) || currentCustomer.totalAmount || 0)}</span>
                </div>
              </div>
              
              {currentCustomer.lastInvoiceDate && (
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600">Dokumen Terakhir</span>
                    <span className="text-blue-900 font-semibold">{formatDate(currentCustomer.lastInvoiceDate)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Tindakan Pantas</h3>
            
            <div className="space-y-3">
              <Link
                to={`/invoices/new?customer=${currentCustomer._id}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiFile className="w-4 h-4 mr-2" />
                Buat Invois
              </Link>
              
              <Link
                to={`/customers/${id}/edit`}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <FiEdit className="w-4 h-4 mr-2" />
                Edit Maklumat
              </Link>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Maklumat Sistem</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-600">ID Pelanggan</span>
                <span className="text-blue-900 font-mono">{currentCustomer._id.slice(-8)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-blue-600">Dicipta</span>
                <span className="text-blue-900">{formatDate(currentCustomer.createdAt)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-blue-600">Dikemaskini</span>
                <span className="text-blue-900">{formatDate(currentCustomer.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(false)} />
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
                Adakah anda pasti mahu padam pelanggan <strong>{currentCustomer.name}</strong>?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Padam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
