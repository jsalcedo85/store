from rest_framework import viewsets
from django.db.models import Q

from .models import Client, Supplier
from .serializers import ClientSerializer, SupplierSerializer


class ClientViewSet(viewsets.ModelViewSet):
    """ViewSet for Client management."""
    
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(document_number__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset


class SupplierViewSet(viewsets.ModelViewSet):
    """ViewSet for Supplier management."""
    
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(ruc__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset


