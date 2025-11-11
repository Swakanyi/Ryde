from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserProfile, Ride, DriverLocation

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'user_type', 'phone_number', 
                 'first_name', 'last_name', 'driver_license', 'responder_type', 
                 'organization')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Validate driver fields
        if attrs.get('user_type') == 'driver' and not attrs.get('driver_license'):
            raise serializers.ValidationError({"driver_license": "Driver license is required for drivers."})
        
        # Validate emergency responder fields
        if attrs.get('user_type') == 'emergency_responder':
            if not attrs.get('responder_type'):
                raise serializers.ValidationError({"responder_type": "Responder type is required for emergency responders."})
            if not attrs.get('organization'):
                raise serializers.ValidationError({"organization": "Organization is required for emergency responders."})
        
        return attrs  
    
    def create(self, validated_data):
        validated_data.pop('password2')
        
       
        user_type = validated_data.get('user_type')
        driver_license = validated_data.pop('driver_license', None)
        responder_type = validated_data.pop('responder_type', None)
        organization = validated_data.pop('organization', None)
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=user_type,
            phone_number=validated_data['phone_number'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Set driver fields
        if user_type == 'driver' and driver_license:
            user.driver_license = driver_license
            user.save()
        
        # Set emergency responder fields
        if user_type == 'emergency_responder':
            user.responder_type = responder_type
            user.organization = organization
            user.save()
        
        # Create user profile
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
    
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'user_type', 
                 'phone_number', 'profile_picture', 'is_verified', 'profile',
                 'driver_license', 'is_approved', 'responder_type', 
                 'organization', 'created_at')
        read_only_fields = ('id', 'is_verified', 'created_at')
    
    def get_profile(self, obj):
        try:
            return {
                'emergency_contact_name': obj.profile.emergency_contact_name,
                'emergency_contact_phone': obj.profile.emergency_contact_phone,
            }
        except UserProfile.DoesNotExist:
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