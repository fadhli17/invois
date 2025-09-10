import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
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
    const result = await updateProfile(data);
    
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    const result = await changePassword(data);
    
    if (result.success) {
      toast.success(result.message);
      setShowPasswordForm(false);
      resetPassword();
    } else {
      toast.error(result.message);
    }
    setPasswordLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile Pengguna</h1>
        <p className="mt-1 text-sm text-gray-600">
          Kemaskini maklumat profile anda
        </p>
      </div>

      <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="mt-1 input bg-gray-100"
            />
            <p className="mt-1 text-sm text-gray-500">
              Username tidak boleh ditukar
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nama Penuh *
            </label>
            <input
              {...register('fullName', { 
                required: 'Nama penuh diperlukan' 
              })}
              type="text"
              className="mt-1 input"
              placeholder="Masukkan nama penuh"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
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
              className="mt-1 input"
              placeholder="contoh@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nama Syarikat
            </label>
            <input
              {...register('company')}
              type="text"
              className="mt-1 input"
              placeholder="Nama syarikat (pilihan)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombor Telefon
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="mt-1 input"
              placeholder="Contoh: +60123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Alamat
            </label>
            <textarea
              {...register('address')}
              rows={3}
              className="mt-1 input"
              placeholder="Alamat lengkap"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Sedang menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {/* Form Tukar Kata Laluan */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Keselamatan</h2>
          <p className="mt-1 text-sm text-gray-600">
            Tukar kata laluan anda untuk keselamatan yang lebih baik
          </p>
        </div>

        {!showPasswordForm ? (
          <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
            <button
              onClick={() => setShowPasswordForm(true)}
              className="btn-secondary"
            >
              Tukar Kata Laluan
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kata Laluan Semasa *
                </label>
                <input
                  {...registerPassword('currentPassword', { 
                    required: 'Kata laluan semasa diperlukan' 
                  })}
                  type="password"
                  className="mt-1 input"
                  placeholder="Masukkan kata laluan semasa"
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kata Laluan Baru *
                </label>
                <input
                  {...registerPassword('newPassword', { 
                    required: 'Kata laluan baru diperlukan',
                    minLength: {
                      value: 6,
                      message: 'Kata laluan mestilah sekurang-kurangnya 6 aksara'
                    }
                  })}
                  type="password"
                  className="mt-1 input"
                  placeholder="Masukkan kata laluan baru"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sahkan Kata Laluan Baru *
                </label>
                <input
                  {...registerPassword('confirmPassword', { 
                    required: 'Sahkan kata laluan diperlukan',
                    validate: (value, formValues) => 
                      value === formValues.newPassword || 'Kata laluan tidak sepadan'
                  })}
                  type="password"
                  className="mt-1 input"
                  placeholder="Masukkan semula kata laluan baru"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    resetPassword();
                  }}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn-primary"
                >
                  {passwordLoading ? 'Sedang menukar...' : 'Tukar Kata Laluan'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
