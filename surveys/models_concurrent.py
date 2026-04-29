"""
Models for concurrent access control and real-time collaboration
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json


class FormLock(models.Model):
    """Lock forms to prevent concurrent editing conflicts"""
    LOCK_TYPES = [
        ('clan', 'Clan Survey'),
        ('sub_clan', 'Sub-Clan Survey'),
        ('ridge', 'Ridge Survey'),
        ('clan_create', 'Clan Creation'),
        ('sub_clan_create', 'Sub-Clan Creation'),
        ('ridge_create', 'Ridge Creation'),
    ]
    
    lock_type = models.CharField(max_length=20, choices=LOCK_TYPES)
    object_id = models.PositiveIntegerField()  # ID of the locked object
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=40, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        unique_together = ['lock_type', 'object_id']
        indexes = [
            models.Index(fields=['lock_type', 'object_id']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.get_lock_type_display()} #{self.object_id} locked by {self.user.username}"
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    @classmethod
    def acquire_lock(cls, lock_type, object_id, user, session_key=None, duration=30):
        """Acquire a lock for a form"""
        expires_at = timezone.now() + timezone.timedelta(minutes=duration)
        
        # Remove expired locks
        cls.objects.filter(
            lock_type=lock_type,
            object_id=object_id,
            expires_at__lt=timezone.now()
        ).delete()
        
        # Try to create new lock
        lock, created = cls.objects.get_or_create(
            lock_type=lock_type,
            object_id=object_id,
            defaults={
                'user': user,
                'session_key': session_key,
                'expires_at': expires_at
            }
        )
        
        if not created:
            # Check if existing lock is expired or belongs to same user
            if lock.user == user or lock.is_expired:
                lock.user = user
                lock.session_key = session_key
                lock.expires_at = expires_at
                lock.save()
                return lock
            else:
                return None
        
        return lock
    
    @classmethod
    def release_lock(cls, lock_type, object_id, user=None):
        """Release a lock"""
        queryset = cls.objects.filter(lock_type=lock_type, object_id=object_id)
        if user:
            queryset = queryset.filter(user=user)
        queryset.delete()
    
    @classmethod
    def refresh_lock(cls, lock_type, object_id, user, duration=30):
        """Refresh an existing lock"""
        expires_at = timezone.now() + timezone.timedelta(minutes=duration)
        
        try:
            lock = cls.objects.get(
                lock_type=lock_type,
                object_id=object_id,
                user=user
            )
            lock.expires_at = expires_at
            lock.save()
            return lock
        except cls.DoesNotExist:
            return None
    
    @classmethod
    def get_active_lock(cls, lock_type, object_id):
        """Get active lock for an object"""
        try:
            return cls.objects.get(
                lock_type=lock_type,
                object_id=object_id,
                expires_at__gt=timezone.now()
            )
        except cls.DoesNotExist:
            return None


class EditSession(models.Model):
    """Track active editing sessions for real-time collaboration"""
    SESSION_TYPES = [
        ('clan_survey', 'Clan Survey'),
        ('sub_clan_survey', 'Sub-Clan Survey'),
        ('ridge_survey', 'Ridge Survey'),
        ('clan_obb', 'Clan OBB Survey'),
        ('sub_clan_obb', 'Sub-Clan OBB Survey'),
        ('ridge_obb', 'Ridge OBB Survey'),
    ]
    
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES)
    object_id = models.PositiveIntegerField()
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=40)
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    current_page = models.CharField(max_length=50, default='1')
    progress_data = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['session_type', 'object_id', 'user', 'session_key']
        indexes = [
            models.Index(fields=['session_type', 'object_id']),
            models.Index(fields=['user']),
            models.Index(fields=['last_activity']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.get_session_type_display()} #{self.object_id} - {self.user.username}"
    
    @classmethod
    def start_session(cls, session_type, object_id, user, session_key):
        """Start or update an editing session"""
        session, created = cls.objects.get_or_create(
            session_type=session_type,
            object_id=object_id,
            user=user,
            session_key=session_key,
            defaults={
                'is_active': True,
                'current_page': '1'
            }
        )
        
        if not created and not session.is_active:
            session.is_active = True
            session.save()
        
        return session
    
    @classmethod
    def end_session(cls, session_type, object_id, user, session_key=None):
        """End an editing session"""
        queryset = cls.objects.filter(
            session_type=session_type,
            object_id=object_id,
            user=user
        )
        if session_key:
            queryset = queryset.filter(session_key=session_key)
        
        queryset.update(is_active=False)
    
    @classmethod
    def get_active_sessions(cls, session_type, object_id):
        """Get all active sessions for an object"""
        return cls.objects.filter(
            session_type=session_type,
            object_id=object_id,
            is_active=True,
            last_activity__gte=timezone.now() - timezone.timedelta(minutes=5)
        ).select_related('user')
    
    @classmethod
    def cleanup_expired_sessions(cls):
        """Clean up inactive sessions"""
        cutoff_time = timezone.now() - timezone.timedelta(minutes=10)
        cls.objects.filter(
            last_activity__lt=cutoff_time
        ).update(is_active=False)


class CollaborationEvent(models.Model):
    """Track collaboration events for real-time updates"""
    EVENT_TYPES = [
        ('user_joined', 'User Joined'),
        ('user_left', 'User Left'),
        ('field_updated', 'Field Updated'),
        ('page_changed', 'Page Changed'),
        ('form_submitted', 'Form Submitted'),
        ('form_locked', 'Form Locked'),
        ('form_unlocked', 'Form Unlocked'),
    ]
    
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    session_type = models.CharField(max_length=20, choices=EditSession.SESSION_TYPES)
    object_id = models.PositiveIntegerField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collaboration_events')
    target_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='targeted_events')
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['session_type', 'object_id', 'created_at']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['event_type']),
        ]
    
    def __str__(self):
        return f"{self.get_event_type_display()} - {self.user.username} on {self.session_type} #{self.object_id}"
