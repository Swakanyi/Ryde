from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone
from .models import User, UserProfile, Vehicle, Ride, EmergencyRequest, DriverLocation

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    
    ordering = ('email',)  
    
    list_display = ('email', 'first_name', 'last_name', 'user_type', 'is_verified', 'is_staff', 'approval_status', 'is_approved')
    list_filter = ('user_type', 'is_verified', 'is_staff', 'approval_status')
    
    
    actions = ['approve_drivers', 'reject_drivers']
    
    def approve_drivers(self, request, queryset):
        drivers = queryset.filter(user_type__in=['driver', 'boda_rider'])
        for driver in drivers:
            driver.approval_status = 'approved'
            driver.is_approved = True
            driver.approval_date = timezone.now()
            driver.save()
            
            
            try:
                vehicle = driver.vehicle
                vehicle.vehicle_approval_status = 'approved'
                vehicle.is_approved = True
                vehicle.save()
            except Vehicle.DoesNotExist:
                pass
        
        self.message_user(request, f"✅ {drivers.count()} driver(s) approved!")
    approve_drivers.short_description = "✅ Approve selected drivers"
    
    def reject_drivers(self, request, queryset):
        drivers = queryset.filter(user_type__in=['driver', 'boda_rider'])
        for driver in drivers:
            driver.approval_status = 'rejected'
            driver.is_approved = False
            driver.save()
        
        self.message_user(request, f"❌ {drivers.count()} driver(s) rejected!")
    reject_drivers.short_description = "❌ Reject selected drivers"

   
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('RydeApp Info', {
            'fields': ('user_type', 'phone_number', 'profile_picture', 'is_verified', 
                      'driver_license', 'license_expiry', 'is_approved', 'approval_status',
                      'responder_type', 'organization', 'created_at')
        }),
    )
    
    
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
    list_display = ('driver', 'vehicle_type', 'license_plate', 'make', 'model', 'is_approved', 'vehicle_approval_status')
    list_filter = ('vehicle_type', 'is_approved', 'vehicle_approval_status')
    search_fields = ('driver__email', 'license_plate')
    
    
    actions = ['approve_vehicles', 'reject_vehicles']
    
    def approve_vehicles(self, request, queryset):
        updated = queryset.update(vehicle_approval_status='approved', is_approved=True)
        self.message_user(request, f"✅ {updated} vehicle(s) approved!")
    approve_vehicles.short_description = "✅ Approve selected vehicles"
    
    def reject_vehicles(self, request, queryset):
        updated = queryset.update(vehicle_approval_status='rejected', is_approved=False)
        self.message_user(request, f"❌ {updated} vehicle(s) rejected!")
    reject_vehicles.short_description = "❌ Reject selected vehicles"

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