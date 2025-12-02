import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { reportsAPI } from '../services/api';
import { formatCurrency } from '../config/app.config';

interface SellerData {
  seller_name: string;
  seller_first_name: string;
  seller_last_name: string;
  total: number;
  count: number;
}

interface MonthlyData {
  month: string;
  total: number;
  count: number;
}

interface InventoryReport {
  items: Array<{
    product_name: string;
    product_sku: string;
    quantity: number;
    value: number;
    stock_status: string;
  }>;
  total_value: number;
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

interface AccountingData {
  sales: {
    total: number;
    subtotal: number;
    igv: number;
    count: number;
    by_payment_method: Array<{ payment_method: string; total: number; count: number }>;
  };
  expenses: {
    total: number;
    count: number;
    by_category: Array<{ category_name: string; total: number; count: number }>;
  };
  profit: number;
}

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const Reports = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('sales');
  const [sellerData, setSellerData] = useState<SellerData[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ sales: MonthlyData[]; expenses: MonthlyData[] }>({
    sales: [],
    expenses: [],
  });
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [accountingData, setAccountingData] = useState<AccountingData | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, dateFrom, dateTo]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'sales') {
        const [sellerRes, monthlyRes] = await Promise.all([
          reportsAPI.getSalesBySeller(30),
          reportsAPI.getMonthlyComparison(12),
        ]);
        setSellerData(sellerRes.data);
        setMonthlyData(monthlyRes.data);
      } else if (activeTab === 'inventory') {
        const response = await reportsAPI.getInventoryReport();
        setInventoryReport(response.data);
      } else if (activeTab === 'accounting') {
        const params: Record<string, string> = {};
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        const response = await reportsAPI.getAccountingReport(params);
        setAccountingData(response.data);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'sales', label: t('reports.salesReport'), icon: '📈' },
    { id: 'inventory', label: t('reports.inventoryReport'), icon: '📦' },
    { id: 'accounting', label: t('reports.accountingReport'), icon: '🧮' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Sales Report */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              {/* Monthly Comparison Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Ventas Mensuales</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData.sales.map((s) => ({
                        month: new Date(s.month).toLocaleDateString('es', { month: 'short', year: '2-digit' }),
                        ventas: s.total,
                        cantidad: s.count,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="ventas" fill="#1e40af" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sales by Seller */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">{t('reports.sellerReport')}</h3>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Vendedor</th>
                        <th>Ventas</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerData.map((seller, index) => (
                        <tr key={index}>
                          <td className="font-medium">
                            {seller.seller_first_name || seller.seller_name}
                          </td>
                          <td>{seller.count}</td>
                          <td className="font-semibold">{formatCurrency(seller.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Report */}
          {activeTab === 'inventory' && inventoryReport && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="card">
                  <p className="text-sm text-slate-500">Productos</p>
                  <p className="text-2xl font-bold">{inventoryReport.total_products}</p>
                </div>
                <div className="card">
                  <p className="text-sm text-slate-500">Valor Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(inventoryReport.total_value)}</p>
                </div>
                <div className="card bg-yellow-50 border-yellow-200">
                  <p className="text-sm text-yellow-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-yellow-700">{inventoryReport.low_stock_count}</p>
                </div>
                <div className="card bg-red-50 border-red-200">
                  <p className="text-sm text-red-600">Sin Stock</p>
                  <p className="text-2xl font-bold text-red-700">{inventoryReport.out_of_stock_count}</p>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="table">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        <th>SKU</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Valor</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryReport.items.map((item, index) => (
                        <tr key={index}>
                          <td className="font-mono text-sm">{item.product_sku}</td>
                          <td>{item.product_name}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.value)}</td>
                          <td>
                            <span
                              className={`badge ${
                                item.stock_status === 'in_stock'
                                  ? 'badge-success'
                                  : item.stock_status === 'low_stock'
                                  ? 'badge-warning'
                                  : 'badge-danger'
                              }`}
                            >
                              {item.stock_status === 'in_stock'
                                ? 'En stock'
                                : item.stock_status === 'low_stock'
                                ? 'Stock bajo'
                                : 'Sin stock'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Accounting Report */}
          {activeTab === 'accounting' && (
            <div className="space-y-6">
              {/* Date Filters */}
              <div className="card">
                <div className="flex gap-4 items-end">
                  <div>
                    <label className="label">{t('reports.from')}</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{t('reports.to')}</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="input"
                    />
                  </div>
                  <button onClick={fetchReportData} className="btn btn-primary">
                    {t('reports.generate')}
                  </button>
                </div>
              </div>

              {accountingData && (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="card bg-green-50 border-green-200">
                      <p className="text-sm text-green-600">Ventas</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(accountingData.sales.total)}
                      </p>
                      <p className="text-xs text-green-500 mt-1">
                        {accountingData.sales.count} transacciones
                      </p>
                    </div>
                    <div className="card bg-red-50 border-red-200">
                      <p className="text-sm text-red-600">Gastos</p>
                      <p className="text-2xl font-bold text-red-700">
                        {formatCurrency(accountingData.expenses.total)}
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        {accountingData.expenses.count} gastos
                      </p>
                    </div>
                    <div
                      className={`card ${
                        accountingData.profit >= 0
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          accountingData.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        Utilidad
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          accountingData.profit >= 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {formatCurrency(accountingData.profit)}
                      </p>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Payment Methods */}
                    <div className="card">
                      <h3 className="text-lg font-semibold mb-4">Ventas por Método de Pago</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={accountingData.sales.by_payment_method}
                              dataKey="total"
                              nameKey="payment_method"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label
                            >
                              {accountingData.sales.by_payment_method.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Expenses by Category */}
                    <div className="card">
                      <h3 className="text-lg font-semibold mb-4">Gastos por Categoría</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={accountingData.expenses.by_category}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                            <YAxis
                              type="category"
                              dataKey="category_name"
                              stroke="#94a3b8"
                              fontSize={12}
                              width={100}
                            />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Bar dataKey="total" fill="#ef4444" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* IGV Summary */}
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Resumen IGV</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-500">Subtotal Ventas</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(accountingData.sales.subtotal)}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-500">IGV (18%)</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(accountingData.sales.igv)}
                        </p>
                      </div>
                      <div className="p-4 bg-primary-50 rounded-lg">
                        <p className="text-sm text-primary-600">Total con IGV</p>
                        <p className="text-xl font-bold text-primary-700">
                          {formatCurrency(accountingData.sales.total)}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;


