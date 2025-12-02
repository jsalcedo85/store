from rest_framework import serializers
from .models import Sale, SaleItem, Invoice
from apps.products.serializers import ProductSerializer


class SaleItemSerializer(serializers.ModelSerializer):
    """Serializer for SaleItem model."""
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity', 'unit_price', 'subtotal', 'igv', 'total'
        ]
        read_only_fields = ['id', 'subtotal', 'igv', 'total']


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model."""
    
    invoice_type_display = serializers.CharField(
        source='get_invoice_type_display',
        read_only=True
    )
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'sale', 'invoice_type', 'invoice_type_display',
            'series', 'number', 'issued_at'
        ]
        read_only_fields = ['id', 'issued_at']


class SaleSerializer(serializers.ModelSerializer):
    """Serializer for Sale model."""
    
    items = SaleItemSerializer(many=True, read_only=True)
    invoice = InvoiceSerializer(read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    payment_method_display = serializers.CharField(
        source='get_payment_method_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    
    class Meta:
        model = Sale
        fields = [
            'id', 'client', 'client_name', 'seller', 'seller_name',
            'subtotal', 'igv', 'total', 'payment_method',
            'payment_method_display', 'status', 'status_display',
            'notes', 'items', 'invoice', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'subtotal', 'igv', 'total', 'seller', 'created_at', 'updated_at'
        ]


class CreateSaleSerializer(serializers.Serializer):
    """Serializer for creating a sale with items."""
    
    client = serializers.IntegerField(required=False, allow_null=True)
    payment_method = serializers.ChoiceField(
        choices=Sale.PaymentMethod.choices,
        default=Sale.PaymentMethod.CASH
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    invoice_type = serializers.ChoiceField(
        choices=Invoice.InvoiceType.choices,
        default=Invoice.InvoiceType.BOLETA
    )


