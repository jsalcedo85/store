from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SaleViewSet, InvoiceViewSet

router = DefaultRouter()
router.register('invoices', InvoiceViewSet, basename='invoices')
router.register('', SaleViewSet, basename='sales')

urlpatterns = [
    path('', include(router.urls)),
]


