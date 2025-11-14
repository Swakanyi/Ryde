from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from django.db import models
from .models import User, UserProfile, Ride, DriverLocation, RideMessage
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer, RideSerializer, DriverLocationSerializer, RideMessageSerializer
from django.utils import timezone
import math
import requests
import json
from django.conf import settings
from django.db.models import Q

# Authentication Views
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    if request.method == 'POST':
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            refresh = RefreshToken.for_user(user)
            
           
            if user.user_type in ['driver', 'boda_rider']:
                message = 'Driver registration submitted for admin approval'
                approval_status = 'pending'
                can_login = True
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

# Ride Views 
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
        base_fare = 100  
        per_km_rate = 50  
        fare = round(base_fare + (distance_km * per_km_rate), 2)
        
    except (TypeError, ValueError) as e:
        print(f"Fare calculation error: {e}")
        fare = 100 
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
    
    # Check if driver is approved
    if not request.user.is_approved:
        return Response({"error": "Your driver account is pending approval"}, status=403)
    
    rides = Ride.objects.filter(status='requested')
    
    
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


#driver side 
@api_view(['GET'])
def driver_dashboard(request):
    """Driver dashboard with stats and current ride info"""
    if request.user.user_type not in ['driver', 'boda_rider']:
        return Response({"error": "Only drivers can access dashboard"}, status=403)
    
    # Check if driver is approved
    if not request.user.is_approved or request.user.approval_status != 'approved':
        return Response({
            "error": "Driver account pending approval",
            "approval_status": request.user.approval_status,
            "rejection_reason": request.user.rejection_reason
        }, status=403)
    
    # MOVE THESE INSIDE THE APPROVAL CHECK
    current_ride = Ride.objects.filter(
        driver=request.user,
        status__in=['accepted', 'driver_arrived', 'in_progress']
    ).first()
    
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
    
    # FIX: Safely get or create driver location
    try:
        driver_location = DriverLocation.objects.get(driver=request.user)
        is_online = driver_location.is_online
        location_data = DriverLocationSerializer(driver_location).data
    except DriverLocation.DoesNotExist:
        # Create default driver location if it doesn't exist
        driver_location = DriverLocation.objects.create(
            driver=request.user,
            lat=0.0,
            lng=0.0,
            is_online=False
        )
        is_online = False
        location_data = None

    dashboard_data = {
        'current_ride': RideSerializer(current_ride).data if current_ride else None,
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
        }
    }
    
    return Response(dashboard_data)

@api_view(['POST'])
def toggle_online_status(request):
    """Toggle driver's online/offline status"""
    if request.user.user_type not in ['driver', 'boda_rider']:
        return Response({"error": "Only drivers can toggle online status"}, status=403)
    
    is_online = request.data.get('is_online')
    
    if is_online is None:
        return Response({"error": "is_online field is required"}, status=400)
    
    
    location, created = DriverLocation.objects.update_or_create(
        driver=request.user,
        defaults={'is_online': is_online}
    )
    
    return Response({
        'is_online': location.is_online,
        'message': f'You are now {"online" if location.is_online else "offline"}'
    })

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
        
        #system message
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
        
        # Create system message
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
    
    period = request.GET.get('period', 'week')  # week, month, year
    
    
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


# Add admin approval system
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def pending_drivers(request):
    """Get list of drivers pending approval (Admin only)"""
    pending_drivers = User.objects.filter(
        user_type__in=['driver', 'boda_rider'],
        approval_status='pending',
        submitted_for_approval=True
    )
    
    drivers_data = []
    for driver in pending_drivers:
        try:
            vehicle = driver.vehicle
            vehicle_data = {
                'vehicle_type': vehicle.vehicle_type,
                'license_plate': vehicle.license_plate,
                'make': vehicle.make,
                'model': vehicle.model,
                'year': vehicle.year,
                'color': vehicle.color,
                'vehicle_approval_status': vehicle.vehicle_approval_status,
            }
        except:
            vehicle_data = None
            
        drivers_data.append({
            'user': UserSerializer(driver).data,
            'vehicle': vehicle_data
        })
    
    return Response(drivers_data)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def approve_driver(request, user_id):
    """Approve a driver (Admin only)"""
    try:
        driver = User.objects.get(
            id=user_id,
            user_type__in=['driver', 'boda_rider']
        )
        
        action = request.data.get('action')  # 'approve' or 'reject'
        reason = request.data.get('reason', '')
        
        if action == 'approve':
            driver.approval_status = 'approved'
            driver.is_approved = True
            driver.approval_date = timezone.now()
            driver.approved_by = request.user
            
            # Also approve vehicle
            try:
                vehicle = driver.vehicle
                vehicle.is_approved = True
                vehicle.vehicle_approval_status = 'approved'
                vehicle.save()
            except:
                pass
                
            message = 'Driver approved successfully'
            
        elif action == 'reject':
            driver.approval_status = 'rejected'
            driver.is_approved = False
            driver.rejection_reason = reason
            message = 'Driver rejected'
            
        else:
            return Response({"error": "Action must be 'approve' or 'reject'"}, status=400)
        
        driver.save()
        
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