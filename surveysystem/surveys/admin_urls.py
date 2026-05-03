from django.urls import path
from . import views

app_name = 'admin_dash'

urlpatterns = [
    path('', views.admin_dashboard, name='dashboard'),
    path('dashboard/', views.admin_dashboard, name='dashboard'),
    path('surveys/', views.admin_surveys, name='surveys'),
    path('responses/', views.admin_responses, name='responses'),
    path('users/', views.admin_users, name='users'),
    path('users/create/', views.create_user, name='create_user'),
    path('users/<int:user_id>/edit/', views.edit_user_role, name='edit_user'),
    path('users/<int:user_id>/delete/', views.delete_user, name='delete_user'),
    path('users/<int:user_id>/reset-password/', views.reset_user_password, name='reset_password'),
    path('super-admin/', views.super_admin_dashboard, name='super_admin_dashboard'),
    # Data viewing and export URLs
    path('data/clans/', views.view_clan_data, name='view_clan_data'),
    path('data/sub-clans/', views.view_sub_clan_data, name='view_sub_clan_data'),
    path('data/ridges/', views.view_ridge_data, name='view_ridge_data'),
    path('export/clans/pdf/', views.export_clan_data_pdf, name='export_clan_data_pdf'),
    path('export/sub-clans/pdf/', views.export_sub_clan_data_pdf, name='export_sub_clan_data_pdf'),
    path('export/ridges/pdf/', views.export_ridge_data_pdf, name='export_ridge_data_pdf'),
]
