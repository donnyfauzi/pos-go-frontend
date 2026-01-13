import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuService } from '../../services/menuService';
import { categoryService } from '../../services/categoryService';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import MenuForm from '../../components/Forms/MenuForm';
import Alert from '../../components/UI/Alert';
import { Plus, Search, Edit, Trash2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Menu, Category } from '../../types';
import type { MenuFormData } from '../../components/Forms/MenuForm';

export default function ListMenu() {
  const navigate = useNavigate();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 6;

  // Fetch menus
  const fetchMenus = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await menuService.getAllMenus();
      if (response.success && response.data) {
        setMenus(response.data);
      }
    } catch (err: any) {
      setError('Gagal memuat daftar menu');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAllCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err: any) {
      // Silent fail for categories
    }
  };

  useEffect(() => {
    fetchMenus();
    fetchCategories();
  }, []);

  // Filter menus
  const filteredMenus = menus.filter((menu) => {
    const matchesSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      menu.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || menu.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMenus = filteredMenus.slice(startIndex, endIndex);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Format currency
  const formatCurrency = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Handle form submit (Create/Edit)
  const handleFormSubmit = async (data: MenuFormData, imageFile: File | null) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (editingMenu) {
        // Update menu
        const response = await menuService.updateMenu(editingMenu.id, data, imageFile);
        setSuccess(response.message || 'Menu berhasil diupdate');
      } else {
        // Create menu
        if (!imageFile) {
          setError('Gambar menu wajib diisi');
          setIsSubmitting(false);
          return;
        }
        const response = await menuService.createMenu({
          ...data,
          image: imageFile,
        });
        setSuccess(response.message || 'Menu berhasil ditambahkan');
      }
      
      // Close modal and refresh list
      setIsModalOpen(false);
      setEditingMenu(null);
      fetchMenus();
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        setError(typeof firstError === 'string' ? firstError : 'Validasi gagal');
      } else {
        setError('Terjadi kesalahan, silahkan coba lagi');
      }
      throw err; // Re-throw untuk ditangani oleh MenuForm
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete click - open confirm dialog
  const handleDeleteClick = (menu: Menu) => {
    setMenuToDelete(menu);
    setDeleteConfirmOpen(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!menuToDelete) return;

    setIsDeleting(true);
    setError('');

    try {
      const response = await menuService.deleteMenu(menuToDelete.id);
      setSuccess(response.message || 'Menu berhasil dihapus');
      setDeleteConfirmOpen(false);
      setMenuToDelete(null);
      fetchMenus(); // Refresh list
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Gagal menghapus menu');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setMenuToDelete(null);
  };

  // Open create modal
  const handleCreateClick = () => {
    setEditingMenu(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEditClick = (menu: Menu) => {
    setEditingMenu(menu);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMenu(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto mb-4">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Kembali ke Dashboard
        </button>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {/* Welcome Card */}
        <Card className="mb-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Kelola Menu Anda
              </h2>
              <p className="text-sm text-gray-600">
                Lihat dan kelola semua menu restoran
              </p>
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
                placeholder="Cari menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Add Button */}
            <Button
              variant="primary"
              onClick={handleCreateClick}
              className="flex items-center gap-2"
            >
              <Plus size={20} />
              Tambah Menu
            </Button>
          </div>
        </Card>

        {/* Menu Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Memuat menu...</p>
          </div>
        ) : filteredMenus.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedCategory
                  ? 'Tidak ada menu yang sesuai dengan filter'
                  : 'Belum ada menu'}
              </p>
              {!searchQuery && !selectedCategory && (
                <Button variant="primary" onClick={handleCreateClick}>
                  <Plus size={20} className="mr-2" />
                  Tambah Menu Pertama
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {paginatedMenus.map((menu) => (
              <Card key={menu.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="relative bg-gray-100 aspect-[4/3] rounded-lg overflow-hidden">
                  <img
                    src={`${import.meta.env.VITE_API_URL}/${menu.image}`}
                    alt={menu.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                  {/* Status Badge */}
                  <div
                    className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                      menu.is_available
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {menu.is_available ? 'Tersedia' : 'Tidak Tersedia'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
                    {menu.name}
                  </h3>
                  {menu.category && (
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded mb-1">
                      {menu.category.name}
                    </span>
                  )}
                  <p className="text-lg font-bold text-blue-600 mb-1">
                    Rp {formatCurrency(menu.price)}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-3 min-h-[1.25rem]">
                    {menu.description || 'Tidak ada deskripsi'}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => handleEditClick(menu)}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteClick(menu)}
                      className="flex items-center justify-center gap-2 px-4"
                    >
                      <Trash2 size={16} />
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
                  <ChevronLeft size={18} />
                  Sebelumnya
                </button>

                <div className="flex items-center gap-1">
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
                              ? 'bg-blue-600 text-white border-blue-600'
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
            {filteredMenus.length > 0 && (
              <div className="text-center text-xs text-gray-500 mt-2">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredMenus.length)} dari {filteredMenus.length} menu
              </div>
            )}
          </>
        )}
      </main>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
        size="lg"
      >
        <MenuForm
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
          initialData={editingMenu || undefined}
        />
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Hapus Menu"
        message={`Apakah Anda yakin ingin menghapus menu "${menuToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
