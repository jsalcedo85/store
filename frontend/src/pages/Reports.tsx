import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { reportsAPI } from '../services/api';
import { formatCurrency } from '../config/app.config';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { Tag } from 'primereact/tag';
import { applyHighchartsTheme } from '../components/HighchartsTheme';

// Apply theme globally
applyHighchartsTheme();

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
  const [search, setSearch] = useState('');

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
    { id: 'sales', label: t('reports.salesReport'), icon: 'pi pi-chart-line' },
    { id: 'inventory', label: t('reports.inventoryReport'), icon: 'pi pi-box' },
    { id: 'accounting', label: t('reports.accountingReport'), icon: 'pi pi-calculator' },
  ];

  // Column templates for Seller Table
  const sellerColumns: DataTableColumn[] = [
    { field: 'seller_name', header: 'Vendedor', body: (rowData) => rowData.seller_first_name || rowData.seller_name, sortable: true },
    { field: 'count', header: 'Ventas', sortable: true },
    { field: 'total', header: 'Total', body: (rowData) => formatCurrency(rowData.total), sortable: true, style: { fontWeight: 'bold' } },
  ];

  // Column templates for Inventory Table
  const stockStatusBodyTemplate = (rowData: any) => {
    switch (rowData.stock_status) {
      case 'in_stock':
        return <Tag value="En stock" severity="success" />;
      case 'low_stock':
        return <Tag value="Stock bajo" severity="warning" />;
      case 'out_of_stock':
        return <Tag value="Sin stock" severity="danger" />;
      default:
        return null;
    }
  };

  const inventoryColumns: DataTableColumn[] = [
    { field: 'product_sku', header: 'SKU', sortable: true, style: { fontFamily: 'monospace' } },
    { field: 'product_name', header: 'Producto', sortable: true },
    { field: 'quantity', header: 'Cantidad', sortable: true },
    { field: 'value', header: 'Valor', body: (rowData) => formatCurrency(rowData.value), sortable: true },
    { field: 'stock_status', header: 'Estado', body: stockStatusBodyTemplate, sortable: true },
  ];

  // Chart Options
  const getMonthlySalesOptions = (): Highcharts.Options => ({
    chart: { type: 'column', height: 320 },
    title: { text: '' },
    xAxis: {
      categories: monthlyData.sales.map(s => new Date(s.month.substring(0, 10) + 'T00:00:00').toLocaleDateString('es', { month: 'short', year: '2-digit' })),
    },
    yAxis: {
      title: { text: 'Ventas' },
    },
    tooltip: {
      pointFormatter: function () {
        return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${formatCurrency(this.y || 0)}</b><br/>`;
      }
    },
    series: [{
      type: 'column',
      name: 'Ventas',
      data: monthlyData.sales.map(s => s.total),
    }],
  });

  const getPaymentMethodsOptions = (): Highcharts.Options => ({
    chart: { type: 'pie', height: 300 },
    title: { text: '' },
    tooltip: {
      pointFormatter: function () {
        return `<b>${this.name}</b>: ${formatCurrency(this.y || 0)} (${this.percentage?.toFixed(1)}%)`;
      }
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f} %'
        }
      }
    },
    series: [{
      type: 'pie',
      name: 'Método de Pago',
      data: accountingData?.sales.by_payment_method.map(item => ({
        name: item.payment_method,
        y: item.total
      })) || []
    }]
  });

  const getExpensesByCategoryOptions = (): Highcharts.Options => ({
    chart: { type: 'bar', height: 300 },
    title: { text: '' },
    xAxis: {
      categories: accountingData?.expenses.by_category.map(c => c.category_name) || [],
    },
    yAxis: {
      title: { text: 'Total' },
    },
    tooltip: {
      pointFormatter: function () {
        return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${formatCurrency(this.y || 0)}</b><br/>`;
      }
    },
    series: [{
      type: 'bar',
      name: 'Gastos',
      data: accountingData?.expenses.by_category.map(c => c.total) || [],
      color: '#ef4444'
    }]
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${activeTab === tab.id
              ? 'bg-primary-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            <i className={`${tab.icon} mr-2`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && !sellerData.length && !inventoryReport && !accountingData ? (
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
                <HighchartsReact highcharts={Highcharts} options={getMonthlySalesOptions()} />
              </div>

              {/* Sales by Seller */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">{t('reports.sellerReport')}</h3>
                <DataTable
                  data={sellerData}
                  columns={sellerColumns}
                  loading={isLoading}
                  emptyMessage={t('common.noResults')}
                />
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
              <div className="card">
                <DataTable
                  data={inventoryReport.items}
                  columns={inventoryColumns}
                  loading={isLoading}
                  globalFilterValue={search}
                  onGlobalFilterChange={setSearch}
                  searchPlaceholder={`${t('common.search')}...`}
                  emptyMessage={t('common.noResults')}
                />
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
                      className={`card ${accountingData.profit >= 0
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-red-50 border-red-200'
                        }`}
                    >
                      <p
                        className={`text-sm ${accountingData.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                      >
                        Utilidad
                      </p>
                      <p
                        className={`text-2xl font-bold ${accountingData.profit >= 0 ? 'text-emerald-700' : 'text-red-700'
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
                      <HighchartsReact highcharts={Highcharts} options={getPaymentMethodsOptions()} />
                    </div>

                    {/* Expenses by Category */}
                    <div className="card">
                      <h3 className="text-lg font-semibold mb-4">Gastos por Categoría</h3>
                      <HighchartsReact highcharts={Highcharts} options={getExpensesByCategoryOptions()} />
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
