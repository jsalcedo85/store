from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from .models import Inventory, InventoryMovement
from .serializers import (
    InventorySerializer, 
    InventoryMovementSerializer,
    StockAdjustmentSerializer
)


class InventoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Inventory management."""
    
    queryset = Inventory.objects.select_related('product').all()
    serializer_class = InventorySerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by stock status
        stock_status = self.request.query_params.get('status')
        if stock_status == 'low':
            queryset = [inv for inv in queryset if inv.is_low_stock]
            return Inventory.objects.filter(id__in=[i.id for i in queryset])
        elif stock_status == 'out':
            queryset = queryset.filter(quantity__lte=0)
        
        # Search by product
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(product__name__icontains=search) |
                Q(product__sku__icontains=search) |
                Q(product__barcode__icontains=search)
            )
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def adjust(self, request, pk=None):
        """Adjust stock quantity."""
        inventory = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        
        if serializer.is_valid():
            quantity = serializer.validated_data['quantity']
            movement_type = serializer.validated_data['movement_type']
            reason = serializer.validated_data.get('reason', '')
            
            previous_quantity = inventory.quantity
            
            if movement_type == InventoryMovement.MovementType.IN:
                inventory.quantity += quantity
            elif movement_type == InventoryMovement.MovementType.OUT:
                inventory.quantity -= quantity
            else:  # adjustment
                inventory.quantity = quantity
            
            inventory.save()
            
            # Create movement record
            InventoryMovement.objects.create(
                inventory=inventory,
                movement_type=movement_type,
                quantity=quantity,
                previous_quantity=previous_quantity,
                new_quantity=inventory.quantity,
                reason=reason,
                user=request.user
            )
            
            return Response(InventorySerializer(inventory).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock."""
        inventories = [inv for inv in self.get_queryset() if inv.is_low_stock]
        serializer = InventorySerializer(inventories, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def movements(self, request):
        """Get all inventory movements."""
        movements = InventoryMovement.objects.select_related(
            'inventory__product', 'user'
        ).all()[:100]
        serializer = InventoryMovementSerializer(movements, many=True)
        return Response(serializer.data)


