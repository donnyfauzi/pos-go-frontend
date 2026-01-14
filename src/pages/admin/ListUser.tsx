import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import UserForm from '../../components/Forms/UserForm';
import Alert from '../../components/UI/Alert';
import Dropdown from '../../components/UI/Dropdown';
import { Plus, Search, Trash2, ArrowLeft, Lock, LogOut, User as UserIcon } from 'lucide-react';
import type { User } from '../../types';
import type { UserFormData } from '../../components/Forms/UserForm';

export default function ListUser() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 6;

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await authService.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (err: any) {
      setError('Gagal memuat daftar user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle form submit (Create)
  const handleFormSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.register({
        ...data,
        role: 'kasir',
      });
      setSuccess(response.message || 'User berhasil didaftarkan');
      setIsModalOpen(false);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        setError(typeof firstError === 'string' ? firstError : 'Validasi gagal');
      } else {
        setError('Terjadi kesalahan, silahkan coba lagi');
      }
      throw err; // Re-throw untuk ditangani oleh UserForm
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete click - open confirm dialog
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setError('');

    try {
      const response = await authService.deleteUser(userToDelete.id);
      setSuccess(response.message || 'User berhasil dihapus');
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Gagal menghapus user');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  // Open create modal
  const handleCreateClick = () => {
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-gray-100 shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-0">
            <div>
              <img
                src="/logo-dashboard.png"
                alt="POS Go"
                className="h-20 w-auto"
              />
            </div>
            <div className="flex items-center gap-4">
              <Dropdown
                trigger={
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon size={18} className="text-gray-600" />
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                }
                items={[
                  {
                    label: 'Ubah Password',
                    icon: <Lock size={16} />,
                    onClick: () => navigate('/change-password'),
                  },
                  {
                    label: 'Logout',
                    icon: <LogOut size={16} />,
                    onClick: handleLogout,
                    variant: 'danger',
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with padding-top for fixed header */}
      <main className="pt-24 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-teal-800 hover:text-teal-600 text-sm font-medium flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Kembali ke Dashboard
            </button>
          </div>
        {/* Welcome Card */}
        <Card className="mb-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Kelola User Kasir
              </h2>
              <p className="text-sm text-gray-600">
                Lihat dan kelola semua user kasir
              </p>
            </div>
            <div className="hidden md:block">
              <img
                src="/logo-card2.png"
                alt="Welcome"
                className="h-24 w-auto"
              />
            </div>
          </div>
        </Card>

        {/* Success/Error Messages */}
        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess('')}
          />
        )}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        {/* Action Bar */}
        <Card className="mb-4 py-3">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Add Button */}
            <Button
              variant="primary"
              onClick={handleCreateClick}
              className="flex items-center gap-2"
            >
              <Plus size={20} />
              Tambah User
            </Button>
          </div>
        </Card>

        {/* User Grid */}
        {isLoading ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">Memuat user...</p>
            </div>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? 'Tidak ada user yang sesuai dengan pencarian'
                  : 'Belum ada user kasir'}
              </p>
              {!searchQuery && (
                <Button variant="primary" onClick={handleCreateClick}>
                  <Plus size={20} className="mr-2" />
                  Tambah User Pertama
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {paginatedUsers.map((user) => (
                <Card key={user.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* User Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserIcon size={24} className="text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="mb-3">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {user.role === 'kasir' ? 'Kasir' : user.role}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteClick(user)}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Hapus
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Sebelumnya
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 border rounded-lg ${
                            currentPage === page
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Selanjutnya
                </button>
              </div>
            )}

            {/* Page Info */}
            {filteredUsers.length > 0 && (
              <div className="text-center text-xs text-gray-500 mt-2">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} dari {filteredUsers.length} user
              </div>
            )}
          </>
        )}
        </div>
      </main>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Tambah User Kasir Baru"
        size="md"
      >
        <UserForm
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Hapus User"
        message={`Apakah Anda yakin ingin menghapus user "${userToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

