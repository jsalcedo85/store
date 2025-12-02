from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q

from .models import Sale, SaleItem, Invoice
from .serializers import SaleSerializer, CreateSaleSerializer, InvoiceSerializer
from apps.products.models import Product
from apps.clients.models import Client
from apps.inventory.models import Inventory, InventoryMovement


class SaleViewSet(viewsets.ModelViewSet):
    """ViewSet for Sale management."""
    
    queryset = Sale.objects.select_related('client', 'seller').prefetch_related('items__product').all()
    serializer_class = SaleSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status
        sale_status = self.request.query_params.get('status')
        if sale_status:
            queryset = queryset.filter(status=sale_status)
        
        # Filter by payment method
        payment_method = self.request.query_params.get('payment_method')
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        # Filter by seller
        seller = self.request.query_params.get('seller')
        if seller:
            queryset = queryset.filter(seller_id=seller)
        
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new sale with items."""
        serializer = CreateSaleSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Create sale
        client = None
        if data.get('client'):
            try:
                client = Client.objects.get(id=data['client'])
            except Client.DoesNotExist:
                pass
        
        sale = Sale.objects.create(
            client=client,
            seller=request.user,
            payment_method=data['payment_method'],
            notes=data.get('notes', ''),
            status=Sale.Status.COMPLETED
        )
        
        # Create sale items and update inventory
        for item_data in data['items']:
            try:
                product = Product.objects.get(id=item_data['product'])
            except Product.DoesNotExist:
                sale.delete()
                return Response(
                    {'error': f'Producto {item_data["product"]} no encontrado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=item_data['quantity'],
                unit_price=item_data.get('unit_price', product.price)
            )
            
            # Update inventory
            try:
                inventory = Inventory.objects.get(product=product)
                previous_qty = inventory.quantity
                inventory.quantity -= item_data['quantity']
                inventory.save()
                
                InventoryMovement.objects.create(
                    inventory=inventory,
                    movement_type=InventoryMovement.MovementType.OUT,
                    quantity=item_data['quantity'],
                    previous_quantity=previous_qty,
                    new_quantity=inventory.quantity,
                    reason=f'Venta #{sale.id}',
                    user=request.user
                )
            except Inventory.DoesNotExist:
                pass
        
        # Calculate totals
        sale.calculate_totals()
        
        # Create invoice
        invoice_type = data.get('invoice_type', Invoice.InvoiceType.BOLETA)
        last_invoice = Invoice.objects.filter(
            invoice_type=invoice_type
        ).order_by('-id').first()
        
        if last_invoice:
            number = str(int(last_invoice.number) + 1).zfill(8)
        else:
            number = '00000001'
        
        series_prefix = {
            Invoice.InvoiceType.BOLETA: 'B001',
            Invoice.InvoiceType.FACTURA: 'F001',
            Invoice.InvoiceType.NOTA_VENTA: 'NV01',
        }
        
        Invoice.objects.create(
            sale=sale,
            invoice_type=invoice_type,
            series=series_prefix.get(invoice_type, 'B001'),
            number=number
        )
        
        return Response(
            SaleSerializer(sale).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a sale and restore inventory."""
        sale = self.get_object()
        
        if sale.status == Sale.Status.CANCELLED:
            return Response(
                {'error': 'La venta ya está anulada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Restore inventory
            for item in sale.items.all():
                try:
                    inventory = Inventory.objects.get(product=item.product)
                    previous_qty = inventory.quantity
                    inventory.quantity += item.quantity
                    inventory.save()
                    
                    InventoryMovement.objects.create(
                        inventory=inventory,
                        movement_type=InventoryMovement.MovementType.IN,
                        quantity=item.quantity,
                        previous_quantity=previous_qty,
                        new_quantity=inventory.quantity,
                        reason=f'Anulación de venta #{sale.id}',
                        user=request.user
                    )
                except Inventory.DoesNotExist:
                    pass
            
            sale.status = Sale.Status.CANCELLED
            sale.save()
        
        return Response(SaleSerializer(sale).data)


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Invoice (read-only)."""
    
    queryset = Invoice.objects.select_related('sale__client').all()
    serializer_class = InvoiceSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by type
        invoice_type = self.request.query_params.get('type')
        if invoice_type:
            queryset = queryset.filter(invoice_type=invoice_type)
        
        return queryset


