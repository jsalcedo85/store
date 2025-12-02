from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model with roles."""
    
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrador'
        SELLER = 'seller', 'Vendedor'
        ACCOUNTANT = 'accountant', 'Contador'
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.SELLER,
        verbose_name='Rol'
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name='Teléfono')
    avatar = models.FileField(upload_to='avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_seller(self):
        return self.role == self.Role.SELLER

    @property
    def is_accountant(self):
        return self.role == self.Role.ACCOUNTANT


