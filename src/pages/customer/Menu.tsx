import { useState, useEffect } from 'react';
import { menuService } from '../../services/menuService';
import { categoryService } from '../../services/categoryService';
import Card from '../../components/UI/Card';
import { Search, ShoppingCart, Plus, Minus, ChevronLeft, ChevronRight, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import type { Menu, Category } from '../../types';

interface CartItem {
  menu: Menu;
  quantity: number;
}

export default function CustomerMenu() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch public menus
  const fetchMenus = async () => {
    setIsLoading(true);
    try {
      const response = await menuService.getPublicMenus();
      if (response.success && response.data) {
        setMenus(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch menus:', err);
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
    } catch (err) {
      console.error('Failed to fetch categories:', err);
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

  // Cart functions
  const addToCart = (menu: Menu) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.menu.id === menu.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.menu.id === menu.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { menu, quantity: 1 }];
    });
  };

  const removeFromCart = (menuId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.menu.id === menuId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.menu.id === menuId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter((item) => item.menu.id !== menuId);
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.menu.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <img
                src="/logo-dashboard.png"
                alt="POS Go"
                className="h-16 w-auto"
              />
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <ShoppingCart size={20} />
              <span>Keranjang</span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className="mb-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Selamat Datang di POS Go Restaurant
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                Silahkan pilih menu yang Anda inginkan dan lakukan checkout untuk memesan
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-medium text-gray-700 mb-2">Cara Memesan:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Pilih menu yang ingin dipesan</li>
                  <li>Klik tombol "Tambah" untuk menambahkan ke keranjang</li>
                  <li>Klik tombol "Keranjang" di header untuk melihat pesanan</li>
                  <li>Klik "Checkout" untuk menyelesaikan pesanan</li>
                </ol>
              </div>
            </div>
            <div className="hidden md:block ml-6">
              <img
                src="/logo-public.png"
                alt="Welcome"
                className="h-36 w-auto"
              />
            </div>
          </div>
        </Card>

        {/* Search and Filter */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
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
              <p className="text-gray-500">
                {searchQuery || selectedCategory
                  ? 'Tidak ada menu yang sesuai dengan filter'
                  : 'Belum ada menu tersedia'}
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
              {paginatedMenus.map((menu) => (
                <Card key={menu.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  {/* Image */}
                  <div className="relative bg-gray-100 aspect-[4/3] rounded-lg overflow-hidden mb-3">
                    <img
                      src={`${import.meta.env.VITE_API_URL}/${menu.image}`}
                      alt={menu.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-1.5 truncate">
                      {menu.name}
                    </h3>
                    {menu.category && (
                      <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded mb-2 w-fit">
                        {menu.category.name}
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-auto pt-2">
                      <p className="text-base font-bold text-teal-600">
                        Rp {formatCurrency(menu.price)}
                      </p>
                      <button
                        onClick={() => addToCart(menu)}
                        className="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-1.5 text-sm whitespace-nowrap"
                      >
                        <Plus size={16} />
                        Tambah
                      </button>
                    </div>
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

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowCart(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Keranjang</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Keranjang kosong</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.menu.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                        <img
                          src={`${import.meta.env.VITE_API_URL}/${item.menu.image}`}
                          alt={item.menu.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.menu.name}</h3>
                          <p className="text-sm text-gray-600">Rp {formatCurrency(item.menu.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.menu.id)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item.menu)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-medium text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-teal-600">
                        Rp {formatCurrency(getTotalPrice())}
                      </span>
                    </div>
                    <button
                      className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                      onClick={() => {
                        // TODO: Navigate to checkout
                        console.log('Checkout:', cart);
                      }}
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-teal-600 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-12 gap-x-8">
            {/* Logo & About */}
            <div className="col-span-2 md:col-span-3 lg:col-span-2 lg:pr-8">
              <img
                src="/logo-dashboard.png"
                alt="POS Go Restaurant"
                className="w-auto h-20 mb-6"
              />
              <p className="text-teal-100 text-sm leading-relaxed max-w-md text-justify">
                "Restoran dengan cita rasa autentik dan pelayanan terbaik untuk pengalaman makan yang tak terlupakan. silahkan coba dan rasakan kelezatan masakan nusantara yang ada di restoran kami"
              </p>
              <ul className="flex items-center space-x-3 mt-6">
                <li>
                  <a
                    href="#"
                    title="Facebook"
                    className="flex items-center justify-center text-white transition-all duration-200 bg-teal-700 rounded-full w-9 h-9 hover:bg-teal-800 focus:bg-teal-800"
                  >
                    <Facebook size={18} />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    title="Instagram"
                    className="flex items-center justify-center text-white transition-all duration-200 bg-teal-700 rounded-full w-9 h-9 hover:bg-teal-800 focus:bg-teal-800"
                  >
                    <Instagram size={18} />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    title="Twitter"
                    className="flex items-center justify-center text-white transition-all duration-200 bg-teal-700 rounded-full w-9 h-9 hover:bg-teal-800 focus:bg-teal-800"
                  >
                    <Twitter size={18} />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    title="YouTube"
                    className="flex items-center justify-center text-white transition-all duration-200 bg-teal-700 rounded-full w-9 h-9 hover:bg-teal-800 focus:bg-teal-800"
                  >
                    <Youtube size={18} />
                  </a>
                </li>
              </ul>
            </div>

            {/* Alamat */}
            <div>
              <p className="text-sm font-semibold tracking-widest text-white uppercase mb-6">Alamat</p>
              <ul className="space-y-3">
                <li>
                  <p className="text-teal-100 text-sm">Jl. Raya Restoran No. 123</p>
                </li>
                <li>
                  <p className="text-teal-100 text-sm">Kelurahan Makan Enak</p>
                </li>
                <li>
                  <p className="text-teal-100 text-sm">Jakarta Selatan, 12345</p>
                </li>
              </ul>
            </div>

            {/* Kontak */}
            <div>
              <p className="text-sm font-semibold tracking-widest text-white uppercase mb-6">Kontak</p>
              <ul className="space-y-3">
                <li>
                  <p className="text-teal-100 text-sm">
                    <span className="font-medium text-white">Telepon:</span> (021) 1234-5678
                  </p>
                </li>
                <li>
                  <p className="text-teal-100 text-sm">
                    <span className="font-medium text-white">Email:</span> info@posgorestaurant.com
                  </p>
                </li>
              </ul>
            </div>

            {/* Jam Operasional */}
            <div>
              <p className="text-sm font-semibold tracking-widest text-white uppercase mb-6">Jam Operasional</p>
              <ul className="space-y-3">
                <li>
                  <p className="text-teal-100 text-sm">Senin - Minggu</p>
                </li>
                <li>
                  <p className="text-teal-100 text-sm">09:00 - 22:00 WIB</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <hr className="mt-12 mb-8 border-teal-500" />
          <p className="text-sm text-center text-teal-100">
            © {new Date().getFullYear()} POS Go Restaurant. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

