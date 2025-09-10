import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const newPassword = watch('newPassword');
  const confirmPassword = watch('confirmPassword');
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Token reset password tidak ditemui');
      navigate('/forgot-password');
      return;
    }

    verifyToken();
  }, [token, navigate]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/verify-reset-token/${token}`);
      setTokenValid(true);
    } catch (error) {
      toast.error('Token tidak sah atau telah tamat tempoh');
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Kata laluan tidak sepadan');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token,
        newPassword: data.newPassword
      });
      
      toast.success('Kata laluan berjaya dikemaskini');
      setPasswordReset(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ralat berlaku. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="relative min-h-screen w-full bg-gradient-to-br from-primary-50 via-white to-primary-100/60 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="relative rounded-2xl bg-white/80 backdrop-blur p-8 shadow-xl ring-1 ring-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Mengesahkan token...</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="relative min-h-screen w-full bg-gradient-to-br from-primary-50 via-white to-primary-100/60 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="relative rounded-2xl bg-white/80 backdrop-blur p-8 shadow-xl ring-1 ring-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                <FiAlertCircle className="h-8 w-8" />
              </div>
              
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Token Tidak Sah
              </h1>
              
              <p className="text-gray-600 mb-6">
                Link reset password tidak sah atau telah tamat tempoh. Sila minta link baru.
              </p>

              <Link
                to="/forgot-password"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
              >
                Minta Link Baru
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="relative min-h-screen w-full bg-gradient-to-br from-primary-50 via-white to-primary-100/60 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="relative rounded-2xl bg-white/80 backdrop-blur p-8 shadow-xl ring-1 ring-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <FiCheckCircle className="h-8 w-8" />
              </div>
              
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Berjaya!
              </h1>
              
              <p className="text-gray-600 mb-6">
                Kata laluan anda telah berjaya dikemaskini. Anda boleh log masuk dengan kata laluan baru.
              </p>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
              >
                Log Masuk Sekarang
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-primary-50 via-white to-primary-100/60 flex items-center justify-center px-4 py-10">
      {/* Background Pattern */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#e5e7eb_1px,transparent_1.5px)] [background-size:20px_20px]"></div>
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary-200/50 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary-300/40 blur-3xl"></div>
      </div>

      <div className="w-full max-w-md">
        <div className="relative rounded-2xl bg-white/80 backdrop-blur p-8 shadow-xl ring-1 ring-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
              <FiLock className="h-7 w-7" />
            </div>
            
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Set Kata Laluan Baru
            </h1>
            
            <p className="mt-2 text-sm text-gray-600">
              Masukkan kata laluan baru untuk akaun anda
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="newPassword" className="sr-only">Kata Laluan Baru</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FiLock className="h-5 w-5" />
                </div>
                <input
                  id="newPassword"
                  {...register('newPassword', { 
                    required: 'Kata laluan diperlukan',
                    minLength: {
                      value: 6,
                      message: 'Kata laluan mesti sekurang-kurangnya 6 aksara'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  aria-invalid={!!errors.newPassword}
                  aria-describedby={errors.newPassword ? 'newPassword-error' : undefined}
                  className="block w-full rounded-xl border-gray-300 pl-10 pr-10 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-400 focus:ring-primary-400 sm:text-sm"
                  placeholder="Kata laluan baru"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p id="newPassword-error" className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">Sahkan Kata Laluan</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FiLock className="h-5 w-5" />
                </div>
                <input
                  id="confirmPassword"
                  {...register('confirmPassword', { 
                    required: 'Sahkan kata laluan diperlukan',
                    validate: value => value === newPassword || 'Kata laluan tidak sepadan'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  className="block w-full rounded-xl border-gray-300 pl-10 pr-10 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-400 focus:ring-primary-400 sm:text-sm"
                  placeholder="Sahkan kata laluan baru"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                >
                  {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sedang mengemaskini...' : 'Kemaskini Kata Laluan'}
            </button>

            <div className="text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
              >
                <FiArrowLeft className="h-4 w-4" />
                Kembali ke Log Masuk
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Invois</span>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
