import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryAPI } from '../services/api';

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <span className="badge badge-success">{t('inventory.inStock')}</span>;
      case 'low_stock':
        return <span className="badge badge-warning">{t('inventory.lowStock')}</span>;
      case 'out_of_stock':
        return <span className="badge badge-danger">{t('inventory.outOfStock')}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder={`${t('common.search')}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>
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

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('products.sku')}</th>
                <th>{t('common.name')}</th>
                <th>{t('products.barcode')}</th>
                <th>{t('inventory.stock')}</th>
                <th>{t('inventory.minStock')}</th>
                <th>{t('inventory.location')}</th>
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
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    {t('common.noResults')}
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className={item.is_low_stock ? 'bg-yellow-50' : ''}>
                    <td className="font-mono text-sm">{item.product_sku}</td>
                    <td className="font-medium">{item.product_name}</td>
                    <td className="font-mono text-sm">{item.product_barcode || '-'}</td>
                    <td className="font-bold">{item.quantity}</td>
                    <td>{item.min_quantity}</td>
                    <td>{item.location || '-'}</td>
                    <td>{getStatusBadge(item.stock_status)}</td>
                    <td>
                      <button
                        onClick={() => openAdjustModal(item)}
                        className="btn btn-secondary text-sm px-3 py-1"
                      >
                        {t('inventory.adjustment')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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


