from django.db import models
from django.conf import settings
from apps.products.models import Product
from apps.clients.models import Client
from store_backend.config import get_config


class Sale(models.Model):
    """Sale model."""
    
    class PaymentMethod(models.TextChoices):
        CASH = 'cash', 'Efectivo'
        CARD = 'card', 'Tarjeta'
        TRANSFER = 'transfer', 'Transferencia'
        CREDIT = 'credit', 'Crédito'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        COMPLETED = 'completed', 'Completada'
        CANCELLED = 'cancelled', 'Anulada'
    
    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales',
        verbose_name='Cliente'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sales',
        verbose_name='Vendedor'
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
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH,
        verbose_name='Método de pago'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.COMPLETED,
        verbose_name='Estado'
    )
    notes = models.TextField(blank=True, verbose_name='Notas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Venta #{self.id} - {self.total}"
    
    def calculate_totals(self):
        """Calculate sale totals from items."""
        items = self.items.all()
        self.subtotal = sum(item.subtotal for item in items)
        self.igv = sum(item.igv for item in items)
        self.total = sum(item.total for item in items)
        self.save()


class SaleItem(models.Model):
    """Sale item model."""
    
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Venta'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        verbose_name='Producto'
    )
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
        verbose_name = 'Item de venta'
        verbose_name_plural = 'Items de venta'
    
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


class Invoice(models.Model):
    """Invoice/Comprobante model."""
    
    class InvoiceType(models.TextChoices):
        BOLETA = 'boleta', 'Boleta de Venta'
        FACTURA = 'factura', 'Factura'
        NOTA_VENTA = 'nota_venta', 'Nota de Venta'
    
    sale = models.OneToOneField(
        Sale,
        on_delete=models.CASCADE,
        related_name='invoice',
        verbose_name='Venta'
    )
    invoice_type = models.CharField(
        max_length=20,
        choices=InvoiceType.choices,
        default=InvoiceType.BOLETA,
        verbose_name='Tipo de comprobante'
    )
    series = models.CharField(max_length=10, verbose_name='Serie')
    number = models.CharField(max_length=20, verbose_name='Número')
    issued_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Comprobante'
        verbose_name_plural = 'Comprobantes'
        unique_together = ['series', 'number']
        ordering = ['-issued_at']
    
    def __str__(self):
        return f"{self.get_invoice_type_display()} {self.series}-{self.number}"


