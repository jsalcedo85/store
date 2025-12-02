import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { salesAPI } from '../services/api';
import { formatCurrency } from '../config/app.config';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

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
  const [search, setSearch] = useState('');

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

  // Count by type
  const countByType = {
    boleta: invoices.filter(i => i.invoice_type === 'boleta').length,
    factura: invoices.filter(i => i.invoice_type === 'factura').length,
    nota_venta: invoices.filter(i => i.invoice_type === 'nota_venta').length,
  };

  // Column templates
  const typeBodyTemplate = (rowData: Invoice) => {
    let severity: 'success' | 'warning' | 'info' | 'danger' = 'info';
    switch (rowData.invoice_type) {
      case 'boleta': severity = 'info'; break;
      case 'factura': severity = 'success'; break;
      case 'nota_venta': severity = 'warning'; break;
    }
    return <Tag value={rowData.invoice_type_display} severity={severity} />;
  };

  const actionsBodyTemplate = (_rowData: Invoice) => {
    return (
      <Button
        label="Ver"
        icon="pi pi-eye"
        size="small"
        text
        severity="help"
        onClick={() => { }} // Placeholder for view action
      />
    );
  };

  const columns: DataTableColumn[] = [
    { field: 'invoice_type', header: t('invoices.type'), body: typeBodyTemplate, sortable: true },
    { field: 'series', header: t('invoices.series'), style: { fontFamily: 'monospace' } },
    { field: 'number', header: t('invoices.number'), style: { fontFamily: 'monospace', fontWeight: 500 } },
    { field: 'sale.client_name', header: t('sales.client'), body: (rowData) => rowData.sale?.client_name || 'Cliente General' },
    { field: 'sale.total', header: t('common.total'), body: (rowData) => formatCurrency(rowData.sale?.total || 0), style: { fontWeight: 'bold' } },
    { field: 'issued_at', header: t('common.date'), body: (rowData) => new Date(rowData.issued_at).toLocaleDateString('es'), sortable: true },
    { field: 'actions', header: t('table.actions'), body: actionsBodyTemplate },
  ];

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

      {/* Filter and DataTable */}
      <div className="card">
        <div className="flex justify-end mb-4">
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

        <DataTable
          data={invoices}
          columns={columns}
          loading={isLoading}
          globalFilterValue={search}
          onGlobalFilterChange={setSearch}
          searchPlaceholder={`${t('common.search')}...`}
          emptyMessage={t('common.noResults')}
        />
      </div>
    </div>
  );
};

export default Invoices;
