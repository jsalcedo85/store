from django.contrib import admin
from .models import Quote, QuoteItem


class QuoteItemInline(admin.TabularInline):
    model = QuoteItem
    extra = 0


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ['quote_number', 'client', 'total', 'status', 'valid_until', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['quote_number', 'client__name']
    inlines = [QuoteItemInline]


