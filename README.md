# Kingdom Survey System - Django Backend

A comprehensive Django REST API backend for the OBB Kingdom survey system, providing user authentication, device-based access control, survey data management, and PDF report generation.

## Features

- **User Authentication**: JWT-based authentication with three roles (agent, admin, superadmin)
- **Device Validation**: Device-based access control for agents
- **Survey Management**: Complete CRUD operations for all survey data
- **Offline Sync**: Support for offline data synchronization
- **Admin Dashboard**: Aggregated statistics and data management
- **PDF Reports**: Server-side PDF generation using ReportLab
- **Django Admin**: Built-in admin interface for superusers

## Tech Stack

- **Python**: 3.12
- **Django**: 5.1.6
- **Django REST Framework**: 3.15.2
- **Simple JWT**: 5.3.1
- **django-cors-headers**: 4.4.0
- **Pillow**: 10.4.0
- **ReportLab**: 4.2.0
- **drf-spectacular**: 0.27.2
- **Database**: SQLite (production ready for PostgreSQL)

## Quick Start

### Prerequisites

- Python 3.12 installed
- Virtual environment recommended

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd kingdom-survey-backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create a superuser:**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

The server will be available at `http://127.0.0.1:8000/`

## API Documentation

### Authentication Endpoints

- `POST /api/token/` - Obtain JWT token pair
- `POST /api/token/refresh/` - Refresh access token
- `POST /api/logout/` - Logout (blacklist token)

### Device Management (Super Admin)

- `GET /api/devices/` - List all registered devices
- `POST /api/devices/` - Register a new device
- `PUT /api/devices/{id}/` - Update device
- `DELETE /api/devices/{id}/` - Delete device

### Survey Management

- `GET /api/surveys/` - List surveys (filtered by user role)
- `POST /api/surveys/` - Create new survey
- `GET /api/surveys/{id}/` - Retrieve survey details
- `PUT /api/surveys/{id}/` - Update survey
- `DELETE /api/surveys/{id}/` - Delete survey
- `POST /api/surveys/sync-offline/` - Sync offline surveys

### Statistics and Reports (Admin/Super Admin)

- `GET /api/stats/` - Get dashboard statistics
- `POST /api/report/` - Generate PDF report

### Lookup Data

- `GET /api/resources/` - List available resources
- `GET /api/challenges/` - List available challenges
- `GET /api/enterprises/` - List available enterprises
- `GET /api/environmental-projects/` - List environmental projects

### API Documentation

- Swagger UI: `http://127.0.0.1:8000/api/docs/`
- ReDoc: `http://127.0.0.1:8000/api/redoc/`
- OpenAPI Schema: `http://127.0.0.1:8000/api/schema/`

## User Roles and Permissions

### Agent
- Can create and update own surveys
- Can view own survey data
- Must use registered device (X-Device-ID header required)
- Cannot access admin endpoints

### Admin
- Can view all survey data
- Can access statistics and reports
- Can manage users (read-only)
- No device validation required

### Super Admin
- Full access to all endpoints
- Can manage users and devices
- Can access Django admin interface
- No device validation required

## Device Registration

Agents must use a pre-registered device. To register a device:

1. Create an agent user via Django admin or API
2. Register the device using the devices endpoint:
   ```bash
   POST /api/devices/
   {
       "device_unique_id": "unique-device-id-from-capacitor",
       "user": 1  # Agent user ID
   }
   ```

3. Agents must include the device ID in all API requests:
   ```bash
   X-Device-ID: unique-device-id-from-capacitor
   ```

## Database Models

The system includes comprehensive models for:

- **User Management**: Custom User model with roles
- **Device Registration**: RegisteredDevice for agent access control
- **Survey Data**: SurveyData, Clan, SubClan, CommitteeMember
- **Resources**: Resource, ClanResource for asset tracking
- **Challenges**: Challenge, ClanChallenge for issue tracking
- **Education**: EducationEstimate, EducatedPerson
- **Leadership**: PoliticalLeader, OBBLeader
- **Financial**: SavingGroup for financial data
- **Infrastructure**: OfficeStructure, WaterSource
- **Environment**: EnvironmentalProject

## PDF Report Generation

The system generates comprehensive PDF reports including:

- Summary statistics
- District distribution
- Clan details with all sections
- Tables for committees, resources, challenges
- Population breakdowns
- Signature information

Reports can be filtered by:
- Clan ID
- Date range
- District

## Development

### Running Tests

```bash
python manage.py test
```

### Creating New Migrations

```bash
python manage.py makemigrations survey
python manage.py migrate
```

### Django Admin Interface

Access the admin interface at `http://127.0.0.1:8000/admin/`

Use the superuser credentials created during setup to access:
- User management
- Device registration
- Survey data review
- All model management

## Production Deployment

### Environment Variables

Set the following environment variables in production:

```bash
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,anotherdomain.com
DATABASE_URL=postgresql://user:password@host:port/dbname
```

### Database Migration to PostgreSQL

1. Install psycopg2:
   ```bash
   pip install psycopg2-binary
   ```

2. Update settings.py:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'your_db_name',
           'USER': 'your_db_user',
           'PASSWORD': 'your_db_password',
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

### Static Files

Collect static files for production:

```bash
python manage.py collectstatic
```

## Security Considerations

- Change the default SECRET_KEY in production
- Use HTTPS in production
- Configure CORS settings appropriately
- Regularly update dependencies
- Implement rate limiting for API endpoints
- Use environment variables for sensitive configuration

## API Usage Examples

### Agent Login

```bash
POST /api/token/
{
    "username": "agent_username",
    "password": "agent_password"
}
```

### Create Survey (Agent)

```bash
POST /api/surveys/
Headers:
X-Device-ID: registered-device-id
Authorization: Bearer access-token

{
    "clans": [
        {
            "name": "Example Clan",
            "district": "Example District",
            "village": "Example Village",
            "total_population": 1000,
            "total_households": 200,
            // ... other clan fields
            "committee": [
                {
                    "name": "John Doe",
                    "position": "Chairman",
                    "sex": "M",
                    // ... other committee fields
                }
            ]
        }
    ]
}
```

### Get Statistics (Admin)

```bash
GET /api/stats/?date_from=2024-01-01&date_to=2024-12-31&district=Example
Authorization: Bearer admin-access-token
```

## Troubleshooting

### Common Issues

1. **Device Validation Error**: Ensure the device is registered and the X-Device-ID header is included
2. **Permission Denied**: Check user roles and ensure proper authentication
3. **Migration Errors**: Ensure database is properly migrated and user model is correctly configured
4. **PDF Generation Issues**: Check ReportLab installation and ensure media files are accessible

### Logging

The application includes comprehensive logging. Check the console output for debugging information.

## Support

For issues and questions, refer to the Django documentation and API documentation available at `/api/docs/`.

## License

This project is proprietary and should not be distributed without permission.
