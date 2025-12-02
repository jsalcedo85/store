from rest_framework import serializers
from .models import Quote, QuoteItem


class QuoteItemSerializer(serializers.ModelSerializer):
    """Serializer for QuoteItem model."""
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = QuoteItem
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'description',
            'quantity', 'unit_price', 'subtotal', 'igv', 'total'
        ]
        read_only_fields = ['id', 'subtotal', 'igv', 'total']


class QuoteSerializer(serializers.ModelSerializer):
    """Serializer for Quote model."""
    
    items = QuoteItemSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    
    class Meta:
        model = Quote
        fields = [
            'id', 'client', 'client_name', 'user', 'user_name',
            'quote_number', 'subtotal', 'igv', 'total', 'status',
            'status_display', 'valid_until', 'notes', 'terms',
            'items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'subtotal', 'igv', 'total', 'user',
            'created_at', 'updated_at'
        ]


class CreateQuoteSerializer(serializers.Serializer):
    """Serializer for creating a quote with items."""
    
    client = serializers.IntegerField(required=False, allow_null=True)
    valid_until = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    terms = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )


