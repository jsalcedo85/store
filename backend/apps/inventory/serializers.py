from rest_framework import serializers
from .models import Inventory, InventoryMovement


class InventorySerializer(serializers.ModelSerializer):
    """Serializer for Inventory model."""
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_barcode = serializers.CharField(source='product.barcode', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    stock_status = serializers.CharField(read_only=True)
    
    class Meta:
        model = Inventory
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'product_barcode',
            'quantity', 'min_quantity', 'location', 'is_low_stock',
            'stock_status', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class InventoryMovementSerializer(serializers.ModelSerializer):
    """Serializer for InventoryMovement model."""
    
    movement_type_display = serializers.CharField(
        source='get_movement_type_display', 
        read_only=True
    )
    user_name = serializers.CharField(source='user.username', read_only=True)
    product_name = serializers.CharField(
        source='inventory.product.name', 
        read_only=True
    )
    
    class Meta:
        model = InventoryMovement
        fields = [
            'id', 'inventory', 'product_name', 'movement_type',
            'movement_type_display', 'quantity', 'previous_quantity',
            'new_quantity', 'reason', 'user', 'user_name', 'created_at'
        ]
        read_only_fields = [
            'id', 'previous_quantity', 'new_quantity', 'user', 'created_at'
        ]


class StockAdjustmentSerializer(serializers.Serializer):
    """Serializer for stock adjustment."""
    
    quantity = serializers.IntegerField()
    movement_type = serializers.ChoiceField(
        choices=InventoryMovement.MovementType.choices
    )
    reason = serializers.CharField(required=False, allow_blank=True)


