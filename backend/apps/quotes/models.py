from django.db import models
from django.conf import settings
from apps.products.models import Product
from apps.clients.models import Client
from store_backend.config import get_config


class Quote(models.Model):
    """Quote/Cotización model."""
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Borrador'
        SENT = 'sent', 'Enviada'
        ACCEPTED = 'accepted', 'Aceptada'
        REJECTED = 'rejected', 'Rechazada'
        EXPIRED = 'expired', 'Expirada'
    
    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quotes',
        verbose_name='Cliente'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='quotes',
        verbose_name='Usuario'
    )
    quote_number = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Número de cotización'
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Subtotal'
    )
    igv = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='IGV'
    )
    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Total'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name='Estado'
    )
    valid_until = models.DateField(
        null=True,
        blank=True,
        verbose_name='Válido hasta'
    )
    notes = models.TextField(blank=True, verbose_name='Notas')
    terms = models.TextField(blank=True, verbose_name='Términos y condiciones')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Cotización'
        verbose_name_plural = 'Cotizaciones'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Cotización {self.quote_number}"
    
    def calculate_totals(self):
        """Calculate quote totals from items."""
        items = self.items.all()
        self.subtotal = sum(item.subtotal for item in items)
        self.igv = sum(item.igv for item in items)
        self.total = sum(item.total for item in items)
        self.save()


class QuoteItem(models.Model):
    """Quote item model."""
    
    quote = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Cotización'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        verbose_name='Producto'
    )
    description = models.TextField(blank=True, verbose_name='Descripción')
    quantity = models.IntegerField(verbose_name='Cantidad')
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio unitario'
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Subtotal'
    )
    igv = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='IGV'
    )
    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Total'
    )
    
    class Meta:
        verbose_name = 'Item de cotización'
        verbose_name_plural = 'Items de cotización'
    
    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
    
    def save(self, *args, **kwargs):
        """Calculate item totals before saving."""
        self.subtotal = self.quantity * self.unit_price
        if self.product.apply_igv:
            igv_rate = get_config('igv_rate', 0.18)
            self.igv = float(self.subtotal) * igv_rate
        else:
            self.igv = 0
        self.total = float(self.subtotal) + self.igv
        super().save(*args, **kwargs)


