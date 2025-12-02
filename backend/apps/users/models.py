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


class AuthenticationLog(models.Model):
    """Audit log for authentication events."""
    
    class EventType(models.TextChoices):
        LOGIN_SUCCESS = 'login_success', 'Login Exitoso'
        LOGIN_FAILED = 'login_failed', 'Login Fallido'
        LOGOUT = 'logout', 'Logout'
        PASSWORD_CHANGE = 'password_change', 'Cambio de Contraseña'
        PASSWORD_RESET = 'password_reset', 'Reset de Contraseña'
        TOKEN_REFRESH = 'token_refresh', 'Refresh de Token'
        ACCOUNT_LOCKED = 'account_locked', 'Cuenta Bloqueada'
    
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='auth_logs'
    )
    username = models.CharField(max_length=150)
    event_type = models.CharField(max_length=50, choices=EventType.choices)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    success = models.BooleanField()
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Log de Autenticación'
        verbose_name_plural = 'Logs de Autenticación'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['username', '-timestamp']),
            models.Index(fields=['ip_address', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.username} - {self.get_event_type_display()} - {self.timestamp}"


