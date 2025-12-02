import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { salesAPI } from '../services/api';
import { formatCurrency } from '../config/app.config';

interface Invoice {
  id: number;
  invoice_type: string;
  invoice_type_display: string;
  series: string;
  number: string;
  issued_at: string;
  sale: {
    id: number;
    client_name: string;
    total: number;
    status: string;
  };
}

const Invoices = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, [typeFilter]);

  const fetchInvoices = async () => {
    try {
      const params: Record<string, string> = {};
      if (typeFilter) params.type = typeFilter;
      
      const response = await salesAPI.getInvoices(params);
      setInvoices(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'boleta': return 'badge-info';
      case 'factura': return 'badge-success';
      case 'nota_venta': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  // Count by type
  const countByType = {
    boleta: invoices.filter(i => i.invoice_type === 'boleta').length,
    factura: invoices.filter(i => i.invoice_type === 'factura').length,
    nota_venta: invoices.filter(i => i.invoice_type === 'nota_venta').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
            🧾
          </div>
          <div>
            <p className="text-2xl font-bold">{countByType.boleta}</p>
            <p className="text-sm text-slate-500">{t('invoices.boleta')}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
            📄
          </div>
          <div>
            <p className="text-2xl font-bold">{countByType.factura}</p>
            <p className="text-sm text-slate-500">{t('invoices.factura')}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">
            📝
          </div>
          <div>
            <p className="text-2xl font-bold">{countByType.nota_venta}</p>
            <p className="text-sm text-slate-500">{t('invoices.notaVenta')}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">{t('common.all')}</option>
          <option value="boleta">{t('invoices.boleta')}</option>
          <option value="factura">{t('invoices.factura')}</option>
          <option value="nota_venta">{t('invoices.notaVenta')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('invoices.type')}</th>
                <th>{t('invoices.series')}</th>
                <th>{t('invoices.number')}</th>
                <th>{t('sales.client')}</th>
                <th>{t('common.total')}</th>
                <th>{t('common.date')}</th>
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
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    {t('common.noResults')}
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <span className={`badge ${getTypeColor(invoice.invoice_type)}`}>
                        {invoice.invoice_type_display}
                      </span>
                    </td>
                    <td className="font-mono">{invoice.series}</td>
                    <td className="font-mono font-medium">{invoice.number}</td>
                    <td>{invoice.sale?.client_name || 'Cliente General'}</td>
                    <td className="font-semibold">
                      {formatCurrency(invoice.sale?.total || 0)}
                    </td>
                    <td>{new Date(invoice.issued_at).toLocaleDateString('es')}</td>
                    <td>
                      <button className="text-primary-600 hover:text-primary-800 text-sm">
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;


