import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { productsAPI } from '../services/api';
import { formatCurrency } from '../config/app.config';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

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
    if (window.confirm(t('products.confirmDelete'))) {
      try {
        await productsAPI.delete(id);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const openCreateModal = () => {
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
  };

  // Column templates
  const stockBodyTemplate = (rowData: Product) => {
    const severity = rowData.stock <= 0 ? 'danger' : rowData.stock <= 10 ? 'warning' : 'success';
    return <Tag value={rowData.stock} severity={severity} />;
  };

  const statusBodyTemplate = (rowData: Product) => {
    return (
      <Tag
        value={rowData.is_active ? t('common.active') : t('common.inactive')}
        severity={rowData.is_active ? 'success' : 'danger'}
      />
    );
  };

  const actionsBodyTemplate = (rowData: Product) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="info"
          onClick={() => handleEdit(rowData)}
          tooltip={t('buttons.edit')}
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => handleDelete(rowData.id)}
          tooltip={t('buttons.delete')}
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  const columns: DataTableColumn[] = [
    { field: 'sku', header: t('products.sku'), sortable: true, style: { fontFamily: 'monospace', fontSize: '0.875rem' } },
    { field: 'name', header: t('common.name'), sortable: true, style: { fontWeight: 500 } },
    { field: 'category_name', header: t('products.category'), body: (rowData) => rowData.category_name || '-' },
    { field: 'barcode', header: t('products.barcode'), body: (rowData) => rowData.barcode || '-', style: { fontFamily: 'monospace', fontSize: '0.875rem' } },
    { field: 'price', header: t('common.price'), body: (rowData) => formatCurrency(rowData.price) },
    { field: 'stock', header: t('inventory.stock'), body: stockBodyTemplate, sortable: true },
    { field: 'is_active', header: t('common.status'), body: statusBodyTemplate, sortable: true },
    { field: 'actions', header: t('table.actions'), body: actionsBodyTemplate, style: { width: '120px' } },
  ];

  return (
    <div className="space-y-6">
      {/* DataTable */}
      <div className="card">
        <DataTable
          data={products}
          columns={columns}
          loading={isLoading}
          globalFilterValue={search}
          onGlobalFilterChange={setSearch}
          onNew={openCreateModal}
          newButtonLabel={t('products.newProduct')}
          searchPlaceholder={`${t('common.search')}...`}
          emptyMessage={t('common.noResults')}
        />
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
                  <option value="">{t('products.select')}</option>
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
