# Store - Inventory and Sales Management System

Enterprise web application for inventory control, sales management, electronic invoicing, and comprehensive reporting.

## Overview

Store is a full-stack business management system designed to streamline operations for retail and wholesale businesses. The platform provides real-time inventory tracking, sales processing, customer management, and detailed analytics.

## Technology Stack

### Backend
- **Django 4.2** - High-level Python web framework
- **Django REST Framework** - RESTful API development
- **JWT Authentication** - Secure token-based authentication
- **SQLite** - Database (development environment)
- **Poetry** - Dependency management and packaging

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Composable charting library
- **react-i18next** - Internationalization (Spanish/English)
- **Yarn** - Package manager

## Features

- **Inventory Management** - Real-time stock tracking with low stock alerts
- **Product Catalog** - Comprehensive product management with barcode support
- **Sales Processing** - Automated sales registration with IGV calculation (18%)
- **Electronic Invoicing** - Generate invoices, receipts, and sales notes
- **Customer Management** - Client and supplier database with document management
- **Expense Tracking** - Categorized expense registration and reporting
- **Quotations** - Quote creation and status workflow management
- **Analytics & Reports** - Statistical reports with interactive charts and graphs
- **Multi-language Support** - Spanish and English interface

## Installation

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- Poetry (for Python dependency management)
- Yarn or npm (for Node.js dependency management)

### Backend Setup

```bash
cd backend

# Install Poetry if not already installed
pip install poetry

# Install project dependencies
poetry install

# Activate virtual environment
poetry shell

# Run database migrations
python manage.py migrate

# Create initial data (includes test user)
python manage.py setup_initial_data

# Start development server
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install
# or
npm install

# Start development server
yarn dev
# or
npm run dev
```

The frontend application will be available at `http://localhost:5173`

## Access

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Django Admin Panel**: http://localhost:8000/admin

### Test Credentials

- **Username**: `liuliu`
- **Password**: `liuliu`
- **Role**: Administrator

## Configuration

### Backend Configuration

Edit `backend/store_backend/config.py` to customize application settings:

```python
APP_CONFIG = {
    "name": "Store",
    "igv_rate": 0.18,
    "currency": "PEN",
    "currency_symbol": "S/",
    "company_name": "Your Company S.A.C.",
    # ... additional settings
}
```

### Frontend Configuration

Edit `frontend/src/config/app.config.ts` to customize frontend settings:

```typescript
export const APP_CONFIG = {
  name: 'Store',
  version: '1.0.0',
  theme: {
    primaryColor: '#1e40af',
    primaryLight: '#3b82f6',
    primaryDark: '#1e3a8a',
  },
  business: {
    igvRate: 0.18,
    currency: 'PEN',
    currencySymbol: 'S/',
  },
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
};
```

## Project Structure

```
store/
├── backend/
│   ├── apps/
│   │   ├── users/          # User authentication and management
│   │   ├── products/       # Product catalog and categories
│   │   ├── inventory/      # Stock control and movements
│   │   ├── sales/          # Sales transactions and invoices
│   │   ├── clients/        # Client and supplier management
│   │   ├── expenses/       # Expense tracking
│   │   ├── quotes/         # Quotation management
│   │   └── reports/        # Analytics and reporting
│   ├── store_backend/
│   │   ├── config.py       # Application configuration
│   │   ├── settings.py     # Django settings
│   │   └── urls.py         # URL routing
│   └── pyproject.toml      # Poetry configuration
└── frontend/
    ├── src/
    │   ├── components/     # Reusable React components
    │   ├── pages/          # Application pages
    │   ├── services/       # API service layer
    │   ├── context/        # React context providers
    │   ├── config/         # Frontend configuration
    │   └── i18n/           # Internationalization files
    └── package.json        # Node.js dependencies
```

## API Endpoints

### Authentication
- `POST /api/token/` - Obtain JWT authentication token
- `POST /api/token/refresh/` - Refresh JWT token
- `GET /api/users/me/` - Get current user profile

### Products
- `GET /api/products/` - List all products
- `POST /api/products/` - Create new product
- `GET /api/products/{id}/` - Get product details
- `PUT /api/products/{id}/` - Update product
- `DELETE /api/products/{id}/` - Delete product
- `GET /api/products/barcode/{barcode}/` - Lookup product by barcode

### Inventory
- `GET /api/inventory/` - List inventory items
- `POST /api/inventory/` - Create inventory entry
- `GET /api/inventory/{id}/` - Get inventory details
- `PUT /api/inventory/{id}/` - Update inventory
- `GET /api/inventory/low-stock/` - Get low stock alerts

### Sales
- `GET /api/sales/` - List sales transactions
- `POST /api/sales/` - Create new sale
- `GET /api/sales/{id}/` - Get sale details
- `PUT /api/sales/{id}/` - Update sale
- `GET /api/sales/{id}/invoice/` - Generate invoice PDF

### Reports
- `GET /api/reports/dashboard/` - Dashboard statistics
- `GET /api/reports/sales-chart/` - Sales chart data
- `GET /api/reports/top-products/` - Top selling products
- `GET /api/reports/sales-by-category/` - Sales by category
- `GET /api/reports/inventory-report/` - Inventory report
- `GET /api/reports/accounting-report/` - Accounting report

## Development

### Running Tests

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests (if configured)
cd frontend
yarn test
```

### Code Style

- Backend: Follow PEP 8 Python style guide
- Frontend: Follow ESLint and Prettier configurations

## License

MIT License

## Support

For issues, questions, or contributions, please refer to the project repository.
