from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.products.models import Category, Product
from apps.inventory.models import Inventory
from apps.clients.models import Client, Supplier
from apps.expenses.models import ExpenseCategory

User = get_user_model()


class Command(BaseCommand):
    help = 'Set up initial data including test user'
    
    def handle(self, *args, **options):
        self.stdout.write('Setting up initial data...')
        
        # Create test user
        if not User.objects.filter(username='liuliu').exists():
            user = User.objects.create_user(
                username='liuliu',
                email='liuliu@store.com',
                password='liuliu',
                first_name='Liu',
                last_name='Liu',
                role=User.Role.ADMIN
            )
            self.stdout.write(self.style.SUCCESS(f'Created user: {user.username}'))
        else:
            self.stdout.write('User liuliu already exists')
        
        # Create product categories
        categories = [
            'Electrónicos', 'Ropa', 'Alimentos', 'Hogar', 'Oficina'
        ]
        for cat_name in categories:
            Category.objects.get_or_create(name=cat_name)
        self.stdout.write(self.style.SUCCESS('Created product categories'))
        
        # Create expense categories
        expense_cats = [
            'Servicios', 'Alquiler', 'Sueldos', 'Proveedores', 'Marketing', 'Otros'
        ]
        for cat_name in expense_cats:
            ExpenseCategory.objects.get_or_create(name=cat_name)
        self.stdout.write(self.style.SUCCESS('Created expense categories'))
        
        # Create sample products
        electronics = Category.objects.get(name='Electrónicos')
        sample_products = [
            {'name': 'Laptop HP 15"', 'sku': 'LAPTOP001', 'barcode': '7501234567890', 'price': 2500.00, 'cost': 2000.00, 'category': electronics},
            {'name': 'Mouse Inalámbrico', 'sku': 'MOUSE001', 'barcode': '7501234567891', 'price': 50.00, 'cost': 30.00, 'category': electronics},
            {'name': 'Teclado Mecánico', 'sku': 'KEYB001', 'barcode': '7501234567892', 'price': 150.00, 'cost': 100.00, 'category': electronics},
            {'name': 'Monitor 24"', 'sku': 'MON001', 'barcode': '7501234567893', 'price': 800.00, 'cost': 600.00, 'category': electronics},
            {'name': 'Auriculares Bluetooth', 'sku': 'AUD001', 'barcode': '7501234567894', 'price': 120.00, 'cost': 80.00, 'category': electronics},
        ]
        
        for prod_data in sample_products:
            product, created = Product.objects.get_or_create(
                sku=prod_data['sku'],
                defaults=prod_data
            )
            if created:
                # Create inventory
                Inventory.objects.create(
                    product=product,
                    quantity=50,
                    min_quantity=10
                )
        self.stdout.write(self.style.SUCCESS('Created sample products'))
        
        # Create sample clients
        sample_clients = [
            {'name': 'Juan Pérez', 'document_type': 'dni', 'document_number': '12345678'},
            {'name': 'Empresa ABC S.A.C.', 'document_type': 'ruc', 'document_number': '20123456789'},
        ]
        for client_data in sample_clients:
            Client.objects.get_or_create(
                document_number=client_data['document_number'],
                defaults=client_data
            )
        self.stdout.write(self.style.SUCCESS('Created sample clients'))
        
        # Create sample suppliers
        sample_suppliers = [
            {'name': 'Proveedor Tech S.A.C.', 'ruc': '20987654321', 'contact_name': 'Carlos García'},
        ]
        for sup_data in sample_suppliers:
            Supplier.objects.get_or_create(
                ruc=sup_data['ruc'],
                defaults=sup_data
            )
        self.stdout.write(self.style.SUCCESS('Created sample suppliers'))
        
        self.stdout.write(self.style.SUCCESS('Initial data setup complete!'))


