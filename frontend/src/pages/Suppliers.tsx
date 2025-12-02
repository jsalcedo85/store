import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { suppliersAPI } from '../services/api';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

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
    if (window.confirm(t('suppliers.confirmDelete'))) {
      try {
        await suppliersAPI.delete(id);
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const openCreateModal = () => {
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
  };

  // Column templates
  const statusBodyTemplate = (rowData: Supplier) => {
    return (
      <Tag
        value={rowData.is_active ? t('common.active') : t('common.inactive')}
        severity={rowData.is_active ? 'success' : 'danger'}
      />
    );
  };

  const actionsBodyTemplate = (rowData: Supplier) => {
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
    { field: 'ruc', header: 'RUC', sortable: true, style: { fontFamily: 'monospace' } },
    { field: 'name', header: t('common.name'), sortable: true, style: { fontWeight: 500 } },
    { field: 'contact_name', header: t('suppliers.contactName'), body: (rowData) => rowData.contact_name || '-' },
    { field: 'email', header: t('common.email'), body: (rowData) => rowData.email || '-' },
    { field: 'phone', header: t('common.phone'), body: (rowData) => rowData.phone || '-' },
    { field: 'is_active', header: t('common.status'), body: statusBodyTemplate, sortable: true },
    { field: 'actions', header: t('table.actions'), body: actionsBodyTemplate, style: { width: '120px' } },
  ];

  return (
    <div className="space-y-6">
      {/* DataTable */}
      <div className="card">
        <DataTable
          data={suppliers}
          columns={columns}
          loading={isLoading}
          globalFilterValue={search}
          onGlobalFilterChange={setSearch}
          onNew={openCreateModal}
          newButtonLabel={t('suppliers.newSupplier')}
          searchPlaceholder={`${t('common.search')}...`}
          emptyMessage={t('common.noResults')}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold">
                {editingSupplier ? t('suppliers.editSupplier') : t('suppliers.newSupplier')}
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
