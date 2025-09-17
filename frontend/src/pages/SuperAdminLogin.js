import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiShield, FiLock, FiUser, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';

const SuperAdminLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('superAdminToken', data.token);
        localStorage.setItem('superAdmin', JSON.stringify(data.superAdmin));
        navigate('/superadmin/dashboard');
      } else {
        setError(data.message || 'Log masuk gagal');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Ralat rangkaian. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-red-50 via-white to-orange-100/60 flex items-center justify-center px-4 py-10">
      {/* Latar: grid halus + blob gradient merah/ jingga */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#e5e7eb_1px,transparent_1.5px)] [background-size:20px_20px]"></div>
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-red-200/50 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-orange-300/40 blur-3xl"></div>
      </div>

      <div className="w-full max-w-5xl">
        <div className="grid gap-8 md:grid-cols-2 items-stretch">
          {/* Kad Log Masuk */}
          <div className="relative rounded-2xl bg-white/80 backdrop-blur p-8 shadow-xl ring-1 ring-gray-200 md:order-2">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg">
                <FiShield className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">SuperAdmin Log Masuk</h1>
              <p className="mt-1 text-sm text-gray-500">Sistem Pengurusan Invois</p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="sr-only">Username atau Email</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FiUser className="h-5 w-5" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={loading}
                      className="block w-full rounded-xl border-gray-300 pl-10 pr-3 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-red-400 focus:ring-red-400 sm:text-sm"
                      placeholder="Username atau Email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FiLock className="h-5 w-5" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      className="block w-full rounded-xl border-gray-300 pl-10 pr-10 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-red-400 focus:ring-red-400 sm:text-sm"
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      disabled={loading}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tunjukkan password'}
                    >
                      {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              >
                {loading ? 'Memproses...' : 'Log Masuk'}
              </button>

              {/* Maklumat default SuperAdmin */}
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
                <p className="font-medium text-gray-700 mb-1">Default SuperAdmin:</p>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  <p><span className="text-gray-500">Username:</span> superadmin</p>
                  <p><span className="text-gray-500">Email:</span> superadmin@invois.com</p>
                  <p><span className="text-gray-500">Password:</span> SuperAdmin123!</p>
                </div>
              </div>
            </form>
          </div>

          {/* Panel Info */}
          <div className="relative rounded-2xl bg-white/80 backdrop-blur p-8 shadow-xl ring-1 ring-gray-200 md:order-1">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
                <FiInfo className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Info Penting</h2>
                <p className="text-xs text-gray-500">Akses khas untuk SuperAdmin</p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-900">Garis Panduan</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-3"><FiCheckCircle className="mt-0.5 h-4 w-4 text-red-500" /><span>Gunakan akaun SuperAdmin yang diamanahkan sahaja.</span></li>
                  <li className="flex items-start gap-3"><FiCheckCircle className="mt-0.5 h-4 w-4 text-red-500" /><span>Pastikan keselamatan sistem ketika mengurus pengguna.</span></li>
                  <li className="flex items-start gap-3"><FiCheckCircle className="mt-0.5 h-4 w-4 text-red-500" /><span>Log keluar selepas selesai, terutamanya pada peranti awam.</span></li>
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

export default SuperAdminLogin;
