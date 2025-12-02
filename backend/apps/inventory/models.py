from django.db import models
from django.conf import settings
from apps.products.models import Product
from store_backend.config import get_config


class Inventory(models.Model):
    """Inventory model for stock control."""
    
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        related_name='inventory',
        verbose_name='Producto'
    )
    quantity = models.IntegerField(default=0, verbose_name='Cantidad')
    min_quantity = models.IntegerField(default=0, verbose_name='Cantidad mínima')
    location = models.CharField(max_length=100, blank=True, verbose_name='Ubicación')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Inventario'
        verbose_name_plural = 'Inventarios'
    
    def __str__(self):
        return f"{self.product.name}: {self.quantity} unidades"
    
    @property
    def is_low_stock(self):
        """Check if stock is below threshold."""
        threshold = self.min_quantity or get_config('low_stock_threshold', 10)
        return self.quantity <= threshold
    
    @property
    def stock_status(self):
        """Return stock status."""
        if self.quantity <= 0:
            return 'out_of_stock'
        elif self.is_low_stock:
            return 'low_stock'
        return 'in_stock'


class InventoryMovement(models.Model):
    """Track inventory movements."""
    
    class MovementType(models.TextChoices):
        IN = 'in', 'Entrada'
        OUT = 'out', 'Salida'
        ADJUSTMENT = 'adjustment', 'Ajuste'
    
    inventory = models.ForeignKey(
        Inventory,
        on_delete=models.CASCADE,
        related_name='movements',
        verbose_name='Inventario'
    )
    movement_type = models.CharField(
        max_length=20,
        choices=MovementType.choices,
        verbose_name='Tipo de movimiento'
    )
    quantity = models.IntegerField(verbose_name='Cantidad')
    previous_quantity = models.IntegerField(verbose_name='Cantidad anterior')
    new_quantity = models.IntegerField(verbose_name='Cantidad nueva')
    reason = models.TextField(blank=True, verbose_name='Razón')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Usuario'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Movimiento de inventario'
        verbose_name_plural = 'Movimientos de inventario'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_movement_type_display()}: {self.quantity} - {self.inventory.product.name}"


