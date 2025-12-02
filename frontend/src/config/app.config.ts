/**
 * Configuración centralizada de la aplicación.
 * Modifica estos valores para personalizar la aplicación.
 */

export const APP_CONFIG = {
  name: 'Store',
  version: '1.0.0',
  description: 'Sistema de Gestión de Inventario y Ventas',
  
  // Colores corporativos (azul)
  theme: {
    primaryColor: '#1e40af',
    primaryLight: '#3b82f6',
    primaryDark: '#1e3a8a',
  },
  
  // Configuración de negocio
  business: {
    igvRate: 0.18,
    currency: 'PEN',
    currencySymbol: 'S/',
  },
  
  // API
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
};

export const formatCurrency = (amount: number | string | null | undefined): string => {
  const num = Number(amount) || 0;
  return `${APP_CONFIG.business.currencySymbol} ${num.toFixed(2)}`;
};

export const calculateIGV = (subtotal: number): number => {
  return subtotal * APP_CONFIG.business.igvRate;
};


