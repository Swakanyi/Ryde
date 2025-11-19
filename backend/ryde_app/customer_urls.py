
from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.customer_profile, name='customer_profile'),
    path('payment-methods/', views.customer_payment_methods, name='customer_payment_methods'),
    path('payment-methods/<int:payment_id>/', views.customer_payment_method_detail, name='customer_payment_method_detail'),
    path('payment-methods/<int:payment_id>/set-default/', views.set_default_payment_method, name='set_default_payment_method'),
    path('chat-history/', views.customer_chat_history, name='customer_chat_history'),
    path('stats/', views.customer_stats, name='customer_stats'),
]