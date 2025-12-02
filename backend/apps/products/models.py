from django.db import models
from store_backend.config import get_config


class Category(models.Model):
    """Product category model."""
    
    name = models.CharField(max_length=100, verbose_name='Nombre')
    description = models.TextField(blank=True, verbose_name='Descripción')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """Product model with barcode support."""
    
    name = models.CharField(max_length=200, verbose_name='Nombre')
    description = models.TextField(blank=True, verbose_name='Descripción')
    barcode = models.CharField(
        max_length=50, 
        unique=True, 
        blank=True, 
        null=True,
        verbose_name='Código de barras'
    )
    sku = models.CharField(max_length=50, unique=True, verbose_name='SKU')
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='products',
        verbose_name='Categoría'
    )
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name='Precio'
    )
    cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=0,
        verbose_name='Costo'
    )
    apply_igv = models.BooleanField(default=True, verbose_name='Aplica IGV')
    image = models.FileField(
        upload_to='products/', 
        blank=True, 
        null=True,
        verbose_name='Imagen'
    )
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.sku} - {self.name}"
    
    @property
    def price_with_igv(self):
        """Calculate price with IGV."""
        if self.apply_igv:
            igv_rate = get_config('igv_rate', 0.18)
            return float(self.price) * (1 + igv_rate)
        return float(self.price)
    
    @property
    def igv_amount(self):
        """Calculate IGV amount."""
        if self.apply_igv:
            igv_rate = get_config('igv_rate', 0.18)
            return float(self.price) * igv_rate
        return 0


