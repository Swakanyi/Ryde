from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserProfile, Ride, DriverLocation, RideMessage, RideRating, Vehicle, CustomerChatHistory, CustomerPaymentMethod, NotificationPreference
 
#register
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    
    #drivers
    driver_license_file = serializers.FileField(required=False, write_only=True)
    national_id_file = serializers.FileField(required=False, write_only=True)
    logbook_file = serializers.FileField(required=False, write_only=True)
    
    class Meta:
        model = User
        fields = (
            'email', 'password', 'password2', 'user_type', 'phone_number', 
            'first_name', 'last_name', 'driver_license', 'responder_type', 
            'organization', 'driver_license_file', 'national_id_file', 'logbook_file'
        )
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Validate driver fields DOCUMENTS
        if attrs.get('user_type') in ['driver', 'boda_rider']:
            if not attrs.get('driver_license'):
                raise serializers.ValidationError({
                    "driver_license": "Driver license number is required for drivers."
                })
            
           
            required_documents = {
                'driver_license_file': 'Valid driving license upload is required',
                'national_id_file': 'National ID upload is required', 
                'logbook_file': 'Vehicle logbook upload is required'
            }
            
            for field, error_message in required_documents.items():
                if not attrs.get(field):
                    raise serializers.ValidationError({field: error_message})
        
        
        if attrs.get('user_type') == 'emergency_responder':
            if not attrs.get('responder_type'):
                raise serializers.ValidationError({
                    "responder_type": "Responder type is required for emergency responders."
                })
            if not attrs.get('organization'):
                raise serializers.ValidationError({
                    "organization": "Organization is required for emergency responders."
                })
        
        return attrs  
    
    def create(self, validated_data):
        validated_data.pop('password2')
        
        
        driver_license_file = validated_data.pop('driver_license_file', None)
        national_id_file = validated_data.pop('national_id_file', None)
        logbook_file = validated_data.pop('logbook_file', None)
        
        user_type = validated_data.get('user_type')
        
       
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=user_type,
            phone_number=validated_data['phone_number'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
       
        if user_type in ['driver', 'boda_rider']:
            user.driver_license = validated_data.get('driver_license')
            user.submitted_for_approval = True
            
            # Save file uploads
            if driver_license_file:
                user.driver_license_file = driver_license_file
            if national_id_file:
                user.national_id_file = national_id_file
            if logbook_file:
                user.logbook_file = logbook_file
                
            user.save()
            
           
        
        # Set emergency responder fields
        if user_type == 'emergency_responder':
            user.responder_type = validated_data.get('responder_type')
            user.organization = validated_data.get('organization')
            user.save()
        
        
        UserProfile.objects.create(user=user)
        
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('Account is disabled')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include "email" and "password"')

class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    driver_license_file_url = serializers.SerializerMethodField()
    national_id_file_url = serializers.SerializerMethodField()
    logbook_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'user_type', 
            'phone_number', 'profile_picture', 'is_verified', 'profile',
            'driver_license', 'is_approved', 'responder_type', 
            'organization', 'created_at', 'is_staff', 'is_superuser',
            'driver_license_file_url', 'national_id_file_url', 
            'logbook_file_url', 'approval_status', 'submitted_for_approval'
        )
        read_only_fields = ('id', 'is_verified', 'created_at')
    
    def get_profile(self, obj):
        try:
            return {
                'emergency_contact_name': obj.profile.emergency_contact_name,
                'emergency_contact_phone': obj.profile.emergency_contact_phone,
            }
        except UserProfile.DoesNotExist:
            return None
    
    def get_driver_license_file_url(self, obj):
        if obj.driver_license_file:
            return obj.driver_license_file.url
        return None
    
    def get_national_id_file_url(self, obj):
        if obj.national_id_file:
            return obj.national_id_file.url
        return None
    
    def get_logbook_file_url(self, obj):
        if obj.logbook_file:
            return obj.logbook_file.url
        return None   
        
#RIDES  
class RideSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)
    
    class Meta:
        model = Ride
        fields = (
            'id', 'customer', 'customer_name', 'customer_phone',
            'driver', 'driver_name', 'pickup_lat', 'pickup_lng',
            'dropoff_lat', 'dropoff_lng', 'pickup_address', 
            'dropoff_address', 'status', 'fare', 'created_at'
        )
        read_only_fields = ('id', 'customer', 'driver', 'created_at')

class DriverLocationSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    driver_phone = serializers.CharField(source='driver.phone_number', read_only=True)
    vehicle_type = serializers.SerializerMethodField()
    
    class Meta:
        model = DriverLocation
        fields = ('id', 'driver', 'driver_name', 'driver_phone', 
                 'vehicle_type', 'lat', 'lng', 'is_online', 'last_updated')
        read_only_fields = ('id', 'driver', 'last_updated')
    
    def get_vehicle_type(self, obj):
        try:
            return obj.driver.vehicle.vehicle_type
        except:
            return None  


class RideMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = RideMessage
        fields = '__all__'    


class RideRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = RideRating
        fields = '__all__'                


class CustomerProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'phone_number')
    
    def validate_email(self, value):
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value
    
    def validate_phone_number(self, value):
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(phone_number=value).exists():
            raise serializers.ValidationError("This phone number is already in use.")
        return value

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerPaymentMethod
        fields = ('id', 'payment_type', 'mpesa_number', 'card_number', 
                 'expiry_date', 'cvv', 'card_holder', 'is_default', 'created_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def validate(self, attrs):
        payment_type = attrs.get('payment_type')
        
        if payment_type == 'mpesa':
            if not attrs.get('mpesa_number'):
                raise serializers.ValidationError({"mpesa_number": "M-Pesa number is required for M-Pesa payments."})
            
            attrs['card_number'] = None
            attrs['expiry_date'] = None
            attrs['cvv'] = None
            attrs['card_holder'] = None
            
        elif payment_type == 'visa':
            required_fields = ['card_number', 'expiry_date', 'cvv', 'card_holder']
            for field in required_fields:
                if not attrs.get(field):
                    raise serializers.ValidationError({field: f"This field is required for card payments."})
           
            attrs['mpesa_number'] = None
            
        return attrs

class ChatHistorySerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    ride_info = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerChatHistory
        fields = ('id', 'ride', 'driver', 'driver_name', 'last_message', 
                 'last_message_time', 'unread_count', 'ride_info', 'created_at')
        read_only_fields = ('id', 'last_message_time', 'created_at')
    
    def get_ride_info(self, obj):
        return {
            'pickup_address': obj.ride.pickup_address,
            'dropoff_address': obj.ride.dropoff_address,
            'status': obj.ride.status,
            'created_at': obj.ride.created_at
        }
    
  
class AdminUserSerializer(serializers.ModelSerializer):
    ride_stats = serializers.SerializerMethodField()
    vehicle_info = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'user_type', 
                 'phone_number', 'is_active', 'is_verified', 'created_at',
                 'approval_status', 'is_approved', 'ride_stats', 'vehicle_info')
    
    def get_ride_stats(self, obj):
        return {
            'total_rides_as_customer': Ride.objects.filter(customer=obj).count(),
            'total_rides_as_driver': Ride.objects.filter(driver=obj).count() if obj.user_type in ['driver', 'boda_rider'] else 0,
        }
    
    def get_vehicle_info(self, obj):
        if obj.user_type in ['driver', 'boda_rider']:
            try:
                vehicle = obj.vehicle
                return {
                    'license_plate': vehicle.license_plate,
                    'vehicle_type': vehicle.vehicle_type,
                    'is_approved': vehicle.is_approved,
                }
            except:
                return None
        return None

class AdminRideSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name')
    customer_email = serializers.CharField(source='customer.email')
    driver_name = serializers.CharField(source='driver.get_full_name', allow_null=True)
    driver_email = serializers.CharField(source='driver.email', allow_null=True)
    
    class Meta:
        model = Ride
        fields = '__all__'



class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = (
            'receive_new_driver_notifications',
            'receive_emergency_notifications', 
            'receive_ride_issue_notifications',
            'receive_system_alerts',
            'receive_payment_issues',
            'email_notifications',
            'push_notifications',
            'in_app_notifications',
            'minimum_priority',
        )

class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = (
            'email', 'password', 'first_name', 'last_name', 
            'role', 'phone_number', 'department', 'employee_id'
        )
    
    def create(self, validated_data):
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            role=validated_data.get('role', 'admin'),
            department=validated_data.get('department', ''),
            employee_id=validated_data.get('employee_id', ''),
            is_staff=True,
            is_active=True
        )
        return user

class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'first_name', 'last_name', 'role', 'phone_number',
            'department', 'employee_id', 'is_active',
            'can_manage_users', 'can_manage_drivers', 'can_manage_rides',
            'can_manage_emergency', 'can_view_reports', 'can_manage_system'
        )        