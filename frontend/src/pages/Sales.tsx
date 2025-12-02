import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { salesAPI, productsAPI, clientsAPI } from '../services/api';
import { formatCurrency, APP_CONFIG } from '../config/app.config';

interface Sale {
  id: number;
  client_name: string;
  seller_name: string;
  subtotal: number;
  igv: number;
  total: number;
  payment_method: string;
  payment_method_display: string;
  status: string;
  status_display: string;
  created_at: string;
  invoice?: {
    invoice_type_display: string;
    series: string;
    number: string;
  };
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

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
}

const Sales = () => {
  const { t } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSale, setShowNewSale] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [invoiceType, setInvoiceType] = useState('boleta');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchClients();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await salesAPI.getAll();
      setSales(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
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

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1, unit_price: product.price }]);
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.product.id !== productId));
    } else {
      setCart(
        cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let igv = 0;

    cart.forEach((item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      subtotal += itemSubtotal;
      if (item.product.apply_igv) {
        igv += itemSubtotal * APP_CONFIG.business.igvRate;
      }
    });

    return { subtotal, igv, total: subtotal + igv };
  };

  const handleCreateSale = async () => {
    if (cart.length === 0) return;

    try {
      await salesAPI.create({
        client: selectedClient ? parseInt(selectedClient) : null,
        payment_method: paymentMethod,
        invoice_type: invoiceType,
        items: cart.map((item) => ({
          product: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });

      setShowNewSale(false);
      setCart([]);
      setSelectedClient('');
      fetchSales();
    } catch (error) {
      console.error('Error creating sale:', error);
    }
  };

  const handleCancelSale = async (id: number) => {
    if (window.confirm('¿Estás seguro de anular esta venta?')) {
      try {
        await salesAPI.cancel(id);
        fetchSales();
      } catch (error) {
        console.error('Error cancelling sale:', error);
      }
    }
  };

  const totals = calculateTotals();
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('sales.title')}</h2>
        <button
          onClick={() => setShowNewSale(true)}
          className="btn btn-primary"
        >
          + {t('sales.newSale')}
        </button>
      </div>

      {/* Sales Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t('invoices.type')}</th>
                <th>{t('sales.client')}</th>
                <th>{t('sales.seller')}</th>
                <th>{t('common.subtotal')}</th>
                <th>{t('sales.igv')}</th>
                <th>{t('common.total')}</th>
                <th>{t('sales.paymentMethod')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.date')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-slate-500">
                    {t('common.noResults')}
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>#{sale.id}</td>
                    <td className="text-sm">
                      {sale.invoice
                        ? `${sale.invoice.series}-${sale.invoice.number}`
                        : '-'}
                    </td>
                    <td>{sale.client_name || 'Cliente General'}</td>
                    <td>{sale.seller_name}</td>
                    <td>{formatCurrency(sale.subtotal)}</td>
                    <td>{formatCurrency(sale.igv)}</td>
                    <td className="font-semibold">{formatCurrency(sale.total)}</td>
                    <td>{sale.payment_method_display}</td>
                    <td>
                      <span className={`badge ${getStatusColor(sale.status)}`}>
                        {sale.status_display}
                      </span>
                    </td>
                    <td className="text-sm">
                      {new Date(sale.created_at).toLocaleDateString('es')}
                    </td>
                    <td>
                      {sale.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelSale(sale.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Anular
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal */}
      {showNewSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold">{t('sales.newSale')}</h3>
              <button
                onClick={() => setShowNewSale(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Products */}
                <div>
                  <h4 className="font-medium mb-3">Productos</h4>
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="input mb-3"
                  />
                  <div className="h-64 overflow-y-auto border border-slate-200 rounded-lg">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => addToCart(product)}
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

                {/* Cart */}
                <div>
                  <h4 className="font-medium mb-3">Carrito</h4>
                  <div className="h-64 overflow-y-auto border border-slate-200 rounded-lg mb-4">
                    {cart.length === 0 ? (
                      <p className="text-center text-slate-400 py-8">
                        Agrega productos al carrito
                      </p>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="p-3 border-b border-slate-100 last:border-0"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-sm text-slate-500">
                                {formatCurrency(item.unit_price)} x {item.quantity}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity - 1)
                                }
                                className="w-8 h-8 bg-slate-100 rounded-lg"
                              >
                                -
                              </button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity + 1)
                                }
                                className="w-8 h-8 bg-slate-100 rounded-lg"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Client and Payment */}
                  <div className="space-y-3">
                    <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="input"
                    >
                      <option value="">Cliente General</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} - {client.document_number}
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="input"
                      >
                        <option value="cash">{t('sales.cash')}</option>
                        <option value="card">{t('sales.card')}</option>
                        <option value="transfer">{t('sales.transfer')}</option>
                      </select>
                      <select
                        value={invoiceType}
                        onChange={(e) => setInvoiceType(e.target.value)}
                        className="input"
                      >
                        <option value="boleta">{t('invoices.boleta')}</option>
                        <option value="factura">{t('invoices.factura')}</option>
                        <option value="nota_venta">{t('invoices.notaVenta')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">
                    Subtotal: {formatCurrency(totals.subtotal)}
                  </p>
                  <p className="text-sm text-slate-500">
                    IGV (18%): {formatCurrency(totals.igv)}
                  </p>
                  <p className="text-2xl font-bold">
                    Total: {formatCurrency(totals.total)}
                  </p>
                </div>
                <button
                  onClick={handleCreateSale}
                  disabled={cart.length === 0}
                  className="btn btn-primary px-8 py-3 text-lg"
                >
                  Completar Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;


