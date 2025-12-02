import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { clientsAPI } from '../services/api';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

interface Client {
  id: number;
  name: string;
  document_type: string;
  document_type_display: string;
  document_number: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

const Clients = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    document_type: 'dni',
    document_number: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchClients();
  }, [search]);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll({ search });
      setClients(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await clientsAPI.update(editingClient.id, formData);
      } else {
        await clientsAPI.create(formData);
      }

      setShowModal(false);
      setEditingClient(null);
      setFormData({
        name: '',
        document_type: 'dni',
        document_number: '',
        email: '',
        phone: '',
        address: '',
      });
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      document_type: client.document_type,
      document_number: client.document_number,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('clients.confirmDelete'))) {
      try {
        await clientsAPI.delete(id);
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      document_type: 'dni',
      document_number: '',
      email: '',
      phone: '',
      address: '',
    });
    setShowModal(true);
  };

  // Column templates
  const statusBodyTemplate = (rowData: Client) => {
    return (
      <Tag
        value={rowData.is_active ? t('common.active') : t('common.inactive')}
        severity={rowData.is_active ? 'success' : 'danger'}
      />
    );
  };

  const actionsBodyTemplate = (rowData: Client) => {
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
    { field: 'document_type_display', header: t('clients.documentType'), sortable: true },
    { field: 'document_number', header: t('clients.documentNumber'), sortable: true, style: { fontFamily: 'monospace' } },
    { field: 'name', header: t('common.name'), sortable: true, style: { fontWeight: 500 } },
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
          data={clients}
          columns={columns}
          loading={isLoading}
          globalFilterValue={search}
          onGlobalFilterChange={setSearch}
          onNew={openCreateModal}
          newButtonLabel={t('clients.newClient')}
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
                {editingClient ? t('clients.editClient') : t('clients.newClient')}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('clients.documentType')}</label>
                  <select
                    value={formData.document_type}
                    onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                    className="input"
                  >
                    <option value="dni">DNI</option>
                    <option value="ruc">RUC</option>
                    <option value="ce">Carné de Extranjería</option>
                    <option value="passport">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="label">{t('clients.documentNumber')} *</label>
                  <input
                    type="text"
                    value={formData.document_number}
                    onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                    className="input"
                    required
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

export default Clients;
