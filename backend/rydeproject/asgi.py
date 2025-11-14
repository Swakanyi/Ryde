"""
ASGI config for rydeproject project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import django
import ryde_app.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rydeproject.settings')
django.setup()

try:
    from ryde_app import routing
    websocket_urlpatterns = routing.websocket_urlpatterns
except ImportError:
    websocket_urlpatterns = []

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            ryde_app.routing.websocket_urlpatterns
        )
    ),
})
