from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from survey.models import User

class Command(BaseCommand):
    help = 'Create test users for the OBB Kingdom Survey system'

    def handle(self, *args, **options):
        User = get_user_model()
        
        # Create test users
        users_data = [
            {
                'username': 'admin',
                'email': 'admin@obb.com',
                'password': 'admin123',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': False,
            },
            {
                'username': 'agent',
                'email': 'agent@obb.com',
                'password': 'agent123',
                'first_name': 'Agent',
                'last_name': 'User',
                'role': 'agent',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'username': 'superadmin',
                'email': 'superadmin@obb.com',
                'password': 'super123',
                'first_name': 'Super',
                'last_name': 'Admin',
                'role': 'superadmin',
                'is_staff': True,
                'is_superuser': True,
            },
        ]

        for user_data in users_data:
            username = user_data['username']
            password = user_data.pop('password')
            
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                self.stdout.write(
                    self.style.WARNING(f'User {username} already exists')
                )
                continue
            
            # Create user
            user = User.objects.create_user(**user_data)
            user.set_password(password)
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Created user: {username}')
            )
        
        self.stdout.write(
            self.style.SUCCESS('Test users created successfully!')
        )
        
        # Display user information
        self.stdout.write('\nTest Users:')
        self.stdout.write('-' * 40)
        for user_data in users_data:
            username = user_data['username']
            password = user_data['password']
            self.stdout.write(f'{username}: {password}')
        self.stdout.write('-' * 40)
