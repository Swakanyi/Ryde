from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile, Vehicle, Ride, EmergencyRequest, DriverLocation

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'user_type', 'is_verified', 'is_staff')
    list_filter = ('user_type', 'is_verified', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('RydeApp Info', {
            'fields': ('user_type', 'phone_number', 'profile_picture', 'is_verified', 
                      'driver_license', 'license_expiry', 'is_approved',
                      'responder_type', 'organization')
        }),
    )

admin.site.register(UserProfile)
admin.site.register(Vehicle)
admin.site.register(Ride)
admin.site.register(EmergencyRequest)
admin.site.register(DriverLocation)