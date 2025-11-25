from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
#authentication   
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('profile/', views.user_profile, name='profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

#customers request ride 
    path('rides/request/', views.request_ride, name='request_ride'),
    path('rides/available/', views.available_rides, name='available_rides'),
    path('rides/<int:ride_id>/accept/', views.accept_ride, name='accept_ride'),
    path('rides/<int:ride_id>/status/', views.update_ride_status, name='update_ride_status'),
    path('rides/<int:ride_id>/', views.ride_detail, name='ride_detail'),
    path('rides/my-rides/', views.user_rides, name='user_rides'),
    path('driver/location/', views.update_driver_location, name='update_driver_location'),
    path('rides/calculate-route/', views.calculate_route, name='calculate_route'),

#map 
    path('test-google-api/', views.test_google_api, name='test_google_api'),
    path('map/geocode/', views.geocode_address_view, name='geocode_address'),
    path('map/nearby-drivers/', views.get_nearby_drivers, name='nearby_drivers'),
    path('driver/location/', views.update_driver_location, name='update_driver_location'),
#suggestions
    path('autocomplete/', views.autocomplete_address, name='autocomplete_address'),
    path('place-details/', views.get_place_details, name='get_place_details'),

#driver
    path('driver/dashboard/', views.driver_dashboard, name='driver_dashboard'),
    path('driver/toggle-online/', views.toggle_online_status, name='toggle_online_status'),
    path('driver/earnings/', views.driver_earnings, name='driver_earnings'),
    path('rides/<int:ride_id>/start/', views.start_ride, name='start_ride'),
    path('rides/<int:ride_id>/complete/', views.complete_ride, name='complete_ride'),
    path('rides/<int:ride_id>/messages/', views.ride_messages, name='ride_messages'),
    path('rides/<int:ride_id>/send-message/', views.send_ride_message, name='send_ride_message'),
    path('rides/<int:ride_id>/decline/', views.decline_ride, name='decline_ride'),
    
    path('reverse-geocode/', views.reverse_geocode, name='reverse_geocode'),
    path('set-current-location/', views.set_current_location, name='set_current_location'),

#admin approval
    path('admin/pending-drivers/', views.pending_drivers, name='pending_drivers'),
    path('admin/drivers/<int:user_id>/approve/', views.approve_driver, name='approve_driver'),
    path('admin/drivers/<int:user_id>/suspend/', views.suspend_driver, name='suspend_driver'),

# Admin Dashboard URLs
path('admin/stats/', views.admin_dashboard_stats, name='admin_dashboard_stats'),
path('admin/users/', views.admin_user_management, name='admin_user_management'),
path('admin/users/<int:user_id>/', views.admin_user_detail, name='admin_user_detail'),
path('admin/rides/', views.admin_ride_management, name='admin_ride_management'),
path('admin/rides/<int:ride_id>/', views.admin_ride_detail, name='admin_ride_detail'),
path('admin/drivers/pending/', views.pending_drivers, name='pending_drivers'),
path('admin/drivers/<int:user_id>/approve/', views.approve_driver, name='approve_driver'),
path('admin/drivers/<int:user_id>/suspend/', views.suspend_driver, name='suspend_driver'),
path('admin/emergency-requests/', views.admin_emergency_requests, name='admin_emergency_requests'),
path('admin/reports/earnings/', views.admin_earnings_report, name='admin_earnings_report'),
path('admin/reports/usage/', views.admin_usage_report, name='admin_usage_report'), 
 path('admin/drivers/<int:user_id>/documents/<str:document_type>/download/', 
         views.download_driver_document, 
         name='download_driver_document'),

# Notification URLs
path('admin/notifications/', views.admin_notifications, name='admin_notifications'),
path('admin/notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
path('admin/notifications/mark-all-read/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
path('admin/notification-preferences/', views.notification_preferences, name='notification_preferences'),
path('admin/test-notification/', views.test_notification, name='test_notification'),
path('admin/drivers/pending-with-documents/', views.pending_drivers_with_documents, name='pending_drivers_with_documents'),
path('admin/drivers/<int:user_id>/documents/', views.driver_documents, name='driver_documents'),
path('admin/drivers/<int:user_id>/approve-with-vehicle/', views.approve_driver_with_vehicle, name='approve_driver_with_vehicle'),
path('admin/drivers/approved/', views.get_approved_drivers, name='get_approved_drivers'),



]