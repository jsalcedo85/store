import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryAPI } from '../services/api';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

interface InventoryItem {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  product_barcode: string;
  quantity: number;
  min_quantity: number;
  location: string;
  is_low_stock: boolean;
  stock_status: string;
}

const Inventory = () => {
  const { t } = useTranslation();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustData, setAdjustData] = useState({
    quantity: '',
    movement_type: 'in',
    reason: '',
  });

  useEffect(() => {
    fetchInventory();
  }, [search, filter]);

  const fetchInventory = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filter !== 'all') params.status = filter;

      const response = await inventoryAPI.getAll(params);
      setInventory(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await inventoryAPI.adjust(selectedItem.id, {
        quantity: parseInt(adjustData.quantity),
        movement_type: adjustData.movement_type,
        reason: adjustData.reason,
      });

      setShowAdjustModal(false);
      setSelectedItem(null);
      setAdjustData({ quantity: '', movement_type: 'in', reason: '' });
      fetchInventory();
    } catch (error) {
      console.error('Error adjusting inventory:', error);
    }
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowAdjustModal(true);
  };

  // Column templates
  const statusBodyTemplate = (rowData: InventoryItem) => {
    switch (rowData.stock_status) {
      case 'in_stock':
        return <Tag value={t('inventory.inStock')} severity="success" />;
      case 'low_stock':
        return <Tag value={t('inventory.lowStock')} severity="warning" />;
      case 'out_of_stock':
        return <Tag value={t('inventory.outOfStock')} severity="danger" />;
      default:
        return null;
    }
  };

  const actionsBodyTemplate = (rowData: InventoryItem) => {
    return (
      <Button
        label={t('inventory.adjustment')}
        icon="pi pi-sliders-h"
        size="small"
        severity="secondary"
        onClick={() => openAdjustModal(rowData)}
      />
    );
  };

  const columns: DataTableColumn[] = [
    { field: 'product_sku', header: t('products.sku'), sortable: true, style: { fontFamily: 'monospace', fontSize: '0.875rem' } },
    { field: 'product_name', header: t('common.name'), sortable: true, style: { fontWeight: 500 } },
    { field: 'product_barcode', header: t('products.barcode'), body: (rowData) => rowData.product_barcode || '-', style: { fontFamily: 'monospace', fontSize: '0.875rem' } },
    { field: 'quantity', header: t('inventory.stock'), sortable: true, style: { fontWeight: 'bold' } },
    { field: 'min_quantity', header: t('inventory.minStock'), sortable: true },
    { field: 'location', header: t('inventory.location'), body: (rowData) => rowData.location || '-' },
    { field: 'stock_status', header: t('common.status'), body: statusBodyTemplate, sortable: true },
    { field: 'actions', header: t('table.actions'), body: actionsBodyTemplate, style: { width: '140px' } },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-600">{t('inventory.inStock')}</p>
          <p className="text-2xl font-bold text-green-700">
            {inventory.filter((i) => i.stock_status === 'in_stock').length}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-600">{t('inventory.lowStock')}</p>
          <p className="text-2xl font-bold text-yellow-700">
            {inventory.filter((i) => i.stock_status === 'low_stock').length}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600">{t('inventory.outOfStock')}</p>
          <p className="text-2xl font-bold text-red-700">
            {inventory.filter((i) => i.stock_status === 'out_of_stock').length}
          </p>
        </div>
      </div>

      {/* Filter and DataTable */}
      <div className="card">
        <div className="flex justify-end mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">{t('common.all')}</option>
            <option value="low">{t('inventory.lowStock')}</option>
            <option value="out">{t('inventory.outOfStock')}</option>
          </select>
        </div>

        <DataTable
          data={inventory}
          columns={columns}
          loading={isLoading}
          globalFilterValue={search}
          onGlobalFilterChange={setSearch}
          searchPlaceholder={`${t('common.search')}...`}
          emptyMessage={t('common.noResults')}
        // No new button for inventory
        />
      </div>

      {/* Adjust Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold">{t('inventory.adjustment')}</h3>
              <p className="text-slate-500 mt-1">{selectedItem.product_name}</p>
              <p className="text-sm text-slate-400">
                Stock actual: <strong>{selectedItem.quantity}</strong>
              </p>
            </div>
            <form onSubmit={handleAdjust} className="p-6 space-y-4">
              <div>
                <label className="label">{t('inventory.movement')}</label>
                <select
                  value={adjustData.movement_type}
                  onChange={(e) => setAdjustData({ ...adjustData, movement_type: e.target.value })}
                  className="input"
                >
                  <option value="in">{t('inventory.in')} (+)</option>
                  <option value="out">{t('inventory.out')} (-)</option>
                  <option value="adjustment">{t('inventory.adjustment')} (=)</option>
                </select>
              </div>

              <div>
                <label className="label">{t('common.quantity')} *</label>
                <input
                  type="number"
                  value={adjustData.quantity}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                  className="input"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="label">Razón</label>
                <textarea
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
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
                  onClick={() => setShowAdjustModal(false)}
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

export default Inventory;
