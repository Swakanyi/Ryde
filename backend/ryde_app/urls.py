from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
#authentication urls   
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('profile/', views.user_profile, name='profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

#request ride urls
    path('rides/request/', views.request_ride, name='request_ride'),
    path('rides/available/', views.available_rides, name='available_rides'),
    path('rides/<int:ride_id>/accept/', views.accept_ride, name='accept_ride'),
    path('rides/<int:ride_id>/status/', views.update_ride_status, name='update_ride_status'),
    path('rides/<int:ride_id>/', views.ride_detail, name='ride_detail'),
    path('rides/my-rides/', views.user_rides, name='user_rides'),
    path('driver/location/', views.update_driver_location, name='update_driver_location'),

#map urls
    path('test-google-api/', views.test_google_api, name='test_google_api'),
    path('map/geocode/', views.geocode_address_view, name='geocode_address'),
    path('map/nearby-drivers/', views.get_nearby_drivers, name='nearby_drivers'),
    path('driver/location/', views.update_driver_location, name='update_driver_location'),
#suggestions
    path('autocomplete/', views.autocomplete_address, name='autocomplete_address'),
    path('place-details/', views.get_place_details, name='get_place_details')
]