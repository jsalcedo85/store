"""
Custom authentication views with rate limiting and audit logging.
"""
from rest_framework_simplejwt.views import TokenObtainPairView as BaseTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from .models import AuthenticationLog


def get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_auth_event(request, user, event_type, success, details=''):
    """Log authentication event to database."""
    try:
        AuthenticationLog.objects.create(
            user=user if success else None,
            username=request.data.get('username', '') or getattr(user, 'username', ''),
            event_type=event_type,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            success=success,
            details=details
        )
    except Exception as e:
        # Don't fail the auth flow if logging fails
        print(f"Failed to log auth event: {e}")


@method_decorator(ratelimit(key='ip', rate='5/15m', method='POST'), name='post')
@method_decorator(never_cache, name='dispatch')
class TokenObtainPairView(BaseTokenObtainPairView):
    """
    JWT Token obtain view with rate limiting and audit logging.
    Rate limit: 5 attempts per 15 minutes per IP address.
    """
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # Log the authentication attempt
        if response.status_code == 200:
            # Successful login
            username = request.data.get('username', '')
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(username=username)
                log_auth_event(
                    request, 
                    user, 
                    AuthenticationLog.EventType.LOGIN_SUCCESS,
                    True
                )
            except:
                pass
        else:
            # Failed login
            log_auth_event(
                request,
                None,
                AuthenticationLog.EventType.LOGIN_FAILED,
                False,
                f"Status code: {response.status_code}"
            )
        
        return response


@method_decorator(ratelimit(key='user', rate='20/m', method='POST'), name='post')
@method_decorator(never_cache, name='dispatch')
class TokenRefreshView(BaseTokenRefreshView):
    """
    JWT Token refresh view with rate limiting and audit logging.
    Rate limit: 20 attempts per minute per user.
    """
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # Log token refresh
        if response.status_code == 200:
            log_auth_event(
                request,
                request.user if hasattr(request, 'user') and request.user.is_authenticated else None,
                AuthenticationLog.EventType.TOKEN_REFRESH,
                True
            )
        
        return response
