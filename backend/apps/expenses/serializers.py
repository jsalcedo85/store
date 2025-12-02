from rest_framework import serializers
from .models import Expense, ExpenseCategory


class ExpenseCategorySerializer(serializers.ModelSerializer):
    """Serializer for ExpenseCategory model."""
    
    expenses_count = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'name', 'description', 'expenses_count', 'total_amount']
    
    def get_expenses_count(self, obj):
        return obj.expenses.count()
    
    def get_total_amount(self, obj):
        return sum(e.amount for e in obj.expenses.all())


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for Expense model."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    payment_method_display = serializers.CharField(
        source='get_payment_method_display',
        read_only=True
    )
    
    class Meta:
        model = Expense
        fields = [
            'id', 'category', 'category_name', 'description', 'amount',
            'payment_method', 'payment_method_display', 'receipt_number',
            'date', 'user', 'user_name', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


