from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
from datetime import datetime

from .models import Quote, QuoteItem
from .serializers import QuoteSerializer, CreateQuoteSerializer
from apps.products.models import Product
from apps.clients.models import Client


class QuoteViewSet(viewsets.ModelViewSet):
    """ViewSet for Quote management."""
    
    queryset = Quote.objects.select_related('client', 'user').prefetch_related('items__product').all()
    serializer_class = QuoteSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status
        quote_status = self.request.query_params.get('status')
        if quote_status:
            queryset = queryset.filter(status=quote_status)
        
        # Filter by client
        client = self.request.query_params.get('client')
        if client:
            queryset = queryset.filter(client_id=client)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(quote_number__icontains=search) |
                Q(client__name__icontains=search)
            )
        
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new quote with items."""
        serializer = CreateQuoteSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Generate quote number
        today = datetime.now()
        prefix = f"COT-{today.strftime('%Y%m')}"
        last_quote = Quote.objects.filter(
            quote_number__startswith=prefix
        ).order_by('-id').first()
        
        if last_quote:
            last_num = int(last_quote.quote_number.split('-')[-1])
            quote_number = f"{prefix}-{str(last_num + 1).zfill(4)}"
        else:
            quote_number = f"{prefix}-0001"
        
        # Get client
        client = None
        if data.get('client'):
            try:
                client = Client.objects.get(id=data['client'])
            except Client.DoesNotExist:
                pass
        
        # Create quote
        quote = Quote.objects.create(
            client=client,
            user=request.user,
            quote_number=quote_number,
            valid_until=data.get('valid_until'),
            notes=data.get('notes', ''),
            terms=data.get('terms', ''),
            status=Quote.Status.DRAFT
        )
        
        # Create quote items
        for item_data in data['items']:
            try:
                product = Product.objects.get(id=item_data['product'])
            except Product.DoesNotExist:
                quote.delete()
                return Response(
                    {'error': f'Producto {item_data["product"]} no encontrado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            QuoteItem.objects.create(
                quote=quote,
                product=product,
                description=item_data.get('description', ''),
                quantity=item_data['quantity'],
                unit_price=item_data.get('unit_price', product.price)
            )
        
        # Calculate totals
        quote.calculate_totals()
        
        return Response(
            QuoteSerializer(quote).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Mark quote as sent."""
        quote = self.get_object()
        quote.status = Quote.Status.SENT
        quote.save()
        return Response(QuoteSerializer(quote).data)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Mark quote as accepted."""
        quote = self.get_object()
        quote.status = Quote.Status.ACCEPTED
        quote.save()
        return Response(QuoteSerializer(quote).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Mark quote as rejected."""
        quote = self.get_object()
        quote.status = Quote.Status.REJECTED
        quote.save()
        return Response(QuoteSerializer(quote).data)


