from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/driver/(?P<id>\w+)/$', consumers.DriverConsumer.as_asgi()),
    re_path(r'ws/customer/(?P<id>\w+)/$', consumers.RideConsumer.as_asgi()),
    re_path(r'ws/boda_rider/(?P<id>\w+)/$', consumers.DriverConsumer.as_asgi()), 
    
]
    