import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiEye, FiEyeOff, FiMail, FiInfo, FiCheckCircle, FiShield, FiUserPlus, FiArrowRight, FiStar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await registerUser(data);
    
    if (result.success) {
      setUserData(data);
      setShowSuccessModal(true);
      // Don't auto navigate - let user see the popup first
      // setTimeout(() => {
      //   navigate('/dashboard');
      // }, 3000);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-primary-50 via-white to-primary-100/60 flex items-center justify-center px-4 py-10">
      {/* Corak latar profesional: grid halus + blob gradient */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#e5e7eb_1px,transparent_1.5px)] [background-size:20px_20px]"></div>
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary-200/50 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary-300/40 blur-3xl"></div>
      </div>
      <div className="w-full max-w-5xl">
        <div className="grid gap-8 md:grid-cols-2 items-stretch">
          <div className="relative rounded-2xl bg-white/80 backdrop-blur p-8 shadow-xl ring-1 ring-gray-200 md:order-2">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg overflow-hidden">
                <FiUserPlus className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Daftar Akaun Baru</h1>
              <p className="mt-1 text-sm text-gray-500">Sistem Pengurusan Invois</p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="sr-only">Nama Penuh</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FiUser className="h-5 w-5" />
                    </div>
                    <input
                      id="fullName"
                      {...register('fullName', { 
                        required: 'Nama penuh diperlukan' 
                      })}
                      type="text"
                      aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                      className="block w-full rounded-xl border-gray-300 pl-10 pr-3 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-400 focus:ring-primary-400 sm:text-sm"
                      placeholder="Nama Penuh"
                    />
                  </div>
                  {errors.fullName && (
                    <p id="fullName-error" className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="sr-only">Email</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FiMail className="h-5 w-5" />
                    </div>
                    <input
                      id="email"
                      {...register('email', { 
                        required: 'Email diperlukan',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Format email tidak sah'
                        }
                      })}
                      type="email"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      className="block w-full rounded-xl border-gray-300 pl-10 pr-3 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-400 focus:ring-primary-400 sm:text-sm"
                      placeholder="contoh@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p id="email-error" className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="username" className="sr-only">Username</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FiUser className="h-5 w-5" />
                    </div>
                    <input
                      id="username"
                      {...register('username', { 
                        required: 'Username diperlukan',
                        minLength: {
                          value: 3,
                          message: 'Username minimum 3 aksara'
                        }
                      })}
                      type="text"
                      aria-invalid={!!errors.username}
                      aria-describedby={errors.username ? 'username-error' : undefined}
                      className="block w-full rounded-xl border-gray-300 pl-10 pr-3 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-400 focus:ring-primary-400 sm:text-sm"
                      placeholder="Username"
                    />
                  </div>
                  {errors.username && (
                    <p id="username-error" className="mt-1 text-xs text-red-600">{errors.username.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FiLock className="h-5 w-5" />
                    </div>
                    <input
                      id="password"
                      {...register('password', { 
                        required: 'Password diperlukan',
                        minLength: {
                          value: 6,
                          message: 'Password minimum 6 aksara'
                        }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      className="block w-full rounded-xl border-gray-300 pl-10 pr-10 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-400 focus:ring-primary-400 sm:text-sm"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tunjukkan password'}
                    >
                      {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="sr-only">Sahkan Password</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FiLock className="h-5 w-5" />
                    </div>
                    <input
                      id="confirmPassword"
                      {...register('confirmPassword', { 
                        required: 'Sila sahkan password',
                        validate: value =>
                          value === password || 'Password tidak sepadan'
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                      className="block w-full rounded-xl border-gray-300 pl-10 pr-10 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-400 focus:ring-primary-400 sm:text-sm"
                      placeholder="Sahkan Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                      aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tunjukkan password'}
                    >
                      {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p id="confirmPassword-error" className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Sedang memproses...' : 'Daftar Akaun'}
              </button>

              <p className="text-center text-sm text-gray-600">
                Sudah ada akaun?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Log masuk di sini
                </Link>
              </p>
            </form>
          </div>

          <div className="relative rounded-2xl bg-white/80 backdrop-blur p-8 shadow-xl ring-1 ring-gray-200 md:order-1">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100">
                <FiInfo className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Panduan Pendaftaran</h2>
                <p className="text-xs text-gray-500">Maklumat penting untuk akaun baru</p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-900">Keperluan akaun</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-3"><FiCheckCircle className="mt-0.5 h-4 w-4 text-primary-500" /><span>Nama penuh mesti sama dengan dokumen rasmi.</span></li>
                  <li className="flex items-start gap-3"><FiCheckCircle className="mt-0.5 h-4 w-4 text-primary-500" /><span>Email akan digunakan untuk notifikasi sistem.</span></li>
                  <li className="flex items-start gap-3"><FiCheckCircle className="mt-0.5 h-4 w-4 text-primary-500" /><span>Username mesti unik dan mudah diingati.</span></li>
                  <li className="flex items-start gap-3"><FiCheckCircle className="mt-0.5 h-4 w-4 text-primary-500" /><span>Password minimum 6 aksara untuk keselamatan.</span></li>
                </ul>
              </div>

              <div className="pt-5 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-900">Selepas pendaftaran</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-3"><FiShield className="mt-0.5 h-4 w-4 text-primary-500" /><span>Log masuk dengan kredensial yang baru dicipta.</span></li>
                  <li className="flex items-start gap-3"><FiUser className="mt-0.5 h-4 w-4 text-primary-500" /><span>Kemas kini profil dan maklumat syarikat.</span></li>
                  <li className="flex items-start gap-3"><FiCheckCircle className="mt-0.5 h-4 w-4 text-primary-500" /><span>Mula mencipta invois dan mengurus pelanggan.</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Invois</span>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={handleCloseModal}
          ></div>
          
          {/* Modal */}
          <div className="relative w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20"></div>
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-5 -left-5 w-16 h-16 bg-white/10 rounded-full"></div>
                
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <FiCheckCircle className="w-10 h-10 text-white animate-pulse" />
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="px-8 py-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Pendaftaran Berjaya!
                </h2>
                <p className="text-gray-600 mb-4">
                  Selamat datang ke sistem pengurusan invois kami
                </p>
                
                {/* User info card */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <FiUser className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{userData?.fullName}</p>
                      <p className="text-sm text-gray-500">@{userData?.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiMail className="w-4 h-4" />
                    <span>{userData?.email}</span>
                  </div>
                </div>
                
                {/* Next steps */}
                <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <FiStar className="w-4 h-4" />
                    Langkah Seterusnya
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Kemas kini profil anda</li>
                    <li>• Tambah maklumat syarikat</li>
                    <li>• Mula cipta invois pertama</li>
                  </ul>
                </div>
                
                {/* Auto redirect countdown */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span>Mengalihkan ke Dashboard dalam 3 saat...</span>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 hover:shadow-lg"
                  >
                    <FiArrowRight className="w-4 h-4" />
                    Ke Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;