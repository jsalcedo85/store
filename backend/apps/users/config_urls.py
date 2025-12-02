from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from store_backend.config import APP_CONFIG


@api_view(['GET'])
@permission_classes([AllowAny])
def get_app_config(request):
    """Return public app configuration."""
    public_config = {
        'name': APP_CONFIG['name'],
        'version': APP_CONFIG['version'],
        'currency': APP_CONFIG['currency'],
        'currency_symbol': APP_CONFIG['currency_symbol'],
        'igv_rate': APP_CONFIG['igv_rate'],
        'company_name': APP_CONFIG['company_name'],
    }
    return Response(public_config)


urlpatterns = [
    path('', get_app_config, name='app_config'),
]


