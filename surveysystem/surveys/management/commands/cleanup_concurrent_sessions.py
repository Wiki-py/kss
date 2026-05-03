"""
Management command to clean up expired locks and sessions
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from surveys.models_concurrent import FormLock, EditSession


class Command(BaseCommand):
    help = 'Clean up expired form locks and inactive editing sessions'
    
    def handle(self, *args, **options):
        # Clean up expired locks
        expired_locks = FormLock.objects.filter(
            expires_at__lt=timezone.now()
        ).delete()
        
        # Clean up inactive sessions
        EditSession.cleanup_expired_sessions()
        
        self.stdout.write(
            self.style.SUCCESS('Successfully cleaned up expired locks and sessions')
        )
