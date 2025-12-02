from django.contrib import admin
from .models import Inventory, InventoryMovement


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'quantity', 'min_quantity', 'location', 'stock_status']
    list_filter = ['location']
    search_fields = ['product__name', 'product__sku']


@admin.register(InventoryMovement)
class InventoryMovementAdmin(admin.ModelAdmin):
    list_display = ['inventory', 'movement_type', 'quantity', 'user', 'created_at']
    list_filter = ['movement_type', 'created_at']
    search_fields = ['inventory__product__name']


