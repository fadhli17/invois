import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiEye, FiEyeOff, FiInfo, FiCheckCircle, FiShield, FiLogOut, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const watchedUsername = watch('username');

  // Function to check user status
  const checkUserStatus = async (username) => {
    if (!username || username.length < 3) {
      setUserStatus(null);
      return;
    }

    setCheckingStatus(true);
    try {
      const response = await fetch(`http://localhost:3001/api/superadmin/check-user-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });
      
      const data = await response.json();
      setUserStatus(data);
    } catch (error) {
      console.error('Error checking user status:', error);
      setUserStatus(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Debounced username check
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedUsername) {
        checkUserStatus(watchedUsername);
      } else {
        setUserStatus(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedUsername]);

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await login(data);
    
    if (result.success) {
      toast.success(result.message);
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
    setLoading(false);
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
                <span className="text-2xl font-bold">IN</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Log Masuk</h1>
              <p className="mt-1 text-sm text-gray-500">Sistem Pengurusan Invois</p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="sr-only">Username</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FiUser className="h-5 w-5" />
                    </div>
                    <input
                      id="username"
                      {...register('username', { required: 'Username diperlukan' })}
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
                      {...register('password', { required: 'Password diperlukan' })}
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

                {/* User Status Display */}
                {userStatus && (
                  <div className={`mt-3 p-3 rounded-lg border ${
                    userStatus.success && userStatus.user?.isActive 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {checkingStatus ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      ) : userStatus.success && userStatus.user?.isActive ? (
                        <FiCheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <FiXCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          userStatus.success && userStatus.user?.isActive 
                            ? 'text-green-800' 
                            : 'text-red-800'
                        }`}>
                          {userStatus.success ? userStatus.message : 'Pengguna tidak ditemui'}
                        </p>
                        {userStatus.success && userStatus.user && (
                          <p className="text-xs text-gray-600 mt-1">
                            {userStatus.user.fullName} • {userStatus.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (userStatus && userStatus.success && !userStatus.user?.isActive)}
                className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  userStatus && userStatus.success && !userStatus.user?.isActive
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'
                }`}
              >
                {loading ? 'Sedang memproses...' : 
                 (userStatus && userStatus.success && !userStatus.user?.isActive) ? 'Akaun Dinyahaktifkan' : 
                 'Log Masuk'}
              </button>

              {/* Account Deactivated Info */}
              {userStatus && userStatus.success && !userStatus.user?.isActive && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FiAlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Akaun Dinyahaktifkan</h3>
                      <p className="text-xs text-red-700 mt-1">
                        Akaun anda telah dinyahaktifkan oleh pentadbir sistem. 
                        Sila hubungi pentadbir untuk mengaktifkan semula akaun anda.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-center text-sm text-gray-600">
                  Belum ada akaun?{' '}
                  <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                    Daftar di sini
                  </Link>
                </p>
                
                <p className="text-center text-sm text-gray-600">
                  Lupa kata laluan?{' '}
                  <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                    Reset di sini
                  </Link>
                </p>

                {/* SuperAdmin Access Button */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-center text-xs text-gray-500 mb-3">Akses Pentadbir</p>
                  <Link 
                    to="/superadmin/login"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
                  >
                    <FiShield className="h-4 w-4" />
                    Portal SuperAdmin
                  </Link>
                </div>
              </div>
            </form>
          </div>

          <div className="relative rounded-2xl bg-white/80 backdrop-blur p-8 shadow-xl ring-1 ring-gray-200 md:order-1">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100">
                <FiInfo className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Info Penting</h2>
                <p className="text-xs text-gray-500">Sedikit panduan sebelum anda bermula</p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-900">Sebelum anda bermula</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-3"><FiCheckCircle className="mt-0.5 h-4 w-4 text-primary-500" /><span>Gunakan akaun yang diberikan oleh pentadbir organisasi.</span></li>
                  <li className="flex items-start gap-3"><FiCheckCircle className="mt-0.5 h-4 w-4 text-primary-500" /><span>Kemas kini profil syarikat serta maklumat invois.</span></li>
                  <li className="flex items-start gap-3"><FiCheckCircle className="mt-0.5 h-4 w-4 text-primary-500" /><span>Semak tetapan cukai, mata wang dan nombor siri invois.</span></li>
                  <li className="flex items-start gap-3"><FiCheckCircle className="mt-0.5 h-4 w-4 text-primary-500" /><span>Pastikan emel pelanggan betul sebelum menghantar invois.</span></li>
                </ul>
              </div>

              <div className="pt-5 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-900">Privasi & keselamatan</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-3"><FiShield className="mt-0.5 h-4 w-4 text-primary-500" /><span>Jangan kongsi kata laluan. Gunakan kata laluan yang kukuh.</span></li>
                  <li className="flex items-start gap-3"><FiLogOut className="mt-0.5 h-4 w-4 text-primary-500" /><span>Log keluar selepas selesai terutamanya pada peranti awam.</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Invois</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
