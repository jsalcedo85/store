# Store - Sistema de Gestión de Inventario y Ventas

Sistema web corporativo para control de inventario, ventas, facturación electrónica y reportes.

## Tecnologías

### Backend
- Django 4.2
- Django REST Framework
- JWT Authentication
- SQLite (desarrollo)
- Poetry (gestión de dependencias)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts (gráficos)
- react-i18next (ES/EN)
- Yarn (gestión de dependencias)

## Características

- 📦 Control de inventario con alertas de stock bajo
- 🏷️ Catálogo de productos con código de barras
- 💰 Registro de ventas con cálculo automático de IGV (18%)
- 🧾 Emisión de comprobantes (Boleta, Factura, Nota de Venta)
- 👥 Gestión de clientes y proveedores
- 💸 Registro de gastos por categoría
- 📝 Cotizaciones
- 📊 Reportes y gráficos estadísticos
- 🌐 Soporte multi-idioma (Español/Inglés)

## Instalación

### Backend

```bash
cd backend

# Instalar Poetry si no lo tienes
pip install poetry

# Instalar dependencias
poetry install

# Activar entorno virtual
poetry shell

# Ejecutar migraciones
python manage.py migrate

# Crear datos iniciales (incluye usuario de prueba)
python manage.py setup_initial_data

# Iniciar servidor
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Instalar dependencias
yarn install

# Iniciar servidor de desarrollo
yarn dev
```

## Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Admin Django**: http://localhost:8000/admin

### Usuario de prueba
- **Usuario**: `liuliu`
- **Contraseña**: `liuliu`
- **Rol**: Administrador

## Configuración

### Backend
Edita `backend/store_backend/config.py`:

```python
APP_CONFIG = {
    "name": "Store",
    "igv_rate": 0.18,
    "currency": "PEN",
    "company_name": "Mi Empresa S.A.C.",
    ...
}
```

### Frontend
Edita `frontend/src/config/app.config.ts`:

```typescript
export const APP_CONFIG = {
  name: 'Store',
  theme: {
    primaryColor: '#1e40af',
  },
  business: {
    igvRate: 0.18,
    currency: 'PEN',
  },
};
```

## Estructura del Proyecto

```
store/
├── backend/
│   ├── apps/
│   │   ├── users/        # Usuarios y autenticación
│   │   ├── products/     # Productos y categorías
│   │   ├── inventory/    # Control de stock
│   │   ├── sales/        # Ventas y comprobantes
│   │   ├── clients/      # Clientes y proveedores
│   │   ├── expenses/     # Gastos
│   │   ├── quotes/       # Cotizaciones
│   │   └── reports/      # Reportes y estadísticas
│   ├── store_backend/
│   │   ├── config.py     # Configuración de la app
│   │   └── settings.py
│   └── pyproject.toml
└── frontend/
    ├── src/
    │   ├── components/   # Componentes React
    │   ├── pages/        # Páginas
    │   ├── services/     # API calls
    │   ├── context/      # Context providers
    │   ├── config/       # Configuración
    │   └── i18n/         # Traducciones
    └── package.json
```

## API Endpoints

- `POST /api/token/` - Obtener token JWT
- `GET /api/users/me/` - Perfil del usuario
- `GET /api/products/` - Listar productos
- `GET /api/inventory/` - Listar inventario
- `POST /api/sales/` - Crear venta
- `GET /api/clients/` - Listar clientes
- `GET /api/reports/dashboard/` - Estadísticas del dashboard

## Licencia

MIT


