#!/usr/bin/env python
"""
Django WiFi Server Runner
Run this script to make the Django application available on your WiFi network
"""

import os
import sys
import subprocess

def main():
    # Add the project directory to Python path
    project_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, project_dir)
    
    # Set Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'surveysystem.settings')
    
    # Import Django
    try:
        import django
        django.setup()
        
        # Get the local IP address
        import socket
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        print("=" * 60)
        print("🚀 DJANGO WIFI SERVER STARTER")
        print("=" * 60)
        print(f"📱 Local IP Address: {local_ip}")
        print(f"🌐 Server will run on: http://{local_ip}:8000")
        print(f"💻 Local access: http://127.0.0.1:8000")
        print("=" * 60)
        print("📋 INSTRUCTIONS FOR OTHER DEVICES:")
        print(f"1. Connect to the same WiFi network")
        print(f"2. Open browser and go to: http://{local_ip}:8000")
        print(f"3. Make sure firewall allows connections on port 8000")
        print("=" * 60)
        print("🔧 FIREWALL SETUP (Windows):")
        print("If you can't connect from other devices, run this command:")
        print(f"netsh http add urlacl url=http://{local_ip}:8000/ user=everyone")
        print("Or allow port 8000 in Windows Firewall settings")
        print("=" * 60)
        print("⚠️  Press Ctrl+C to stop the server")
        print("=" * 60)
        
        # Run Django development server
        from django.core.management import execute_from_command_line
        execute_from_command_line(['manage.py', 'runserver', f'{local_ip}:8000'])
        
    except ImportError as e:
        print(f"❌ Error importing Django: {e}")
        print("Make sure Django is installed: pip install django")
        return 1
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return 1

if __name__ == '__main__':
    main()
