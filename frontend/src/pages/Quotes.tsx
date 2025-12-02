import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { quotesAPI, productsAPI, clientsAPI } from '../services/api';
import { formatCurrency, APP_CONFIG } from '../config/app.config';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

interface Quote {
  id: number;
  quote_number: string;
  client_name: string;
  user_name: string;
  subtotal: number;
  igv: number;
  total: number;
  status: string;
  status_display: string;
  valid_until: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  apply_igv: boolean;
}

interface Client {
  id: number;
  name: string;
  document_number: string;
}

interface QuoteItem {
  product: Product;
  quantity: number;
  unit_price: number;
  description: string;
}

const Quotes = () => {
  const { t } = useTranslation();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewQuote, setShowNewQuote] = useState(false);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchQuotes();
    fetchProducts();
    fetchClients();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await quotesAPI.getAll();
      setQuotes(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({ is_active: 'true' });
      setProducts(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll({ is_active: 'true' });
      setClients(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const addItem = (product: Product) => {
    const existing = items.find((item) => item.product.id === product.id);
    if (existing) {
      setItems(
        items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setItems([...items, { product, quantity: 1, unit_price: product.price, description: '' }]);
    }
  };

  const updateItem = (productId: number, field: string, value: number | string) => {
    if (field === 'quantity' && (value as number) <= 0) {
      setItems(items.filter((item) => item.product.id !== productId));
    } else {
      setItems(
        items.map((item) =>
          item.product.id === productId ? { ...item, [field]: value } : item
        )
      );
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let igv = 0;

    items.forEach((item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      subtotal += itemSubtotal;
      if (item.product.apply_igv) {
        igv += itemSubtotal * APP_CONFIG.business.igvRate;
      }
    });

    return { subtotal, igv, total: subtotal + igv };
  };

  const handleCreateQuote = async () => {
    if (items.length === 0) return;

    try {
      await quotesAPI.create({
        client: selectedClient ? parseInt(selectedClient) : null,
        valid_until: validUntil || null,
        notes,
        terms,
        items: items.map((item) => ({
          product: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          description: item.description,
        })),
      });

      setShowNewQuote(false);
      setItems([]);
      setSelectedClient('');
      setValidUntil('');
      setNotes('');
      setTerms('');
      fetchQuotes();
    } catch (error) {
      console.error('Error creating quote:', error);
    }
  };

  const handleAction = async (id: number, action: 'send' | 'accept' | 'reject') => {
    try {
      if (action === 'send') await quotesAPI.send(id);
      else if (action === 'accept') await quotesAPI.accept(id);
      else if (action === 'reject') await quotesAPI.reject(id);
      fetchQuotes();
    } catch (error) {
      console.error(`Error ${action}ing quote:`, error);
    }
  };

  const totals = calculateTotals();

  // Column templates
  const statusBodyTemplate = (rowData: Quote) => {
    let severity: 'success' | 'warning' | 'danger' | 'info' | null = 'info';
    switch (rowData.status) {
      case 'draft': severity = 'info'; break;
      case 'sent': severity = 'warning'; break;
      case 'accepted': severity = 'success'; break;
      case 'rejected': severity = 'danger'; break;
      case 'expired': severity = null; break; // Custom style for expired
    }

    if (severity === null) {
      return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">{rowData.status_display}</span>;
    }
    return <Tag value={rowData.status_display} severity={severity} />;
  };

  const actionsBodyTemplate = (rowData: Quote) => {
    return (
      <div className="flex gap-2">
        {rowData.status === 'draft' && (
          <Button
            label="Enviar"
            icon="pi pi-send"
            size="small"
            text
            onClick={() => handleAction(rowData.id, 'send')}
          />
        )}
        {rowData.status === 'sent' && (
          <>
            <Button
              icon="pi pi-check"
              severity="success"
              rounded
              text
              tooltip="Aceptar"
              onClick={() => handleAction(rowData.id, 'accept')}
            />
            <Button
              icon="pi pi-times"
              severity="danger"
              rounded
              text
              tooltip="Rechazar"
              onClick={() => handleAction(rowData.id, 'reject')}
            />
          </>
        )}
      </div>
    );
  };

  const columns: DataTableColumn[] = [
    { field: 'quote_number', header: t('quotes.quoteNumber'), sortable: true, style: { fontFamily: 'monospace', fontWeight: 500 } },
    { field: 'client_name', header: t('sales.client'), body: (rowData) => rowData.client_name || 'Sin cliente' },
    { field: 'total', header: t('common.total'), body: (rowData) => formatCurrency(rowData.total), style: { fontWeight: 'bold' } },
    { field: 'status', header: t('common.status'), body: statusBodyTemplate, sortable: true },
    { field: 'valid_until', header: t('quotes.validUntil'), body: (rowData) => rowData.valid_until ? new Date(rowData.valid_until).toLocaleDateString('es') : '-' },
    { field: 'created_at', header: t('common.date'), body: (rowData) => new Date(rowData.created_at).toLocaleDateString('es'), sortable: true },
    { field: 'actions', header: t('table.actions'), body: actionsBodyTemplate, style: { minWidth: '150px' } },
  ];

  return (
    <div className="space-y-6">
      {/* DataTable */}
      <div className="card">
        <DataTable
          data={quotes}
          columns={columns}
          loading={isLoading}
          globalFilterValue={search}
          onGlobalFilterChange={setSearch}
          onNew={() => setShowNewQuote(true)}
          newButtonLabel={t('quotes.newQuote')}
          searchPlaceholder={`${t('common.search')}...`}
          emptyMessage={t('common.noResults')}
        />
      </div>

      {/* New Quote Modal */}
      {showNewQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold">{t('quotes.newQuote')}</h3>
              <button onClick={() => setShowNewQuote(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Products */}
                <div>
                  <h4 className="font-medium mb-3">Agregar productos</h4>
                  <div className="h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => addItem(product)}
                        className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-slate-500">{product.sku}</p>
                          </div>
                          <p className="font-semibold">{formatCurrency(product.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-medium mb-3">Items de cotización</h4>
                  <div className="h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    {items.length === 0 ? (
                      <p className="text-center text-slate-400 py-8">Agrega productos</p>
                    ) : (
                      items.map((item) => (
                        <div key={item.product.id} className="p-3 border-b border-slate-100 last:border-0">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="font-medium">{item.product.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  onClick={() => updateItem(item.product.id, 'quantity', item.quantity - 1)}
                                  className="w-6 h-6 bg-slate-100 rounded"
                                >
                                  -
                                </button>
                                <span>{item.quantity}</span>
                                <button
                                  onClick={() => updateItem(item.product.id, 'quantity', item.quantity + 1)}
                                  className="w-6 h-6 bg-slate-100 rounded"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <p className="font-semibold">
                              {formatCurrency(item.quantity * item.unit_price)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Client and Details */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="label">{t('sales.client')}</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="input"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('quotes.validUntil')}</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="label">Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                  rows={2}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Subtotal: {formatCurrency(totals.subtotal)}</p>
                  <p className="text-sm text-slate-500">IGV: {formatCurrency(totals.igv)}</p>
                  <p className="text-2xl font-bold">Total: {formatCurrency(totals.total)}</p>
                </div>
                <button
                  onClick={handleCreateQuote}
                  disabled={items.length === 0}
                  className="btn btn-primary px-8 py-3"
                >
                  Crear Cotización
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotes;
