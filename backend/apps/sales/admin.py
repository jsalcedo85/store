from django.contrib import admin
from .models import Sale, SaleItem, Invoice


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'seller', 'total', 'payment_method', 'status', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['client__name', 'seller__username']
    inlines = [SaleItemInline]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['series', 'number', 'invoice_type', 'sale', 'issued_at']
    list_filter = ['invoice_type', 'issued_at']
    search_fields = ['series', 'number']


