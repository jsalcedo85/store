from rest_framework import serializers
from .models import Client, Supplier


class ClientSerializer(serializers.ModelSerializer):
    """Serializer for Client model."""
    
    document_type_display = serializers.CharField(
        source='get_document_type_display',
        read_only=True
    )
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'document_type', 'document_type_display',
            'document_number', 'email', 'phone', 'address', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier model."""
    
    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'ruc', 'email', 'phone', 'address',
            'contact_name', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


