import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { productsAPI } from '../services/api';
import { formatCurrency } from '../config/app.config';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  category: number;
  category_name: string;
  price: number;
  cost: number;
  apply_igv: boolean;
  is_active: boolean;
  stock: number;
}

const Products = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    price: '',
    cost: '',
    apply_igv: true,
    description: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [search]);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({ search });
      setProducts(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        category: formData.category ? parseInt(formData.category) : null,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost) || 0,
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data);
      } else {
        await productsAPI.create(data);
      }

      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        category: '',
        price: '',
        cost: '',
        apply_igv: true,
        description: '',
      });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category: product.category?.toString() || '',
      price: product.price.toString(),
      cost: product.cost.toString(),
      apply_igv: product.apply_igv,
      description: '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await productsAPI.delete(id);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder={`${t('common.search')}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: '',
              sku: '',
              barcode: '',
              category: '',
              price: '',
              cost: '',
              apply_igv: true,
              description: '',
            });
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          + {t('products.newProduct')}
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('products.sku')}</th>
                <th>{t('common.name')}</th>
                <th>{t('products.category')}</th>
                <th>{t('products.barcode')}</th>
                <th>{t('common.price')}</th>
                <th>{t('inventory.stock')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    {t('common.noResults')}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="font-mono text-sm">{product.sku}</td>
                    <td className="font-medium">{product.name}</td>
                    <td>{product.category_name || '-'}</td>
                    <td className="font-mono text-sm">{product.barcode || '-'}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>
                      <span
                        className={`badge ${
                          product.stock <= 0
                            ? 'badge-danger'
                            : product.stock <= 10
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {product.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold">
                {editingProduct ? t('products.editProduct') : t('products.newProduct')}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('products.sku')} *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">{t('products.barcode')}</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">{t('common.name')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">{t('products.category')}</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                >
                  <option value="">Seleccionar...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('common.price')} *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">{t('products.cost')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="apply_igv"
                  checked={formData.apply_igv}
                  onChange={(e) => setFormData({ ...formData, apply_igv: e.target.checked })}
                  className="w-4 h-4 text-primary-600"
                />
                <label htmlFor="apply_igv" className="text-sm text-slate-700">
                  {t('products.applyIgv')} (18%)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;


