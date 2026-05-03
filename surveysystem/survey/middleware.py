from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from .models import RegisteredDevice


class DeviceValidationMiddleware(MiddlewareMixin):
    """
    Middleware to validate device ID for agent requests.
    
    This middleware checks if authenticated agents are using a registered device.
    Admin and superadmin requests bypass this check.
    """
    
    def process_request(self, request):
        # Only check API endpoints
        if not request.path.startswith('/api/'):
            return None
        
        # Only check authenticated requests
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
        
        # Bypass device check for admin and superadmin
        if request.user.role in ['admin', 'superadmin']:
            return None
        
        # Only check device validation for agents
        if request.user.role != 'agent':
            return None
        
        # Get device ID from header
        device_id = self._get_device_id(request)
        
        if not device_id:
            return JsonResponse({
                'error': 'Device ID required',
                'message': 'X-Device-ID header is required for agent requests'
            }, status=403)
        
        # Validate device
        if not self._is_device_valid(device_id, request.user):
            return JsonResponse({
                'error': 'Device not registered or not allowed',
                'message': 'The device ID is not registered or not allowed for this user'
            }, status=403)
        
        # Update last_seen for the device
        try:
            device = RegisteredDevice.objects.get(
                device_unique_id=device_id,
                user=request.user,
                is_allowed=True
            )
            device.update_last_seen()
        except RegisteredDevice.DoesNotExist:
            # This shouldn't happen if validation passed, but handle gracefully
            pass
        
        return None
    
    def _get_device_id(self, request):
        """Extract device ID from various header formats."""
        # Try X-Device-ID header first
        device_id = request.headers.get('X-Device-ID')
        if device_id:
            return device_id
        
        # Try HTTP_X_DEVICE_ID (Django's header format)
        device_id = request.META.get('HTTP_X_DEVICE_ID')
        if device_id:
            return device_id
        
        return None
    
    def _is_device_valid(self, device_id, user):
        """Check if device is registered and allowed for the user."""
        try:
            device = RegisteredDevice.objects.get(
                device_unique_id=device_id,
                user=user,
                is_allowed=True
            )
            return True
        except RegisteredDevice.DoesNotExist:
            return False
