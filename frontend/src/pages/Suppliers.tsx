import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { suppliersAPI } from '../services/api';

interface Supplier {
  id: number;
  name: string;
  ruc: string;
  email: string;
  phone: string;
  address: string;
  contact_name: string;
  is_active: boolean;
}

const Suppliers = () => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ruc: '',
    email: '',
    phone: '',
    address: '',
    contact_name: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll({ search });
      setSuppliers(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier.id, formData);
      } else {
        await suppliersAPI.create(formData);
      }

      setShowModal(false);
      setEditingSupplier(null);
      setFormData({
        name: '',
        ruc: '',
        email: '',
        phone: '',
        address: '',
        contact_name: '',
      });
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      ruc: supplier.ruc,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contact_name: supplier.contact_name || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
      try {
        await suppliersAPI.delete(id);
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
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
            setEditingSupplier(null);
            setFormData({
              name: '',
              ruc: '',
              email: '',
              phone: '',
              address: '',
              contact_name: '',
            });
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          + {t('suppliers.newSupplier')}
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>RUC</th>
                <th>{t('common.name')}</th>
                <th>{t('suppliers.contactName')}</th>
                <th>{t('common.email')}</th>
                <th>{t('common.phone')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    {t('common.noResults')}
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="font-mono">{supplier.ruc}</td>
                    <td className="font-medium">{supplier.name}</td>
                    <td>{supplier.contact_name || '-'}</td>
                    <td>{supplier.email || '-'}</td>
                    <td>{supplier.phone || '-'}</td>
                    <td>
                      <span className={`badge ${supplier.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {supplier.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold">
                {editingSupplier ? 'Editar Proveedor' : t('suppliers.newSupplier')}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">RUC *</label>
                  <input
                    type="text"
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                    className="input"
                    maxLength={11}
                    required
                  />
                </div>
                <div>
                  <label className="label">{t('suppliers.contactName')}</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('common.email')}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">{t('common.phone')}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">{t('common.address')}</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  rows={2}
                />
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

export default Suppliers;


