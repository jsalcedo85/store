from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from apps.sales.models import Sale, SaleItem
from apps.products.models import Product, Category
from apps.inventory.models import Inventory
from apps.expenses.models import Expense
from apps.clients.models import Client
from apps.quotes.models import Quote


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """Get dashboard summary statistics."""
    today = timezone.now().date()
    month_start = today.replace(day=1)
    
    # Sales today
    sales_today = Sale.objects.filter(
        created_at__date=today,
        status=Sale.Status.COMPLETED
    ).aggregate(
        total=Sum('total'),
        count=Count('id')
    )
    
    # Sales this month
    sales_month = Sale.objects.filter(
        created_at__date__gte=month_start,
        status=Sale.Status.COMPLETED
    ).aggregate(
        total=Sum('total'),
        count=Count('id')
    )
    
    # Expenses this month
    expenses_month = Expense.objects.filter(
        date__gte=month_start
    ).aggregate(total=Sum('amount'))
    
    # Low stock products
    low_stock_count = sum(
        1 for inv in Inventory.objects.all() 
        if inv.is_low_stock
    )
    
    # Active clients
    active_clients = Client.objects.filter(is_active=True).count()
    
    # Active products
    active_products = Product.objects.filter(is_active=True).count()
    
    # Pending quotes
    pending_quotes = Quote.objects.filter(
        status__in=[Quote.Status.DRAFT, Quote.Status.SENT]
    ).count()
    
    return Response({
        'sales_today': {
            'total': sales_today['total'] or 0,
            'count': sales_today['count'] or 0
        },
        'sales_month': {
            'total': sales_month['total'] or 0,
            'count': sales_month['count'] or 0
        },
        'expenses_month': expenses_month['total'] or 0,
        'profit_month': (sales_month['total'] or 0) - (expenses_month['total'] or 0),
        'low_stock_count': low_stock_count,
        'active_clients': active_clients,
        'active_products': active_products,
        'pending_quotes': pending_quotes
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_chart(request):
    """Get sales data for charts."""
    days = int(request.query_params.get('days', 30))
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)
    
    sales_by_day = Sale.objects.filter(
        created_at__date__gte=start_date,
        status=Sale.Status.COMPLETED
    ).annotate(
        date=TruncDate('created_at')
    ).values('date').annotate(
        total=Sum('total'),
        count=Count('id')
    ).order_by('date')
    
    return Response(list(sales_by_day))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_by_category(request):
    """Get sales grouped by product category."""
    days = int(request.query_params.get('days', 30))
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)
    
    sales_by_cat = SaleItem.objects.filter(
        sale__created_at__date__gte=start_date,
        sale__status=Sale.Status.COMPLETED
    ).values(
        category_name=F('product__category__name')
    ).annotate(
        total=Sum('total'),
        quantity=Sum('quantity')
    ).order_by('-total')
    
    return Response(list(sales_by_cat))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_products(request):
    """Get top selling products."""
    days = int(request.query_params.get('days', 30))
    limit = int(request.query_params.get('limit', 10))
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)
    
    top = SaleItem.objects.filter(
        sale__created_at__date__gte=start_date,
        sale__status=Sale.Status.COMPLETED
    ).values(
        'product__id',
        'product__name',
        'product__sku'
    ).annotate(
        total_sold=Sum('quantity'),
        total_revenue=Sum('total')
    ).order_by('-total_sold')[:limit]
    
    # Rename fields to match frontend expectations
    result = []
    for item in top:
        result.append({
            'product_id': item['product__id'],
            'product_name': item['product__name'],
            'product_sku': item['product__sku'],
            'total_sold': item['total_sold'],
            'total_revenue': float(item['total_revenue']) if item['total_revenue'] else 0
        })
    
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_by_seller(request):
    """Get sales grouped by seller."""
    days = int(request.query_params.get('days', 30))
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)
    
    by_seller = Sale.objects.filter(
        created_at__date__gte=start_date,
        status=Sale.Status.COMPLETED
    ).values(
        'seller__id',
        'seller__username',
        'seller__first_name',
        'seller__last_name'
    ).annotate(
        total=Sum('total'),
        count=Count('id'),
        avg_sale=Avg('total')
    ).order_by('-total')
    
    # Rename fields to match frontend expectations
    result = []
    for item in by_seller:
        result.append({
            'seller_id': item['seller__id'],
            'seller_name': item['seller__username'],
            'seller_first_name': item['seller__first_name'],
            'seller_last_name': item['seller__last_name'],
            'total': float(item['total']) if item['total'] else 0,
            'count': item['count'],
            'avg_sale': float(item['avg_sale']) if item['avg_sale'] else 0
        })
    
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventory_report(request):
    """Get inventory status report."""
    inventories = Inventory.objects.select_related('product', 'product__category').all()
    
    data = []
    total_value = Decimal('0')
    
    for inv in inventories:
        value = inv.quantity * inv.product.cost
        total_value += value
        data.append({
            'product_id': inv.product.id,
            'product_name': inv.product.name,
            'product_sku': inv.product.sku,
            'category': inv.product.category.name if inv.product.category else None,
            'quantity': inv.quantity,
            'min_quantity': inv.min_quantity,
            'cost': float(inv.product.cost),
            'value': float(value),
            'stock_status': inv.stock_status,
            'is_low_stock': inv.is_low_stock
        })
    
    return Response({
        'items': data,
        'total_value': float(total_value),
        'total_products': len(data),
        'low_stock_count': sum(1 for d in data if d['is_low_stock']),
        'out_of_stock_count': sum(1 for d in data if d['stock_status'] == 'out_of_stock')
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_comparison(request):
    """Get monthly sales comparison."""
    months = int(request.query_params.get('months', 12))
    
    sales_by_month = Sale.objects.filter(
        status=Sale.Status.COMPLETED
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        total=Sum('total'),
        count=Count('id')
    ).order_by('-month')[:months]
    
    expenses_by_month = Expense.objects.annotate(
        month=TruncMonth('date')
    ).values('month').annotate(
        total=Sum('amount')
    ).order_by('-month')[:months]
    
    return Response({
        'sales': list(sales_by_month),
        'expenses': list(expenses_by_month)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def accounting_report(request):
    """Get accounting summary for accountants."""
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    
    sales_filter = {'status': Sale.Status.COMPLETED}
    expenses_filter = {}
    
    if date_from:
        sales_filter['created_at__date__gte'] = date_from
        expenses_filter['date__gte'] = date_from
    if date_to:
        sales_filter['created_at__date__lte'] = date_to
        expenses_filter['date__lte'] = date_to
    
    # Sales summary
    sales_summary = Sale.objects.filter(**sales_filter).aggregate(
        total_sales=Sum('total'),
        total_subtotal=Sum('subtotal'),
        total_igv=Sum('igv'),
        sales_count=Count('id')
    )
    
    # Sales by payment method
    by_payment = Sale.objects.filter(**sales_filter).values(
        'payment_method'
    ).annotate(
        total=Sum('total'),
        count=Count('id')
    )
    
    # Expenses summary
    expenses_summary = Expense.objects.filter(**expenses_filter).aggregate(
        total_expenses=Sum('amount'),
        expenses_count=Count('id')
    )
    
    # Expenses by category
    by_category = Expense.objects.filter(**expenses_filter).values(
        category_name=F('category__name')
    ).annotate(
        total=Sum('amount'),
        count=Count('id')
    )
    
    return Response({
        'sales': {
            'total': sales_summary['total_sales'] or 0,
            'subtotal': sales_summary['total_subtotal'] or 0,
            'igv': sales_summary['total_igv'] or 0,
            'count': sales_summary['sales_count'] or 0,
            'by_payment_method': list(by_payment)
        },
        'expenses': {
            'total': expenses_summary['total_expenses'] or 0,
            'count': expenses_summary['expenses_count'] or 0,
            'by_category': list(by_category)
        },
        'profit': (sales_summary['total_sales'] or 0) - (expenses_summary['total_expenses'] or 0)
    })


