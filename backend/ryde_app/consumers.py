import json
import jwt
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

#Driver Consumer
class DriverConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        try:
            
            self.driver_id = self.scope['url_route']['kwargs'].get('id')
            
            if not self.driver_id:
                print("❌ [Driver WS] No driver ID provided")
                await self.close(code=4001)
                return
                
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
                'data': {
                    'message': f'Driver {self.driver_id} connected', 
                    'driver_id': self.driver_id,
                    'user_type': self.user.user_type
                }
            }))

        except Exception as e:
            print(f"❌ [Driver WS] Connection error: {e}")
            
            await self.close(code=4000)

    async def disconnect(self, close_code):
        
        if hasattr(self, 'driver_group_name'):
            await self.channel_layer.group_discard(self.driver_group_name, self.channel_name)
            print(f"🔴 [Driver WS] Disconnected driver {self.driver_id}, code: {close_code}")
        else:
            print(f"🔴 [Driver WS] Disconnected (never fully connected), code: {close_code}")

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

            
            elif message_type == 'driver_message':
                print(f"🔍 [Driver WS] Received driver_message: {data}")
                
                ride_id = data.get('ride_id')
                if ride_id:
                    await self.send_chat_to_customer(ride_id, data)

            elif message_type == 'ride_accepted':
                ride_id = data.get('ride_id')
                if ride_id:
                    await self.notify_customer_ride_accepted(ride_id, data)

            elif message_type == 'location_update':
                ride_id = data.get('ride_id')
                if ride_id:
                    await self.broadcast_driver_location(ride_id, data)

            elif message_type == 'chat_message':
                ride_id = data.get('ride_id')
                print(f"🔍 [Driver WS] Received chat_message for ride {ride_id}: {data}")
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

    
    async def customer_message(self, event):
        print(f"💬 [Driver WS CUSTOMER_MESSAGE] Received message from customer: {event['data']}")
        await self.send(text_data=json.dumps({
            'type': 'customer_message', 
            'data': event['data']
        }))
        print(f"✅ [Driver WS CUSTOMER_MESSAGE] Sent to driver frontend")


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

    # async def chat_message(self, event):
    #     print(f" [Driver WS] Received chat message: {event['data']}")
    #     await self.send(text_data=json.dumps({
    #         'type': 'chat_message', 
    #         'data': event['data']
    #     }))

    # async def customer_message(self, event):
    #     print(f" [Driver WS] Received customer message: {event['data']}")
    #     await self.send(text_data=json.dumps({
    #         'type': 'customer_message', 
    #         'data': event['data']
    #     }))

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
            'sender_type': 'driver',  # Add this
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
            print(f"🟡 [Customer WS DEBUG] === STARTING CONNECTION ===")
            
          
            self.customer_id = self.scope['url_route']['kwargs']['id']
            print(f"🟡 [Customer WS DEBUG] Customer ID from URL: {self.customer_id}")
            
           
            query_string = self.scope.get('query_string', b'').decode()
            print(f"🟡 [Customer WS DEBUG] Raw query string: {query_string}")
            
           
            print(f"🟡 [Customer WS DEBUG] Calling get_user()...")
            import asyncio
            try:
               
                self.user = await asyncio.wait_for(self.get_user(), timeout=3.0)
            except asyncio.TimeoutError:
                print("❌ [Customer WS DEBUG] get_user() timed out!")
                await self.close(code=4000)
                return
                
            print(f"🟡 [Customer WS DEBUG] get_user() returned: {self.user}")
            
            if not self.user:
                print("❌ [Customer WS DEBUG] get_user() returned None - authentication failed")
                await self.close(code=4001)
                return
            
            print(f"🟡 [Customer WS DEBUG] User details: id={self.user.id}, type={getattr(self.user, 'user_type', 'NO_USER_TYPE')}")
            
            
            if not hasattr(self.user, 'user_type'):
                print(f"❌ [Customer WS DEBUG] User has no user_type attribute")
                await self.close(code=4001)
                return
                
            if self.user.user_type != 'customer':
                print(f"❌ [Customer WS DEBUG] Wrong user type: {self.user.user_type} (expected: customer)")
                await self.close(code=4001)
                return

            
            if str(self.user.id) != str(self.customer_id):
                print(f"❌ [Customer WS DEBUG] ID mismatch: user.id={self.user.id} vs URL id={self.customer_id}")
                await self.close(code=4003)
                return

            
            self.customer_group_name = f'customer_{self.customer_id}'
            print(f"🟡 [Customer WS DEBUG] Adding to group: {self.customer_group_name}")
            await self.channel_layer.group_add(self.customer_group_name, self.channel_name)
            
            await self.accept()
            print(f"✅ [Customer WS DEBUG] CONNECTION SUCCESSFUL for customer {self.customer_id}")

            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'data': {
                    'message': f'Customer {self.customer_id} connected',
                    'customer_id': self.customer_id,
                    'user_type': self.user.user_type
                }
            }))

        except asyncio.TimeoutError:
            print("❌ [Customer WS DEBUG] Connection timed out")
            await self.close(code=4000)
        except Exception as e:
            print(f"❌ [Customer WS DEBUG] Connection error: {str(e)}")
            import traceback
            print(f"❌ [Customer WS DEBUG] Traceback: {traceback.format_exc()}")
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

            
            elif message_type == 'customer_message':
                print(f"🔍 [Customer WS] Received customer_message: {data}")
               
                ride_id = data.get('ride_id')
                if ride_id:
                    await self.send_chat_to_driver(ride_id, data)

            elif message_type == 'chat_message':
                ride_id = data.get('ride_id')
                print(f"🔍 [Customer WS] Received chat_message for ride {ride_id}: {data}")
                if ride_id:
                    await self.send_chat_to_driver(ride_id, data)

            elif message_type == 'ride_status_update':
                ride_id = data.get('ride_id')
                if ride_id:
                    await self.broadcast_ride_status_update(ride_id, data)

        except Exception as e:
            print(f"❌ [Customer WS] Receive error: {e}")

    
    async def driver_message(self, event):
        print(f"💬 [Customer WS DRIVER_MESSAGE] Received message from driver: {event['data']}")
        await self.send(text_data=json.dumps({
            'type': 'driver_message', 
            'data': event['data']
        }))
        print(f"✅ [Customer WS DRIVER_MESSAGE] Sent to customer frontend")

    
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

    async def ride_declined(self, event):
        print(f"❌ [Customer WS] Ride declined: {event['data']}")
        await self.send(text_data=json.dumps({
            'type': 'ride_declined',
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
        
        print(f"🔍 [get_user DEBUG] Starting authentication...")
        
        query_string = self.scope.get('query_string', b'').decode()
        print(f"🔍 [get_user DEBUG] Query string: {query_string}")
        
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                token = token.replace(' ', '+')
                break
        
        print(f"🔍 [get_user DEBUG] Token extracted: {bool(token)}")
        if token:
            print(f"🔍 [get_user DEBUG] Token length: {len(token)}")
        
        if token:
            try:
                import jwt
                from django.conf import settings
                
                print(f"🔍 [get_user DEBUG] Decoding JWT token...")
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
                print(f"🔍 [get_user DEBUG] Token payload - user_id: {user_id}")
                
                if user_id:
                    print(f"🔍 [get_user DEBUG] Looking up user in database...")
                    user = User.objects.get(id=user_id)
                    print(f"🔍 [get_user DEBUG] User found: {user.id}, user_type: {getattr(user, 'user_type', 'NO_TYPE')}")
                    return user
            except jwt.ExpiredSignatureError:
                print("❌ [get_user] Token expired")
            except jwt.InvalidTokenError as e:
                print(f"❌ [get_user] Invalid token: {e}")
            except User.DoesNotExist:
                print(f"❌ [get_user] User {user_id} not found")
            except Exception as e:
                print(f"❌ [get_user] Unexpected error: {e}")
                import traceback
                print(f"❌ [get_user] Traceback: {traceback.format_exc()}")
        
       
        user = self.scope.get('user')
        print(f"🔍 [get_user DEBUG] Scope user: {user}, authenticated: {getattr(user, 'is_authenticated', False)}")
        
        if user and user.is_authenticated:
            print(f"🔍 [get_user] Using scope user: {user.id}")
            return user
        
        print("❌ [get_user] No valid authentication found")
        return None

    @database_sync_to_async
    def get_ride(self, ride_id):
        from .models import Ride
        try:
            return Ride.objects.select_related('customer', 'driver').get(id=ride_id)
        except Ride.DoesNotExist:
            print(f"❌ [Customer WS] Ride {ride_id} not found")
            return None




# @database_sync_to_async
# def get_user(self):
#     from django.contrib.auth import get_user_model
#     User = get_user_model()
    
#     print(f"🔍 [get_user DEBUG] Starting authentication...")
    
#     query_string = self.scope.get('query_string', b'').decode()
#     print(f"🔍 [get_user DEBUG] Query string: {query_string}")
    
#     token = None
#     for param in query_string.split('&'):
#         if param.startswith('token='):
#             token = param.split('=')[1]
#             token = token.replace(' ', '+')
#             break
    
#     print(f"🔍 [get_user DEBUG] Token extracted: {bool(token)}")
#     if token:
#         print(f"🔍 [get_user DEBUG] Token length: {len(token)}")
    
#     if token:
#         try:
#             import jwt
#             from django.conf import settings
            
#             print(f"🔍 [get_user DEBUG] Decoding JWT token...")
#             payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
#             user_id = payload.get('user_id')
#             print(f"🔍 [get_user DEBUG] Token payload - user_id: {user_id}")
            
#             if user_id:
#                 print(f"🔍 [get_user DEBUG] Looking up user in database...")
#                 user = User.objects.get(id=user_id)
#                 print(f"🔍 [get_user DEBUG] User found: {user.id}, user_type: {getattr(user, 'user_type', 'NO_TYPE')}")
#                 return user
#         except jwt.ExpiredSignatureError:
#             print("❌ [get_user] Token expired")
#         except jwt.InvalidTokenError as e:
#             print(f"❌ [get_user] Invalid token: {e}")
#         except User.DoesNotExist:
#             print(f"❌ [get_user] User {user_id} not found")
#         except Exception as e:
#             print(f"❌ [get_user] Unexpected error: {e}")
#             import traceback
#             print(f"❌ [get_user] Traceback: {traceback.format_exc()}")
    
#     # Try scope user
#     user = self.scope.get('user')
#     print(f"🔍 [get_user DEBUG] Scope user: {user}, authenticated: {getattr(user, 'is_authenticated', False)}")
    
#     if user and user.is_authenticated:
#         print(f"🔍 [get_user] Using scope user: {user.id}")
#         return user
    
#     print("❌ [get_user] No valid authentication found")
#     return None

#     @database_sync_to_async
#     def get_ride(self, ride_id):
#         from .models import Ride
#         try:
#             return Ride.objects.select_related('customer', 'driver').get(id=ride_id)
#         except Ride.DoesNotExist:
#             print(f"❌ [Customer WS] Ride {ride_id} not found")
#             return None
        
