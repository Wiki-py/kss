from django.urls import path
from . import views
from . import concurrent_utils

app_name = 'surveys'

urlpatterns = [
    path('', views.survey_list, name='survey_list'),
    path('dashboard/', views.surveyer_dashboard, name='surveyer_dashboard'),
    path('create/', views.create_survey, name='create_survey'),
    path('create-sub-clan/<int:clan_id>/', views.create_sub_clan, name='create_sub_clan'),
    path('create-sub-clan/', views.create_sub_clan, name='create_sub_clan'),
    path('create-sub-clan-survey/<int:sub_clan_id>/', views.create_sub_clan_survey, name='create_sub_clan_survey'),
    path('create-sub-clan-survey/', views.create_sub_clan_survey, name='create_sub_clan_survey'),
    path('take-sub-clan-survey/<int:sub_clan_id>/', views.take_sub_clan_survey, name='take_sub_clan_survey'),
    path('sub-clan-obb-survey/<int:sub_clan_id>/', views.sub_clan_obb_survey, name='sub_clan_obb_survey'),
    path('create-ridge/<int:sub_clan_id>/', views.create_ridge, name='create_ridge'),
    path('create-ridge/', views.create_ridge, name='create_ridge'),
    path('create-ridge-survey/<int:ridge_id>/', views.create_ridge_survey, name='create_ridge_survey'),
    path('create-ridge-survey/', views.create_ridge_survey, name='create_ridge_survey'),
    path('take-ridge-survey/<int:ridge_id>/', views.take_ridge_survey, name='take_ridge_survey'),
    path('ridge-obb-survey/<int:ridge_id>/', views.ridge_obb_survey, name='ridge_obb_survey'),
    path('<int:survey_id>/', views.survey_detail, name='survey_detail'),
    path('<int:survey_id>/edit/', views.edit_survey, name='edit_survey'),
    path('<int:survey_id>/take/', views.take_survey, name='take_survey'),
    path('<int:survey_id>/thank-you/', views.survey_thank_you, name='survey_thank_you'),
    path('<int:survey_id>/results/', views.survey_results, name='survey_results'),
    path('<int:survey_id>/delete-question/<int:question_id>/', views.delete_question, name='delete_question'),
    path('my-responses/', views.my_responses, name='my_responses'),
    # Concurrent access control URLs
    path('api/refresh-lock/', concurrent_utils.refresh_lock, name='refresh_lock'),
    path('api/release-lock/', concurrent_utils.release_lock, name='release_lock'),
    path('api/active-users/', concurrent_utils.get_active_users, name='get_active_users'),
    path('api/update-progress/', concurrent_utils.update_progress, name='update_progress'),
    path('api/collaboration-events/', concurrent_utils.get_collaboration_events, name='get_collaboration_events'),
]
