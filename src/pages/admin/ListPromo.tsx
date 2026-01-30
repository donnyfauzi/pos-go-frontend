import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getAllPromos, deletePromo, createPromo, updatePromo, type Promo, type CreatePromoRequest } from '../../services/promoService';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Alert from '../../components/UI/Alert';
import Modal from '../../components/UI/Modal';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import PromoForm from '../../components/Forms/PromoForm';
import Dropdown from '../../components/UI/Dropdown';
import { Plus, Edit2, Trash2, Calendar, TrendingUp, ArrowLeft, Lock, LogOut, User as UserIcon, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ListPromo() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const data = await getAllPromos();
      setPromos(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data promo');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingPromo(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (promo: Promo) => {
    setEditingPromo(promo);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deletePromo(deleteId);
      setSuccess('Promo berhasil dihapus');
      setDeleteId(null);
      fetchPromos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus promo');
      setDeleteId(null);
    }
  };

  const handleFormSubmit = async (data: CreatePromoRequest) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingPromo) {
        await updatePromo(editingPromo.id, data);
        setSuccess('Promo berhasil diupdate');
      } else {
        await createPromo(data);
        setSuccess('Promo berhasil ditambahkan');
      }
      
      setIsModalOpen(false);
      setEditingPromo(null);
      fetchPromos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan promo');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Helper function untuk format datetime ke input format
  const formatDateTimeForInput = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 10); // Format: YYYY-MM-DD
  };

  // Filter promos berdasarkan search query
  const filteredPromos = promos.filter((promo) => {
    const matchesSearch = promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredPromos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPromos = filteredPromos.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data promo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-gray-100 shadow-md fixed top-0 left-0 right-0 z-10">
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

      {/* Main Content */}
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
                  Kelola Promo
                </h2>
                <p className="text-sm text-gray-600">
                  Kelola dan atur promo restoran
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
              onClose={() => setSuccess(null)}
            />
          )}
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError(null)}
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
                  placeholder="Cari promo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Add Promo Button */}
              <Button onClick={handleCreateClick} className="flex items-center gap-2">
                <Plus size={20} />
                Tambah Promo
              </Button>
            </div>
          </Card>

          {/* Promo Grid */}
          {filteredPromos.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? 'Tidak ada promo yang sesuai dengan pencarian'
                    : 'Belum ada promo'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreateClick}>
                    <Plus size={20} className="mr-2" />
                    Tambah Promo Pertama
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPromos.map((promo) => (
                <Card key={promo.id} className="relative flex flex-col h-full">
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        promo.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {promo.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  {/* Code */}
                  <div className="mb-4">
                    <div className="inline-block bg-teal-100 px-3 py-1 rounded">
                      <span className="text-xl font-bold text-teal-800">{promo.code}</span>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{promo.name}</h3>

                  {/* Description - dengan min-height untuk konsistensi */}
                  <div className="mb-4 min-h-[3.5rem]">
                    {promo.description ? (
                      <p className="text-sm text-gray-600 line-clamp-3">{promo.description}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Tidak ada deskripsi</p>
                    )}
                  </div>

                  {/* Value */}
                  <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600">Nilai Diskon</p>
                    <p className="text-2xl font-bold text-teal-600">
                      {promo.type === 'percentage'
                        ? `${promo.value}%`
                        : `Rp ${formatCurrency(promo.value)}`}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min. Pembelian:</span>
                      <span className="font-medium">
                        {promo.min_purchase > 0 ? `Rp ${formatCurrency(promo.min_purchase)}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max. Diskon:</span>
                      <span className="font-medium">
                        {promo.max_discount > 0 ? `Rp ${formatCurrency(promo.max_discount)}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Penggunaan:</span>
                      <span className="font-medium">
                        {promo.usage_limit > 0
                          ? `${promo.usage_count} / ${promo.usage_limit} (Sisa: ${Math.max(0, promo.usage_limit - promo.usage_count)})`
                          : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 pb-4 border-b">
                    <Calendar size={16} />
                    <span>
                      {formatDate(promo.start_date)} - {formatDate(promo.end_date)}
                    </span>
                  </div>

                  {/* Actions - menggunakan mt-auto agar selalu di bawah */}
                  <div className="flex gap-2 mt-auto">
                    <Button
                      onClick={() => handleEditClick(promo)}
                      variant="secondary"
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Edit2 size={16} />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(promo.id)}
                      variant="danger"
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Hapus
                    </Button>
                  </div>
                </Card>
              ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft size={18} />
                    Sebelumnya
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
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
                          <span key={page} className="px-2">
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
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* Page Info */}
              {filteredPromos.length > 0 && (
                <div className="text-center text-xs text-gray-500 mt-2">
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredPromos.length)} dari {filteredPromos.length} promo
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal untuk Create/Edit Promo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPromo(null);
        }}
        title={editingPromo ? 'Edit Promo' : 'Tambah Promo Baru'}
        size="lg"
      >
        <PromoForm
          initialData={editingPromo ? {
            code: editingPromo.code,
            name: editingPromo.name,
            description: editingPromo.description,
            type: editingPromo.type,
            value: editingPromo.value,
            min_purchase: editingPromo.min_purchase,
            max_discount: editingPromo.max_discount,
            usage_limit: editingPromo.usage_limit,
            start_date: formatDateTimeForInput(editingPromo.start_date),
            end_date: formatDateTimeForInput(editingPromo.end_date),
            is_active: editingPromo.is_active,
          } : undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingPromo(null);
          }}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Hapus Promo"
        message="Apakah Anda yakin ingin menghapus promo ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}