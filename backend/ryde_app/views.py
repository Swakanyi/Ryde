from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from .models import User, UserProfile, Ride, DriverLocation
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer, RideSerializer, DriverLocationSerializer
from django.utils import timezone
import math
import requests
import json
from django.conf import settings

# Authentication Views
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    if request.method == 'POST':
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'User registered successfully'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    if request.method == 'POST':
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Login successful'
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

# Map Helper Functions with Google Maps API
def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in kilometers using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
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
            'components': 'country:KE'  # Focus on Kenya
        }
        
        response = requests.get(base_url, params=params, timeout=10)
        data = response.json()
        
        print(f"Google Maps API Response: {data['status']}")  # Debug logging
        
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
                'distance': route['distance']['value'],  # meters
                'duration': route['duration']['value'],  # seconds
                'polyline': data['routes'][0]['overview_polyline']['points']
            }
        else:
            print(f"Google Directions API error: {data['status']}")
            return None
            
    except Exception as e:
        print(f"Google Directions error: {e}")
        return None

# Ride Views with Google Maps Integration
@api_view(['POST'])
def request_ride(request):
    """Customer requests a ride with Google Maps integration"""
    if request.user.user_type != 'customer':
        return Response({"error": "Only customers can request rides"}, status=403)
    
    pickup_address = request.data.get('pickup_address')
    dropoff_address = request.data.get('dropoff_address')
    
    if not pickup_address or not dropoff_address:
        return Response({"error": "Pickup and dropoff addresses are required"}, status=400)
    
    # Geocode addresses using Google Maps API
    pickup_coords = None
    dropoff_coords = None
    
    # Geocode pickup address
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
    
    # Geocode dropoff address
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
    
    # Use coordinates from geocoding
    pickup_lat = pickup_coords['lat']
    pickup_lng = pickup_coords['lng']
    dropoff_lat = dropoff_coords['lat']
    dropoff_lng = dropoff_coords['lng']
    
    # Get route information using Google Directions API
    route_info = get_google_route(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
    
    try:
        if route_info:
            # Use actual route distance
            distance_km = route_info['distance'] / 1000  # Convert to kilometers
            duration_min = route_info['duration'] / 60   # Convert to minutes
        else:
            # Fallback to straight-line distance
            distance_km = calculate_distance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
            duration_min = distance_km * 2  # Rough estimate: 2 minutes per km
        
        # Calculate fare in Kenyan Shillings (KSH)
        base_fare = 100  # Base fare in KSH
        per_km_rate = 50  # Rate per kilometer in KSH
        fare = round(base_fare + (distance_km * per_km_rate), 2)
        
    except (TypeError, ValueError) as e:
        print(f"Fare calculation error: {e}")
        fare = 100  # Default fare in KSH
        distance_km = 0
        duration_min = 0
    
    # Create ride with all data
    ride_data = {
        'pickup_address': pickup_address,
        'dropoff_address': dropoff_address,
        'pickup_lat': pickup_lat,
        'pickup_lng': pickup_lng,
        'dropoff_lat': dropoff_lat,
        'dropoff_lng': dropoff_lng,
    }
    
    serializer = RideSerializer(data=ride_data)
    if serializer.is_valid():
        ride = serializer.save(
            customer=request.user,
            status='requested',
            fare=fare
        )
        
        response_data = RideSerializer(ride).data
        # Add route information to response
        response_data['distance_km'] = round(distance_km, 2)
        response_data['duration_min'] = round(duration_min, 2)
        if route_info:
            response_data['route_polyline'] = route_info['polyline']
        
        return Response(response_data, status=201)
    
    return Response(serializer.errors, status=400)

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

@api_view(['GET'])
def get_nearby_drivers(request):
    """Get drivers near a location"""
    lat = request.GET.get('lat', 0)
    lng = request.GET.get('lng', 0)
    radius_km = float(request.GET.get('radius', 5))  # Default 5km radius
    
    try:
        lat = float(lat)
        lng = float(lng)
    except (TypeError, ValueError):
        return Response({"error": "Invalid coordinates"}, status=400)
    
    # Get online drivers
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
    """Drivers see available rides"""
    if request.user.user_type not in ['driver', 'boda_rider']:
        return Response({"error": "Only drivers can view available rides"}, status=403)
    
    rides = Ride.objects.filter(status='requested')
    
    # If driver provides location, calculate distance to rides
    driver_lat = request.GET.get('lat')
    driver_lng = request.GET.get('lng')
    
    rides_data = []
    for ride in rides:
        ride_data = RideSerializer(ride).data
        
        if driver_lat and driver_lng:
            try:
                distance = calculate_distance(
                    float(driver_lat), float(driver_lng),
                    ride.pickup_lat, ride.pickup_lng
                )
                ride_data['distance_to_pickup_km'] = round(distance, 2)
            except (TypeError, ValueError):
                pass
        
        rides_data.append(ride_data)
    
    return Response(rides_data)

@api_view(['POST'])
def accept_ride(request, ride_id):
    """Driver accepts a ride"""
    if request.user.user_type not in ['driver', 'boda_rider']:
        return Response({"error": "Only drivers can accept rides"}, status=403)
    
    try:
        ride = Ride.objects.get(id=ride_id, status='requested')
        ride.driver = request.user
        ride.status = 'accepted'
        ride.save()
        
        # Update driver location to ride pickup location
        DriverLocation.objects.update_or_create(
            driver=request.user,
            defaults={
                'lat': ride.pickup_lat,
                'lng': ride.pickup_lng,
                'is_online': True
            }
        )
        
        return Response(RideSerializer(ride).data)
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
        
        # Validate the user can update this ride
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
        # Check if user is authorized to view this ride
        if request.user != ride.customer and request.user != ride.driver:
            return Response({"error": "Not authorized to view this ride"}, status=403)
        
        serializer = RideSerializer(ride)
        return Response(serializer.data)
    except Ride.DoesNotExist:
        return Response({"error": "Ride not found"}, status=404)

# Test endpoint to verify Google Maps API
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
    """Get address suggestions using Google Places Autocomplete"""
    query = request.data.get('query', '')
    
    if not query or len(query) < 3:
        return Response({"suggestions": []})
    
    try:
        base_url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
        params = {
            'input': query,
            'key': settings.GOOGLE_API_KEY,
            'components': 'country:ke',
            'types': 'geocode',
        }
        
        response = requests.get(base_url, params=params, timeout=10)
        data = response.json()
        
        if data['status'] == 'OK':
            suggestions = []
            for prediction in data['predictions']:
                suggestions.append({
                    'description': prediction['description'],
                    'place_id': prediction['place_id']
                })
            return Response({"suggestions": suggestions})
        else:
            return Response({"suggestions": []})
            
    except Exception as e:
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