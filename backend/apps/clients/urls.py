from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, SupplierViewSet

router = DefaultRouter()
router.register('suppliers', SupplierViewSet, basename='suppliers')
router.register('', ClientViewSet, basename='clients')

urlpatterns = [
    path('', include(router.urls)),
]


