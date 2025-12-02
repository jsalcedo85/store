"""
Configuración centralizada de la aplicación Store.
Modifica estos valores para personalizar la aplicación.
"""

APP_CONFIG = {
    "name": "Store",
    "version": "1.0.0",
    "igv_rate": 0.18,  # 18% IGV en Perú
    "currency": "PEN",
    "currency_symbol": "S/",
    "company_name": "Mi Empresa S.A.C.",
    "company_ruc": "20123456789",
    "company_address": "Av. Principal 123, Lima, Perú",
    "company_phone": "+51 999 999 999",
    "company_email": "contacto@miempresa.com",
    "low_stock_threshold": 10,  # Umbral para alertas de bajo stock
    "pagination_size": 20,
}


def get_config(key: str, default=None):
    """Obtiene un valor de configuración."""
    return APP_CONFIG.get(key, default)


