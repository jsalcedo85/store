from rest_framework import serializers
from .models import Product, Category


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'products_count', 'created_at']
    
    def get_products_count(self, obj):
        return obj.products.count()


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    price_with_igv = serializers.FloatField(read_only=True)
    igv_amount = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'barcode', 'sku', 'category',
            'category_name', 'price', 'cost', 'apply_igv', 'price_with_igv',
            'igv_amount', 'image', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Simplified serializer for product lists."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'barcode', 'sku', 'category_name',
            'price', 'is_active', 'stock'
        ]
    
    def get_stock(self, obj):
        inventory = getattr(obj, 'inventory', None)
        if inventory:
            return inventory.quantity
        return 0


