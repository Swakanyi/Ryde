from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    
    username = None
    email = models.EmailField(unique=True)
    
    USER_TYPES = [
        ('customer', 'Customer'),
        ('driver', 'Driver'),
        ('boda_rider', 'Boda Rider'),
        ('emergency_responder', 'Emergency Responder'),
    ]

    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='customer')
    phone_number = models.CharField(max_length=15, unique=True, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Driver/Boda 
    driver_license = models.CharField(max_length=50, blank=True, null=True)
    license_expiry = models.DateField(null=True, blank=True)
    is_approved = models.BooleanField(default=False)
    approval_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending Approval'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
            ('suspended', 'Suspended'),
        ],
        default='pending'
    )
    submitted_for_approval = models.BooleanField(default=False)
    approval_date = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        limit_choices_to={'is_staff': True},
        related_name='approved_drivers'
    )
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Emergency Responder
    responder_type = models.CharField(
        max_length=20, 
        choices=[
            ('ambulance', 'Ambulance'),
            ('tow_truck', 'Tow Truck'),
            ('police', 'Police'),
            ('fire', 'Fire Department'),
        ],
        blank=True,
        null=True
    )
    organization = models.CharField(max_length=100, blank=True, null=True)
    
    
    objects = CustomUserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.email} ({self.user_type})"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True)
    
    def __str__(self):
        return f"Profile of {self.user.email}"


class Vehicle(models.Model):
    VEHICLE_TYPES = [
        ('economy', 'Economy'),
        ('comfort', 'Comfort'),
        ('premium', 'Premium'),
        ('xl', 'XL'),
        ('boda', 'Boda'),
    ]
    
    driver = models.OneToOneField(User, on_delete=models.CASCADE, limit_choices_to={'user_type__in': ['driver', 'boda_rider']})
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES)
    license_plate = models.CharField(max_length=15)
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    year = models.IntegerField()
    color = models.CharField(max_length=30)
    is_approved = models.BooleanField(default=False)
    insurance_number = models.CharField(max_length=100, blank=True, null=True)
    insurance_expiry = models.DateField(null=True, blank=True)
    vehicle_photo = models.ImageField(upload_to='vehicles/', null=True, blank=True)
    vehicle_approval_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
        ],
        default='pending'
    )

class Ride(models.Model):
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('accepted', 'Accepted'),
        ('driver_arrived', 'Driver Arrived'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    customer = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='customer_rides', 
        limit_choices_to={'user_type': 'customer'}
    )
    driver = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='driver_rides', 
        limit_choices_to={'user_type__in': ['driver', 'boda_rider']}
    )
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()
    dropoff_lat = models.FloatField()
    dropoff_lng = models.FloatField()
    pickup_address = models.TextField()
    dropoff_address = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    created_at = models.DateTimeField(auto_now_add=True)
    fare = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    estimated_arrival = models.DateTimeField(null=True, blank=True)
    actual_pickup_time = models.DateTimeField(null=True, blank=True)
    actual_dropoff_time = models.DateTimeField(null=True, blank=True)
    distance_km = models.FloatField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"Ride {self.id} - {self.customer.email}"


class RideMessage(models.Model):
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('location', 'Location'),
        ('system', 'System'),
    ]
    
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['timestamp']

class EmergencyRequest(models.Model):
    SERVICE_TYPES = [
        ('ambulance', 'Ambulance'),
        ('tow_truck', 'Tow Truck'),
        ('police', 'Police'),
        ('fire', 'Fire Department'),
    ]
    
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('accepted', 'Accepted'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    customer = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'user_type': 'customer'},  related_name='emergency_requests_made')
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES)
    location_lat = models.FloatField()
    location_lng = models.FloatField()
    address = models.TextField()
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'user_type': 'emergency_responder'})

class DriverLocation(models.Model):
    driver = models.OneToOneField(User, on_delete=models.CASCADE, limit_choices_to={'user_type__in': ['driver', 'boda_rider']})
    lat = models.FloatField()
    lng = models.FloatField()
    last_updated = models.DateTimeField(auto_now=True)
    is_online = models.BooleanField(default=False) 
    current_ride = models.ForeignKey(
        Ride, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='active_driver'
    )  


class RideRating(models.Model):
    ride = models.OneToOneField(Ride, on_delete=models.CASCADE, related_name='rating')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)     
