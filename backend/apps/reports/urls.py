from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_summary, name='dashboard_summary'),
    path('sales-chart/', views.sales_chart, name='sales_chart'),
    path('sales-by-category/', views.sales_by_category, name='sales_by_category'),
    path('top-products/', views.top_products, name='top_products'),
    path('sales-by-seller/', views.sales_by_seller, name='sales_by_seller'),
    path('inventory/', views.inventory_report, name='inventory_report'),
    path('monthly-comparison/', views.monthly_comparison, name='monthly_comparison'),
    path('accounting/', views.accounting_report, name='accounting_report'),
]


