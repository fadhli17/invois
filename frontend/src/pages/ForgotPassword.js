import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiMail, FiArrowLeft, FiCheckCircle, FiInfo } from 'react-icons/fi';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const email = watch('email');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      console.log('Sending request to:', `${API_BASE_URL}/api/auth/forgot-password`);
      console.log('Request data:', { email: data.email });
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email: data.email
      });
      
      console.log('Response received:', response.data);
      console.log('Reset URL in response:', response.data.resetUrl);
      toast.success(response.data.message);
      setEmailSent(true);
      
      // In development, show the reset URL
      if (response.data.resetUrl) {
        console.log('Setting reset URL:', response.data.resetUrl);
        setResetUrl(response.data.resetUrl);
        toast.success(`Development: Reset URL: ${response.data.resetUrl}`, { duration: 10000 });
        
        // Add copy to clipboard functionality
        if (navigator.clipboard) {
          navigator.clipboard.writeText(response.data.resetUrl).then(() => {
            toast.success('Link reset telah disalin ke clipboard!', { duration: 5000 });
          });
        }
      } else {
        console.log('No reset URL in response');
      }
    } catch (error) {
      console.error('Error details:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || 'Ralat berlaku. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <FiCheckCircle className="h-8 w-8" />
              </div>
              
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
                Email Dihantar!
              </h1>
              
              <p className="text-gray-600 mb-6">
                Kami telah menghantar link reset password ke <strong>{email}</strong>
              </p>

              <div className="w-full p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                <div className="flex items-start gap-3">
                  <FiInfo className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Apa yang perlu dilakukan seterusnya:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Periksa folder spam/junk jika tidak menerima email</li>
                      <li>• Klik link dalam email untuk reset password</li>
                      <li>• Link akan tamat tempoh dalam 15 minit</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <FiArrowLeft className="h-4 w-4" />
                  Kembali ke Log Masuk
                </Link>
                
                <button
                  onClick={() => setEmailSent(false)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors"
                >
                  <FiMail className="h-4 w-4" />
                  Hantar Semula
                </button>
              </div>

              {/* Development Mode - Direct Link */}
              {(resetUrl || process.env.NODE_ENV === 'development') && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Development Mode:</p>
                  {resetUrl ? (
                    <>
                      <p className="text-xs text-yellow-700 mb-2">Reset URL: {resetUrl}</p>
                      <button
                        onClick={() => window.open(resetUrl, '_blank')}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors"
                      >
                        🔗 Buka Link Reset
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-yellow-700 mb-2">
                        Link reset tidak tersedia. Periksa console untuk link reset.
                      </p>
                      <button
                        onClick={() => {
                          // Use the latest token from terminal output
                          const latestToken = "1d68c22eca0e7884bac217b08691711c365daebfbc35b84af85c6df9dd2e69b5";
                          const testUrl = `http://localhost:3002/reset-password?token=${latestToken}`;
                          window.open(testUrl, '_blank');
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 border border-yellow-300 rounded hover:bg-yellow-200 transition-colors"
                      >
                        🧪 Test dengan Token Terbaru
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <p>Debug: resetUrl = "{resetUrl}"</p>
                  <p>Debug: emailSent = {emailSent.toString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            <span>© {new Date().getFullYear()} Invois</span>
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
              <FiMail className="h-7 w-7" />
            </div>
            
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Lupa Kata Laluan?
            </h1>
            
            <p className="mt-2 text-sm text-gray-600">
              Masukkan email anda dan kami akan menghantar link untuk reset password
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Format email tidak sah'
                    }
                  })}
                  type="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className="block w-full rounded-xl border-gray-300 pl-10 pr-3 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-400 focus:ring-primary-400 sm:text-sm"
                  placeholder="Masukkan email anda"
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sedang menghantar...' : 'Hantar Link Reset'}
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

export default ForgotPassword;
