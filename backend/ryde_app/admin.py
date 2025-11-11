from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile, Vehicle, Ride, EmergencyRequest, DriverLocation

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Remove ordering that references username
    ordering = ('email',)  # Use email instead of username
    
    list_display = ('email', 'first_name', 'last_name', 'user_type', 'is_verified', 'is_staff')
    list_filter = ('user_type', 'is_verified', 'is_staff')
    
    # Define custom fieldsets without username
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('RydeApp Info', {
            'fields': ('user_type', 'phone_number', 'profile_picture', 'is_verified', 
                      'driver_license', 'license_expiry', 'is_approved',
                      'responder_type', 'organization', 'created_at')
        }),
    )
    
    # Add fieldsets for creating users
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'emergency_contact_name', 'emergency_contact_phone')
    search_fields = ('user__email', 'emergency_contact_name')

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('driver', 'vehicle_type', 'license_plate', 'make', 'model', 'is_approved')
    list_filter = ('vehicle_type', 'is_approved')
    search_fields = ('driver__email', 'license_plate')

@admin.register(Ride)
class RideAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'driver', 'status', 'fare', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('customer__email', 'driver__email')

@admin.register(EmergencyRequest)
class EmergencyRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'service_type', 'status', 'created_at')
    list_filter = ('service_type', 'status', 'created_at')
    search_fields = ('customer__email', 'service_type')

@admin.register(DriverLocation)
class DriverLocationAdmin(admin.ModelAdmin):
    list_display = ('driver', 'lat', 'lng', 'is_online', 'last_updated')
    list_filter = ('is_online',)
    search_fields = ('driver__email',)