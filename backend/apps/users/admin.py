from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, AuthenticationLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model."""
    
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Información Adicional', {'fields': ('role', 'phone', 'avatar')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Información Adicional', {'fields': ('role', 'phone')}),
    )


@admin.register(AuthenticationLog)
class AuthenticationLogAdmin(admin.ModelAdmin):
    """Admin configuration for AuthenticationLog model."""
    
    list_display = ['username', 'event_type', 'ip_address', 'success', 'timestamp']
    list_filter = ['event_type', 'success', 'timestamp']
    search_fields = ['username', 'ip_address', 'user_agent']
    readonly_fields = ['user', 'username', 'event_type', 'ip_address', 'user_agent', 'success', 'details', 'timestamp']
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        # Prevent manual creation of logs
        return False
    
    def has_change_permission(self, request, obj=None):
        # Prevent editing of logs
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Only superusers can delete logs
        return request.user.is_superuser
