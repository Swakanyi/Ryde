import json
import jwt
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class RideConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.ride_id = self.scope['url_route']['kwargs']['ride_id']
        self.ride_group_name = f'ride_{self.ride_id}'

        # Authenticate user
        # user = await self.get_user()
        # if not user:
        #     await self.close()
        #     return

        # Join ride group
        await self.channel_layer.group_add(
            self.ride_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"WebSocket connected for ride {self.ride_id}")

    async def disconnect(self, close_code):
        # Leave ride group
        await self.channel_layer.group_discard(
            self.ride_group_name,
            self.channel_name
        )
        print(f"WebSocket disconnected for ride {self.ride_id}")

    # Receive message from WebSocket
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json['type']
            data = text_data_json.get('data', {})
            
            user = await self.get_user()
            if not user:
                return

            if message_type == 'ride_status_update':
                # Broadcast ride status update
                await self.channel_layer.group_send(
                    self.ride_group_name,
                    {
                        'type': 'ride_status_update',
                        'data': {
                            'ride_id': self.ride_id,
                            'status': data['status'],
                            'timestamp': data.get('timestamp'),
                            'user_id': user.id
                        }
                    }
                )
            
            elif message_type == 'location_update':
                # Broadcast driver location
                await self.channel_layer.group_send(
                    self.ride_group_name,
                    {
                        'type': 'location_update',
                        'data': {
                            'ride_id': self.ride_id,
                            'lat': data['lat'],
                            'lng': data['lng'],
                            'timestamp': data.get('timestamp')
                        }
                    }
                )
            
            elif message_type == 'chat_message':
                # Handle chat messages
                await self.channel_layer.group_send(
                    self.ride_group_name,
                    {
                        'type': 'chat_message',
                        'data': {
                            'ride_id': self.ride_id,
                            'message': data['message'],
                            'sender_id': user.id,
                            'sender_name': f"{user.first_name} {user.last_name}",
                            'timestamp': data.get('timestamp')
                        }
                    }
                )

        except Exception as e:
            print(f"WebSocket receive error: {e}")

    # Handler for ride status updates
    async def ride_status_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'ride_status_update',
            'data': event['data']
        }))

    # Handler for location updates
    async def location_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'location_update',
            'data': event['data']
        }))

    # Handler for chat messages
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_user(self):
        """Get user from JWT token or session"""
        try:
            # Import here to avoid circular imports
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Get token from query string
            query_string = self.scope.get('query_string', b'').decode()
            token = None
            
            # Extract token from query parameters
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token = param.split('=')[1]
                    break
            
            if token:
                # Decode JWT token
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
                return User.objects.get(id=user_id)
            
            # Fallback to session authentication
            return self.scope['user'] if self.scope['user'].is_authenticated else None
            
        except Exception as e:
            print(f"Authentication error: {e}")
            return None


class DriverConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.driver_id = self.scope['url_route']['kwargs']['driver_id']
        self.driver_group_name = f'driver_{self.driver_id}'

        await self.channel_layer.group_add(
            self.driver_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.driver_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Handle driver-specific messages
        pass

    async def new_ride_request(self, event):
        """Notify driver of new ride request"""
        await self.send(text_data=json.dumps({
            'type': 'new_ride_request',
            'data': event['data']
        }))


class CustomerConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.customer_id = self.scope['url_route']['kwargs']['customer_id']
        self.customer_group_name = f'customer_{self.customer_id}'

        await self.channel_layer.group_add(
            self.customer_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.customer_group_name,
            self.customer_name
        )

    async def receive(self, text_data):
        # Handle customer-specific messages
        pass

    async def ride_update(self, event):
        """Notify customer of ride updates"""
        await self.send(text_data=json.dumps({
            'type': 'ride_update',
            'data': event['data']
        }))