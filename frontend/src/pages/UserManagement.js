import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FiUsers, FiSearch, FiFilter, FiRefreshCw, FiPlus, FiEdit, FiTrash2,
  FiToggleLeft, FiToggleRight, FiChevronLeft, FiChevronRight,
  FiCheckCircle, FiXCircle, FiClock, FiEye, FiAlertCircle,
  FiUser, FiMail, FiHome, FiCalendar, FiSettings, FiX,
  FiFileText, FiDollarSign
} from 'react-icons/fi';
import './UserManagement.css';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userStatus, setUserStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUserDetails, setViewUserDetails] = useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', company: '', username: '', phone: '', address: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    checkAuth();
    fetchStats();
    fetchUsers();
    loadTheme();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, userStatus, currentPage]);

  const checkAuth = () => {
    const token = localStorage.getItem('superAdminToken');
    if (!token) {
      navigate('/superadmin/login');
    }
  };

  const loadTheme = () => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      // ignore malformed theme setting
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_BASE}/api/superadmin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('superAdminToken');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: userStatus
      });
      
      const response = await fetch(`${API_BASE}/api/superadmin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        toast.error(
          <div className="toast-content">
            <FiAlertCircle className="toast-icon error" />
            <span>Ralat memuatkan senarai pengguna</span>
          </div>
        );
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Ralat memuatkan senarai pengguna</span>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_BASE}/api/superadmin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
        
        if (data.user.isActive) {
          toast.success(
            <div className="toast-content">
              <FiCheckCircle className="toast-icon success" />
              <span>{data.message}</span>
            </div>
          );
        } else {
          toast.error(
            <div className="toast-content">
              <FiXCircle className="toast-icon error" />
              <span>{data.message}</span>
            </div>
          );
        }
      } else {
        toast.error(
          <div className="toast-content">
            <FiAlertCircle className="toast-icon error" />
            <span>{data.message}</span>
          </div>
        );
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Ralat semasa mengubah status pengguna</span>
        </div>
      );
    }
  };

  const deleteUser = async (userId) => {
    const user = users.find(u => u._id === userId);
    const userName = user ? user.fullName : 'pengguna ini';
    
    if (!window.confirm(`Adakah anda pasti ingin memadam ${userName}? Tindakan ini tidak boleh dibatalkan.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_BASE}/api/superadmin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
        toast.success(
          <div className="toast-content">
            <FiCheckCircle className="toast-icon success" />
            <span>{data.message}</span>
          </div>
        );
      } else {
        toast.error(
          <div className="toast-content">
            <FiAlertCircle className="toast-icon error" />
            <span>{data.message}</span>
          </div>
        );
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Ralat semasa memadam pengguna</span>
        </div>
      );
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName || '',
      email: user.email || '',
      company: user.company || '',
      username: user.username || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setShowEditUserModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsFetchingDetails(true);
    setShowViewUserModal(true);
    fetchUserDetails(user._id);
  };

  const fetchUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`${API_BASE}/api/superadmin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setViewUserDetails(data.user);
      } else {
        toast.error(
          <div className="toast-content">
            <FiAlertCircle className="toast-icon error" />
            <span>{data.message || 'Gagal memuat butiran pengguna'}</span>
          </div>
        );
        setShowViewUserModal(false);
      }
    } catch (e) {
      console.error('Fetch user details error:', e);
      toast.error(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Ralat memuat butiran pengguna</span>
        </div>
      );
      setShowViewUserModal(false);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSavingEdit(true);
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`${API_BASE}/api/superadmin/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          <div className="toast-content">
            <FiCheckCircle className="toast-icon success" />
            <span>{data.message || 'Pengguna dikemas kini'}</span>
          </div>
        );
        setShowEditUserModal(false);
        setSelectedUser(null);
        fetchUsers();
        fetchStats();
      } else {
        toast.error(
          <div className="toast-content">
            <FiAlertCircle className="toast-icon error" />
            <span>{data.message || 'Gagal mengemas kini pengguna'}</span>
          </div>
        );
      }
    } catch (e) {
      console.error('Update user error:', e);
      toast.error(
        <div className="toast-content">
          <FiAlertCircle className="toast-icon error" />
          <span>Ralat semasa mengemas kini pengguna</span>
        </div>
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatCurrency = (amount = 0) => {
    try {
      return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount || 0);
    } catch {
      return `RM ${Number(amount || 0).toFixed(2)}`;
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="user-management">
        <div className="loading-container">
          <FiRefreshCw className="loading-icon" />
          <p>Memuatkan data pengguna...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Header */}
      <div className="user-management-header">
        <div className="header-content">
          <div className="header-title">
            <FiUsers className="header-icon" />
            <div>
              <h1>Pengurusan Pengguna</h1>
              <p>Kelola dan pantau semua pengguna sistem</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={() => {
                fetchUsers();
                fetchStats();
                toast.success(
                  <div className="toast-content">
                    <FiRefreshCw className="toast-icon info" />
                    <span>Data dimuat semula</span>
                  </div>
                );
              }}
            >
              <FiRefreshCw className="icon-sm" />
              <span>Muat Semula</span>
            </button>
            <button 
              className="add-user-btn"
              onClick={handleAddUser}
            >
              <FiPlus className="icon-sm" />
              <span>Tambah Pengguna</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="user-stats">
          <div className="stat-card">
            <div className="stat-icon total">
              <FiUsers className="icon-md" />
            </div>
            <div className="stat-content">
              <h3>{stats.users.total}</h3>
              <p>Jumlah Pengguna</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active">
              <FiCheckCircle className="icon-md" />
            </div>
            <div className="stat-content">
              <h3>{stats.users.active}</h3>
              <p>Pengguna Aktif</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon inactive">
              <FiXCircle className="icon-md" />
            </div>
            <div className="stat-content">
              <h3>{stats.users.inactive}</h3>
              <p>Tidak Aktif</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon recent">
              <FiClock className="icon-md" />
            </div>
            <div className="stat-content">
              <h3>{stats.users.recent}</h3>
              <p>Baru Bulan Ini</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="user-filters">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FiFilter className="filter-icon" />
          <select
            value={userStatus}
            onChange={(e) => setUserStatus(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Email</th>
              <th>Syarikat</th>
              <th>Status</th>
              <th>Tarikh Daftar</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="loading-row">
                  <div className="loading-content">
                    <FiRefreshCw className="loading-spinner" />
                    Memuatkan pengguna...
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  <div className="empty-content">
                    <FiUsers className="empty-icon" />
                    <p className="empty-text">Tiada pengguna ditemui</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <span className="user-name">{user.fullName}</span>
                        <span className="user-username">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="email-info">
                      <FiMail className="email-icon" />
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="company-info">
                      <FiHome className="company-icon" />
                      <span>{user.company || '-'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td>
                    <div className="date-info">
                      <FiCalendar className="date-icon" />
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        onClick={() => handleViewUser(user)}
                        title="Lihat Butiran"
                      >
                        <FiEye className="icon-sm" />
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditUser(user)}
                        title="Edit Pengguna"
                      >
                        <FiEdit className="icon-sm" />
                      </button>
                      <button
                        className="action-btn toggle"
                        onClick={() => toggleUserStatus(user._id)}
                        title={user.isActive ? 'Nyahaktifkan' : 'Aktifkan'}
                      >
                        {user.isActive ? <FiToggleRight className="icon-sm" /> : <FiToggleLeft className="icon-sm" />}
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => deleteUser(user._id)}
                        title="Padam Pengguna"
                      >
                        <FiTrash2 className="icon-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="pagination-btn"
          >
            <FiChevronLeft className="icon-sm" />
            <span>Sebelum</span>
          </button>
          <div className="pagination-info">
            <span>Halaman {currentPage} dari {pagination.pages}</span>
          </div>
          <button
            disabled={currentPage === pagination.pages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="pagination-btn"
          >
            <span>Seterusnya</span>
            <FiChevronRight className="icon-sm" />
          </button>
        </div>
      )}

      {/* Add User Modal Placeholder */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Tambah Pengguna Baru</h3>
              <button onClick={() => setShowAddUserModal(false)}>
                <FiX className="icon-sm" />
              </button>
            </div>
            <div className="modal-body">
              <p>Fungsi tambah pengguna akan datang...</p>
            </div>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {showViewUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Butiran Pengguna</h3>
              <button onClick={() => { setShowViewUserModal(false); setViewUserDetails(null); }}>
                <FiX className="icon-sm" />
              </button>
            </div>
            <div className="modal-body">
              {isFetchingDetails ? (
                <div className="loading-content"><FiRefreshCw className="loading-spinner icon-sm" /> Memuatkan...</div>
              ) : viewUserDetails ? (
                <div className="details-scroll space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="user-avatar" style={{ width: 48, height: 48 }}>
                      {viewUserDetails.fullName?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{viewUserDetails.fullName}</div>
                      <div className="text-sm text-gray-600">@{viewUserDetails.username}</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <span className={`status-badge ${viewUserDetails.isActive ? 'active' : 'inactive'}`}>
                        {viewUserDetails.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  </div>

                  <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="email-info"><FiMail className="email-icon" /><span>{viewUserDetails.email}</span></div>
                    <div className="company-info"><FiHome className="company-icon" /><span>{viewUserDetails.company || '-'}</span></div>
                    <div className="date-info"><FiCalendar className="date-icon" /><span>{formatDate(viewUserDetails.createdAt)}</span></div>
                  </div>

                  {viewUserDetails.stats && (
                    <div className="users-table-container" style={{ padding: '1rem' }}>
                      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        <div className="stat-card" style={{ margin: 0 }}>
                          <div className="stat-icon recent"><FiFileText className="icon-md" /></div>
                          <div className="stat-content">
                            <h3>{viewUserDetails.stats.totalInvoices}</h3>
                            <p>Jumlah Invois</p>
                          </div>
                        </div>
                        <div className="stat-card" style={{ margin: 0 }}>
                          <div className="stat-icon total"><FiDollarSign className="icon-md" /></div>
                          <div className="stat-content">
                            <h3>{formatCurrency(viewUserDetails.stats.totalRevenue)}</h3>
                            <p>Jumlah Nilai</p>
                          </div>
                        </div>
                        <div className="stat-card" style={{ margin: 0 }}>
                          <div className="stat-icon active"><FiCheckCircle className="icon-md" /></div>
                          <div className="stat-content">
                            <h3>{formatCurrency(viewUserDetails.stats.paidRevenue)}</h3>
                            <p>Telah Dibayar</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-content"><div className="empty-text">Tiada butiran</div></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Pengguna</h3>
              <button onClick={() => setShowEditUserModal(false)}>
                <FiX className="icon-sm" />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Penuh</label>
                  <input name="fullName" value={editForm.fullName} onChange={handleEditFormChange} required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:ring-red-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" name="email" value={editForm.email} onChange={handleEditFormChange} required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:ring-red-400" />
                </div>
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input name="username" value={editForm.username} onChange={handleEditFormChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:ring-red-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Syarikat</label>
                    <input name="company" value={editForm.company} onChange={handleEditFormChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:ring-red-400" />
                  </div>
                </div>
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefon</label>
                    <input name="phone" value={editForm.phone} onChange={handleEditFormChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:ring-red-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Alamat</label>
                    <input name="address" value={editForm.address} onChange={handleEditFormChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:ring-red-400" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowEditUserModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700">Batal</button>
                  <button disabled={isSavingEdit} type="submit" className="px-4 py-2 text-sm rounded-lg text-white bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
                    {isSavingEdit ? 'Menyimpan...' : 'Simpan' }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
