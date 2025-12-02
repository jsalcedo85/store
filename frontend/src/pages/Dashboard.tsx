import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportsAPI } from '../services/api';
import { formatCurrency } from '../config/app.config';

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

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

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
    },
    {
      label: t('dashboard.salesMonth'),
      value: formatCurrency(dashboardData.sales_month.total),
      subValue: `${dashboardData.sales_month.count} ${t('dashboard.sales')}`,
      trend: 'up',
    },
    {
      label: t('dashboard.expensesMonth'),
      value: formatCurrency(dashboardData.expenses_month),
      trend: 'neutral',
    },
    {
      label: t('dashboard.profitMonth'),
      value: formatCurrency(dashboardData.profit_month),
      trend: dashboardData.profit_month >= 0 ? 'up' : 'down',
    },
  ];

  const quickStats = [
    { label: t('dashboard.lowStock'), value: dashboardData.low_stock_count },
    { label: t('dashboard.activeClients'), value: dashboardData.active_clients },
    { label: t('dashboard.activeProducts'), value: dashboardData.active_products },
    { label: t('dashboard.pendingQuotes'), value: dashboardData.pending_quotes },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
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
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                {stat.subValue && (
                  <p className="text-xs text-slate-400 mt-1">{stat.subValue}</p>
                )}
              </div>
              <div className={`w-2 h-12 rounded-full ${
                stat.trend === 'up' ? 'bg-emerald-500' : 
                stat.trend === 'down' ? 'bg-red-500' : 'bg-slate-300'
              }`} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString(getLocale(), { day: '2-digit', month: 'short' })}
                    stroke="#94a3b8"
                    fontSize={11}
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Total']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString(getLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#1e40af"
                    strokeWidth={2}
                    dot={{ fill: '#1e40af', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales}
                    dataKey="total"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ category_name, percent }) => 
                      `${category_name || t('dashboard.noCategory')}: ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {categorySales.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)} 
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="product_name"
                  stroke="#94a3b8"
                  fontSize={11}
                  width={150}
                  tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'total_sold' ? `${value} ${t('dashboard.units')}` : formatCurrency(value),
                    name === 'total_sold' ? t('dashboard.quantity') : t('dashboard.revenue'),
                  ]}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="total_sold" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
