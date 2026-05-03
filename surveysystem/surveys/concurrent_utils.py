"""
Utilities for concurrent access control and real-time collaboration
"""
from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from surveys.models_concurrent import FormLock, EditSession, CollaborationEvent
import json


def concurrent_access_required(lock_type, object_id_param='id', lock_duration=30):
    """
    Decorator to ensure concurrent access control for forms
    """
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('login')
            
            # Get object ID from URL parameters
            object_id = kwargs.get(object_id_param)
            if not object_id:
                messages.error(request, 'Invalid object ID')
                return redirect('surveys:survey_list')
            
            # Try to acquire lock
            lock = FormLock.acquire_lock(
                lock_type=lock_type,
                object_id=object_id,
                user=request.user,
                session_key=request.session.session_key,
                duration=lock_duration
            )
            
            if not lock:
                # Get existing lock info
                existing_lock = FormLock.get_active_lock(lock_type, object_id)
                if existing_lock:
                    messages.error(
                        request,
                        f'This form is currently being edited by {existing_lock.user.get_full_name() or existing_lock.user.username}. '
                        f'Please try again in a few minutes.'
                    )
                else:
                    messages.error(request, 'Unable to acquire lock for this form. Please try again.')
                return redirect('surveys:survey_list')
            
            # Start editing session
            session_type = lock_type.replace('_create', '_survey')
            EditSession.start_session(
                session_type=session_type,
                object_id=object_id,
                user=request.user,
                session_key=request.session.session_key
            )
            
            # Log collaboration event
            CollaborationEvent.objects.create(
                event_type='form_locked',
                session_type=session_type,
                object_id=object_id,
                user=request.user,
                data={'lock_duration': lock_duration}
            )
            
            # Add lock info to request for later use
            request.current_lock = lock
            
            try:
                return view_func(request, *args, **kwargs)
            finally:
                # Clean up will be handled by middleware or explicit release
                pass
        
        return wrapper
    return decorator


def release_form_lock(lock_type, object_id, user):
    """Release a form lock"""
    FormLock.release_lock(lock_type, object_id, user)
    
    # Log collaboration event
    CollaborationEvent.objects.create(
        event_type='form_unlocked',
        session_type=lock_type.replace('_create', '_survey'),
        object_id=object_id,
        user=user
    )


@login_required
@require_POST
def refresh_lock(request):
    """Refresh an existing form lock"""
    lock_type = request.POST.get('lock_type')
    object_id = request.POST.get('object_id')
    
    if not lock_type or not object_id:
        return JsonResponse({'success': False, 'error': 'Missing parameters'})
    
    try:
        object_id = int(object_id)
        lock = FormLock.refresh_lock(
            lock_type=lock_type,
            object_id=object_id,
            user=request.user
        )
        
        if lock:
            return JsonResponse({
                'success': True,
                'expires_at': lock.expires_at.isoformat(),
                'message': 'Lock refreshed successfully'
            })
        else:
            return JsonResponse({'success': False, 'error': 'Lock not found or expired'})
    
    except (ValueError, TypeError):
        return JsonResponse({'success': False, 'error': 'Invalid object ID'})


@login_required
@require_POST
def release_lock(request):
    """Release a form lock"""
    lock_type = request.POST.get('lock_type')
    object_id = request.POST.get('object_id')
    
    if not lock_type or not object_id:
        return JsonResponse({'success': False, 'error': 'Missing parameters'})
    
    try:
        object_id = int(object_id)
        release_form_lock(lock_type, object_id, request.user)
        
        return JsonResponse({
            'success': True,
            'message': 'Lock released successfully'
        })
    
    except (ValueError, TypeError):
        return JsonResponse({'success': False, 'error': 'Invalid object ID'})


@login_required
def get_active_users(request):
    """Get active users for a specific form"""
    session_type = request.GET.get('session_type')
    object_id = request.GET.get('object_id')
    
    if not session_type or not object_id:
        return JsonResponse({'success': False, 'error': 'Missing parameters'})
    
    try:
        object_id = int(object_id)
        sessions = EditSession.get_active_sessions(session_type, object_id)
        
        users_data = []
        for session in sessions:
            users_data.append({
                'id': session.user.id,
                'username': session.user.username,
                'full_name': session.user.get_full_name(),
                'current_page': session.current_page,
                'last_activity': session.last_activity.isoformat(),
                'is_current_user': session.user.id == request.user.id
            })
        
        return JsonResponse({
            'success': True,
            'users': users_data,
            'total_count': len(users_data)
        })
    
    except (ValueError, TypeError):
        return JsonResponse({'success': False, 'error': 'Invalid object ID'})


@login_required
@require_POST
def update_progress(request):
    """Update editing progress"""
    session_type = request.POST.get('session_type')
    object_id = request.POST.get('object_id')
    current_page = request.POST.get('current_page', '1')
    progress_data = request.POST.get('progress_data', '{}')
    
    if not session_type or not object_id:
        return JsonResponse({'success': False, 'error': 'Missing parameters'})
    
    try:
        object_id = int(object_id)
        progress_data = json.loads(progress_data)
        
        # Update session
        session = EditSession.start_session(
            session_type=session_type,
            object_id=object_id,
            user=request.user,
            session_key=request.session.session_key
        )
        
        session.current_page = current_page
        session.progress_data = progress_data
        session.save()
        
        # Log collaboration event
        CollaborationEvent.objects.create(
            event_type='page_changed',
            session_type=session_type,
            object_id=object_id,
            user=request.user,
            data={'current_page': current_page, 'progress_data': progress_data}
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Progress updated successfully'
        })
    
    except (ValueError, TypeError, json.JSONDecodeError):
        return JsonResponse({'success': False, 'error': 'Invalid data'})


@login_required
def get_collaboration_events(request):
    """Get recent collaboration events for a form"""
    session_type = request.GET.get('session_type')
    object_id = request.GET.get('object_id')
    since = request.GET.get('since')
    
    if not session_type or not object_id:
        return JsonResponse({'success': False, 'error': 'Missing parameters'})
    
    try:
        object_id = int(object_id)
        
        events_queryset = CollaborationEvent.objects.filter(
            session_type=session_type,
            object_id=object_id
        )
        
        if since:
            since_time = timezone.datetime.fromisoformat(since.replace('Z', '+00:00'))
            events_queryset = events_queryset.filter(created_at__gt=since_time)
        
        events = events_queryset.order_by('-created_at')[:20]
        
        events_data = []
        for event in events:
            events_data.append({
                'id': event.id,
                'event_type': event.event_type,
                'user': {
                    'id': event.user.id,
                    'username': event.user.username,
                    'full_name': event.user.get_full_name()
                },
                'data': event.data,
                'created_at': event.created_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'events': events_data
        })
    
    except (ValueError, TypeError):
        return JsonResponse({'success': False, 'error': 'Invalid data'})


def get_lock_status(lock_type, object_id):
    """Get current lock status for an object"""
    lock = FormLock.get_active_lock(lock_type, object_id)
    if lock:
        return {
            'is_locked': True,
            'locked_by': lock.user.username,
            'locked_by_full_name': lock.user.get_full_name(),
            'expires_at': lock.expires_at.isoformat(),
            'is_current_user': False
        }
    return {
        'is_locked': False
    }


def check_form_access(request, lock_type, object_id):
    """Check if current user can access a form"""
    lock = FormLock.get_active_lock(lock_type, object_id)
    
    if not lock:
        return True  # No lock, can access
    
    if lock.user == request.user:
        return True  # Same user owns the lock
    
    return False  # Different user has the lock
