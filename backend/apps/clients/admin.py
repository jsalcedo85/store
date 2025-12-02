from django.contrib import admin
from .models import Client, Supplier


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['document_number', 'name', 'document_type', 'phone', 'is_active']
    list_filter = ['document_type', 'is_active']
    search_fields = ['name', 'document_number', 'email']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['ruc', 'name', 'contact_name', 'phone', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'ruc', 'email']


