from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomTokenObtainPairView, LogoutView, UserViewSet, RegisteredDeviceViewSet,
    SurveyDataViewSet, StatisticsView, PDFReportView, ResourceListView,
    ChallengeListView, EnterpriseListView, EnvironmentalProjectListView,
    AgentSurveyListView, AdminSurveyListView, SurveyDetailView,
    ClanViewSet, SubClanViewSet, RidgeViewSet, ClanAssignmentViewSet,
    ClanSubClansView, SubClanRidgesView, SurveyFormSubmissionView, create_test_user
)

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'devices', RegisteredDeviceViewSet, basename='device')
router.register(r'surveys', SurveyDataViewSet, basename='survey')

# Clan management endpoints
router.register(r'clans', ClanViewSet, basename='clan')
router.register(r'subclans', SubClanViewSet, basename='subclan')
router.register(r'ridges', RidgeViewSet, basename='ridge')
router.register(r'clan-assignments', ClanAssignmentViewSet, basename='clan-assignment')

# URL patterns
urlpatterns = [
    # Authentication endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenObtainPairView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # Survey endpoints
    path('surveys/agent/', AgentSurveyListView.as_view(), name='agent-surveys'),
    path('surveys/admin/', AdminSurveyListView.as_view(), name='admin-surveys'),
    path('surveys/<int:pk>/', SurveyDetailView.as_view(), name='survey-detail'),
    
    # Statistics and reports
    path('stats/', StatisticsView.as_view(), name='statistics'),
    path('report/', PDFReportView.as_view(), name='pdf-report'),
    
    # Lookup data endpoints
    path('resources/', ResourceListView.as_view(), name='resource-list'),
    path('challenges/', ChallengeListView.as_view(), name='challenge-list'),
    path('enterprises/', EnterpriseListView.as_view(), name='enterprise-list'),
    path('environmental-projects/', EnvironmentalProjectListView.as_view(), name='environmental-project-list'),
    
    # Clan management specific endpoints
    path('clans/<int:clan_id>/subclans/', ClanSubClansView.as_view(), name='clan-subclans'),
    path('subclans/<int:subclan_id>/ridges/', SubClanRidgesView.as_view(), name='subclan-ridges'),
    
    # Survey form submission endpoint
    path('survey/submit/', SurveyFormSubmissionView.as_view(), name='survey-form-submit'),
    
    # Test user creation endpoint (for development)
    path('create-test-user/', create_test_user, name='create-test-user'),
    
    # Router URLs for ViewSets
    path('', include(router.urls)),
]
