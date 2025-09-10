import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCustomer } from '../context/CustomerContext';
import { FiArrowLeft, FiSave, FiUser, FiMail, FiPhone, FiBriefcase, FiMapPin, FiFileText, FiHash, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { createCustomer, updateCustomer, fetchCustomer, currentCustomer, loading } = useCustomer();
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      fetchCustomer(id);
    }
  }, [isEdit, id]);

  useEffect(() => {
    if (isEdit && currentCustomer) {
      // Populate form with existing data
      setValue('name', currentCustomer.name);
      setValue('email', currentCustomer.email);
      setValue('phone', currentCustomer.phone || '');
      setValue('company', currentCustomer.company || '');
      setValue('companyRegistrationNo', currentCustomer.companyRegistrationNo || '');
      setValue('companyTaxNumber', currentCustomer.companyTaxNumber || '');
      setValue('companyBankName', currentCustomer.companyBankName || '');
      setValue('companyBankAccount', currentCustomer.companyBankAccount || '');
      setValue('address.street', currentCustomer.address?.street || '');
      setValue('address.city', currentCustomer.address?.city || '');
      setValue('address.state', currentCustomer.address?.state || '');
      setValue('address.postalCode', currentCustomer.address?.postalCode || '');
      setValue('address.country', currentCustomer.address?.country || 'Malaysia');
      setValue('taxNumber', currentCustomer.taxNumber || '');
      setValue('notes', currentCustomer.notes || '');
      setValue('status', currentCustomer.status || 'active');
    }
  }, [currentCustomer, isEdit, setValue]);

  const onSubmit = async (data) => {
    setFormLoading(true);
    
    try {
      // Clean up empty address fields
      const address = {};
      if (data.address.street) address.street = data.address.street;
      if (data.address.city) address.city = data.address.city;
      if (data.address.state) address.state = data.address.state;
      if (data.address.postalCode) address.postalCode = data.address.postalCode;
      if (data.address.country) address.country = data.address.country;

      const customerData = {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        company: data.company || undefined,
        companyRegistrationNo: data.companyRegistrationNo || undefined,
        companyTaxNumber: data.companyTaxNumber || undefined,
        companyBankName: data.companyBankName || undefined,
        companyBankAccount: data.companyBankAccount || undefined,
        address: Object.keys(address).length > 0 ? address : undefined,
        taxNumber: data.taxNumber || undefined,
        notes: data.notes || undefined,
        status: data.status
      };

      let result;
      if (isEdit) {
        result = await updateCustomer(id, customerData);
      } else {
        result = await createCustomer(customerData);
      }

      if (result.success) {
        toast.success(result.message);
        navigate('/customers');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Ralat berlaku semasa menyimpan data');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-blue-600">Memuatkan data pelanggan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/customers"
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-blue-900">
              {isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
            </h1>
            <p className="mt-1 text-sm text-blue-600">
              {isEdit ? 'Kemaskini maklumat pelanggan' : 'Tambah pelanggan baru ke sistem'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-blue-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <FiUser className="w-5 h-5 mr-2" />
              Maklumat Pelanggan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Nama Penuh *
                </label>
                <input
                  {...register('name', { required: 'Nama diperlukan' })}
                  type="text"
                  className="input"
                  placeholder="Nama penuh pelanggan"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Email *
                </label>
                <input
                  {...register('email', { 
                    required: 'Email diperlukan',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Format email tidak sah'
                    }
                  })}
                  type="email"
                  className="input"
                  placeholder="contoh@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Telefon
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="input"
                  placeholder="+60123456789"
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <FiBriefcase className="w-5 h-5 mr-2" />
              Maklumat Syarikat
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Nama Syarikat
                </label>
                <input
                  {...register('company')}
                  type="text"
                  className="input"
                  placeholder="Nama syarikat pelanggan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  No. Pendaftaran Syarikat
                </label>
                <input
                  {...register('companyRegistrationNo')}
                  type="text"
                  className="input"
                  placeholder="Contoh: 123456-A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Nombor Cukai Syarikat
                </label>
                <input
                  {...register('companyTaxNumber')}
                  type="text"
                  className="input"
                  placeholder="Nombor cukai pendapatan syarikat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Nama Bank
                </label>
                <input
                  {...register('companyBankName')}
                  type="text"
                  className="input"
                  placeholder="Contoh: Maybank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  No. Akaun Bank
                </label>
                <input
                  {...register('companyBankAccount')}
                  type="text"
                  className="input"
                  placeholder="Contoh: 123456789012"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <FiMapPin className="w-5 h-5 mr-2" />
              Alamat
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Jalan
                </label>
                <input
                  {...register('address.street')}
                  type="text"
                  className="input"
                  placeholder="Nombor rumah, nama jalan"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Bandar
                  </label>
                  <input
                    {...register('address.city')}
                    type="text"
                    className="input"
                    placeholder="Kuala Lumpur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Negeri
                  </label>
                  <input
                    {...register('address.state')}
                    type="text"
                    className="input"
                    placeholder="Selangor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Poskod
                  </label>
                  <input
                    {...register('address.postalCode')}
                    type="text"
                    className="input"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Negara
                </label>
                <input
                  {...register('address.country')}
                  type="text"
                  className="input"
                  placeholder="Malaysia"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <FiFileText className="w-5 h-5 mr-2" />
              Maklumat Tambahan
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Nombor Cukai
                </label>
                <input
                  {...register('taxNumber')}
                  type="text"
                  className="input"
                  placeholder="Nombor cukai pendapatan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Catatan
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="input"
                  placeholder="Catatan tambahan tentang pelanggan..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="input"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-blue-200">
            <Link
              to="/customers"
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={formLoading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {formLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4 mr-2" />
                  {isEdit ? 'Kemaskini' : 'Simpan'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
