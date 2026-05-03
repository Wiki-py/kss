from rest_framework import permissions


class IsAgent(permissions.BasePermission):
    """
    Allows access only to users with role 'agent'.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'agent'
        )


class IsAdminOrSuperAdmin(permissions.BasePermission):
    """
    Allows access only to users with role 'admin' or 'superadmin'.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'superadmin']
        )


class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to users with role 'superadmin'.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'superadmin'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Allows access if user is the owner of the object or is admin/superadmin.
    """
    def has_object_permission(self, request, view, obj):
        # Admin and superadmin can access all objects
        if request.user.role in ['admin', 'superadmin']:
            return True
        
        # Agents can only access their own objects
        if hasattr(obj, 'agent'):
            return obj.agent == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class IsAgentOrAdminReadOnly(permissions.BasePermission):
    """
    Agents can create and update their own data, admins can read all data.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin and superadmin have read-only access
        if request.user.role in ['admin', 'superadmin']:
            return request.method in permissions.SAFE_METHODS
        
        # Agents can perform all actions
        return request.user.role == 'agent'
    
    def has_object_permission(self, request, view, obj):
        # Admin and superadmin can read all objects
        if request.user.role in ['admin', 'superadmin']:
            return request.method in permissions.SAFE_METHODS
        
        # Agents can only access their own objects
        if hasattr(obj, 'agent'):
            return obj.agent == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False
