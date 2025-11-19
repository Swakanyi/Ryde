import json
import jwt
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

#Driver Consumer
class DriverConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        try:
            self.driver_id = self.scope['url_route']['kwargs']['id']
            self.driver_group_name = f'driver_{self.driver_id}'
            print(f"🟡 [Driver WS] Connecting driver ID: {self.driver_id}")

            self.user = await self.get_user()
            if not self.user:
                print("❌ [Driver WS] Authentication failed")
                await self.close(code=4001)
                return

            if self.user.user_type not in ['driver', 'boda_rider']:
                print(f"❌ [Driver WS] Unauthorized user type: {self.user.user_type}")
                await self.close(code=4003)
                return

            if str(self.user.id) != str(self.driver_id):
                print(f"❌ [Driver WS] Driver ID mismatch")
                await self.close(code=4003)
                return

            await self.channel_layer.group_add(self.driver_group_name, self.channel_name)
            await self.accept()
            print(f"✅ [Driver WS] Connected driver {self.driver_id}")

            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'data': {'message': f'Driver {self.driver_id} connected', 'driver_id': self.driver_id}
            }))

        except Exception as e:
            print(f"❌ [Driver WS] Connection error: {e}")
            await self.close(code=4000)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.driver_group_name, self.channel_name)
        print(f"🔴 [Driver WS] Disconnected driver {self.driver_id}, code: {close_code}")

    async def receive(self, text_data):
        try:
            data_json = json.loads(text_data)
            message_type = data_json.get('type')
            data = data_json.get('data', {})

            print(f"📨 [Driver WS] Message type: {message_type}, data: {data}")

            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong', 
                    'data': {'timestamp': 'pong'}
                }))
                return

            if message_type == 'ride_accepted':
                ride_id = data.get('ride_id')
                if ride_id:
                    await self.notify_customer_ride_accepted(ride_id, data)

            elif message_type == 'location_update':
                ride_id = data.get('ride_id')
                if ride_id:
                    await self.broadcast_driver_location(ride_id, data)

            elif message_type == 'chat_message':
                ride_id = data.get('ride_id')
                if ride_id:
                    await self.send_chat_to_customer(ride_id, data)
            elif message_type == 'chat_message':
                ride_id = data.get('ride_id')
                print(f"🔍 [Driver WS DEBUG] Received chat_message for ride {ride_id}: {data}")
                if ride_id:
                    await self.send_chat_to_customer(ride_id, data)        

            elif message_type == 'ride_status_update':
                ride_id = data.get('ride_id')
                if ride_id:
                    await self.broadcast_ride_status_update(ride_id, data)

            else:
                print(f"⚠️ [Driver WS] Unknown message type: {message_type}")

        except Exception as e:
            print(f"❌ [Driver WS] Receive error: {e}")

    #Messages
    async def new_ride_request(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_ride_request', 
            'data': event['data']
        }))

    async def ride_accepted_self(self, event):
        print(f"🔄 [Driver WS] Updating dashboard with accepted ride {event['data']['ride_id']}")
        await self.send(text_data=json.dumps({
            'type': 'ride_accepted_self',
            'data': event['data']
        }))
    
    async def ride_taken(self, event):
        await self.send(text_data=json.dumps({
            'type': 'ride_taken', 
            'data': event['data']
        }))

    async def customer_message(self, event):
        print(f"💬 [Driver WS] Received customer message: {event['data']}")
        await self.send(text_data=json.dumps({
            'type': 'customer_message', 
            'data': event['data']
    }))    

    async def location_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'location_update', 
            'data': event['data']
        }))

    async def chat_message(self, event):
        print(f"💬 [Driver WS] Received chat message: {event['data']}")
        await self.send(text_data=json.dumps({
            'type': 'chat_message', 
            'data': event['data']
        }))

    async def customer_message(self, event):
        print(f"💬 [Driver WS] Received customer message: {event['data']}")
        await self.send(text_data=json.dumps({
            'type': 'customer_message', 
            'data': event['data']
        }))

    async def ride_status_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'ride_status_update',
            'data': event['data']
        }))

    async def driver_arrived(self, event):
        await self.send(text_data=json.dumps({
            'type': 'driver_arrived',
            'data': event['data']
        }))

   
    async def notify_customer_ride_accepted(self, ride_id, data):
        ride = await self.get_ride(ride_id)
        if not ride or not ride.customer:
            print(f"❌ [Driver WS] Cannot notify customer - ride {ride_id} not found")
            return
            
        customer_group = f'customer_{ride.customer.id}'
        await self.channel_layer.group_send(customer_group, {
            'type': 'ride_accepted',
            'data': {
                'ride_id': ride.id,
                'driver_id': self.user.id,
                'driver_name': f"{self.user.first_name} {self.user.last_name}",
                'driver_phone': self.user.phone_number,
                'vehicle_type': data.get('vehicle_type', ''),
                'license_plate': data.get('license_plate', ''),
                'timestamp': data.get('timestamp')
            }
        })
        print(f"📢 [Driver WS] Notified customer {ride.customer.id} about accepted ride")

    async def broadcast_driver_location(self, ride_id, data):
        ride = await self.get_ride(ride_id)
        if not ride or not ride.customer:
            return
            
        customer_group = f'customer_{ride.customer.id}'
        await self.channel_layer.group_send(customer_group, {
            'type': 'location_update',
            'data': data
        })

    async def send_chat_to_customer(self, ride_id, data):
        ride = await self.get_ride(ride_id)
        if not ride or not ride.customer:
            print(f"❌ [Driver WS] Cannot send chat - ride {ride_id} not found")
            return
            
        customer_group = f'customer_{ride.customer.id}'
        message_data = {
            'ride_id': ride.id,
            'message': data.get('message'),
            'sender_id': self.user.id,
            'sender_name': f"{self.user.first_name} {self.user.last_name}",
            'sender_type': 'driver',
            'timestamp': data.get('timestamp')
        }
        
       
        await self.channel_layer.group_send(customer_group, {
            'type': 'driver_message',
            'data': message_data
        })
        print(f"💬 [Driver WS] Sent chat to customer {ride.customer.id}: {data.get('message')}")

    async def broadcast_ride_status_update(self, ride_id, data):
        ride = await self.get_ride(ride_id)
        if not ride or not ride.customer:
            return
            
        customer_group = f'customer_{ride.customer.id}'
        await self.channel_layer.group_send(customer_group, {
            'type': 'ride_status_update',
            'data': data
        })

    
    @database_sync_to_async
    def get_user(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1].replace(' ', '+')
                break
        if token:
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
                if user_id:
                    return User.objects.get(id=user_id)
            except Exception as e:
                print(f"❌ [Driver Auth] JWT error: {e}")
        user = self.scope.get('user')
        if user and user.is_authenticated:
            return user
        return None

    @database_sync_to_async
    def get_ride(self, ride_id):
        from .models import Ride
        try:
            return Ride.objects.select_related('customer', 'driver').get(id=ride_id)
        except Ride.DoesNotExist:
            print(f"❌ [Driver WS] Ride {ride_id} not found")
            return None


#Customer Consumer
class RideConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        try:
            self.customer_id = self.scope['url_route']['kwargs']['id']
            self.customer_group_name = f'customer_{self.customer_id}'
            print(f"🟡 [Customer WS] Connecting customer ID: {self.customer_id}")

            self.user = await self.get_user()
            if not self.user or self.user.user_type != 'customer':
                print(f"❌ [Customer WS] Authentication failed or wrong user type: {getattr(self.user, 'user_type', 'None')}")
                await self.close(code=4001)
                return

            if str(self.user.id) != str(self.customer_id):
                print(f"❌ [Customer WS] Customer ID mismatch")
                await self.close(code=4003)
                return

            await self.channel_layer.group_add(self.customer_group_name, self.channel_name)
            await self.accept()
            print(f"✅ [Customer WS] Connected customer {self.customer_id}")

            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'data': {'message': f'Customer {self.customer_id} connected', 'customer_id': self.customer_id}
            }))

        except Exception as e:
            print(f"❌ [Customer WS] Connection error: {e}")
            await self.close(code=4000)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.customer_group_name, self.channel_name)
        print(f"🔴 [Customer WS] Disconnected customer {self.customer_id}, code: {close_code}")

    async def receive(self, text_data):
        try:
            data_json = json.loads(text_data)
            message_type = data_json.get('type')
            data = data_json.get('data', {})

            print(f"📨 [Customer WS] Message type: {message_type}, data: {data}")

            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong', 
                    'data': {'timestamp': 'pong'}
                }))
                return

            if message_type == 'chat_message':
                ride_id = data.get('ride_id')
                if ride_id:
                    await self.send_chat_to_driver(ride_id, data)

            elif message_type == 'ride_status_update':
                ride_id = data.get('ride_id')
                if ride_id:
                    await self.broadcast_ride_status_update(ride_id, data)

        except Exception as e:
            print(f"❌ [Customer WS] Receive error: {e}")

    
    async def ride_accepted(self, event):
        print(f"✅ [Customer WS] Ride accepted: {event['data']}")
        await self.send(text_data=json.dumps({
            'type': 'ride_accepted', 
            'data': event['data']
        }))

    async def location_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'location_update', 
            'data': event['data']
        }))

    async def chat_message(self, event):
        print(f"💬 [Customer WS] Received chat message: {event['data']}")
        await self.send(text_data=json.dumps({
            'type': 'chat_message', 
            'data': event['data']
        }))

    async def driver_message(self, event):
        print(f"💬 [Customer WS] Received driver message: {event['data']}")
        await self.send(text_data=json.dumps({
            'type': 'driver_message', 
            'data': event['data']
        }))

    async def ride_status_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'ride_status_update',
            'data': event['data']
        }))

    async def driver_arrived(self, event):
        await self.send(text_data=json.dumps({
            'type': 'driver_arrived',
            'data': event['data']
        }))

    
    async def send_chat_to_driver(self, ride_id, data):
        ride = await self.get_ride(ride_id)
        if not ride or not ride.driver:
            print(f"❌ [Customer WS] Cannot send chat - ride {ride_id} not found or no driver")
            return
            
        driver_group = f'driver_{ride.driver.id}'
        message_data = {
            'ride_id': ride.id,
            'message': data.get('message'),
            'sender_id': self.user.id,
            'sender_name': f"{self.user.first_name} {self.user.last_name}",
            'sender_type': 'customer',
            'timestamp': data.get('timestamp')
        }
        
       
        await self.channel_layer.group_send(driver_group, {
            'type': 'customer_message',
            'data': message_data
        })
        print(f"💬 [Customer WS] Sent chat to driver {ride.driver.id}: {data.get('message')}")

    async def broadcast_ride_status_update(self, ride_id, data):
        ride = await self.get_ride(ride_id)
        if not ride or not ride.driver:
            return
            
        driver_group = f'driver_{ride.driver.id}'
        await self.channel_layer.group_send(driver_group, {
            'type': 'ride_status_update',
            'data': data
        })

    
    @database_sync_to_async
    def get_user(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1].replace(' ', '+')
                break
        if token:
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
                if user_id:
                    return User.objects.get(id=user_id)
            except Exception as e:
                print(f"❌ [Customer Auth] JWT error: {e}")
        user = self.scope.get('user')
        if user and user.is_authenticated:
            return user
        return None

    @database_sync_to_async
    def get_ride(self, ride_id):
        from .models import Ride
        try:
            return Ride.objects.select_related('customer', 'driver').get(id=ride_id)
        except Ride.DoesNotExist:
            print(f"❌ [Customer WS] Ride {ride_id} not found")
            return None