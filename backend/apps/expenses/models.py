from django.db import models
from django.conf import settings


class ExpenseCategory(models.Model):
    """Expense category model."""
    
    name = models.CharField(max_length=100, verbose_name='Nombre')
    description = models.TextField(blank=True, verbose_name='Descripción')
    
    class Meta:
        verbose_name = 'Categoría de gasto'
        verbose_name_plural = 'Categorías de gastos'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Expense(models.Model):
    """Expense model."""
    
    class PaymentMethod(models.TextChoices):
        CASH = 'cash', 'Efectivo'
        CARD = 'card', 'Tarjeta'
        TRANSFER = 'transfer', 'Transferencia'
    
    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses',
        verbose_name='Categoría'
    )
    description = models.CharField(max_length=500, verbose_name='Descripción')
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Monto'
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH,
        verbose_name='Método de pago'
    )
    receipt_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Número de comprobante'
    )
    date = models.DateField(verbose_name='Fecha')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='expenses',
        verbose_name='Usuario'
    )
    notes = models.TextField(blank=True, verbose_name='Notas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Gasto'
        verbose_name_plural = 'Gastos'
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.description} - {self.amount}"


