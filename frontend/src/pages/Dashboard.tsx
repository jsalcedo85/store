import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { reportsAPI } from '../services/api';
import { formatCurrency } from '../config/app.config';
import { applyHighchartsTheme } from '../components/HighchartsTheme';

// Apply theme globally
applyHighchartsTheme();

interface DashboardData {
  sales_today: { total: number; count: number };
  sales_month: { total: number; count: number };
  expenses_month: number;
  profit_month: number;
  low_stock_count: number;
  active_clients: number;
  active_products: number;
  pending_quotes: number;
}

interface SalesChartData {
  date: string;
  total: number;
  count: number;
}

interface TopProduct {
  product_name: string;
  total_sold: number;
  total_revenue: number;
}

interface CategorySales {
  category_name: string;
  total: number;
}

// Datos de ejemplo cuando no hay datos reales
const SAMPLE_DASHBOARD: DashboardData = {
  sales_today: { total: 0, count: 0 },
  sales_month: { total: 0, count: 0 },
  expenses_month: 0,
  profit_month: 0,
  low_stock_count: 0,
  active_clients: 0,
  active_products: 0,
  pending_quotes: 0,
};

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [dashboardData, setDashboardData] = useState<DashboardData>(SAMPLE_DASHBOARD);
  const [salesChart, setSalesChart] = useState<SalesChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [dashboardRes, salesChartRes, topProductsRes, categoryRes] = await Promise.all([
          reportsAPI.getDashboard(),
          reportsAPI.getSalesChart(30),
          reportsAPI.getTopProducts(30, 5),
          reportsAPI.getSalesByCategory(30),
        ]);

        setDashboardData(dashboardRes.data || SAMPLE_DASHBOARD);
        setSalesChart(salesChartRes.data || []);
        setTopProducts(topProductsRes.data || []);
        setCategorySales(categoryRes.data || []);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);

        let errorMessage = 'Error al cargar los datos del panel';

        if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
          errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
        } else if (err?.response?.status === 401) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        } else if (err?.response?.status === 403) {
          errorMessage = 'No tienes permisos para ver estos datos.';
        } else if (err?.response?.status === 404) {
          errorMessage = 'El endpoint no fue encontrado. Verifica la configuración del servidor.';
        } else if (err?.response?.status >= 500) {
          errorMessage = 'Error del servidor. Por favor, intenta más tarde.';
        } else if (err?.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        // Usar datos de ejemplo en caso de error
        setDashboardData(SAMPLE_DASHBOARD);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getLocale = () => i18n.language === 'es' ? 'es-PE' : 'en-US';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: t('dashboard.salesToday'),
      value: formatCurrency(dashboardData.sales_today.total),
      subValue: `${dashboardData.sales_today.count} ${t('dashboard.sales')}`,
      trend: 'neutral',
      icon: 'pi pi-shopping-cart'
    },
    {
      label: t('dashboard.salesMonth'),
      value: formatCurrency(dashboardData.sales_month.total),
      subValue: `${dashboardData.sales_month.count} ${t('dashboard.sales')}`,
      trend: 'up',
      icon: 'pi pi-chart-line'
    },
    {
      label: t('dashboard.expensesMonth'),
      value: formatCurrency(dashboardData.expenses_month),
      trend: 'neutral',
      icon: 'pi pi-wallet'
    },
    {
      label: t('dashboard.profitMonth'),
      value: formatCurrency(dashboardData.profit_month),
      trend: dashboardData.profit_month >= 0 ? 'up' : 'down',
      icon: 'pi pi-money-bill'
    },
  ];

  const quickStats = [
    { label: t('dashboard.lowStock'), value: dashboardData.low_stock_count, icon: 'pi pi-exclamation-triangle', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: t('dashboard.activeClients'), value: dashboardData.active_clients, icon: 'pi pi-users', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('dashboard.activeProducts'), value: dashboardData.active_products, icon: 'pi pi-box', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: t('dashboard.pendingQuotes'), value: dashboardData.pending_quotes, icon: 'pi pi-file', color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  // Chart Options
  const getSalesChartOptions = (): Highcharts.Options => ({
    chart: { type: 'area', height: 280 },
    title: { text: '' },
    xAxis: {
      categories: salesChart.map(d => new Date(d.date + 'T00:00:00').toLocaleDateString(getLocale(), { day: '2-digit', month: 'short' })),
      tickInterval: Math.ceil(salesChart.length / 10),
    },
    yAxis: {
      title: { text: '' },
    },
    tooltip: {
      pointFormatter: function () {
        return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${formatCurrency(this.y || 0)}</b><br/>`;
      }
    },
    series: [{
      type: 'area',
      name: 'Ventas',
      data: salesChart.map(d => d.total),
      color: '#1e40af',
      fillColor: {
        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
        stops: [
          [0, 'rgba(30, 64, 175, 0.5)'],
          [1, 'rgba(30, 64, 175, 0.0)']
        ]
      }
    }],
  });

  const getCategoryChartOptions = (): Highcharts.Options => ({
    chart: { type: 'pie', height: 280 },
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
          enabled: false
        },
        showInLegend: true
      }
    },
    legend: {
      enabled: true,
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle'
    },
    series: [{
      type: 'pie',
      name: 'Ventas',
      innerSize: '50%',
      data: categorySales.map(c => ({
        name: c.category_name || t('dashboard.noCategory'),
        y: c.total
      }))
    }]
  });

  const getTopProductsOptions = (): Highcharts.Options => ({
    chart: { type: 'bar', height: 250 },
    title: { text: '' },
    xAxis: {
      categories: topProducts.map(p => p.product_name.length > 20 ? `${p.product_name.substring(0, 20)}...` : p.product_name),
    },
    yAxis: {
      title: { text: '' },
    },
    tooltip: {
      pointFormatter: function () {
        return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${formatCurrency(this.y || 0)}</b><br/>`;
      }
    },
    series: [{
      type: 'bar',
      name: 'Ingresos',
      data: topProducts.map(p => p.total_revenue),
      color: '#3b82f6'
    }]
  });

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="pi pi-times-circle text-red-400 text-xl"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
              {error.includes('conectar') && (
                <p className="mt-2 text-xs">
                  Asegúrate de que el backend esté corriendo en <code className="bg-red-100 px-1 rounded">http://localhost:8000</code>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <i className={`${stat.icon} text-slate-400`}></i>
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                {stat.subValue && (
                  <p className="text-xs text-slate-400 mt-1">{stat.subValue}</p>
                )}
              </div>
              <div className={`w-2 h-12 rounded-full ${stat.trend === 'up' ? 'bg-emerald-500' :
                stat.trend === 'down' ? 'bg-red-500' : 'bg-slate-300'
                }`} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.bg}`}>
              <i className={`${stat.icon} ${stat.color} text-lg`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">{t('dashboard.salesChart')}</h3>
          <div className="h-72">
            {salesChart.length > 0 ? (
              <HighchartsReact highcharts={Highcharts} options={getSalesChartOptions()} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                {t('dashboard.noData')}
              </div>
            )}
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">{t('dashboard.salesByCategory')}</h3>
          <div className="h-72">
            {categorySales.length > 0 ? (
              <HighchartsReact highcharts={Highcharts} options={getCategoryChartOptions()} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                {t('dashboard.noData')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-4">{t('dashboard.topProducts')}</h3>
        <div className="h-64">
          {topProducts.length > 0 ? (
            <HighchartsReact highcharts={Highcharts} options={getTopProductsOptions()} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              {t('dashboard.noData')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
