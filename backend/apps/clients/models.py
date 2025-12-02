from django.db import models


class Client(models.Model):
    """Client model."""
    
    class DocumentType(models.TextChoices):
        DNI = 'dni', 'DNI'
        RUC = 'ruc', 'RUC'
        CE = 'ce', 'Carné de Extranjería'
        PASSPORT = 'passport', 'Pasaporte'
    
    name = models.CharField(max_length=200, verbose_name='Nombre/Razón Social')
    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices,
        default=DocumentType.DNI,
        verbose_name='Tipo de documento'
    )
    document_number = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Número de documento'
    )
    email = models.EmailField(blank=True, verbose_name='Correo electrónico')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Teléfono')
    address = models.TextField(blank=True, verbose_name='Dirección')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.document_number} - {self.name}"


class Supplier(models.Model):
    """Supplier model."""
    
    name = models.CharField(max_length=200, verbose_name='Nombre/Razón Social')
    ruc = models.CharField(max_length=11, unique=True, verbose_name='RUC')
    email = models.EmailField(blank=True, verbose_name='Correo electrónico')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Teléfono')
    address = models.TextField(blank=True, verbose_name='Dirección')
    contact_name = models.CharField(
        max_length=200, 
        blank=True,
        verbose_name='Nombre de contacto'
    )
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.ruc} - {self.name}"


