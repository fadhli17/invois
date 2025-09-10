import React, { useEffect, useState, useRef } from 'react';
import { FiSave, FiUpload, FiImage, FiX, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { token, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('invoice');
  
  // Debug authentication status
  console.log('Settings component - token:', token ? 'Present' : 'Missing', 'isAuthenticated:', isAuthenticated);
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [quotePrefix, setQuotePrefix] = useState('QUO');
  const [currency, setCurrency] = useState('MYR');
  const [language, setLanguage] = useState('ms');
  const [showCompanyLogo, setShowCompanyLogo] = useState(true);
  const [compactTables, setCompactTables] = useState(false);
  const [companyLogo, setCompanyLogo] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [faviconPreview, setFaviconPreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('app_settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.invoicePrefix) setInvoicePrefix(s.invoicePrefix);
        if (s.quotePrefix) setQuotePrefix(s.quotePrefix);
        if (s.currency) setCurrency(s.currency);
        if (s.language) setLanguage(s.language);
        if (typeof s.showCompanyLogo === 'boolean') setShowCompanyLogo(s.showCompanyLogo);
        if (typeof s.compactTables === 'boolean') setCompactTables(s.compactTables);
        if (s.companyLogo) {
          setCompanyLogo(s.companyLogo);
          setLogoPreview(s.companyLogo);
          setFaviconPreview(s.companyLogo);
        }
      }
    } catch (e) {
      // ignore malformed settings
    }
  }, []);

  // Load favicon on page load
  useEffect(() => {
    try {
      const raw = localStorage.getItem('app_settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.companyLogo) {
          updateFavicon(s.companyLogo);
        }
      }
    } catch (e) {
      // ignore malformed settings
    }
  }, []);

  // Load logo from server
  useEffect(() => {
    const loadLogoFromServer = async () => {
      if (!token || !isAuthenticated) {
        console.log('No token or not authenticated for logo loading');
        return;
      }
      
      try {
        const response = await axios.get('${API_BASE_URL}/api/logos/current', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.data.logo) {
          const logoUrl = `${API_BASE_URL}${response.data.logo.url}`;
          setCompanyLogo(logoUrl);
          setLogoPreview(logoUrl);
          setFaviconPreview(logoUrl);
          updateFavicon(logoUrl);
        }
      } catch (error) {
        console.log('No logo found on server or error loading:', error.message);
      }
    };

    loadLogoFromServer();
  }, [token, isAuthenticated]);

  // Handle logo upload
  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!token || !isAuthenticated) {
      toast.error('Sila log masuk terlebih dahulu untuk memuat naik logo');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Saiz fail mesti kurang dari 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Sila pilih fail imej sahaja');
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('logo', file);

      // Upload to server
      console.log('Uploading logo with token:', token ? 'Token present' : 'No token');
      const response = await axios.post('${API_BASE_URL}/api/logos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.logo) {
        const logoUrl = `${API_BASE_URL}${response.data.logo.url}`;
        
        setCompanyLogo(logoUrl);
        setLogoPreview(logoUrl);
        setFaviconPreview(logoUrl);
        
        // Create optimized favicon from the uploaded image
        createOptimizedFavicon(logoUrl);
        
        toast.success('Logo berjaya dimuat naik ke server!');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Gagal memuat naik logo: ' + (error.response?.data?.message || error.message));
    }
  };

  // Create optimized favicon from uploaded image
  const createOptimizedFavicon = (logoDataUrl) => {
    const img = new Image();
    img.onload = () => {
      // Create canvas for favicon
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to 32x32 for favicon
      canvas.width = 32;
      canvas.height = 32;
      
      // Clear canvas with transparent background
      ctx.clearRect(0, 0, 32, 32);
      
      // Draw image centered and scaled to fit
      const scale = Math.min(32 / img.width, 32 / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (32 - scaledWidth) / 2;
      const y = (32 - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      // Convert to PNG data URL
      const faviconDataUrl = canvas.toDataURL('image/png');
      console.log('Optimized favicon data URL:', faviconDataUrl.substring(0, 100) + '...');
      
      // Try blob URL approach as well
      canvas.toBlob((blob) => {
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          console.log('Blob URL created:', blobUrl);
          
          // Update favicon with blob URL first
          updateFaviconWithBlob(blobUrl);
          
          // Then update with data URL as fallback
          setTimeout(() => {
            updateFavicon(faviconDataUrl);
          }, 100);
        } else {
          // Fallback to data URL
          updateFavicon(faviconDataUrl);
        }
      }, 'image/png');
      
      // Force refresh after a delay
      setTimeout(() => {
        updateFavicon(faviconDataUrl);
      }, 500);
    };
    
    img.onerror = () => {
      console.error('Error loading image for favicon');
      // Fallback to original data URL
      updateFavicon(logoDataUrl);
    };
    
    img.src = logoDataUrl;
  };

  // Update favicon with blob URL
  const updateFaviconWithBlob = (blobUrl) => {
    try {
      // Remove all existing favicon links
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());

      // Create new favicon with blob URL
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/png';
      favicon.href = blobUrl;
      favicon.sizes = '32x32';
      document.head.appendChild(favicon);

      // Add generic favicon
      const faviconGeneric = document.createElement('link');
      faviconGeneric.rel = 'icon';
      faviconGeneric.type = 'image/png';
      faviconGeneric.href = blobUrl;
      document.head.appendChild(faviconGeneric);

      console.log('Favicon updated with blob URL:', blobUrl);
    } catch (error) {
      console.error('Error updating favicon with blob:', error);
    }
  };

  // Update favicon
  const updateFavicon = (logoDataUrl) => {
    try {
      // Remove all existing favicon links
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());

      // Add timestamp to bypass cache
      const timestamp = Date.now();
      const faviconUrl = `${logoDataUrl}?t=${timestamp}`;

      // Create new favicon with multiple sizes and types
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/png';
      favicon.href = faviconUrl;
      favicon.sizes = '32x32';
      document.head.appendChild(favicon);

      // Add 16x16 favicon
      const favicon16 = document.createElement('link');
      favicon16.rel = 'icon';
      favicon16.type = 'image/png';
      favicon16.href = faviconUrl;
      favicon16.sizes = '16x16';
      document.head.appendChild(favicon16);

      // Add generic favicon without size specification
      const faviconGeneric = document.createElement('link');
      faviconGeneric.rel = 'icon';
      faviconGeneric.type = 'image/png';
      faviconGeneric.href = faviconUrl;
      document.head.appendChild(faviconGeneric);

      // Add apple-touch-icon for better compatibility
      const appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      appleTouchIcon.href = faviconUrl;
      appleTouchIcon.sizes = '180x180';
      document.head.appendChild(appleTouchIcon);

      // Add shortcut icon (legacy support)
      const shortcutIcon = document.createElement('link');
      shortcutIcon.rel = 'shortcut icon';
      shortcutIcon.type = 'image/png';
      shortcutIcon.href = faviconUrl;
      document.head.appendChild(shortcutIcon);

      // Force browser to reload favicon by temporarily changing document title
      const originalTitle = document.title;
      document.title = originalTitle + ' ';
      setTimeout(() => {
        document.title = originalTitle;
      }, 10);

      // Additional force refresh techniques
      setTimeout(() => {
        // Method 1: Remove and re-add favicon
        const faviconLinks = document.querySelectorAll('link[rel*="icon"]');
        faviconLinks.forEach(link => {
          const parent = link.parentNode;
          const newLink = link.cloneNode(true);
          parent.removeChild(link);
          parent.appendChild(newLink);
        });

        // Method 2: Trigger window focus event
        window.dispatchEvent(new Event('focus'));
        
        // Method 3: Change document title again
        document.title = originalTitle + ' ';
        setTimeout(() => {
          document.title = originalTitle;
        }, 50);
      }, 100);

      console.log('Favicon updated successfully:', faviconUrl);
    } catch (error) {
      console.error('Error updating favicon:', error);
    }
  };

  // Remove logo
  const removeLogo = async () => {
    if (!token || !isAuthenticated) {
      toast.error('Sila log masuk terlebih dahulu untuk memadam logo');
      return;
    }
    
    try {
      // Get current logo from server to get the ID
      const response = await axios.get('${API_BASE_URL}/api/logos/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.data.logo) {
        // Delete from server
        await axios.delete(`${API_BASE_URL}/api/logos/${response.data.logo.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.log('Error deleting logo from server:', error.message);
    }

    setCompanyLogo('');
    setLogoPreview('');
    setFaviconPreview('');
    
    // Reset to default favicon
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(favicon => favicon.remove());
    
    // Add back default favicon
    const defaultFavicon = document.createElement('link');
    defaultFavicon.rel = 'icon';
    defaultFavicon.type = 'image/svg+xml';
    defaultFavicon.href = '/favicon.svg';
    document.head.appendChild(defaultFavicon);
    
    toast.success('Logo telah dibuang dari server!');
  };

  const saveSettings = () => {
    const payload = {
      invoicePrefix,
      quotePrefix,
      currency,
      language,
      showCompanyLogo,
      compactTables,
      companyLogo
    };
    localStorage.setItem('app_settings', JSON.stringify(payload));
    toast.success('Tetapan berjaya disimpan!');
  };

  return (
    <div className="relative w-full bg-gradient-to-br from-primary-50 via-white to-primary-100/60 px-4 py-6 md:py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tetapan</h1>
            <p className="text-sm text-gray-600">Ubah suai tetapan aplikasi anda</p>
          </div>
          <button onClick={saveSettings} className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700 shadow-sm hover:bg-primary-100">
            <FiSave className="w-4 h-4" /> Simpan
          </button>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl bg-white/80 backdrop-blur p-4 md:p-6 shadow-lg ring-1 ring-gray-200">
          <div className="mb-4 flex gap-2">
            <button onClick={() => setActiveTab('invoice')} className={`px-3 py-2 rounded-lg text-sm ${activeTab === 'invoice' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Invois</button>
            <button onClick={() => setActiveTab('display')} className={`px-3 py-2 rounded-lg text-sm ${activeTab === 'display' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Paparan</button>
            <button onClick={() => setActiveTab('logo')} className={`px-3 py-2 rounded-lg text-sm ${activeTab === 'logo' ? 'bg-green-50 text-green-700 border border-green-200' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Logo & Favicon</button>
          </div>

          {activeTab === 'invoice' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prefix Invois</label>
                <input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())} className="input" maxLength={5} />
                <p className="text-xs text-gray-500 mt-1">Contoh nombor: {invoicePrefix}-202501-001</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prefix Sebut Harga</label>
                <input value={quotePrefix} onChange={(e) => setQuotePrefix(e.target.value.toUpperCase())} className="input" maxLength={5} />
                <p className="text-xs text-gray-500 mt-1">Contoh nombor: {quotePrefix}-202501-001</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mata Wang</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input">
                    <option value="MYR">MYR (Ringgit Malaysia)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="SGD">SGD (Singapore Dollar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bahasa</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input">
                    <option value="ms">Bahasa Melayu</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input id="logo" type="checkbox" checked={showCompanyLogo} onChange={(e) => setShowCompanyLogo(e.target.checked)} className="h-4 w-4" />
                <label htmlFor="logo" className="text-sm text-gray-700">Papar logo syarikat pada invois</label>
              </div>
              <div className="flex items-center gap-3">
                <input id="compact" type="checkbox" checked={compactTables} onChange={(e) => setCompactTables(e.target.checked)} className="h-4 w-4" />
                <label htmlFor="compact" className="text-sm text-gray-700">Mod jadual padat (compact)</label>
              </div>
              <p className="text-xs text-gray-500">Sesetengah tetapan paparan akan digunakan pada halaman invois dan senarai.</p>
            </div>
          )}

          {activeTab === 'logo' && (
            <div className="space-y-6">
              {/* Logo Upload Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo Syarikat</h3>
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  
                  {!logoPreview ? (
                    <div>
                      <FiImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-600 mb-2">Klik untuk memuat naik logo syarikat</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF (Maksimum 2MB)</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FiUpload className="w-4 h-4" />
                        Pilih Fail
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="relative inline-block">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="max-h-32 max-w-full rounded-lg shadow-sm"
                        />
                        <button
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Logo berjaya dimuat naik</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Tukar Logo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Favicon Preview */}
              {faviconPreview && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pratonton Favicon</h3>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <img
                        src={faviconPreview}
                        alt="Favicon"
                        className="w-6 h-6 rounded"
                      />
                      <span className="text-sm text-gray-600">Tab Browser</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        src={faviconPreview}
                        alt="Favicon"
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-600">Bookmark</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Logo ini akan dipaparkan sebagai favicon pada tab browser dan bookmark.
                  </p>
                </div>
              )}

              {/* Logo Usage Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Cara Logo Digunakan:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• <strong>Favicon:</strong> Dipaparkan pada tab browser dan bookmark</li>
                  <li>• <strong>Invois:</strong> Logo akan dipaparkan pada dokumen invois (jika diaktifkan)</li>
                  <li>• <strong>Format:</strong> PNG, JPG, atau GIF (disyorkan: PNG dengan latar belakang telus)</li>
                  <li>• <strong>Saiz:</strong> Maksimum 2MB, disyorkan 512x512px untuk kualiti terbaik</li>
                </ul>
              </div>

              {/* Debug Section */}
              {faviconPreview && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-yellow-900 mb-2">Debug Favicon:</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          console.log('Current favicon links:', document.querySelectorAll('link[rel*="icon"]'));
                          console.log('Company logo:', companyLogo);
                          if (companyLogo) {
                            updateFavicon(companyLogo);
                            toast.success('Favicon refreshed!');
                          } else {
                            toast.error('Tiada logo untuk refresh favicon!');
                          }
                        }}
                        className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                      >
                        Refresh Favicon
                      </button>
                      <button
                        onClick={() => {
                          const links = document.querySelectorAll('link[rel*="icon"]');
                          console.log('=== FAVICON DEBUG INFO ===');
                          console.log('Total favicon links:', links.length);
                          links.forEach((link, index) => {
                            console.log(`Favicon ${index + 1}:`, {
                              rel: link.rel,
                              type: link.type,
                              href: link.href.substring(0, 100) + '...',
                              sizes: link.sizes
                            });
                          });
                          console.log('Company logo length:', companyLogo ? companyLogo.length : 'null');
                          console.log('========================');
                          toast.success('Check console for favicon debug info!');
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Debug Info
                      </button>
                      <button
                        onClick={() => {
                          // Test with a simple colored square
                          const canvas = document.createElement('canvas');
                          canvas.width = 32;
                          canvas.height = 32;
                          const ctx = canvas.getContext('2d');
                          ctx.fillStyle = '#ff6b6b';
                          ctx.fillRect(0, 0, 32, 32);
                          ctx.fillStyle = 'white';
                          ctx.font = 'bold 16px Arial';
                          ctx.textAlign = 'center';
                          ctx.fillText('T', 16, 22);
                          const testFavicon = canvas.toDataURL('image/png');
                          updateFavicon(testFavicon);
                          toast.success('Test favicon applied!');
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        Test Favicon
                      </button>
                      <button
                        onClick={() => {
                          // Test with company logo if available
                          if (companyLogo) {
                            console.log('Testing with company logo...');
                            createOptimizedFavicon(companyLogo);
                            toast.success('Company logo favicon test!');
                          } else {
                            toast.error('Tiada company logo untuk test!');
                          }
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Test Company Logo
                      </button>
                      <button
                        onClick={() => {
                          // Force refresh with multiple techniques
                          if (companyLogo) {
                            // Method 1: Update with new timestamp
                            updateFavicon(companyLogo);
                            
                            // Method 2: Force reload by changing href multiple times
                            setTimeout(() => {
                              const links = document.querySelectorAll('link[rel*="icon"]');
                              links.forEach(link => {
                                const originalHref = link.href;
                                link.href = originalHref.split('?')[0] + '?force=' + Math.random();
                                setTimeout(() => {
                                  link.href = originalHref;
                                }, 50);
                              });
                            }, 100);
                            
                            // Method 3: Trigger page visibility change
                            setTimeout(() => {
                              const event = new Event('visibilitychange');
                              document.dispatchEvent(event);
                            }, 200);
                            
                            toast.success('Force refresh favicon! Check tab browser.');
                          } else {
                            toast.error('Tiada logo untuk refresh!');
                          }
                        }}
                        className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                      >
                        Force Refresh
                      </button>
                      <button
                        onClick={() => {
                          // Test with a very simple favicon
                          const canvas = document.createElement('canvas');
                          canvas.width = 16;
                          canvas.height = 16;
                          const ctx = canvas.getContext('2d');
                          ctx.fillStyle = '#00ff00';
                          ctx.fillRect(0, 0, 16, 16);
                          ctx.fillStyle = 'white';
                          ctx.font = 'bold 12px Arial';
                          ctx.textAlign = 'center';
                          ctx.fillText('✓', 8, 12);
                          const simpleFavicon = canvas.toDataURL('image/png');
                          updateFavicon(simpleFavicon);
                          toast.success('Simple green favicon applied!');
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Simple Test
                      </button>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-yellow-800">
                        Jika favicon tidak berubah, cuba:
                      </p>
                      <ul className="text-xs text-yellow-700 space-y-1 ml-4">
                        <li>• Klik "Force Refresh" button</li>
                        <li>• Hard refresh: Ctrl+F5 (Windows) atau Cmd+Shift+R (Mac)</li>
                        <li>• Buka tab baru</li>
                        <li>• Clear browser cache</li>
                        <li>• Restart browser</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;


