import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { 
  FiUser, 
  FiMail, 
  FiHome, 
  FiPhone, 
  FiMapPin, 
  FiLock, 
  FiEye, 
  FiEyeOff,
  FiSave,
  FiShield,
  FiEdit3,
  FiCheck,
  FiX
} from 'react-icons/fi';

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const { user, updateProfile, changePassword } = useAuth();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors } } = useForm();

  useEffect(() => {
    if (user) {
      setValue('fullName', user.fullName);
      setValue('email', user.email);
      setValue('company', user.company || '');
      setValue('phone', user.phone || '');
      setValue('address', user.address || '');
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    setSaveSuccess(false);
    const result = await updateProfile(data);
    
    if (result.success) {
      toast.success(result.message);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    setPasswordSuccess(false);
    const result = await changePassword(data);
    
    if (result.success) {
      toast.success(result.message);
      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordForm(false);
        resetPassword();
        setPasswordSuccess(false);
      }, 2000);
    } else {
      toast.error(result.message);
    }
    setPasswordLoading(false);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FiUser className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <FiCheck className="w-3 h-3 text-white" />
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Profile Pengguna
                </h1>
                <p className="text-lg text-gray-600 mb-1">
                  Selamat datang, <span className="font-semibold text-blue-600">{user?.fullName}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Kemaskini maklumat profile dan keselamatan akaun anda
                </p>
              </div>
              
              {/* Status Badge */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Aktif</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <FiEdit3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Maklumat Profile</h2>
                    <p className="text-blue-100 text-sm">Kemaskini maklumat peribadi anda</p>
                  </div>
                </div>
              </div>
              
              {/* Form */}
              <div className="p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Username - Read Only */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FiUser className="inline w-4 h-4 mr-2" />
                      Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={user?.username || ''}
                        disabled
                        className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                      />
                      <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                      <FiLock className="w-3 h-3" />
                      Username tidak boleh ditukar
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FiUser className="inline w-4 h-4 mr-2" />
                      Nama Penuh *
                    </label>
                    <div className="relative">
                      <input
                        {...register('fullName', { 
                          required: 'Nama penuh diperlukan' 
                        })}
                        type="text"
                        className={`w-full px-4 py-3 pl-12 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        placeholder="Masukkan nama penuh"
                      />
                      <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {errors.fullName && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiX className="w-3 h-3" />
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FiMail className="inline w-4 h-4 mr-2" />
                      Email *
                    </label>
                    <div className="relative">
                      <input
                        {...register('email', { 
                          required: 'Email diperlukan',
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: 'Format email tidak sah'
                          }
                        })}
                        type="email"
                        className={`w-full px-4 py-3 pl-12 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        placeholder="contoh@email.com"
                      />
                      <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiX className="w-3 h-3" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Company */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FiHome className="inline w-4 h-4 mr-2" />
                      Nama Syarikat
                    </label>
                    <div className="relative">
                      <input
                        {...register('company')}
                        type="text"
                        className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nama syarikat (pilihan)"
                      />
                      <FiHome className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FiPhone className="inline w-4 h-4 mr-2" />
                      Nombor Telefon
                    </label>
                    <div className="relative">
                      <input
                        {...register('phone')}
                        type="tel"
                        className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Contoh: +60123456789"
                      />
                      <FiPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FiMapPin className="inline w-4 h-4 mr-2" />
                      Alamat
                    </label>
                    <div className="relative">
                      <textarea
                        {...register('address')}
                        rows={3}
                        className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Alamat lengkap"
                      />
                      <FiMapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`inline-flex items-center gap-2 px-8 py-3 font-semibold rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 disabled:cursor-not-allowed ${
                        saveSuccess
                          ? 'bg-green-500 text-white animate-bounce'
                          : loading
                            ? 'bg-blue-400 text-white cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                      }`}
                    >
                      {saveSuccess ? (
                        <>
                          <FiCheck className="w-5 h-5" />
                          Berjaya Disimpan!
                        </>
                      ) : loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sedang menyimpan...
                        </>
                      ) : (
                        <>
                          <FiSave className="w-5 h-5" />
                          Simpan Perubahan
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <FiShield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Keselamatan</h2>
                    <p className="text-emerald-100 text-sm">Tukar kata laluan</p>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {!showPasswordForm ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FiLock className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Kata Laluan</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Tukar kata laluan anda untuk keselamatan yang lebih baik
                    </p>
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all duration-200 hover:shadow-lg"
                    >
                      <FiEdit3 className="w-4 h-4" />
                      Tukar Kata Laluan
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Kata Laluan Semasa *
                      </label>
                      <div className="relative">
                        <input
                          {...registerPassword('currentPassword', { 
                            required: 'Kata laluan semasa diperlukan' 
                          })}
                          type={showPasswords.current ? 'text' : 'password'}
                          className={`w-full px-4 py-3 pl-12 pr-12 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                            passwordErrors.currentPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                          placeholder="Masukkan kata laluan semasa"
                        />
                        <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Kata Laluan Baru *
                      </label>
                      <div className="relative">
                        <input
                          {...registerPassword('newPassword', { 
                            required: 'Kata laluan baru diperlukan',
                            minLength: {
                              value: 6,
                              message: 'Kata laluan mestilah sekurang-kurangnya 6 aksara'
                            }
                          })}
                          type={showPasswords.new ? 'text' : 'password'}
                          className={`w-full px-4 py-3 pl-12 pr-12 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                            passwordErrors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                          placeholder="Masukkan kata laluan baru"
                        />
                        <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Sahkan Kata Laluan *
                      </label>
                      <div className="relative">
                        <input
                          {...registerPassword('confirmPassword', { 
                            required: 'Sahkan kata laluan diperlukan',
                            validate: (value, formValues) => 
                              value === formValues.newPassword || 'Kata laluan tidak sepadan'
                          })}
                          type={showPasswords.confirm ? 'text' : 'password'}
                          className={`w-full px-4 py-3 pl-12 pr-12 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                            passwordErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                          placeholder="Masukkan semula kata laluan baru"
                        />
                        <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          resetPassword();
                        }}
                        className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium rounded-xl transition-all duration-200"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className={`flex-1 px-4 py-2 font-semibold rounded-xl transition-all duration-300 ${
                          passwordSuccess
                            ? 'bg-green-500 text-white animate-bounce'
                            : passwordLoading
                              ? 'bg-emerald-400 text-white cursor-not-allowed'
                              : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                      >
                        {passwordSuccess ? (
                          <div className="flex items-center justify-center gap-1">
                            <FiCheck className="w-4 h-4" />
                            Berjaya update data!
                          </div>
                        ) : passwordLoading ? (
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Menukar...
                          </div>
                        ) : (
                          'Tukar'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
