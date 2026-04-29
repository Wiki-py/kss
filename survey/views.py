from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework import generics, status, viewsets
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import (
    User, RegisteredDevice, SurveyData, Clan, ClanAssignment, SubClan, Ridge, Resource, Challenge,
    Enterprise, EnvironmentalProject
)
from .serializers import (
    UserSerializer, LoginSerializer, RegisteredDeviceSerializer,
    SurveyDataSerializer, SurveyNestedSerializer, OfflineSyncSerializer,
    ResourceSerializer, ChallengeSerializer, EnterpriseSerializer,
    EnvironmentalProjectSerializer, ClanSerializer, ClanCreateSerializer,
    SubClanSerializer, SubClanCreateSerializer, RidgeSerializer, RidgeCreateSerializer,
    ClanAssignmentSerializer
)
from .permissions import IsAgent, IsAdminOrSuperAdmin, IsSuperAdmin, IsOwnerOrAdmin
from .utils import generate_pdf_report


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view with additional user information."""
    serializer_class = LoginSerializer
    
    def post(self, request, *args, **kwargs):
        print(f"DEBUG: Login request received: {request.data}")
        print(f"DEBUG: Request headers: {dict(request.headers)}")
        print(f"DEBUG: Request content type: {request.content_type}")
        
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            user = serializer.validated_data['user']
            print(f"DEBUG: User authenticated: {user.username}, active: {user.is_active}")
            
            refresh = RefreshToken.for_user(user)
            print(f"DEBUG: Token generated successfully")
            
            response_data = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                }
            }
            
            print(f"DEBUG: Response data prepared: {response_data}")
            return Response(response_data)
            
        except serializers.ValidationError as e:
            print(f"DEBUG: Validation error: {e.detail}")
            return Response({
                'error': str(e.detail),
                'detail': e.detail
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"DEBUG: Unexpected error: {str(e)}")
            print(f"DEBUG: Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': 'Authentication failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutView(generics.GenericAPIView):
    """Logout view to blacklist refresh token."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for user management (Super Admin only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['role', 'is_active']
    
    def get_queryset(self):
        return User.objects.exclude(id=self.request.user.id)


class RegisteredDeviceViewSet(viewsets.ModelViewSet):
    """ViewSet for device management (Super Admin only)."""
    queryset = RegisteredDevice.objects.all()
    serializer_class = RegisteredDeviceSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'is_allowed']
    
    @extend_schema(
        parameters=[
            OpenApiParameter(name='device_id', description='Device unique ID', required=True, type=str),
            OpenApiParameter(name='user_id', description='User ID', required=True, type=int),
        ]
    )
    def create(self, request, *args, **kwargs):
        """Register a new device for an agent."""
        device_unique_id = request.data.get('device_unique_id')
        user_id = request.data.get('user')
        
        if not device_unique_id or not user_id:
            return Response(
                {"error": "device_unique_id and user are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id, role='agent')
        except User.DoesNotExist:
            return Response(
                {"error": "Agent user not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if device already exists
        if RegisteredDevice.objects.filter(device_unique_id=device_unique_id).exists():
            return Response(
                {"error": "Device already registered"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().create(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def toggle_allowed(self, request, pk=None):
        """Toggle device allowed status."""
        device = self.get_object()
        device.is_allowed = not device.is_allowed
        device.save()
        return Response({
            'id': device.id,
            'is_allowed': device.is_allowed
        })


class SurveyDataViewSet(viewsets.ModelViewSet):
    """ViewSet for survey data management."""
    serializer_class = SurveyDataSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['synced']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'agent':
            return SurveyData.objects.filter(agent=user)
        elif user.role in ['admin', 'superadmin']:
            return SurveyData.objects.all()
        return SurveyData.objects.none()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SurveyNestedSerializer
        return SurveyDataSerializer
    
    def perform_create(self, serializer):
        serializer.save(agent=self.request.user)
    
    @action(detail=False, methods=['post'])
    def sync_offline(self, request):
        """Sync offline surveys from agents."""
        if request.user.role != 'agent':
            return Response(
                {"error": "Only agents can sync offline data"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = OfflineSyncSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            result = serializer.save()
            return Response({
                'message': f'Successfully synced {len(result["surveys"])} surveys',
                'surveys': SurveyDataSerializer(result['surveys'], many=True).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_synced(self, request, pk=None):
        """Mark survey as synced."""
        survey = self.get_object()
        survey.synced = True
        survey.save()
        return Response({'synced': survey.synced})


class StatisticsView(generics.GenericAPIView):
    """API view for dashboard statistics (Admin and Super Admin only)."""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    @extend_schema(
        parameters=[
            OpenApiParameter(name='date_from', description='Start date (YYYY-MM-DD)', type=str),
            OpenApiParameter(name='date_to', description='End date (YYYY-MM-DD)', type=str),
            OpenApiParameter(name='district', description='Filter by district', type=str),
        ]
    )
    def get(self, request):
        """Get aggregated statistics for dashboard."""
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        district = request.query_params.get('district')
        
        # Base queryset
        surveys_queryset = SurveyData.objects.all()
        clans_queryset = Clan.objects.all()
        
        # Apply date filters
        if date_from:
            surveys_queryset = surveys_queryset.filter(submitted_at__date__gte=date_from)
        if date_to:
            surveys_queryset = surveys_queryset.filter(submitted_at__date__lte=date_to)
        
        # Apply district filter
        if district:
            clans_queryset = clans_queryset.filter(district__icontains=district)
            survey_ids = clans_queryset.values_list('survey_id', flat=True)
            surveys_queryset = surveys_queryset.filter(id__in=survey_ids)
        
        # Basic counts
        total_surveys = surveys_queryset.count()
        total_clans = clans_queryset.filter(survey__in=surveys_queryset).count()
        total_agents = User.objects.filter(role='agent').count()
        
        # Population statistics
        population_stats = clans_queryset.filter(survey__in=surveys_queryset).aggregate(
            total_population=Sum('total_population'),
            total_households=Sum('total_households'),
            male_population=Sum('male_population'),
            female_population=Sum('female_population'),
            youth_population=Sum('youth_population')
        )
        
        # District distribution
        district_stats = clans_queryset.filter(
            survey__in=surveys_queryset
        ).values('district').annotate(
            count=Count('id'),
            population=Sum('total_population')
        ).order_by('-count')
        
        # Education statistics
        education_stats = {}
        for clan in clans_queryset.filter(survey__in=surveys_queryset):
            educated_count = clan.educated_persons.count()
            for person in clan.educated_persons.all():
                level = person.education_level
                education_stats[level] = education_stats.get(level, 0) + 1
        
        # Challenges distribution
        challenge_stats = {}
        for clan in clans_queryset.filter(survey__in=surveys_queryset):
            for clan_challenge in clan.challenges.all():
                challenge = clan_challenge.challenge.description
                challenge_stats[challenge] = challenge_stats.get(challenge, 0) + 1
        
        # Resources statistics
        resource_stats = {}
        for clan in clans_queryset.filter(survey__in=surveys_queryset):
            for clan_resource in clan.resources.all():
                resource = clan_resource.resource.name
                resource_stats[resource] = resource_stats.get(resource, 0) + 1
        
        # Recent surveys
        recent_surveys = surveys_queryset.select_related('agent').order_by('-submitted_at')[:10]
        recent_surveys_data = [
            {
                'id': survey.id,
                'agent': survey.agent.username,
                'submitted_at': survey.submitted_at,
                'synced': survey.synced,
                'clan_count': survey.clans.count()
            }
            for survey in recent_surveys
        ]
        
        return Response({
            'summary': {
                'total_surveys': total_surveys,
                'total_clans': total_clans,
                'total_agents': total_agents,
                **population_stats
            },
            'district_distribution': list(district_stats),
            'education_distribution': education_stats,
            'challenges_distribution': challenge_stats,
            'resources_distribution': resource_stats,
            'recent_surveys': recent_surveys_data
        })


class PDFReportView(generics.GenericAPIView):
    """Generate PDF reports (Admin and Super Admin only)."""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    @extend_schema(
        parameters=[
            OpenApiParameter(name='clan_id', description='Filter by clan ID', type=int),
            OpenApiParameter(name='date_from', description='Start date (YYYY-MM-DD)', type=str),
            OpenApiParameter(name='date_to', description='End date (YYYY-MM-DD)', type=str),
            OpenApiParameter(name='district', description='Filter by district', type=str),
        ]
    )
    def post(self, request):
        """Generate PDF report based on filters."""
        clan_id = request.data.get('clan_id')
        date_from = request.data.get('date_from')
        date_to = request.data.get('date_to')
        district = request.data.get('district')
        
        try:
            pdf_buffer = generate_pdf_report(
                clan_id=clan_id,
                date_from=date_from,
                date_to=date_to,
                district=district
            )
            
            response = HttpResponse(pdf_buffer, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="obb_survey_report.pdf"'
            return response
            
        except Exception as e:
            return Response(
                {"error": f"Failed to generate PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Lookup data views for frontend forms
class ResourceListView(generics.ListAPIView):
    """List all available resources."""
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]


class ChallengeListView(generics.ListAPIView):
    """List all available challenges."""
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
    permission_classes = [IsAuthenticated]


class EnterpriseListView(generics.ListAPIView):
    """List all available enterprises."""
    queryset = Enterprise.objects.all()
    serializer_class = EnterpriseSerializer
    permission_classes = [IsAuthenticated]


class EnvironmentalProjectListView(generics.ListAPIView):
    """List all available environmental projects."""
    queryset = EnvironmentalProject.objects.all()
    serializer_class = EnvironmentalProjectSerializer
    permission_classes = [IsAuthenticated]


class AgentSurveyListView(generics.ListAPIView):
    """List surveys for the current agent."""
    serializer_class = SurveyDataSerializer
    permission_classes = [IsAuthenticated, IsAgent]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['synced']
    
    def get_queryset(self):
        return SurveyData.objects.filter(agent=self.request.user).order_by('-submitted_at')


class AdminSurveyListView(generics.ListAPIView):
    """List all surveys for admins."""
    serializer_class = SurveyDataSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['agent', 'synced']
    
    def get_queryset(self):
        return SurveyData.objects.select_related('agent').order_by('-submitted_at')


class SurveyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific survey."""
    serializer_class = SurveyNestedSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'agent':
            return SurveyData.objects.filter(agent=user)
        elif user.role in ['admin', 'superadmin']:
            return SurveyData.objects.all()
        return SurveyData.objects.none()
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return SurveyNestedSerializer
        return SurveyDataSerializer


# Clan Management API Views for Multi-User Hierarchy System

class ClanViewSet(viewsets.ModelViewSet):
    """API endpoint for clan management"""
    queryset = Clan.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['district', 'county']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ClanCreateSerializer
        return ClanSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Failed to create clan: {str(e)}',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'agent':
            # Agents can see clans they're assigned to or created
            return Clan.objects.filter(
                Q(created_by=user) | 
                Q(assigned_users__user=user, assigned_users__is_active=True)
            ).distinct()
        elif user.role in ['admin', 'superadmin']:
            return Clan.objects.all()
        return Clan.objects.none()
    
    @extend_schema(summary="Get current user's clan")
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get clan data for current user"""
        user = request.user
        clan = Clan.objects.filter(
            Q(assigned_users__user=user, assigned_users__level='clan', assigned_users__is_active=True) |
            Q(created_by=user)
        ).first()
        
        if clan:
            serializer = self.get_serializer(clan)
            return Response(serializer.data)
        return Response({'detail': 'No clan found for current user'}, status=status.HTTP_404_NOT_FOUND)


class SubClanViewSet(viewsets.ModelViewSet):
    """API endpoint for sub-clan management"""
    queryset = SubClan.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['clan']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SubClanCreateSerializer
        return SubClanSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'agent':
            # Agents can see sub-clans from clans they're assigned to
            return SubClan.objects.filter(
                Q(clan__created_by=user) | 
                Q(clan__assigned_users__user=user, clan__assigned_users__level='clan', clan__assigned_users__is_active=True) |
                Q(assigned_users__user=user, assigned_users__level='subclan', assigned_users__is_active=True)
            ).distinct()
        elif user.role in ['admin', 'superadmin']:
            return SubClan.objects.all()
        return SubClan.objects.none()


class RidgeViewSet(viewsets.ModelViewSet):
    """API endpoint for ridge management"""
    queryset = Ridge.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subclan']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RidgeCreateSerializer
        return RidgeSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'agent':
            # Agents can see ridges from sub-clans they're assigned to
            return Ridge.objects.filter(
                Q(subclan__clan__created_by=user) | 
                Q(subclan__clan__assigned_users__user=user, subclan__clan__assigned_users__level='clan', subclan__clan__assigned_users__is_active=True) |
                Q(subclan__assigned_users__user=user, subclan__assigned_users__level='subclan', subclan__assigned_users__is_active=True) |
                Q(assigned_users__user=user, assigned_users__level='ridge', assigned_users__is_active=True)
            ).distinct()
        elif user.role in ['admin', 'superadmin']:
            return Ridge.objects.all()
        return Ridge.objects.none()


class ClanAssignmentViewSet(viewsets.ModelViewSet):
    """API endpoint for clan user assignments"""
    queryset = ClanAssignment.objects.all()
    serializer_class = ClanAssignmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['clan', 'user', 'level', 'is_active']


# Custom API Views for specific frontend needs

class ClanSubClansView(generics.ListAPIView):
    """Get sub-clans for a specific clan"""
    serializer_class = SubClanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        clan_id = self.kwargs['clan_id']
        user = self.request.user
        
        # Check if user has access to this clan
        clan = Clan.objects.get(id=clan_id)
        if not (user.role in ['admin', 'superadmin'] or 
                clan.created_by == user or
                clan.assigned_users.filter(user=user, is_active=True).exists()):
            return SubClan.objects.none()
        
        return SubClan.objects.filter(clan_id=clan_id)


class SubClanRidgesView(generics.ListAPIView):
    """Get ridges for a specific sub-clan"""
    serializer_class = RidgeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        subclan_id = self.kwargs['subclan_id']
        user = self.request.user
        
        # Check if user has access to this sub-clan
        subclan = SubClan.objects.get(id=subclan_id)
        if not (user.role in ['admin', 'superadmin'] or 
                subclan.clan.created_by == user or
                subclan.clan.assigned_users.filter(user=user, is_active=True).exists()):
            return Ridge.objects.none()
        
        return Ridge.objects.filter(subclan_id=subclan_id)


class SurveyFormSubmissionView(generics.CreateAPIView):
    """API endpoint for survey form submission"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        """Handle survey form submission"""
        try:
            # Get form data from request
            form_data = request.data
            
            # Extract hierarchy level and entity information
            level = form_data.get('level', 'clan')
            entity_id = form_data.get('entity_id')
            entity_name = form_data.get('entity_name')
            
            # Create or update SurveyData
            survey_data, created = SurveyData.objects.get_or_create(
                agent=request.user,
                defaults={'synced': True}
            )
            
            # Create or update Clan based on hierarchy level
            if level == 'clan':
                clan, clan_created = Clan.objects.update_or_create(
                    id=entity_id,
                    defaults={
                        'name': entity_name,
                        'clan_leader_name': form_data.get('clan_leader_name'),
                        'clan_leader_contact': form_data.get('clan_leader_contact'),
                        'village': form_data.get('village'),
                        'parish': form_data.get('parish'),
                        'sub_county': form_data.get('sub_county'),
                        'district': form_data.get('district'),
                        'county': form_data.get('county'),
                        'number_of_sub_clans': form_data.get('number_of_sub_clans', 0),
                        'number_of_bitubhi': form_data.get('number_of_bitubhi', 0),
                        'total_households': form_data.get('total_households', 0),
                        'total_population': form_data.get('total_population', 0),
                        'male_population': form_data.get('male_population', 0),
                        'female_population': form_data.get('female_population', 0),
                        'youth_population': form_data.get('youth_population', 0),
                        'survey': survey_data,
                        'created_by': request.user
                    }
                )
                
                # Store clan-specific questions
                if 'clan_origin' in form_data:
                    # You can create a separate model for clan-specific data
                    pass
                    
            elif level == 'subclan':
                subclan, subclan_created = SubClan.objects.update_or_create(
                    id=entity_id,
                    defaults={
                        'name': entity_name,
                        'subclan_leader_name': form_data.get('subclan_leader_name'),
                        'subclan_leader_contact': form_data.get('subclan_leader_contact'),
                        'village': form_data.get('village'),
                        'parish': form_data.get('parish'),
                        'sub_county': form_data.get('sub_county'),
                        'district': form_data.get('district'),
                        'county': form_data.get('county'),
                        'created_by': request.user
                    }
                )
                
            elif level == 'ridge':
                ridge, ridge_created = Ridge.objects.update_or_create(
                    id=entity_id,
                    defaults={
                        'name': entity_name,
                        'ridge_leader_name': form_data.get('ridge_leader_name'),
                        'ridge_leader_contact': form_data.get('ridge_leader_contact'),
                        'village': form_data.get('village'),
                        'parish': form_data.get('parish'),
                        'sub_county': form_data.get('sub_county'),
                        'district': form_data.get('district'),
                        'county': form_data.get('county'),
                        'number_of_households': form_data.get('number_of_households', 0),
                        'created_by': request.user
                    }
                )
            
            return Response({
                'success': True,
                'message': f'Survey form submitted successfully for {level}: {entity_name}',
                'survey_id': survey_data.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error submitting survey form: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_test_user(request):
    """Create a test user for development/testing purposes"""
    try:
        username = request.data.get('username', 'testuser')
        password = request.data.get('password', 'testpass')
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            return Response({
                'success': True,
                'message': f'Test user {username} already exists',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'is_active': user.is_active
                }
            })
        
        # Create new user
        user = User.objects.create_user(
            username=username,
            email=f'{username}@test.com',
            password=password,
            role='agent'
        )
        
        return Response({
            'success': True,
            'message': f'Test user {username} created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error creating test user: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Simple health check endpoint"""
    return Response({
        'status': 'healthy',
        'message': 'Backend is running',
        'timestamp': timezone.now().isoformat()
    })
