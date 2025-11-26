from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from django.db import models
from .models import User, UserProfile, Ride, DriverLocation, RideMessage, CustomerPaymentMethod, CustomerChatHistory, EmergencyRequest, AdminNotification, NotificationPreference, Vehicle
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer, RideSerializer, DriverLocationSerializer, RideMessageSerializer,  CustomerProfileUpdateSerializer, PaymentMethodSerializer, ChatHistorySerializer, NotificationPreferenceSerializer
from django.utils import timezone
import math
import requests
import json
from django.conf import settings
from django.db.models import Q, Count, Sum, Avg
from datetime import datetime, timedelta
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from collections import defaultdict

# Authentication Views
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    if request.method == 'POST':
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            
            if user.user_type in ['driver', 'boda_rider']:
                trigger_driver_registration_notification(user)
            
            refresh = RefreshToken.for_user(user)
            
           
            if user.user_type in ['driver', 'boda_rider']:
                message = 'Driver registration submitted for admin approval. You will be notified once approved.'
                approval_status = 'pending'
                can_login = False  
                can_drive = False
            else:
                message = 'User registered successfully'
                approval_status = 'approved'
                can_login = True
                can_drive = False
            
            response_data = {
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': message,
                'approval_status': approval_status,
                'can_login': can_login,  
                'can_drive': can_drive,
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    if request.method == 'POST':
        print(f"🟡 [Login] Request data received: {request.data}")
        email = request.data.get('email')
        password = request.data.get('password')
        
        print(f" [Login] Email: {email}, Password provided: {'*' * len(password) if password else 'None'}")
        
        
        try:
            user = User.objects.get(email=email)
            print(f" [Login] User found: {user.email}")
            print(f"[Login] User details - ID: {user.id}, Type: {user.user_type}, Staff: {user.is_staff}, Superuser: {user.is_superuser}")
            print(f"[Login] User active: {user.is_active}, Has password: {bool(user.password)}")
            
            
            password_valid = user.check_password(password)
            print(f" [Login] Password valid: {password_valid}")
            
            if not password_valid:
                print(f"[Login] Password check failed")
                
        except User.DoesNotExist:
            print(f"[Login] User with email {email} not found")
            return Response({
                "error": "Invalid email or password"
            }, status=400)
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            
            if user.user_type in ['driver', 'boda_rider']:
                if not user.is_approved or user.approval_status != 'approved':
                    return Response({
                        "error": "driver_not_approved",
                        "message": f"Driver account is {user.approval_status}. Please wait for admin approval.",
                        "approval_status": user.approval_status,
                        "rejection_reason": user.rejection_reason,
                        "can_login": False
                    }, status=403)
            
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Login successful',
                'can_login': True
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET', 'PUT'])
def user_profile(request):
    user = request.user
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout_user(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in kilometers using Haversine formula"""
    R = 6371 
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat/2) * math.sin(delta_lat/2) +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon/2) * math.sin(delta_lon/2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def geocode_address(address):
    """Convert address to coordinates using Google Maps API"""
    try:
        base_url = 'https://maps.googleapis.com/maps/api/geocode/json'
        params = {
            'address': address,
            'key': settings.GOOGLE_API_KEY,
            'components': 'country:KE'  
        }
        
        response = requests.get(base_url, params=params, timeout=10)
        data = response.json()
        
        print(f"Google Maps API Response: {data['status']}")  
        
        if data['status'] == 'OK':
            result = data['results'][0]
            location = result['geometry']['location']
            
            return {
                'lat': location['lat'],
                'lng': location['lng'],
                'display_name': result['formatted_address']
            }
        else:
            print(f"Google Maps API error: {data['status']}")
            return None
            
    except Exception as e:
        print(f"Google Maps geocoding error: {e}")
        return None

def get_google_route(start_lat, start_lng, end_lat, end_lng):
    """Get route directions using Google Directions API"""
    try:
        base_url = 'https://maps.googleapis.com/maps/api/directions/json'
        params = {
            'origin': f'{start_lat},{start_lng}',
            'destination': f'{end_lat},{end_lng}',
            'key': settings.GOOGLE_API_KEY,
            'mode': 'driving'
        }
        
        response = requests.get(base_url, params=params, timeout=10)
        data = response.json()
        
        if data['status'] == 'OK':
            route = data['routes'][0]['legs'][0]
            return {
                'distance': route['distance']['value'],  
                'duration': route['duration']['value'],  
                'polyline': data['routes'][0]['overview_polyline']['points']
            }
        else:
            print(f"Google Directions API error: {data['status']}")
            return None
            
    except Exception as e:
        print(f"Google Directions error: {e}")
        return None

# Ride Views 
@api_view(['POST'])
def request_ride(request):
    """Customer requests a ride OR courier service - ACTUAL REQUEST ONLY"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can request services"}, status=403)
    
    pickup_address = request.data.get('pickup_address')
    dropoff_address = request.data.get('dropoff_address')
    vehicle_type = request.data.get('vehicle_type', 'economy')
    service_type = request.data.get('service_type', 'ride')
    estimated_fare = request.data.get('estimated_fare')
    
    if not pickup_address or not dropoff_address:
        return Response({"error": "Pickup and dropoff addresses are required"}, status=400)
    
    if not estimated_fare:
        return Response({"error": "Fare calculation is required"}, status=400)
    
    # Geocode addresses
    pickup_coords = geocode_address(pickup_address)
    if not pickup_coords:
        return Response({"error": "Could not find pickup location"}, status=400)
    
    dropoff_coords = geocode_address(dropoff_address)
    if not dropoff_coords:
        return Response({"error": "Could not find destination"}, status=400)
    
    # Prepare ride data
    ride_data = {
        'pickup_address': pickup_address,
        'dropoff_address': dropoff_address,
        'pickup_lat': pickup_coords['lat'],
        'pickup_lng': pickup_coords['lng'],
        'dropoff_lat': dropoff_coords['lat'],
        'dropoff_lng': dropoff_coords['lng'],
        'vehicle_type': vehicle_type,
        'service_type': service_type,
        'package_description': request.data.get('package_description', ''),
        'package_size': request.data.get('package_size', ''),
        'recipient_name': request.data.get('recipient_name', ''),
        'recipient_phone': request.data.get('recipient_phone', ''),
        'delivery_instructions': request.data.get('delivery_instructions', ''),
    }
    
    serializer = RideSerializer(data=ride_data)
    if serializer.is_valid():
        
        route_info = get_google_route(pickup_coords['lat'], pickup_coords['lng'], 
                                     dropoff_coords['lat'], dropoff_coords['lng'])
        
        if route_info:
            distance_km = route_info['distance'] / 1000
            duration_min = route_info['duration'] / 60
        else:
            distance_km = calculate_distance(pickup_coords['lat'], pickup_coords['lng'], 
                                           dropoff_coords['lat'], dropoff_coords['lng'])
            duration_min = distance_km * 2
        
        ride = serializer.save(
            customer=request.user,
            status='requested',
            fare=estimated_fare,
            distance_km=distance_km,
            duration_minutes=duration_min
        )
        
        # ✅ NOTIFY DRIVERS VIA WEBSOCKET
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        
       
        approved_drivers = User.objects.filter(
           user_type__in=['driver', 'boda_rider'],
           approval_status='approved',
           is_active=True
        )

        print(f"📊 [Request Ride] Total approved drivers: {approved_drivers.count()}")


        driver_locations = DriverLocation.objects.filter(driver__in=approved_drivers)
        location_map = {loc.driver_id: loc for loc in driver_locations}

        notified_count = 0
        for driver in approved_drivers:
    
            driver_loc = location_map.get(driver.id)
    
            if driver_loc:
                driver_lat = driver_loc.lat
                driver_lng = driver_loc.lng
                is_online = driver_loc.is_online
            else:
                print(f"⚠️ [Request Ride] Driver {driver.id} has no location record - using default")
        
                driver_lat = pickup_coords['lat']
                driver_lng = pickup_coords['lng']
                is_online = False  
    
    
            if not is_online:
                print(f"🔔 [Request Ride] Notifying OFFLINE driver {driver.id} for testing")
        
    
    
            driver_to_pickup_distance = calculate_distance(
                driver_lat, driver_lng,
                pickup_coords['lat'], pickup_coords['lng']
            )
    
            print(f"📍 [Request Ride] Driver {driver.id} distance to pickup: {driver_to_pickup_distance}km")
    
   
            MAX_DISTANCE_KM = 1000 
    
            if driver_to_pickup_distance <= MAX_DISTANCE_KM:
                notification_data = {
                    'id': ride.id,
                    'ride_id': ride.id,
                    'customer_name': f"{ride.customer.first_name} {ride.customer.last_name}",
                    'customer_phone': ride.customer.phone_number,
                    'pickup_address': ride.pickup_address,
                    'dropoff_address': ride.dropoff_address,
                    'fare': str(ride.fare),
                    'vehicle_type': ride.vehicle_type,
                    'service_type': ride.service_type,
                    'distance': f"{driver_to_pickup_distance:.1f} km",
                    'estimated_pickup_time': f"{int(driver_to_pickup_distance * 3)} min",
                    'created_at': ride.created_at.isoformat(),
                }
        
        
                if ride.service_type != 'ride':
                    notification_data.update({
                        'package_description': ride.package_description,
                        'package_size': ride.package_size,
                        'recipient_name': ride.recipient_name,
                        'is_courier': True
                    })
        
                print(f"📢 [WebSocket] Sending new_ride_request to driver_{driver.id}")
        
                try:
                    async_to_sync(channel_layer.group_send)(
                        f"driver_{driver.id}",
                        {
                            "type": "new_ride_request",
                            "data": notification_data
                        }
                    )
                    notified_count += 1
                    print(f"✅ [WebSocket] Notified driver {driver.id}")
                except Exception as e:
                    print(f"❌ [WebSocket] Failed to notify driver {driver.id}: {str(e)}")
            else:
                print(f"⏭️ [Request Ride] Driver {driver.id} too far ({driver_to_pickup_distance}km > {MAX_DISTANCE_KM}km)")
            
            # Calculate distance
            driver_to_pickup_distance = calculate_distance(
                driver_lat, driver_lng,
                pickup_coords['lat'], pickup_coords['lng']
            )
            
            print(f"📍 [Request Ride] Driver {driver.id} distance to pickup: {driver_to_pickup_distance}km")
            
           
            MAX_DISTANCE_KM = 50  
            
            if driver_to_pickup_distance <= MAX_DISTANCE_KM:
                notification_data = {
                    'id': ride.id,
                    'ride_id': ride.id,
                    'customer_name': f"{ride.customer.first_name} {ride.customer.last_name}",
                    'customer_phone': ride.customer.phone_number,
                    'pickup_address': ride.pickup_address,
                    'dropoff_address': ride.dropoff_address,
                    'fare': str(ride.fare),
                    'vehicle_type': ride.vehicle_type,
                    'service_type': ride.service_type,
                    'distance': f"{driver_to_pickup_distance:.1f} km",
                    'estimated_pickup_time': f"{int(driver_to_pickup_distance * 3)} min",
                    'created_at': ride.created_at.isoformat(),
                }
                
              
                if ride.service_type != 'ride':
                    notification_data.update({
                        'package_description': ride.package_description,
                        'package_size': ride.package_size,
                        'recipient_name': ride.recipient_name,
                        'is_courier': True
                    })
                
                print(f"📢 [WebSocket] Sending new_ride_request to driver_{driver.id}")
                
                try:
                    async_to_sync(channel_layer.group_send)(
                        f"driver_{driver.id}",
                        {
                            "type": "new_ride_request",
                            "data": notification_data
                        }
                    )
                    notified_count += 1
                    print(f"✅ [WebSocket] Notified driver {driver.id}")
                except Exception as e:
                    print(f"❌ [WebSocket] Failed to notify driver {driver.id}: {str(e)}")
            else:
                print(f"⏭️ [Request Ride] Driver {driver.id} too far ({driver_to_pickup_distance}km > {MAX_DISTANCE_KM}km)")
        
        print(f"✅ [Request Ride] Notified {notified_count} drivers for ride {ride.id}")
        
        response_data = RideSerializer(ride).data
        response_data.update({
            'distance_km': round(distance_km, 2),
            'duration_min': round(duration_min, 2),
            'drivers_notified': notified_count,  
        })
        if route_info:
            response_data['route_polyline'] = route_info['polyline']
        
        return Response(response_data, status=201)
    
    return Response(serializer.errors, status=400)


@api_view(['POST'])
def calculate_route(request):
    """Calculate route and fare estimates WITHOUT sending ride request to drivers"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can calculate routes"}, status=403)
    
    pickup_address = request.data.get('pickup_address')
    dropoff_address = request.data.get('dropoff_address')
    vehicle_type = request.data.get('vehicle_type', 'economy')
    service_type = request.data.get('service_type', 'ride')

    if not pickup_address or not dropoff_address:
        return Response({"error": "Pickup and dropoff addresses are required"}, status=400)
    
    # Geocode addresses
    pickup_coords = geocode_address(pickup_address)
    if not pickup_coords:
        return Response({
            "error": "Could not find pickup location.",
            "suggestions": [
                "Be more specific (include area, city)",
                "Check spelling",
                "Try format: 'Street, Area, City'"
            ]
        }, status=400)
    
    dropoff_coords = geocode_address(dropoff_address)
    if not dropoff_coords:
        return Response({
            "error": "Could not find destination.",
            "suggestions": [
                "Be more specific (include area, city)",
                "Check spelling", 
                "Try format: 'Street, Area, City'"
            ]
        }, status=400)
    
    # Get route information
    route_info = get_google_route(pickup_coords['lat'], pickup_coords['lng'], 
                                 dropoff_coords['lat'], dropoff_coords['lng'])
    
    try:
        if route_info:
            distance_km = route_info['distance'] / 1000
            duration_min = route_info['duration'] / 60
        else:
            distance_km = calculate_distance(pickup_coords['lat'], pickup_coords['lng'], 
                                           dropoff_coords['lat'], dropoff_coords['lng'])
            duration_min = distance_km * 2
        
        # Calculate fares for all vehicle types
        fare_rates = {
            'economy': {'base': 100, 'per_km': 50},
            'premium': {'base': 150, 'per_km': 75},
            'boda': {'base': 50, 'per_km': 30},
            'courier_bike': {'base': 60, 'per_km': 25},
            'courier_car': {'base': 120, 'per_km': 40},
        }
        
        all_fares = {}
        for vehicle_key, rates in fare_rates.items():
            # Apply surge pricing
            hour = datetime.now().hour
            surge_multiplier = 1.2 if (7 <= hour <= 9) or (17 <= hour <= 19) else 1
            
            # Base fare calculation
            base_fare = rates['base']
            distance_charge = distance_km * rates['per_km']
            
            # Add courier service premium
            service_premium = 0
            if 'courier' in vehicle_key:
                service_premium = base_fare * 0.3  
            
            subtotal = base_fare + distance_charge + service_premium
            surge_charge = subtotal * (surge_multiplier - 1) if surge_multiplier > 1 else 0
            total_fare = round(subtotal * surge_multiplier)
            
            all_fares[vehicle_key] = {
                'base': base_fare,
                'distance': round(distance_charge),
                'service_premium': round(service_premium),
                'surge': round(surge_charge),
                'total': total_fare,
                'surge_multiplier': surge_multiplier
            }
        
        response_data = {
            'distance_km': round(distance_km, 2),
            'duration_min': round(duration_min, 2),
            'pickup_coords': pickup_coords,
            'dropoff_coords': dropoff_coords,
            'all_fares': all_fares,
            'selected_fare': all_fares.get(vehicle_type, all_fares['economy'])
        }
        
        if route_info:
            response_data['route_polyline'] = route_info['polyline']
        
        return Response(response_data)
        
    except (TypeError, ValueError) as e:
        print(f"Route calculation error: {e}")
        return Response({"error": "Could not calculate route and fare"}, status=400)

@api_view(['POST'])
def geocode_address_view(request):
    """Geocode an address using Google Maps API"""
    address = request.data.get('address')
    if not address:
        return Response({"error": "Address is required"}, status=400)
    
    coords = geocode_address(address)
    if coords:
        return Response({
            'lat': coords['lat'],
            'lng': coords['lng'],
            'display_name': coords['display_name']
        })
    else:
        return Response({
            "error": "Could not find location using Google Maps",
            "suggestions": [
                "Try a more specific address",
                "Include city name (e.g., Nairobi, Mombasa)",
                "Check spelling"
            ]
        }, status=400)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reverse_geocode(request):
    """Convert coordinates to address using Google Maps API"""
    lat = request.data.get('lat')
    lng = request.data.get('lng')
    
    if not lat or not lng:
        return Response({"error": "Latitude and longitude are required"}, status=400)
    
    try:
        lat = float(lat)
        lng = float(lng)
    except (TypeError, ValueError):
        return Response({"error": "Invalid coordinates"}, status=400)
    
    try:
        base_url = 'https://maps.googleapis.com/maps/api/geocode/json'
        params = {
            'latlng': f'{lat},{lng}',
            'key': settings.GOOGLE_API_KEY,
        }
        
        response = requests.get(base_url, params=params, timeout=10)
        data = response.json()
        
        print(f"Google Reverse Geocoding API Response: {data['status']}")
        
        if data['status'] == 'OK':
            result = data['results'][0]
            return Response({
                'address': result['formatted_address'],
                'display_name': result['formatted_address'],
                'lat': lat,
                'lng': lng
            })
        else:
            print(f"Google Reverse Geocoding API error: {data['status']}")
            
            return Response({
                'address': f'Current Location ({lat:.4f}, {lng:.4f})',
                'display_name': f'Current Location ({lat:.4f}, {lng:.4f})',
                'lat': lat,
                'lng': lng
            })
            
    except Exception as e:
        print(f"Reverse geocoding error: {e}")
       
        return Response({
            'address': f'Current Location ({lat:.4f}, {lng:.4f})',
            'display_name': f'Current Location ({lat:.4f}, {lng:.4f})',
            'lat': lat,
            'lng': lng
        }) 


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_current_location(request):
    """Set user's current location"""
    lat = request.data.get('lat')
    lng = request.data.get('lng')
    address = request.data.get('address', '')
    
    if not lat or not lng:
        return Response({"error": "Latitude and longitude are required"}, status=400)
    
    try:
        lat = float(lat)
        lng = float(lng)
        
        
        if not (-4.9 <= lat <= 5.0) or not (33.9 <= lng <= 42.0):
            return Response({"error": "Coordinates outside Kenya bounds"}, status=400)
            
    except (TypeError, ValueError):
        return Response({"error": "Invalid coordinates"}, status=400)
    
    
    request.session['current_location'] = {
        'lat': lat,
        'lng': lng,
        'address': address,
        'timestamp': timezone.now().isoformat()
    }
    
    
    if request.user.user_type in ['driver', 'boda_rider']:
        DriverLocation.objects.update_or_create(
            driver=request.user,
            defaults={
                'lat': lat,
                'lng': lng,
                'is_online': True,
                'last_updated': timezone.now()
            }
        )
    
    return Response({
        "message": "Location updated successfully",
        "location": {
            "lat": lat,
            "lng": lng,
            "address": address
        }
    })           

@api_view(['GET'])
def get_nearby_drivers(request):
    """Get drivers near a location"""
    lat = request.GET.get('lat', 0)
    lng = request.GET.get('lng', 0)
    radius_km = float(request.GET.get('radius', 5))  
    
    try:
        lat = float(lat)
        lng = float(lng)
    except (TypeError, ValueError):
        return Response({"error": "Invalid coordinates"}, status=400)
    
   
    online_drivers = DriverLocation.objects.filter(is_online=True)
    
    nearby_drivers = []
    for driver_loc in online_drivers:
        distance = calculate_distance(lat, lng, driver_loc.lat, driver_loc.lng)
        if distance <= radius_km:
            driver_data = DriverLocationSerializer(driver_loc).data
            driver_data['distance_km'] = round(distance, 2)
            nearby_drivers.append(driver_data)
    
    return Response(nearby_drivers)

@api_view(['GET'])
def available_rides(request):
    """Get available rides for drivers"""
    if request.user.user_type not in ['driver', 'boda_rider']:
        return Response({"error": "Only drivers can view available rides"}, status=403)
    
    if not request.user.is_approved:
        return Response({"error": "Your driver account is pending approval"}, status=403)
    
    
    rides = Ride.objects.filter(status='requested').select_related('customer')
    
    driver_lat = request.GET.get('lat')
    driver_lng = request.GET.get('lng')
    
    rides_data = []
    for ride in rides:
        ride_data = RideSerializer(ride).data
        
        
        ride_data['customer_name'] = f"{ride.customer.first_name} {ride.customer.last_name}"
        ride_data['customer_phone'] = ride.customer.phone_number
        
       
        if driver_lat and driver_lng:
            try:
                distance = calculate_distance(
                    float(driver_lat), float(driver_lng),
                    ride.pickup_lat, ride.pickup_lng
                )
                ride_data['distance_to_pickup_km'] = round(distance, 2)
                ride_data['estimated_pickup_time'] = f"{int(distance * 3)} min"
            except (TypeError, ValueError):
                ride_data['distance_to_pickup_km'] = None
                ride_data['estimated_pickup_time'] = 'Unknown'
        
        rides_data.append(ride_data)
    
    return Response(rides_data)

@api_view(['POST'])
def accept_ride(request, ride_id):
    """Driver accepts a ride and notifies customer via WebSocket"""
    if request.user.user_type not in ['driver', 'boda_rider']:
        return Response({"error": "Only drivers can accept rides"}, status=403)
    
    try:
        ride = Ride.objects.get(id=ride_id, status='requested')
        ride.driver = request.user
        ride.status = 'accepted'
        ride.save()
        
        print(f"✅ [Ride Accepted] Driver {request.user.id} accepted ride {ride_id}")
        
        
        DriverLocation.objects.update_or_create(
            driver=request.user,
            defaults={
                'lat': ride.pickup_lat,
                'lng': ride.pickup_lng,
                'is_online': True
            }
        )
        
        
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        
        
        print(f"📢 [WebSocket] Notifying customer {ride.customer.id} about accepted ride")
        
        async_to_sync(channel_layer.group_send)(
            f"customer_{ride.customer.id}",
            {
                "type": "ride_accepted",
                "data": {
                    'ride_id': ride.id,
                    'driver_id': request.user.id,
                    'driver_name': f"{request.user.first_name} {request.user.last_name}",
                    'driver_phone': request.user.phone_number,
                    'vehicle_type': getattr(request.user, 'vehicle_type', 'Economy'),
                    'license_plate': getattr(getattr(request.user, 'vehicle', None), 'license_plate', ''),
                    'timestamp': timezone.now().isoformat()
                }
            }
        )
        
        
        print(f"📢 [WebSocket] Notifying driver {request.user.id} about accepted ride")
        
        async_to_sync(channel_layer.group_send)(
            f"driver_{request.user.id}",
            {
                "type": "ride_accepted_self",
                "data": {
                    'ride_id': ride.id,
                    'status': ride.status,
                    'customer_name': f"{ride.customer.first_name} {ride.customer.last_name}",
                    'customer_phone': ride.customer.phone_number,
                    'pickup_address': ride.pickup_address,
                    'dropoff_address': ride.dropoff_address,
                    'fare': str(ride.fare),
                    'pickup_lat': ride.pickup_lat,
                    'pickup_lng': ride.pickup_lng,
                    'timestamp': timezone.now().isoformat()
                }
            }
        )
        
        
        online_drivers = DriverLocation.objects.filter(is_online=True).exclude(driver=request.user)
        for driver_loc in online_drivers:
            async_to_sync(channel_layer.group_send)(
                f"driver_{driver_loc.driver.id}",
                {
                    "type": "ride_taken",
                    "data": {
                        'ride_id': ride.id,
                        'message': 'Ride has been accepted by another driver'
                    }
                }
            )
        
        return Response({
            'message': 'Ride accepted successfully',
            'ride': RideSerializer(ride).data
        })
    except Ride.DoesNotExist:
        return Response({"error": "Ride not found or already accepted"}, status=404)

@api_view(['POST'])
def update_ride_status(request, ride_id):
    """Update ride status"""
    try:
        ride = Ride.objects.get(id=ride_id)
        new_status = request.data.get('status')
        
        if not new_status:
            return Response({"error": "Status is required"}, status=400)
        
       
        if request.user != ride.customer and request.user != ride.driver:
            return Response({"error": "Not authorized to update this ride"}, status=403)
        
        valid_transitions = {
            'requested': ['accepted', 'cancelled'],
            'accepted': ['driver_arrived', 'cancelled'],
            'driver_arrived': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        }
        
        if new_status in valid_transitions.get(ride.status, []):
            ride.status = new_status
            if new_status == 'completed':
                ride.completed_at = timezone.now()
            ride.save()
            return Response(RideSerializer(ride).data)
        else:
            return Response({"error": f"Cannot change status from {ride.status} to {new_status}"}, status=400)
            
    except Ride.DoesNotExist:
        return Response({"error": "Ride not found"}, status=404)

@api_view(['POST'])
def update_driver_location(request):
    """Update driver's current location"""
    if request.user.user_type not in ['driver', 'boda_rider']:
        return Response({"error": "Only drivers can update location"}, status=403)
    
    lat = request.data.get('lat')
    lng = request.data.get('lng')
    
    if lat is None or lng is None:
        return Response({"error": "Latitude and longitude are required"}, status=400)
    
    try:
        lat = float(lat)
        lng = float(lng)
    except (TypeError, ValueError):
        return Response({"error": "Invalid coordinates"}, status=400)
    
    location, created = DriverLocation.objects.update_or_create(
        driver=request.user,
        defaults={
            'lat': lat,
            'lng': lng,
            'is_online': request.data.get('is_online', True)
        }
    )
    return Response(DriverLocationSerializer(location).data)

@api_view(['GET'])
def user_rides(request):
    """Get user's ride history"""
    if request.user.user_type == 'customer':
        rides = Ride.objects.filter(customer=request.user).order_by('-created_at')
    elif request.user.user_type in ['driver', 'boda_rider']:
        rides = Ride.objects.filter(driver=request.user).order_by('-created_at')
    else:
        rides = Ride.objects.none()
    
    serializer = RideSerializer(rides, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def ride_detail(request, ride_id):
    """Get specific ride details"""
    try:
        ride = Ride.objects.get(id=ride_id)
        
        if request.user != ride.customer and request.user != ride.driver:
            return Response({"error": "Not authorized to view this ride"}, status=403)
        
        serializer = RideSerializer(ride)
        return Response(serializer.data)
    except Ride.DoesNotExist:
        return Response({"error": "Ride not found"}, status=404)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def test_google_api(request):
    """Test Google Maps API integration"""
    test_address = "Nairobi, Kenya"
    
    coords = geocode_address(test_address)
    
    if coords:
        return Response({
            "status": "SUCCESS", 
            "message": "Google Maps API is working correctly",
            "test_address": test_address,
            "coordinates": coords,
            "api_key_set": bool(settings.GOOGLE_API_KEY)
        })
    else:
        return Response({
            "status": "FAILED",
            "message": "Google Maps API test failed",
            "api_key_set": bool(settings.GOOGLE_API_KEY)
        }, status=500)
    
#location suggestions
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def autocomplete_address(request):
    """Get address suggestions based on user's location or country-wide"""
    query = request.data.get('query', '')
    user_lat = request.data.get('lat')
    user_lng = request.data.get('lng')
    
    print(f"🔍 [Backend Autocomplete] Query: '{query}', User location: ({user_lat}, {user_lng})")
    
    if not query or len(query) < 3:
        print("⏹️ [Backend Autocomplete] Query too short")
        return Response({"suggestions": []})
    
    try:
        base_url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
        
       
        params = {
            'input': query,
            'key': settings.GOOGLE_API_KEY,
            'components': 'country:ke',
            
            'types': 'establishment,geocode',
        }
        
       
        if user_lat and user_lng:
            try:
               
                lat = float(user_lat)
                lng = float(user_lng)
                params.update({
                    'location': f'{lat},{lng}',
                    'radius': 50000,  
                })
                print(f"📍 [Backend Autocomplete] Using user location: {lat}, {lng}")
            except (TypeError, ValueError) as e:
                print(f"⚠️ [Backend Autocomplete] Invalid user location: {e}")
        
        print(f"🔄 [Backend Autocomplete] Making API call with params: {params}")
        
       
        response = requests.get(base_url, params=params, timeout=10)
        data = response.json()
        
        print(f"📡 [Backend Autocomplete] Google API Status: {data['status']}")
        
        if data['status'] != 'OK':
            print(f"❌ [Backend Autocomplete] Google API Error: {data.get('error_message', 'No error message')}")
            print(f"🔍 [Backend Autocomplete] Full error response: {data}")
            
           
            if data['status'] == 'INVALID_REQUEST':
                print("🔄 [Backend Autocomplete] Trying fallback without types parameter...")
                fallback_params = params.copy()
                fallback_params.pop('types', None)  
                
                fallback_response = requests.get(base_url, params=fallback_params, timeout=10)
                fallback_data = fallback_response.json()
                
                print(f"📡 [Backend Autocomplete] Fallback API Status: {fallback_data['status']}")
                data = fallback_data
        
        suggestions = []
        if data['status'] == 'OK':
            for prediction in data['predictions']:
                suggestion_data = {
                    'description': prediction['description'],
                    'place_id': prediction['place_id'],
                    'main_text': prediction.get('structured_formatting', {}).get('main_text', ''),
                    'secondary_text': prediction.get('structured_formatting', {}).get('secondary_text', ''),
                    'types': prediction.get('types', [])
                }
                suggestions.append(suggestion_data)
                print(f"📍 [Backend Autocomplete] Found: {prediction['description']}")
        
        print(f"✅ [Backend Autocomplete] Returning {len(suggestions)} suggestions")
        return Response({"suggestions": suggestions[:15]})
            
    except Exception as e:
        print(f"❌ [Backend Autocomplete] Exception: {str(e)}")
        import traceback
        print(f"🔍 [Backend Autocomplete] Traceback: {traceback.format_exc()}")
        return Response({"suggestions": []})

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def get_place_details(request):
    """Get detailed place information using place_id"""
    place_id = request.data.get('place_id')
    
    if not place_id:
        return Response({"error": "Place ID is required"}, status=400)
    
    try:
        base_url = 'https://maps.googleapis.com/maps/api/place/details/json'
        params = {
            'place_id': place_id,
            'key': settings.GOOGLE_API_KEY,
            'fields': 'formatted_address,geometry,name'
        }
        
        response = requests.get(base_url, params=params, timeout=5)
        data = response.json()
        
        if data['status'] == 'OK':
            result = data['result']
            location = result.get('geometry', {}).get('location', {})
            
            return Response({
                'address': result.get('formatted_address', ''),
                'name': result.get('name', ''),
                'lat': location.get('lat'),
                'lng': location.get('lng')
            })
        else:
            return Response({"error": "Place not found"}, status=400)
            
    except Exception as e:
        print(f"Place details error: {e}")
        return Response({"error": "Failed to get place details"}, status=400)


#driver side 
@api_view(['GET'])
def driver_dashboard(request):
    """Driver dashboard with stats and current ride info"""
    if request.user.user_type not in ['driver', 'boda_rider']:
        return Response({"error": "Only drivers can access dashboard"}, status=403)
    
    
    dashboard_data = {
        "dashboard_type": "pending_approval",
        "title": "Application Under Review",
        "message": "Your driver account is currently being reviewed by our team",
        "approval_status": request.user.approval_status,
        "rejection_reason": request.user.rejection_reason,
        "current_status": {
            "status": request.user.approval_status,
            "color": "yellow" if request.user.approval_status == 'pending' else "red",
            "icon": "clock" if request.user.approval_status == 'pending' else 'x-circle'
        },
        "current_ride": None,
        "today_stats": {"completed_rides": 0, "total_earnings": 0},
        "weekly_stats": {"completed_rides": 0, "total_earnings": 0},
        "driver_status": {"is_online": False, "current_location": None},
        "user": UserSerializer(request.user).data
    }
    
   
    if not request.user.is_approved or request.user.approval_status != 'approved':
        return Response(dashboard_data, status=200)
    
    
    try:
     
        current_ride = Ride.objects.filter(
            driver=request.user,
            status__in=['accepted', 'driver_arrived', 'in_progress']
        ).order_by('-created_at').first()  
        
        today = timezone.now().date()
        today_rides = Ride.objects.filter(
            driver=request.user,
            created_at__date=today,
            status='completed'
        )
        
        week_ago = today - timezone.timedelta(days=7)
        weekly_rides = Ride.objects.filter(
            driver=request.user,
            created_at__date__gte=week_ago,
            status='completed'
        )
        
        
        try:
            driver_location = DriverLocation.objects.get(driver=request.user)
            is_online = driver_location.is_online
            location_data = DriverLocationSerializer(driver_location).data
        except DriverLocation.DoesNotExist:
            is_online = False
            location_data = None

       
        current_ride_data = None
        if current_ride:
            current_ride_data = RideSerializer(current_ride).data
            
            current_ride_data['customer_name'] = f"{current_ride.customer.first_name} {current_ride.customer.last_name}"
            current_ride_data['customer_phone'] = current_ride.customer.phone_number

        
        dashboard_data = {
            'dashboard_type': 'active_dashboard',
            'current_ride': current_ride_data,
            'today_stats': {
                'completed_rides': today_rides.count(),
                'total_earnings': sum(ride.fare for ride in today_rides if ride.fare),
            },
            'weekly_stats': {
                'completed_rides': weekly_rides.count(),
                'total_earnings': sum(ride.fare for ride in weekly_rides if ride.fare),
            },
            'driver_status': {
                'is_online': is_online,
                'current_location': location_data
            },
            'user': UserSerializer(request.user).data
        }
        
        return Response(dashboard_data)
        
    except Exception as e:
        print(f"❌ [Driver Dashboard Error]: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
        dashboard_data.update({
            "error": "Failed to load dashboard data",
            "dashboard_type": "error"
        })
        return Response(dashboard_data, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_online_status(request):
    """Toggle driver online/offline status"""
    try:
        if request.user.user_type not in ['driver', 'boda_rider']:
            return Response({"error": "Only drivers can toggle online status"}, status=403)
        
        is_online = request.data.get('is_online', False)
        
       
        lat = request.data.get('lat', -1.2921)  
        lng = request.data.get('lng', 36.8219)
        
        
        driver_location, created = DriverLocation.objects.get_or_create(
            driver=request.user,
            defaults={
                'lat': lat,
                'lng': lng,
                'is_online': is_online
            }
        )
        
        if not created:
            driver_location.is_online = is_online
            
            if 'lat' in request.data:
                driver_location.lat = lat
            if 'lng' in request.data:
                driver_location.lng = lng
            driver_location.save()
        
        return Response({
            "message": f"Driver is now {'online' if is_online else 'offline'}",
            "is_online": is_online,
            "driver_id": request.user.id,
            "location": {"lat": driver_location.lat, "lng": driver_location.lng}
        })
        
    except Exception as e:
        print(f"❌ [Toggle Online Error]: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return Response({"error": str(e)}, status=500)
    

@api_view(['POST'])
def start_ride(request, ride_id):
    """Driver starts the ride (pick up customer)"""
    if request.user.user_type not in ['driver', 'boda_rider']:
        return Response({"error": "Only drivers can start rides"}, status=403)
    
    try:
        ride = Ride.objects.get(id=ride_id, driver=request.user)
        
        if ride.status != 'driver_arrived':
            return Response({"error": "Ride status must be 'driver_arrived' to start"}, status=400)
        
        ride.status = 'in_progress'
        ride.actual_pickup_time = timezone.now()
        ride.save()
        
       
        RideMessage.objects.create(
            ride=ride,
            sender=request.user,
            message_type='system',
            content=f'Ride started at {ride.actual_pickup_time.strftime("%H:%M")}'
        )
        
        return Response(RideSerializer(ride).data)
        
    except Ride.DoesNotExist:
        return Response({"error": "Ride not found"}, status=404)

@api_view(['POST'])
def complete_ride(request, ride_id):
    """Driver completes the ride"""
    if request.user.user_type not in ['driver', 'boda_rider']:
        return Response({"error": "Only drivers can complete rides"}, status=403)
    
    try:
        ride = Ride.objects.get(id=ride_id, driver=request.user)
        
        if ride.status != 'in_progress':
            return Response({"error": "Ride must be in progress to complete"}, status=400)
        
        ride.status = 'completed'
        ride.actual_dropoff_time = timezone.now()
        ride.save()
        
        
        RideMessage.objects.create(
            ride=ride,
            sender=request.user,
            message_type='system',
            content=f'Ride completed at {ride.actual_dropoff_time.strftime("%H:%M")}'
        )
        
        return Response(RideSerializer(ride).data)
        
    except Ride.DoesNotExist:
        return Response({"error": "Ride not found"}, status=404)

@api_view(['POST'])
def send_ride_message(request, ride_id):
    """Send message in ride chat"""
    try:
        ride = Ride.objects.get(id=ride_id)
        
        
        if request.user not in [ride.customer, ride.driver]:
            return Response({"error": "Not authorized to send messages in this ride"}, status=403)
        
        content = request.data.get('content')
        message_type = request.data.get('message_type', 'text')
        
        if not content:
            return Response({"error": "Message content is required"}, status=400)
        
        message = RideMessage.objects.create(
            ride=ride,
            sender=request.user,
            message_type=message_type,
            content=content
        )
        
        return Response(RideMessageSerializer(message).data)
        
    except Ride.DoesNotExist:
        return Response({"error": "Ride not found"}, status=404)

@api_view(['GET'])
def ride_messages(request, ride_id):
    """Get all messages for a ride"""
    try:
        ride = Ride.objects.get(id=ride_id)
        
        
        if request.user not in [ride.customer, ride.driver]:
            return Response({"error": "Not authorized to view messages for this ride"}, status=403)
        
        messages = RideMessage.objects.filter(ride=ride)
        serializer = RideMessageSerializer(messages, many=True)
        
        return Response(serializer.data)
        
    except Ride.DoesNotExist:
        return Response({"error": "Ride not found"}, status=404)

@api_view(['GET'])
def driver_earnings(request):
    """Get driver's earnings breakdown"""
    if request.user.user_type not in ['driver', 'boda_rider']:
        return Response({"error": "Only drivers can view earnings"}, status=403)
    
    period = request.GET.get('period', 'week')  
    
    
    end_date = timezone.now().date()
    if period == 'week':
        start_date = end_date - timezone.timedelta(days=7)
    elif period == 'month':
        start_date = end_date - timezone.timedelta(days=30)
    elif period == 'year':
        start_date = end_date - timezone.timedelta(days=365)
    else:
        start_date = end_date - timezone.timedelta(days=7)
    
    completed_rides = Ride.objects.filter(
        driver=request.user,
        status='completed',
        created_at__date__range=[start_date, end_date]
    )
    
    earnings_data = {
        'period': period,
        'start_date': start_date,
        'end_date': end_date,
        'total_rides': completed_rides.count(),
        'total_earnings': sum(ride.fare for ride in completed_rides if ride.fare),
        'average_earnings_per_ride': completed_rides.aggregate(
            avg_fare=models.Avg('fare')
        )['avg_fare'] or 0,
        'rides': RideSerializer(completed_rides, many=True).data
    }
    
    return Response(earnings_data)    


#admin approval system
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def pending_drivers(request):
    """Get list of drivers pending approval with their documents"""
    pending_drivers = User.objects.filter(
        user_type__in=['driver', 'boda_rider'],
        approval_status='pending',
        submitted_for_approval=True
    )
    
    drivers_data = []
    for driver in pending_drivers:
        
        driver_data = UserSerializer(driver).data
        
        
        has_all_documents = all([
            driver.driver_license_file,
            driver.national_id_file, 
            driver.logbook_file
        ])
        
        driver_data['has_all_documents'] = has_all_documents
        driver_data['documents_status'] = {
            'driver_license': bool(driver.driver_license_file),
            'national_id': bool(driver.national_id_file),
            'logbook': bool(driver.logbook_file)
        }
        
        drivers_data.append(driver_data)
    
    return Response(drivers_data)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def approve_driver(request, user_id):
    try:
        driver = User.objects.get(
            id=user_id,
            user_type__in=['driver', 'boda_rider']
        )
        
        action = request.data.get('action')  
        reason = request.data.get('reason', '')
        
        if action == 'approve':
            
            vehicle_type = request.data.get('vehicle_type')
            license_plate = request.data.get('license_plate')
            make = request.data.get('make')
            model = request.data.get('model')
            year = request.data.get('year')
            color = request.data.get('color')
            
            
            if not all([vehicle_type, license_plate, make, model, year, color]):
                return Response({
                    "error": "All vehicle details are required for approval: vehicle_type, license_plate, make, model, year, color"
                }, status=400)
            
            driver.approval_status = 'approved'
            driver.is_approved = True
            driver.approval_date = timezone.now()
            driver.approved_by = request.user
            
            
            try:
                vehicle = Vehicle.objects.create(
                    driver=driver,
                    vehicle_type=vehicle_type,
                    license_plate=license_plate,
                    make=make,
                    model=model,
                    year=year,
                    color=color,
                    is_approved=True,
                    vehicle_approval_status='approved'
                )
            except Exception as e:
                return Response({"error": f"Failed to create vehicle: {str(e)}"}, status=400)
                
            message = 'Driver approved successfully and vehicle assigned'
            
        elif action == 'reject':
            driver.approval_status = 'rejected'
            driver.is_approved = False
            driver.rejection_reason = reason
            message = 'Driver rejected'
            
        else:
            return Response({"error": "Action must be 'approve' or 'reject'"}, status=400)
        
        driver.save()
       
        create_admin_notification(
            notification_type='system_alert',
            title=f'Driver {action.capitalize()}',
            message=f'Driver {driver.get_full_name()} was {action}ed by {request.user.get_full_name()}',
            priority='medium',
            related_user=driver,
            created_by=request.user
        )
        
        return Response({
            "message": message,
            "driver": UserSerializer(driver).data
        })
        
    except User.DoesNotExist:
        return Response({"error": "Driver not found"}, status=404)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def suspend_driver(request, user_id):
    """Suspend a driver (Admin only)"""
    try:
        driver = User.objects.get(
            id=user_id,
            user_type__in=['driver', 'boda_rider']
        )
        
        driver.approval_status = 'suspended'
        driver.is_approved = False
        driver.save()
        
        return Response({
            "message": "Driver suspended successfully",
            "driver": UserSerializer(driver).data
        })
        
    except User.DoesNotExist:
        return Response({"error": "Driver not found"}, status=404)
    

@api_view(['POST'])
def decline_ride(request, ride_id):
    """Driver declines a ride request"""
    if request.user.user_type not in ['driver', 'boda_rider']:
        return Response({"error": "Only drivers can decline rides"}, status=403)
    
    try:
        ride = Ride.objects.get(id=ride_id, status='requested')
        
        print(f"🚫 Driver {request.user.id} declined ride {ride_id}")
        
        
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        
        message_data = {
            'type': 'ride_declined',
            'data': {
                'ride_id': ride.id,
                'driver_id': request.user.id,
                'driver_name': f"{request.user.first_name} {request.user.last_name}",
                'message': 'Driver declined the ride request',
                'timestamp': timezone.now().isoformat()
            }
        }
        
        print(f"📢 [Backend] Broadcasting to customer_{ride.customer.id}: {message_data}")
        
        async_to_sync(channel_layer.group_send)(
            f"customer_{ride.customer.id}",
            message_data
        )
        
        return Response({"message": "Ride declined successfully"})
        
    except Ride.DoesNotExist:
        return Response({"error": "Ride not found or already accepted"}, status=404)

    # Customer Profile Management
@api_view(['GET', 'PUT'])
def customer_profile(request):
    """Get or update customer profile"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can access this endpoint"}, status=403)
    
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = CustomerProfileUpdateSerializer(
            request.user, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated successfully',
                'user': UserSerializer(request.user).data
            })
        return Response(serializer.errors, status=400)

@api_view(['GET', 'POST'])
def customer_payment_methods(request):
    """Get or create payment methods for customer"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can access payment methods"}, status=403)
    
    if request.method == 'GET':
        payment_methods = CustomerPaymentMethod.objects.filter(customer=request.user)
        serializer = PaymentMethodSerializer(payment_methods, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
       
        if request.data.get('is_default'):
            CustomerPaymentMethod.objects.filter(customer=request.user, is_default=True).update(is_default=False)
        
        serializer = PaymentMethodSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            payment_method = serializer.save(customer=request.user)
            return Response(PaymentMethodSerializer(payment_method).data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['PUT', 'DELETE'])
def customer_payment_method_detail(request, payment_id):
    """Update or delete specific payment method"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can access payment methods"}, status=403)
    
    try:
        payment_method = CustomerPaymentMethod.objects.get(id=payment_id, customer=request.user)
    except CustomerPaymentMethod.DoesNotExist:
        return Response({"error": "Payment method not found"}, status=404)
    
    if request.method == 'PUT':
       
        if request.data.get('is_default'):
            CustomerPaymentMethod.objects.filter(customer=request.user, is_default=True).update(is_default=False)
        
        serializer = PaymentMethodSerializer(payment_method, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
    elif request.method == 'DELETE':
       
        if CustomerPaymentMethod.objects.filter(customer=request.user).count() <= 1:
            return Response({"error": "Cannot delete your only payment method"}, status=400)
        
        payment_method.delete()
        return Response({"message": "Payment method deleted successfully"})

@api_view(['GET'])
def customer_chat_history(request):
    """Get customer's chat history with drivers"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can access chat history"}, status=403)
    
    chat_history = CustomerChatHistory.objects.filter(customer=request.user)
    serializer = ChatHistorySerializer(chat_history, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def customer_stats(request):
    """Get real-time customer statistics"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can access stats"}, status=403)
    
   
    total_rides = Ride.objects.filter(customer=request.user).count()
    
   
    today = timezone.now().date()
    first_day_of_month = today.replace(day=1)
    this_month_rides = Ride.objects.filter(
        customer=request.user,
        created_at__date__gte=first_day_of_month
    ).count()
    
    
    completed_rides = Ride.objects.filter(
        customer=request.user,
        status='completed'
    ).count()
    
    
    total_spent = Ride.objects.filter(
        customer=request.user,
        status='completed'
    ).aggregate(total=models.Sum('fare'))['total'] or 0
    
    
    average_rating = 4.8  
    
    stats = {
        'total_rides': total_rides,
        'this_month_rides': this_month_rides,
        'completed_rides': completed_rides,
        'total_spent': float(total_spent),
        'average_rating': average_rating
    }
    
    return Response(stats)

@api_view(['POST'])
def set_default_payment_method(request, payment_id):
    """Set a payment method as default"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can set payment methods"}, status=403)
    
    try:
        
        CustomerPaymentMethod.objects.filter(customer=request.user, is_default=True).update(is_default=False)
        
      
        payment_method = CustomerPaymentMethod.objects.get(id=payment_id, customer=request.user)
        payment_method.is_default = True
        payment_method.save()
        
        return Response({"message": "Default payment method updated successfully"})
        
    except CustomerPaymentMethod.DoesNotExist:
        return Response({"error": "Payment method not found"}, status=404)


def update_chat_history(ride, message):
    """Update or create chat history when messages are sent"""
    try:
        chat_history, created = CustomerChatHistory.objects.get_or_create(
            customer=ride.customer,
            ride=ride,
            driver=ride.driver,
            defaults={
                'last_message': message.content,
                'last_message_time': message.timestamp
            }
        )
        
        if not created:
            chat_history.last_message = message.content
            chat_history.last_message_time = message.timestamp
            if message.sender != ride.customer:
                chat_history.unread_count += 1
            chat_history.save()
            
    except Exception as e:
        print(f"Error updating chat history: {e}")


@api_view(['POST'])
def send_ride_message(request, ride_id):
    """Send message in ride chat and update chat history"""
    try:
        ride = Ride.objects.get(id=ride_id)
        
        
        if request.user not in [ride.customer, ride.driver]:
            return Response({"error": "Not authorized to send messages in this ride"}, status=403)
        
        content = request.data.get('content')
        message_type = request.data.get('message_type', 'text')
        
        if not content:
            return Response({"error": "Message content is required"}, status=400)
        
        message = RideMessage.objects.create(
            ride=ride,
            sender=request.user,
            message_type=message_type,
            content=content
        )
        
        
        update_chat_history(ride, message)
        
        return Response(RideMessageSerializer(message).data)
        
    except Ride.DoesNotExist:
        return Response({"error": "Ride not found"}, status=404)  


@api_view(['GET', 'POST'])
def customer_payment_methods(request):
    """Get or create payment methods for customer"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can access payment methods"}, status=403)
    
    if request.method == 'GET':
        
        return Response([])
    
    elif request.method == 'POST':
        
        payment_data = request.data.copy()
        payment_data['id'] = 1  
        payment_data['created_at'] = timezone.now().isoformat()
        return Response(payment_data, status=201)

@api_view(['PUT', 'DELETE'])
def customer_payment_method_detail(request, payment_id):
    """Update or delete specific payment method"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can access payment methods"}, status=403)
    
    
    if request.method == 'PUT':
        return Response({"message": "Payment method updated successfully"})
    
    elif request.method == 'DELETE':
        return Response({"message": "Payment method deleted successfully"})

@api_view(['GET'])
def customer_chat_history(request):
    """Get customer's chat history with drivers"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can access chat history"}, status=403)
    
    
    return Response([])

@api_view(['GET'])
def customer_stats(request):
    """Get real-time customer statistics"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can access stats"}, status=403)
    
   
    total_rides = Ride.objects.filter(customer=request.user).count()
    
    
    today = timezone.now().date()
    first_day_of_month = today.replace(day=1)
    this_month_rides = Ride.objects.filter(
        customer=request.user,
        created_at__date__gte=first_day_of_month
    ).count()
    
  
  
    completed_rides = Ride.objects.filter(
        customer=request.user,
        status='completed'
    ).count()
    
    
    total_spent = Ride.objects.filter(
        customer=request.user,
        status='completed'
    ).aggregate(total=models.Sum('fare'))['total'] or 0
    
    stats = {
        'total_rides': total_rides,
        'this_month_rides': this_month_rides,
        'completed_rides': completed_rides,
        'total_spent': float(total_spent),
        'average_rating': 4.8  
    }
    
    return Response(stats)

@api_view(['POST'])
def set_default_payment_method(request, payment_id):
    """Set a payment method as default"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can set payment methods"}, status=403)
    

    return Response({"message": "Default payment method updated successfully"})    


# Admin Dashboard Statistics
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_dashboard_stats(request):
    """Get comprehensive admin dashboard statistics"""
    
    
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
   
    total_users = User.objects.count()
    total_customers = User.objects.filter(user_type='customer').count()
    total_drivers = User.objects.filter(user_type__in=['driver', 'boda_rider']).count()
    total_emergency_responders = User.objects.filter(user_type='emergency_responder').count()
    
    
    new_users_week = User.objects.filter(created_at__date__gte=week_ago).count()
    
   
    total_rides = Ride.objects.count()
    completed_rides = Ride.objects.filter(status='completed').count()
    active_rides = Ride.objects.filter(status__in=['accepted', 'driver_arrived', 'in_progress']).count()
    cancelled_rides = Ride.objects.filter(status='cancelled').count()
    
 
    recent_rides = Ride.objects.filter(created_at__date__gte=week_ago).count()
    
   
    total_revenue = Ride.objects.filter(status='completed').aggregate(
        total=Sum('fare')
    )['total'] or 0
    
    weekly_revenue = Ride.objects.filter(
        status='completed',
        created_at__date__gte=week_ago
    ).aggregate(total=Sum('fare'))['total'] or 0
    
   
    pending_drivers_count = User.objects.filter(
        user_type__in=['driver', 'boda_rider'],
        approval_status='pending'
    ).count()
    
    approved_drivers_count = User.objects.filter(
        user_type__in=['driver', 'boda_rider'],
        approval_status='approved'
    ).count()
    
    suspended_drivers_count = User.objects.filter(
        user_type__in=['driver', 'boda_rider'],
        approval_status='suspended'
    ).count()
    
    
    total_emergency_requests = EmergencyRequest.objects.count()
    active_emergency_requests = EmergencyRequest.objects.filter(
        status__in=['requested', 'accepted', 'in_progress']
    ).count()
    
    
    daily_stats = []
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        day_rides = Ride.objects.filter(created_at__date=date).count()
        day_revenue = Ride.objects.filter(
            created_at__date=date,
            status='completed'
        ).aggregate(total=Sum('fare'))['total'] or 0
        
        daily_stats.append({
            'date': date.isoformat(),
            'rides': day_rides,
            'revenue': float(day_revenue)
        })
    
    
    vehicle_stats = Ride.objects.values('vehicle_type').annotate(
        count=Count('id'),
        revenue=Sum('fare')
    ).order_by('-count')
    
    stats = {
        'overview': {
            'total_users': total_users,
            'total_rides': total_rides,
            'total_revenue': float(total_revenue),
            'active_rides': active_rides,
        },
        'users': {
            'total': total_users,
            'customers': total_customers,
            'drivers': total_drivers,
            'emergency_responders': total_emergency_responders,
            'new_this_week': new_users_week,
        },
        'rides': {
            'total': total_rides,
            'completed': completed_rides,
            'cancelled': cancelled_rides,
            'active': active_rides,
            'recent_week': recent_rides,
            'completion_rate': (completed_rides / total_rides * 100) if total_rides > 0 else 0,
        },
        'revenue': {
            'total': float(total_revenue),
            'weekly': float(weekly_revenue),
            'average_per_ride': float(total_revenue / completed_rides) if completed_rides > 0 else 0,
        },
        'drivers': {
            'pending_approval': pending_drivers_count,
            'approved': approved_drivers_count,
            'suspended': suspended_drivers_count,
            'approval_rate': (approved_drivers_count / (approved_drivers_count + pending_drivers_count) * 100) if (approved_drivers_count + pending_drivers_count) > 0 else 0,
        },
        'emergency_services': {
            'total_requests': total_emergency_requests,
            'active_requests': active_emergency_requests,
        },
        'charts': {
            'daily_stats': daily_stats,
            'vehicle_stats': list(vehicle_stats),
        }
    }
    
    return Response(stats)

# User Management
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_user_management(request):
    """Admin user management with filtering and pagination"""
    
    
    user_type = request.GET.get('user_type', '')
    status_filter = request.GET.get('status', '')
    search = request.GET.get('search', '')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    
    
    filters = Q()
    
    if status_filter == 'inactive':
        filters &= Q(is_active=False)
    elif status_filter != 'inactive':  
        filters &= Q(is_active=True)
    
    if user_type:
        if user_type == 'driver':
            filters &= Q(user_type__in=['driver', 'boda_rider'])
        else:
            filters &= Q(user_type=user_type)
    
    if search:
        filters &= (
            Q(email__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(phone_number__icontains=search)
        )
    
    
    users = User.objects.filter(filters).order_by('-created_at')
    total_users = users.count()
    total_pages = (total_users + page_size - 1) // page_size
    
   
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    paginated_users = users[start_index:end_index]
    
   
    users_data = []
    for user in paginated_users:
        user_data = UserSerializer(user).data
        
        
        user_data['ride_stats'] = {
            'total_rides_as_customer': Ride.objects.filter(customer=user).count(),
            'total_rides_as_driver': Ride.objects.filter(driver=user).count() if user.user_type in ['driver', 'boda_rider'] else 0,
            'completed_rides': Ride.objects.filter(driver=user, status='completed').count() if user.user_type in ['driver', 'boda_rider'] else 0,
        }
        
        
        if user.user_type in ['driver', 'boda_rider']:
            try:
                vehicle = user.vehicle
                user_data['vehicle'] = {
                    'license_plate': vehicle.license_plate,
                    'vehicle_type': vehicle.vehicle_type,
                    'make': vehicle.make,
                    'model': vehicle.model,
                    'is_approved': vehicle.is_approved,
                }
            except:
                user_data['vehicle'] = None
        
        users_data.append(user_data)
    
    return Response({
        'users': users_data,
        'pagination': {
            'current_page': page,
            'total_pages': total_pages,
            'total_users': total_users,
            'page_size': page_size,
        },
        'filters': {
            'user_type': user_type,
            'status': status_filter,
            'search': search,
        }
    })

# User Management
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAdminUser])
def admin_user_detail(request, user_id):
    """Admin manage specific user details"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        
       
        response_data = serializer.data
        
       
        if user.user_type == 'customer':
            rides = Ride.objects.filter(customer=user).order_by('-created_at')[:10]
            response_data['recent_rides'] = RideSerializer(rides, many=True).data
        
        elif user.user_type in ['driver', 'boda_rider']:
            
            rides = Ride.objects.filter(driver=user).order_by('-created_at')[:10]
            response_data['recent_rides'] = RideSerializer(rides, many=True).data
            
           
            earnings_data = Ride.objects.filter(
                driver=user,
                status='completed'
            ).aggregate(
                total_earnings=Sum('fare'),
                total_rides=Count('id'),
                avg_rating=Avg('rating__rating')
            )
            response_data['earnings_summary'] = earnings_data
            
            
            try:
                vehicle = user.vehicle
                response_data['vehicle'] = {
                    'license_plate': vehicle.license_plate,
                    'vehicle_type': vehicle.vehicle_type,
                    'make': vehicle.make,
                    'model': vehicle.model,
                    'year': vehicle.year,
                    'color': vehicle.color,
                    'is_approved': vehicle.is_approved,
                    'vehicle_approval_status': vehicle.vehicle_approval_status,
                }
            except:
                response_data['vehicle'] = None
        
        return Response(response_data)
    
    elif request.method == 'PUT':
        
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
    elif request.method == 'DELETE':
        
        print(f"🟡 [Backend] Deleting user ID: {user_id}")
        user.delete()  
        return Response({"message": "User deleted successfully"})
    
   
    elif request.method == 'DELETE':
    
        if user.id == request.user.id:
            return Response({
            "error": "You cannot delete your own account"
        }, status=400)
    
    print(f"🟡 [Backend] Deleting user ID: {user_id}")
    user.delete()
    return Response({"message": "User deleted successfully"})

# Ride Management
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_ride_management(request):
    """Admin ride management with filters"""
    
    
    status_filter = request.GET.get('status', '')
    vehicle_type = request.GET.get('vehicle_type', '')
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    search = request.GET.get('search', '')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    
    filters = Q()
    
    if status_filter:
        filters &= Q(status=status_filter)
    
    if vehicle_type:
        filters &= Q(vehicle_type=vehicle_type)
    
    if date_from:
        filters &= Q(created_at__date__gte=date_from)
    
    if date_to:
        filters &= Q(created_at__date__lte=date_to)
    
    if search:
        filters &= (
            Q(customer__email__icontains=search) |
            Q(customer__first_name__icontains=search) |
            Q(customer__last_name__icontains=search) |
            Q(driver__email__icontains=search) |
            Q(driver__first_name__icontains=search) |
            Q(pickup_address__icontains=search) |
            Q(dropoff_address__icontains=search)
        )
    
    
    rides = Ride.objects.filter(filters).select_related(
        'customer', 'driver'
    ).order_by('-created_at')
    
    total_rides = rides.count()
    total_pages = (total_rides + page_size - 1) // page_size
    
   
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    paginated_rides = rides[start_index:end_index]
    
    
    ride_stats = rides.aggregate(
        total_fare=Sum('fare'),
        avg_fare=Avg('fare'),
        completed_rides=Count('id', filter=Q(status='completed')),
        cancelled_rides=Count('id', filter=Q(status='cancelled'))
    )
    
    serializer = RideSerializer(paginated_rides, many=True)
    
    return Response({
        'rides': serializer.data,
        'pagination': {
            'current_page': page,
            'total_pages': total_pages,
            'total_rides': total_rides,
            'page_size': page_size,
        },
        'stats': ride_stats,
        'filters': {
            'status': status_filter,
            'vehicle_type': vehicle_type,
            'date_from': date_from,
            'date_to': date_to,
            'search': search,
        }
    })

# Ride Management
@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAdminUser])
def admin_ride_detail(request, ride_id):
    """Admin view and manage specific ride details"""
    try:
        ride = Ride.objects.select_related('customer', 'driver').get(id=ride_id)
    except Ride.DoesNotExist:
        return Response({"error": "Ride not found"}, status=404)
    
    if request.method == 'GET':
        serializer = RideSerializer(ride)
        
       
        response_data = serializer.data
        
        
        messages = RideMessage.objects.filter(ride=ride).order_by('timestamp')
        response_data['messages'] = RideMessageSerializer(messages, many=True).data
        
        
        try:
            rating = ride.rating
            response_data['rating'] = {
                'rating': rating.rating,
                'comment': rating.comment,
                'created_at': rating.created_at
            }
        except:
            response_data['rating'] = None
        
       
        if ride.pickup_lat and ride.pickup_lng and ride.dropoff_lat and ride.dropoff_lng:
            route_info = get_google_route(
                ride.pickup_lat, ride.pickup_lng,
                ride.dropoff_lat, ride.dropoff_lng
            )
            if route_info:
                response_data['route_info'] = {
                    'distance_km': round(route_info['distance'] / 1000, 2),
                    'duration_min': round(route_info['duration'] / 60, 2),
                    'polyline': route_info['polyline']
                }
        
        return Response(response_data)
    
    elif request.method == 'PUT':
        
        serializer = RideSerializer(ride, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

# Emergency Management
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_emergency_requests(request):
    """Admin management of emergency requests"""
    
    status_filter = request.GET.get('status', '')
    service_type = request.GET.get('service_type', '')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    
    filters = Q()
    
    if status_filter:
        filters &= Q(status=status_filter)
    
    if service_type:
        filters &= Q(service_type=service_type)
    
    requests = EmergencyRequest.objects.filter(filters).select_related(
        'customer', 'accepted_by'
    ).order_by('-created_at')
    
    total_requests = requests.count()
    total_pages = (total_requests + page_size - 1) // page_size
    
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    paginated_requests = requests[start_index:end_index]
    
    requests_data = []
    for req in paginated_requests:
        requests_data.append({
            'id': req.id,
            'customer': {
                'id': req.customer.id,
                'name': f"{req.customer.first_name} {req.customer.last_name}",
                'phone': req.customer.phone_number,
            },
            'service_type': req.service_type,
            'status': req.status,
            'location': {
                'lat': req.location_lat,
                'lng': req.location_lng,
                'address': req.address,
            },
            'description': req.description,
            'created_at': req.created_at,
            'accepted_by': {
                'id': req.accepted_by.id,
                'name': f"{req.accepted_by.first_name} {req.accepted_by.last_name}",
            } if req.accepted_by else None,
        })
    
    
    stats = {
        'total': total_requests,
        'by_status': EmergencyRequest.objects.values('status').annotate(count=Count('id')),
        'by_service_type': EmergencyRequest.objects.values('service_type').annotate(count=Count('id')),
    }
    
    return Response({
        'requests': requests_data,
        'pagination': {
            'current_page': page,
            'total_pages': total_pages,
            'total_requests': total_requests,
            'page_size': page_size,
        },
        'stats': stats,
    })

# Earnings 
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_earnings_report(request):
    """Detailed earnings reports for admin"""
    
    period = request.GET.get('period', 'week')  
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    
    
    today = timezone.now().date()
    if period == 'week':
        start_date = today - timedelta(days=7)
        end_date = today
    elif period == 'month':
        start_date = today - timedelta(days=30)
        end_date = today
    elif period == 'year':
        start_date = today - timedelta(days=365)
        end_date = today
    elif period == 'custom' and date_from and date_to:
        start_date = datetime.strptime(date_from, '%Y-%m-%d').date()
        end_date = datetime.strptime(date_to, '%Y-%m-%d').date()
    else:
        start_date = today - timedelta(days=7)
        end_date = today
    
    # Get earnings data
    earnings_data = Ride.objects.filter(
        status='completed',
        created_at__date__range=[start_date, end_date]
    ).aggregate(
        total_earnings=Sum('fare'),
        total_rides=Count('id'),
        avg_fare=Avg('fare')
    )
    
    # FIX: Update daily breakdown to use 'total_earnings' instead of 'earnings'
    daily_breakdown = []
    current_date = start_date
    while current_date <= end_date:
        day_earnings = Ride.objects.filter(
            status='completed',
            created_at__date=current_date
        ).aggregate(
            total_earnings=Sum('fare'),  # Changed from 'total' to 'total_earnings'
            total_rides=Count('id')
        )
        
        daily_breakdown.append({
            'date': current_date.isoformat(),
            'total_earnings': float(day_earnings['total_earnings'] or 0),  # Changed key
            'total_rides': day_earnings['total_rides'] or 0,
        })
        
        current_date += timedelta(days=1)
    
    # Vehicle type breakdown
    by_vehicle_type = Ride.objects.filter(
        status='completed',
        created_at__date__range=[start_date, end_date]
    ).values('vehicle_type').annotate(
        total_earnings=Sum('fare'),
        total_rides=Count('id'),
        avg_fare=Avg('fare')
    ).order_by('-total_earnings')
    
    # Top drivers
    top_drivers = Ride.objects.filter(
        status='completed',
        created_at__date__range=[start_date, end_date],
        driver__isnull=False
    ).values(
        'driver__id',
        'driver__first_name',
        'driver__last_name',
        'driver__email'
    ).annotate(
        total_earnings=Sum('fare'),
        total_rides=Count('id'),
        avg_rating=Avg('rating__rating')
    ).order_by('-total_earnings')[:10]
    
    report = {
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'period_type': period,
        },
        'summary': {
            'total_earnings': float(earnings_data['total_earnings'] or 0),
            'total_rides': earnings_data['total_rides'] or 0,
            'average_fare': float(earnings_data['avg_fare'] or 0),
        },
        'daily_breakdown': daily_breakdown,
        'by_vehicle_type': list(by_vehicle_type),
        'top_drivers': list(top_drivers),
    }
    
    return Response(report)

# Usage Reports
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_usage_report(request):
    """System usage and performance reports"""
    
    
    user_growth = []
    for i in range(6, -1, -1):
        date = timezone.now().date() - timedelta(days=i)
        total_users = User.objects.filter(created_at__date__lte=date).count()
        new_users = User.objects.filter(created_at__date=date).count()
        
        user_growth.append({
            'date': date.isoformat(),
            'total_users': total_users,
            'new_users': new_users,
        })
    
    
    total_rides = Ride.objects.count()
    completed_rides = Ride.objects.filter(status='completed').count()
    cancelled_rides = Ride.objects.filter(status='cancelled').count()
    
    completion_rate = (completed_rides / total_rides * 100) if total_rides > 0 else 0
    cancellation_rate = (cancelled_rides / total_rides * 100) if total_rides > 0 else 0
    
    
    active_drivers = DriverLocation.objects.filter(is_online=True).count()
    total_drivers = User.objects.filter(user_type__in=['driver', 'boda_rider']).count()
    
    
    response_times = Ride.objects.filter(
        status__in=['accepted', 'driver_arrived', 'in_progress', 'completed'],
        driver__isnull=False
    ).annotate(
        response_time=models.ExpressionWrapper(
            models.F('actual_pickup_time') - models.F('created_at'),
            output_field=models.DurationField()
        )
    ).aggregate(
        avg_response_time=Avg('response_time')
    )
    
   
    popular_routes = Ride.objects.values(
        'pickup_address', 'dropoff_address'
    ).annotate(
        ride_count=Count('id')
    ).order_by('-ride_count')[:10]
    
    report = {
        'user_metrics': {
            'growth_data': user_growth,
            'total_users': total_users,
            'active_drivers': active_drivers,
            'driver_activity_rate': (active_drivers / total_drivers * 100) if total_drivers > 0 else 0,
        },
        'ride_metrics': {
            'completion_rate': round(completion_rate, 2),
            'cancellation_rate': round(cancellation_rate, 2),
            'total_rides': total_rides,
            'completed_rides': completed_rides,
        },
        'performance_metrics': {
            'avg_response_time_minutes': response_times['avg_response_time'].total_seconds() / 60 if response_times['avg_response_time'] else 0,
            'active_drivers': active_drivers,
        },
        'popular_routes': list(popular_routes),
    }
    
    return Response(report)

# Notifications
def create_admin_notification(
    notification_type, 
    title, 
    message, 
    priority='medium',
    related_user=None,
    related_ride=None,
    related_emergency_request=None,
    created_by=None
):
    """Create admin notification and broadcast via WebSocket"""
    try:
        
        if not created_by:
            created_by = User.objects.filter(is_staff=True, is_superuser=True).first()
            if not created_by:
                created_by = User.objects.filter(is_staff=True).first()
        
        notification = AdminNotification.objects.create(
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            related_user=related_user,
            related_ride=related_ride,
            related_emergency_request=related_emergency_request,
            created_by=created_by
        )
        
        
        broadcast_admin_notification(notification)
        
        return notification
    except Exception as e:
        print(f"Error creating admin notification: {e}")
        return None

def broadcast_admin_notification(notification):
    """Broadcast notification to all connected admin users"""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        
        
        admin_users = User.objects.filter(
            is_staff=True,
            notification_preferences__receive_system_alerts=True 
        )
        
        for admin in admin_users:
           
            pref = getattr(admin, 'notification_preferences', None)
            if should_send_notification(admin, notification):
                async_to_sync(channel_layer.group_send)(
                    f"admin_{admin.id}",
                    {
                        "type": "admin_notification",
                        "data": {
                            'id': notification.id,
                            'type': notification.notification_type,
                            'title': notification.title,
                            'message': notification.message,
                            'priority': notification.priority,
                            'is_read': notification.is_read,
                            'created_at': notification.created_at.isoformat(),
                            'related_user_id': notification.related_user_id,
                            'related_ride_id': notification.related_ride_id,
                            'related_emergency_id': notification.related_emergency_request_id,
                        }
                    }
                )
        
        print(f"📢 [Admin Notification] Broadcast: {notification.title}")
        
    except Exception as e:
        print(f"Error broadcasting admin notification: {e}")

def should_send_notification(admin_user, notification):
    """Check if admin should receive this notification based on preferences"""
    try:
        pref = admin_user.notification_preferences
        if not pref:
            return True  
        
        
        if notification.notification_type == 'new_driver' and not pref.receive_new_driver_notifications:
            return False
        elif notification.notification_type == 'new_emergency' and not pref.receive_emergency_notifications:
            return False
        elif notification.notification_type == 'ride_issue' and not pref.receive_ride_issue_notifications:
            return False
        elif notification.notification_type == 'system_alert' and not pref.receive_system_alerts:
            return False
        elif notification.notification_type == 'payment_issue' and not pref.receive_payment_issues:
            return False
        
        
        priority_weights = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
        notification_priority = priority_weights.get(notification.priority, 1)
        min_priority = priority_weights.get(pref.minimum_priority, 1)
        
        return notification_priority >= min_priority
        
    except Exception as e:
        print(f"Error checking notification preferences: {e}")
        return True


def trigger_driver_registration_notification(driver_user):
    """Trigger notification when new driver registers"""
    create_admin_notification(
        notification_type='new_driver',
        title='New Driver Registration',
        message=f'New driver {driver_user.get_full_name()} ({driver_user.email}) has registered and is pending approval.',
        priority='medium',
        related_user=driver_user
    )

def trigger_emergency_request_notification(emergency_request):
    """Trigger notification for new emergency request"""
    create_admin_notification(
        notification_type='new_emergency',
        title='New Emergency Request',
        message=f'New {emergency_request.service_type} request from {emergency_request.customer.get_full_name()} at {emergency_request.address}',
        priority='high',
        related_emergency_request=emergency_request,
        related_user=emergency_request.customer
    )

def trigger_ride_issue_notification(ride, issue_description):
    """Trigger notification for ride issues"""
    create_admin_notification(
        notification_type='ride_issue',
        title='Ride Issue Reported',
        message=f'Issue with ride #{ride.id}: {issue_description}',
        priority='medium',
        related_ride=ride,
        related_user=ride.customer
    )

def trigger_payment_issue_notification(ride, issue_description):
    """Trigger notification for payment issues"""
    create_admin_notification(
        notification_type='payment_issue',
        title='Payment Issue',
        message=f'Payment issue with ride #{ride.id}: {issue_description}',
        priority='high',
        related_ride=ride,
        related_user=ride.customer
    )

def trigger_system_alert_notification(title, message, priority='high'):
    """Trigger system-wide alert notification"""
    create_admin_notification(
        notification_type='system_alert',
        title=title,
        message=message,
        priority=priority
    )

# Notification Views
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_notifications(request):
    """Get admin notifications with filters"""
    notification_type = request.GET.get('type', '')
    priority = request.GET.get('priority', '')
    is_read = request.GET.get('is_read', '')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    
    filters = Q()
    
    if notification_type:
        filters &= Q(notification_type=notification_type)
    
    if priority:
        filters &= Q(priority=priority)
    
    if is_read.lower() in ['true', 'false']:
        filters &= Q(is_read=is_read.lower() == 'true')
    
    notifications = AdminNotification.objects.filter(filters).select_related(
        'related_user', 'related_ride', 'related_emergency_request', 'created_by'
    ).order_by('-created_at')
    
    total_notifications = notifications.count()
    total_pages = (total_notifications + page_size - 1) // page_size
    
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    paginated_notifications = notifications[start_index:end_index]
    
    notifications_data = []
    for notification in paginated_notifications:
        notifications_data.append({
            'id': notification.id,
            'type': notification.notification_type,
            'title': notification.title,
            'message': notification.message,
            'priority': notification.priority,
            'is_read': notification.is_read,
            'created_at': notification.created_at,
            'read_at': notification.read_at,
            'related_user': {
                'id': notification.related_user.id,
                'name': notification.related_user.get_full_name(),
                'email': notification.related_user.email,
            } if notification.related_user else None,
            'related_ride': {
                'id': notification.related_ride.id,
                'pickup_address': notification.related_ride.pickup_address,
                'status': notification.related_ride.status,
            } if notification.related_ride else None,
            'related_emergency_request': {
                'id': notification.related_emergency_request.id,
                'service_type': notification.related_emergency_request.service_type,
                'status': notification.related_emergency_request.status,
            } if notification.related_emergency_request else None,
            'created_by': notification.created_by.get_full_name(),
        })
    
    
    unread_count = AdminNotification.objects.filter(is_read=False).count()
    unread_high_priority = AdminNotification.objects.filter(
        is_read=False, 
        priority__in=['high', 'critical']
    ).count()
    
    return Response({
        'notifications': notifications_data,
        'pagination': {
            'current_page': page,
            'total_pages': total_pages,
            'total_notifications': total_notifications,
            'page_size': page_size,
        },
        'summary': {
            'unread_count': unread_count,
            'unread_high_priority': unread_high_priority,
        }
    })

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    try:
        notification = AdminNotification.objects.get(id=notification_id)
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        
        return Response({"message": "Notification marked as read"})
    except AdminNotification.DoesNotExist:
        return Response({"error": "Notification not found"}, status=404)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def mark_all_notifications_read(request):
    """Mark all notifications as read for the current admin"""
    AdminNotification.objects.filter(is_read=False).update(
        is_read=True, 
        read_at=timezone.now()
    )
    
    return Response({"message": "All notifications marked as read"})

@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAdminUser])
def notification_preferences(request):
    """Get or update notification preferences"""
    try:
        preferences, created = NotificationPreference.objects.get_or_create(
            user=request.user
        )
        
        if request.method == 'GET':
            return Response({
                'receive_new_driver_notifications': preferences.receive_new_driver_notifications,
                'receive_emergency_notifications': preferences.receive_emergency_notifications,
                'receive_ride_issue_notifications': preferences.receive_ride_issue_notifications,
                'receive_system_alerts': preferences.receive_system_alerts,
                'receive_payment_issues': preferences.receive_payment_issues,
                'email_notifications': preferences.email_notifications,
                'push_notifications': preferences.push_notifications,
                'in_app_notifications': preferences.in_app_notifications,
                'minimum_priority': preferences.minimum_priority,
            })
        
        elif request.method == 'PUT':
            serializer = NotificationPreferenceSerializer(preferences, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
            
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def test_notification(request):
    """Test notification system (admin only)"""
    test_notification = create_admin_notification(
        notification_type='system_alert',
        title='Test Notification',
        message='This is a test notification to verify the system is working.',
        priority='medium',
        created_by=request.user
    )
    
    if test_notification:
        return Response({
            "message": "Test notification sent successfully",
            "notification_id": test_notification.id
        })
    else:
        return Response({"error": "Failed to send test notification"}, status=500) 


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def pending_drivers_with_documents(request):
    """Get pending drivers with document URLs"""
    pending_drivers = User.objects.filter(
        user_type__in=['driver', 'boda_rider'],
        approval_status='pending',
        submitted_for_approval=True
    )
    
    drivers_data = []
    for driver in pending_drivers:
        driver_data = UserSerializer(driver).data
        
        has_all_documents = all([
            driver.driver_license_file,
            driver.national_id_file, 
            driver.logbook_file
        ])
        
        driver_data['has_all_documents'] = has_all_documents
        driver_data['documents_status'] = {
            'driver_license': bool(driver.driver_license_file),
            'national_id': bool(driver.national_id_file),
            'logbook': bool(driver.logbook_file)
        }
        
        drivers_data.append(driver_data)
    
    return Response(drivers_data)

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def driver_documents(request, user_id):
    """Get driver's document URLs"""
    try:
        driver = User.objects.get(
            id=user_id,
            user_type__in=['driver', 'boda_rider']
        )
        
        documents_data = {
            'driver_license_file_url': driver.driver_license_file.url if driver.driver_license_file else None,
            'national_id_file_url': driver.national_id_file.url if driver.national_id_file else None,
            'logbook_file_url': driver.logbook_file.url if driver.logbook_file else None,
            'documents_status': {
                'driver_license': bool(driver.driver_license_file),
                'national_id': bool(driver.national_id_file),
                'logbook': bool(driver.logbook_file)
            }
        }
        
        return Response(documents_data)
    except User.DoesNotExist:
        return Response({"error": "Driver not found"}, status=404)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def approve_driver_with_vehicle(request, user_id):
    """Approve driver and assign vehicle"""
    try:
        driver = User.objects.get(
            id=user_id,
            user_type__in=['driver', 'boda_rider']
        )
        
        action = request.data.get('action')  
        
        if action == 'approve':
            
            vehicle_type = request.data.get('vehicle_type')
            license_plate = request.data.get('license_plate')
            make = request.data.get('make')
            model = request.data.get('model')
            year = request.data.get('year')
            color = request.data.get('color')
            
            
            if not all([vehicle_type, license_plate]):
                return Response({
                    "error": "Vehicle type and license plate are required for approval"
                }, status=400)
            
            driver.approval_status = 'approved'
            driver.is_approved = True
            driver.approval_date = timezone.now()
            driver.approved_by = request.user
            driver.save()
            
           
            try:
                vehicle = Vehicle.objects.create(
                    driver=driver,
                    vehicle_type=vehicle_type,
                    license_plate=license_plate,
                    make=make or 'Unknown',
                    model=model or 'Unknown',
                    year=year or datetime.now().year,
                    color=color or 'Unknown',
                    is_approved=True,
                    vehicle_approval_status='approved'
                )
            except Exception as e:
                return Response({"error": f"Failed to create vehicle: {str(e)}"}, status=400)
                
            message = 'Driver approved successfully and vehicle assigned'
            
        elif action == 'reject':
            driver.approval_status = 'rejected'
            driver.is_approved = False
            driver.rejection_reason = request.data.get('reason', '')
            driver.save()
            message = 'Driver application rejected'
            
        else:
            return Response({"error": "Action must be 'approve' or 'reject'"}, status=400)
        
        create_admin_notification(
            notification_type='system_alert',
            title=f'Driver {action.capitalize()}',
            message=f'Driver {driver.get_full_name()} was {action}ed by {request.user.get_full_name()}',
            priority='medium',
            related_user=driver,
            created_by=request.user
        )
        
        return Response({
            "message": message,
            "driver": UserSerializer(driver).data
        })
        
    except User.DoesNotExist:
        return Response({"error": "Driver not found"}, status=404)


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def get_approved_drivers(request):
    """Get all approved drivers with their details"""
    try:
        approved_drivers = User.objects.filter(
            user_type__in=['driver', 'boda_rider'],
            approval_status='approved'
        ).select_related('vehicle')
        
        drivers_data = []
        for driver in approved_drivers:
            driver_data = UserSerializer(driver).data
            
           
            try:
                vehicle = driver.vehicle
                driver_data['vehicle'] = {
                    'license_plate': vehicle.license_plate,
                    'vehicle_type': vehicle.vehicle_type,
                    'make': vehicle.make,
                    'model': vehicle.model,
                    'year': vehicle.year,
                    'color': vehicle.color,
                    'is_approved': vehicle.is_approved,
                }
            except:
                driver_data['vehicle'] = None
            
            driver_data['ride_stats'] = {
                'total_rides_as_driver': Ride.objects.filter(driver=driver).count(),
                'completed_rides': Ride.objects.filter(driver=driver, status='completed').count(),
                'total_earnings': float(Ride.objects.filter(
                    driver=driver, 
                    status='completed'
                ).aggregate(total=Sum('fare'))['total'] or 0),
            }
            
            drivers_data.append(driver_data)
        
        return Response(drivers_data)
        
    except Exception as e:
        return Response({"error": f"Failed to fetch approved drivers: {str(e)}"}, status=500)  

        
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def download_driver_document(request, user_id, document_type):
    """Download driver document file"""
    try:
        driver = User.objects.get(
            id=user_id,
            user_type__in=['driver', 'boda_rider']
        )
        
        
        file_field = None
        if document_type == 'driver_license':
            file_field = driver.driver_license_file
        elif document_type == 'national_id':
            file_field = driver.national_id_file
        elif document_type == 'logbook':
            file_field = driver.logbook_file
        else:
            return Response({"error": "Invalid document type"}, status=400)
        
        if not file_field:
            return Response({"error": "Document not found"}, status=404)
        
        
        original_filename = file_field.name.split('/')[-1] 
        file_extension = '.' + original_filename.split('.')[-1] if '.' in original_filename else ''
        filename = f"{driver.first_name}_{driver.last_name}_{document_type}{file_extension}"
        
        
        cloudinary_url = file_field.url
        
        
        if 'cloudinary.com' in cloudinary_url:
            
            if '?' in cloudinary_url:
                cloudinary_url += '&fl_attachment'
            else:
                cloudinary_url += '?fl_attachment'
        
        
        return Response({
            "download_url": cloudinary_url,
            "filename": filename
        })
        
    except User.DoesNotExist:
        return Response({"error": "Driver not found"}, status=404)
    except Exception as e:
        return Response({"error": f"Download failed: {str(e)}"}, status=500)