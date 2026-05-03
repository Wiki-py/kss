from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth import views as auth_views
from django.core.paginator import Paginator
from django.core.exceptions import FieldError
from django.db.models import Count, Q
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.db import transaction
from datetime import timedelta
from .models import Survey, Question, SurveyResponse, Answer, Clan, SubClan
import json


def is_admin(user):
    """Check if user is admin (staff)"""
    return user.is_staff


def is_super_admin(user):
    """Check if user is super admin (superuser)"""
    return user.is_superuser


@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    """Admin dashboard for clan and surveyer management"""
    # Import clan models (try to avoid circular imports)
    try:
        from .models import Clan, SubClan, Ridge, Population
        clan_models_available = True
    except ImportError:
        clan_models_available = False
    
    # Get basic statistics
    total_clans = Clan.objects.count() if clan_models_available else 0
    active_clans = Clan.objects.filter(is_active=True).count() if clan_models_available else 0
    total_sub_clans = SubClan.objects.count() if clan_models_available else 0
    total_ridges = Ridge.objects.count() if clan_models_available else 0
    total_responses = SurveyResponse.objects.count()
    total_surveyers = User.objects.filter(is_staff=False).count()
    
    # Get all clans for admin (can view all clans)
    if clan_models_available:
        all_clans = Clan.objects.annotate(
            sub_clans_total=Count('sub_clans'),
            ridges_total=Count('sub_clans__ridges'),  # Access ridges through sub-clans
            responses_total=Count('survey__responses')
        ).order_by('-created_at')
        
        # Clan statistics for cards
        clan_stats = []
        for clan in all_clans[:10]:  # Show recent 10 clans
            clan_stats.append({
                'id': clan.id,
                'name': clan.name,
                'sub_clans_total': clan.sub_clans_total,
                'ridges_total': clan.ridges_total,
                'responses_total': clan.responses_total,
                'created_by': clan.created_by,
                'created_at': clan.created_at,
                'is_active': clan.is_active
            })
    else:
        all_clans = []
        clan_stats = []
    
    # Get all surveyers (non-admin users)
    surveyers = User.objects.filter(is_staff=False).order_by('-date_joined')
    surveyer_stats = []
    for surveyer in surveyers[:10]:  # Show recent 10 surveyers
        clans_created = Clan.objects.filter(created_by=surveyer).count() if clan_models_available else 0
        responses_count = SurveyResponse.objects.filter(user=surveyer).count()
        surveyer_stats.append({
            'id': surveyer.id,
            'username': surveyer.username,
            'email': surveyer.email,
            'date_joined': surveyer.date_joined,
            'clans_created': clans_created,
            'responses_count': responses_count
        })
    
    # Recent data collections
    recent_collections = SurveyResponse.objects.select_related('survey', 'user').order_by('-submitted_at')[:10]
    
    # Available clans for data collection (all active clans)
    available_clans = Clan.objects.filter(is_active=True).annotate(
        sub_clans_total=Count('sub_clans'),
        ridges_total=Count('sub_clans__ridges'),  # Access ridges through sub-clans
        responses_total=Count('survey__responses')
    ).order_by('name') if clan_models_available else []
    
    # Get sub-clan data for admin dashboard
    clan_surveys_with_sub_clans = []
    if clan_models_available:
        # Get all clan surveys
        clan_surveys = Survey.objects.filter(is_active=True, is_clan=True, created_by__isnull=False).order_by('-created_at')
        
        for clan_survey in clan_surveys:
            clan_data = {
                'survey': clan_survey,
                'sub_clans': []
            }
            
            # Get sub-clans for this clan
            try:
                clan = Clan.objects.get(survey=clan_survey)
                sub_clans = SubClan.objects.filter(clan=clan, is_active=True).order_by('name')
                
                for sub_clan in sub_clans:
                    # Check if there are sub-clan surveys for this sub-clan
                    sub_clan_surveys = []
                    try:
                        from .models import SubClanSurvey
                        sub_clan_surveys = SubClanSurvey.objects.filter(
                            is_active=True, 
                            created_by__isnull=False
                        ).order_by('-created_at')
                    except ImportError:
                        pass
                    
                    clan_data['sub_clans'].append({
                        'sub_clan': sub_clan,
                        'surveys': sub_clan_surveys
                    })
                    
            except Clan.DoesNotExist:
                pass
            
            clan_surveys_with_sub_clans.append(clan_data)
    
    context = {
        'clan_models_available': clan_models_available,
        'total_clans': total_clans,
        'active_clans': active_clans,
        'total_sub_clans': total_sub_clans,
        'total_ridges': total_ridges,
        'total_responses': total_responses,
        'total_surveyers': total_surveyers,
        'clan_stats': clan_stats,
        'surveyer_stats': surveyer_stats,
        'recent_collections': recent_collections,
        'available_clans': available_clans,
        'clan_surveys_with_sub_clans': clan_surveys_with_sub_clans,
    }
    
    return render(request, 'surveys/admin_dashboard.html', context)


@login_required
@user_passes_test(is_admin)
def view_clan_data(request):
    """View all submitted clan data"""
    # Import clan models (try to avoid circular imports)
    try:
        from .models import Clan, SubClan, Ridge
        clan_models_available = True
    except ImportError:
        clan_models_available = False
    
    if not clan_models_available:
        messages.error(request, 'Clan models are not available.')
        return redirect('admin_dash:dashboard')
    
    # Get all clans with their survey responses
    clans_data = []
    clans = Clan.objects.all().order_by('-created_at')
    
    for clan in clans:
        # Get survey responses for this clan
        survey_responses = SurveyResponse.objects.filter(survey=clan.survey).order_by('-submitted_at')
        
        clan_info = {
            'clan': clan,
            'survey_responses': survey_responses,
            'response_count': survey_responses.count(),
            'sub_clans_count': clan.sub_clans.count(),
            'ridges_count': Ridge.objects.filter(sub_clan__clan=clan).count()
        }
        clans_data.append(clan_info)
    
    # Calculate totals
    total_sub_clans = sum(clan_info['sub_clans_count'] for clan_info in clans_data)
    total_ridges = sum(clan_info['ridges_count'] for clan_info in clans_data)
    total_responses = sum(clan_info['response_count'] for clan_info in clans_data)
    
    return render(request, 'surveys/admin/view_clan_data.html', {
        'clans_data': clans_data,
        'total_clans': clans.count(),
        'total_sub_clans': total_sub_clans,
        'total_ridges': total_ridges,
        'total_responses': total_responses
    })


@login_required
@user_passes_test(is_admin)
def view_sub_clan_data(request):
    """View all submitted sub-clan data"""
    # Import clan models (try to avoid circular imports)
    try:
        from .models import Clan, SubClan, Ridge
        clan_models_available = True
    except ImportError:
        clan_models_available = False
    
    if not clan_models_available:
        messages.error(request, 'Clan models are not available.')
        return redirect('admin_dash:dashboard')
    
    # Get all sub-clans with their data
    sub_clans_data = []
    sub_clans = SubClan.objects.all().order_by('-created_at')
    
    for sub_clan in sub_clans:
        ridges_count = sub_clan.ridges.count()
        sub_clan_info = {
            'sub_clan': sub_clan,
            'ridges_count': ridges_count,
            'ridges': sub_clan.ridges.all()
        }
        sub_clans_data.append(sub_clan_info)
    
    return render(request, 'surveys/admin/view_sub_clan_data.html', {
        'sub_clans_data': sub_clans_data,
        'total_sub_clans': sub_clans.count()
    })


@login_required
@user_passes_test(is_admin)
def view_ridge_data(request):
    """View all submitted ridge data"""
    # Import clan models (try to avoid circular imports)
    try:
        from .models import Clan, SubClan, Ridge
        clan_models_available = True
    except ImportError:
        clan_models_available = False
    
    if not clan_models_available:
        messages.error(request, 'Clan models are not available.')
        return redirect('admin_dash:dashboard')
    
    # Get all ridges with their data
    ridges_data = Ridge.objects.all().order_by('-created_at')
    
    return render(request, 'surveys/admin/view_ridge_data.html', {
        'ridges_data': ridges_data,
        'total_ridges': ridges_data.count()
    })


@login_required
@user_passes_test(is_admin)
def export_clan_data_pdf(request):
    """Export clan data as PDF"""
    # Import clan models (try to avoid circular imports)
    try:
        from .models import Clan, SubClan, Ridge
        clan_models_available = True
    except ImportError:
        clan_models_available = False
    
    if not clan_models_available:
        messages.error(request, 'Clan models are not available.')
        return redirect('admin_dash:dashboard')
    
    # Get all clans data
    clans_data = []
    clans = Clan.objects.all().order_by('name')
    
    for clan in clans:
        survey_responses = SurveyResponse.objects.filter(survey=clan.survey).order_by('-submitted_at')
        clan_info = {
            'clan': clan,
            'survey_responses': survey_responses,
            'response_count': survey_responses.count(),
            'sub_clans_count': clan.sub_clans.count(),
            'ridges_count': Ridge.objects.filter(sub_clan__clan=clan).count()
        }
        clans_data.append(clan_info)
    
    # Generate PDF using ReportLab
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from io import BytesIO
    
    # Create PDF buffer
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1,  # Center
        textColor=colors.darkblue
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        textColor=colors.darkgreen
    )
    
    # Build PDF content
    content = []
    
    # Title
    content.append(Paragraph("OBB Clan Data Report", title_style))
    content.append(Spacer(1, 12))
    content.append(Paragraph(f"Total Clans: {clans.count()}", styles['Normal']))
    content.append(Paragraph(f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    content.append(Spacer(1, 20))
    
    # Add clan data
    for clan_data in clans_data:
        clan = clan_data['clan']
        
        # Clan title
        content.append(Paragraph(f"Clan: {clan.name}", heading_style))
        
        # Clan information table
        clan_info_data = [
            ['Village', clan.village or 'N/A'],
            ['Parish', clan.parish or 'N/A'],
            ['Sub County', clan.sub_county or 'N/A'],
            ['District', clan.district or 'N/A'],
            ['Clan Head', clan.clan_head_name or 'N/A'],
            ['Contact', clan.clan_head_contact or 'N/A'],
            ['Email', clan.clan_head_email or 'N/A'],
            ['Status', 'Active' if clan.is_active else 'Inactive'],
            ['Sub-clans Count', str(clan_data['sub_clans_count'])],
            ['Ridges Count', str(clan_data['ridges_count'])],
            ['Survey Responses', str(clan_data['response_count'])],
        ]
        
        clan_table = Table(clan_info_data, colWidths=[2*inch, 3*inch])
        clan_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        content.append(clan_table)
        content.append(Spacer(1, 20))
    
    # Build PDF
    doc.build(content)
    
    # Get PDF value
    pdf = buffer.getvalue()
    buffer.close()
    
    # Create response
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="clan_data_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
    
    return response


@login_required
@user_passes_test(is_admin)
def export_sub_clan_data_pdf(request):
    """Export sub-clan data as PDF"""
    # Import clan models (try to avoid circular imports)
    try:
        from .models import Clan, SubClan, Ridge
        clan_models_available = True
    except ImportError:
        clan_models_available = False
    
    if not clan_models_available:
        messages.error(request, 'Clan models are not available.')
        return redirect('admin_dash:dashboard')
    
    # Get all sub-clans data
    sub_clans_data = []
    sub_clans = SubClan.objects.all().order_by('name')
    
    for sub_clan in sub_clans:
        sub_clan_info = {
            'sub_clan': sub_clan,
            'ridges_count': sub_clan.ridges.count(),
            'ridges': sub_clan.ridges.all()
        }
        sub_clans_data.append(sub_clan_info)
    
    # Generate PDF using ReportLab
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from io import BytesIO
    
    # Create PDF buffer
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1,  # Center
        textColor=colors.darkblue
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        textColor=colors.darkgreen
    )
    
    # Build PDF content
    content = []
    
    # Title
    content.append(Paragraph("OBB Sub-Clan Data Report", title_style))
    content.append(Spacer(1, 12))
    content.append(Paragraph(f"Total Sub-Clans: {sub_clans.count()}", styles['Normal']))
    content.append(Paragraph(f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    content.append(Spacer(1, 20))
    
    # Add sub-clan data
    for sub_clan_data in sub_clans_data:
        sub_clan = sub_clan_data['sub_clan']
        
        # Sub-clan title
        content.append(Paragraph(f"Sub-Clan: {sub_clan.name}", heading_style))
        
        # Sub-clan information table
        sub_clan_info_data = [
            ['Parent Clan', sub_clan.clan.name if sub_clan.clan else 'N/A'],
            ['Leader Name', sub_clan.leader_name or 'N/A'],
            ['Contact', sub_clan.leader_contact or 'N/A'],
            ['Email', sub_clan.leader_email or 'N/A'],
            ['Status', 'Active' if sub_clan.is_active else 'Inactive'],
            ['Ridges Count', str(sub_clan_data['ridges_count'])],
        ]
        
        sub_clan_table = Table(sub_clan_info_data, colWidths=[2*inch, 3*inch])
        sub_clan_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        content.append(sub_clan_table)
        
        # Add ridges if any
        if sub_clan_data['ridges']:
            content.append(Spacer(1, 12))
            content.append(Paragraph("Ridges:", styles['Heading3']))
            
            ridge_data = [['Name', 'Leader', 'Contact', 'Status']]
            for ridge in sub_clan_data['ridges']:
                ridge_data.append([
                    ridge.name or 'N/A',
                    ridge.leader_name or 'N/A',
                    ridge.leader_contact or 'N/A',
                    'Active' if ridge.is_active else 'Inactive'
                ])
            
            ridge_table = Table(ridge_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1*inch])
            ridge_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            content.append(ridge_table)
        
        content.append(Spacer(1, 20))
    
    # Build PDF
    doc.build(content)
    
    # Get PDF value
    pdf = buffer.getvalue()
    buffer.close()
    
    # Create response
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="sub_clan_data_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
    
    return response


@login_required
@user_passes_test(is_admin)
def export_ridge_data_pdf(request):
    """Export ridge data as PDF"""
    # Import clan models (try to avoid circular imports)
    try:
        from .models import Clan, SubClan, Ridge
        clan_models_available = True
    except ImportError:
        clan_models_available = False
    
    if not clan_models_available:
        messages.error(request, 'Clan models are not available.')
        return redirect('admin_dash:dashboard')
    
    # Get all ridges data
    ridges_data = Ridge.objects.all().order_by('sub_clan__clan__name', 'sub_clan__name', 'name')
    
    # Generate PDF using ReportLab
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from io import BytesIO
    
    # Create PDF buffer
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1,  # Center
        textColor=colors.darkblue
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        textColor=colors.darkgreen
    )
    
    # Build PDF content
    content = []
    
    # Title
    content.append(Paragraph("OBB Ridge Data Report", title_style))
    content.append(Spacer(1, 12))
    content.append(Paragraph(f"Total Ridges: {ridges_data.count()}", styles['Normal']))
    content.append(Paragraph(f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    content.append(Spacer(1, 20))
    
    # Add ridge data
    for ridge in ridges_data:
        # Ridge title
        content.append(Paragraph(f"Ridge: {ridge.name}", heading_style))
        
        # Ridge information table
        ridge_info_data = [
            ['Parent Sub-Clan', ridge.sub_clan.name if ridge.sub_clan else 'N/A'],
            ['Parent Clan', ridge.sub_clan.clan.name if ridge.sub_clan and ridge.sub_clan.clan else 'N/A'],
            ['Leader Name', ridge.leader_name or 'N/A'],
            ['Contact', ridge.leader_contact or 'N/A'],
            ['Email', ridge.leader_email or 'N/A'],
            ['Status', 'Active' if ridge.is_active else 'Inactive'],
        ]
        
        ridge_table = Table(ridge_info_data, colWidths=[2*inch, 3*inch])
        ridge_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        content.append(ridge_table)
        content.append(Spacer(1, 20))
    
    # Build PDF
    doc.build(content)
    
    # Get PDF value
    pdf = buffer.getvalue()
    buffer.close()
    
    # Create response
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="ridge_data_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
    
    return response


@login_required
@user_passes_test(is_super_admin)
def super_admin_dashboard(request):
    """Super admin dashboard with system overview"""
    # Import clan models (try to avoid circular imports)
    try:
        from .models import Clan, SubClan, Ridge, Population, ExecutiveCommittee, Structure, Resource
        clan_models_available = True
    except ImportError:
        clan_models_available = False
    
    # System statistics
    total_surveys = Survey.objects.count()
    active_surveys = Survey.objects.filter(is_active=True).count()
    total_responses = SurveyResponse.objects.count()
    total_users = User.objects.count()
    admin_users = User.objects.filter(is_staff=True).count()
    super_admin_users = User.objects.filter(is_superuser=True).count()
    
    # User activity
    active_users_7days = User.objects.filter(
        last_login__gte=timezone.now() - timedelta(days=7)
    ).count()
    
    # Clan system statistics if models are available
    if clan_models_available:
        total_clans = Clan.objects.count()
        active_clans = Clan.objects.filter(is_active=True).count()
        
        # Safely count related models
        try:
            total_sub_clans = SubClan.objects.count()
        except:
            total_sub_clans = 0
        
        try:
            total_ridges = Ridge.objects.count()
        except:
            total_ridges = 0
            
        try:
            total_committee_members = ExecutiveCommittee.objects.count()
        except:
            total_committee_members = 0
            
        try:
            total_structures = Structure.objects.count()
        except:
            total_structures = 0
            
        try:
            total_resources = Resource.objects.count()
        except:
            total_resources = 0
        
        # Clan distribution by district
        clan_distribution = Clan.objects.values('district').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        # Recent clans
        recent_clans = Clan.objects.order_by('-created_at')[:5]
        
        # Top clan creators
        top_creators = User.objects.annotate(
            clan_count=Count('clans_created')
        ).order_by('-clan_count')[:5]
        
        # Clan activity (clans with most sub-clans and ridges)
        try:
            clan_hierarchy_stats = Clan.objects.annotate(
                sub_clans_total=Count('sub_clans'),
                ridges_total=Count('ridges'),
                structures_total=Count('structures')
            ).order_by('-sub_clans_total')[:5]
        except FieldError:
            # Fallback if ridge or structure relationships don't exist (migrations not applied)
            clan_hierarchy_stats = Clan.objects.annotate(
                sub_clans_total=Count('sub_clans')
            ).order_by('-sub_clans_total')[:5]
    else:
        total_clans = active_clans = total_sub_clans = total_ridges = 0
        total_committee_members = total_structures = total_resources = 0
        clan_distribution = []
        recent_clans = []
        top_creators = []
        clan_hierarchy_stats = []
    
    # Survey completion rates
    survey_completion = []
    for survey in Survey.objects.annotate(response_count=Count('responses')):
        if survey.questions.exists():
            completion_rate = (survey.response_count / survey.questions.count()) * 100
            survey_completion.append({
                'title': survey.title,
                'completion_rate': min(completion_rate, 100)
            })
    
    # Response distribution by user type
    authenticated_responses = SurveyResponse.objects.filter(user__isnull=False).count()
    anonymous_responses = SurveyResponse.objects.filter(user__isnull=True).count()
    
    # Popular question types
    question_types = Question.objects.values('question_type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    context = {
        'total_surveys': total_surveys,
        'active_surveys': active_surveys,
        'total_responses': total_responses,
        'total_users': total_users,
        'admin_users': admin_users,
        'super_admin_users': super_admin_users,
        'active_users_7days': active_users_7days,
        'survey_completion': survey_completion[:5],
        'authenticated_responses': authenticated_responses,
        'anonymous_responses': anonymous_responses,
        'question_types': question_types,
        # Clan system statistics
        'clan_models_available': clan_models_available,
        'total_clans': total_clans,
        'active_clans': active_clans,
        'total_sub_clans': total_sub_clans,
        'total_ridges': total_ridges,
        'total_committee_members': total_committee_members,
        'total_structures': total_structures,
        'total_resources': total_resources,
        'clan_distribution': clan_distribution,
        'recent_clans': recent_clans,
        'top_creators': top_creators,
        'clan_hierarchy_stats': clan_hierarchy_stats,
    }
    
    return render(request, 'surveys/admin/super_admin_dashboard.html', context)


@login_required
@user_passes_test(is_admin)
def admin_surveys(request):
    """Admin survey management view"""
    surveys = Survey.objects.all().order_by('-created_at')
    
    # Search functionality
    search = request.GET.get('search', '')
    if search:
        surveys = surveys.filter(
            Q(title__icontains=search) | 
            Q(description__icontains=search)
        )
    
    # Filter by status
    status = request.GET.get('status', '')
    if status == 'active':
        surveys = surveys.filter(is_active=True)
    elif status == 'inactive':
        surveys = surveys.filter(is_active=False)
    
    # Pagination
    paginator = Paginator(surveys, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'surveys/admin/surveys.html', {
        'page_obj': page_obj,
        'search': search,
        'status': status,
    })


@login_required
@user_passes_test(is_admin)
def admin_responses(request):
    """Admin response management view"""
    responses = SurveyResponse.objects.select_related('survey', 'user').order_by('-submitted_at')
    
    # Filter by survey
    survey_id = request.GET.get('survey', '')
    if survey_id:
        responses = responses.filter(survey_id=survey_id)
    
    # Filter by date range
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    if date_from:
        responses = responses.filter(submitted_at__date__gte=date_from)
    if date_to:
        responses = responses.filter(submitted_at__date__lte=date_to)
    
    # Pagination
    paginator = Paginator(responses, 25)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    surveys = Survey.objects.all()
    
    return render(request, 'surveys/admin/responses.html', {
        'page_obj': page_obj,
        'surveys': surveys,
        'survey_id': survey_id,
        'date_from': date_from,
        'date_to': date_to,
    })


@login_required
@user_passes_test(is_super_admin)
def admin_users(request):
    """Super admin user management view"""
    users = User.objects.all().order_by('-date_joined')
    
    # Search functionality
    search = request.GET.get('search', '')
    if search:
        users = users.filter(
            Q(username__icontains=search) | 
            Q(email__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)
        )
    
    # Filter by role
    role = request.GET.get('role', '')
    if role == 'admin':
        users = users.filter(is_staff=True, is_superuser=False)
    elif role == 'super_admin':
        users = users.filter(is_superuser=True)
    elif role == 'regular':
        users = users.filter(is_staff=False, is_superuser=False)
    
    # Pagination
    paginator = Paginator(users, 25)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'surveys/admin/users.html', {
        'page_obj': page_obj,
        'search': search,
        'role': role,
    })


@login_required
@user_passes_test(is_super_admin)
def create_user(request):
    """Create a new user with role assignment"""
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')
        role = request.POST.get('role', 'regular')
        
        # Validation
        errors = {}
        if not username:
            errors['username'] = 'Username is required.'
        elif User.objects.filter(username=username).exists():
            errors['username'] = 'Username already exists.'
        
        if not email:
            errors['email'] = 'Email is required.'
        elif User.objects.filter(email=email).exists():
            errors['email'] = 'Email already exists.'
        
        if not password:
            errors['password'] = 'Password is required.'
        elif len(password) < 8:
            errors['password'] = 'Password must be at least 8 characters long.'
        
        if password != confirm_password:
            errors['confirm_password'] = 'Passwords do not match.'
        
        if not errors:
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            # Assign role
            if role == 'admin':
                user.is_staff = True
            elif role == 'super_admin':
                user.is_staff = True
                user.is_superuser = True
            
            user.save()
            
            messages.success(request, f'User "{username}" created successfully with {role} role.')
            return redirect('admin_dash:users')
        else:
            messages.error(request, 'Please correct the errors below.')
    
    return render(request, 'surveys/admin/create_user.html')


@login_required
@user_passes_test(is_super_admin)
def edit_user_role(request, user_id):
    """Edit user role and permissions"""
    user = get_object_or_404(User, id=user_id)
    
    if request.method == 'POST':
        role = request.POST.get('role', 'regular')
        is_active = request.POST.get('is_active') == 'on'
        
        # Prevent super admin from modifying their own super admin status
        if user == request.user and role != 'super_admin':
            messages.error(request, 'You cannot remove your own super admin status.')
            return redirect('admin_dash:users')
        
        # Update role
        user.is_staff = False
        user.is_superuser = False
        
        if role == 'admin':
            user.is_staff = True
        elif role == 'super_admin':
            user.is_staff = True
            user.is_superuser = True
        
        user.is_active = is_active
        user.save()
        
        messages.success(request, f'User "{user.username}" role updated to {role}.')
        return redirect('admin_dash:users')
    
    return render(request, 'surveys/admin/edit_user.html', {'target_user': user})


@login_required
@user_passes_test(is_super_admin)
def delete_user(request, user_id):
    """Delete a user account"""
    user = get_object_or_404(User, id=user_id)
    
    # Prevent self-deletion
    if user == request.user:
        messages.error(request, 'You cannot delete your own account.')
        return redirect('admin_dash:users')
    
    if request.method == 'POST':
        confirm_text = request.POST.get('confirm_text', '').strip()
        
        if confirm_text != 'DELETE':
            messages.error(request, 'Please type "DELETE" exactly as shown to confirm.')
            return render(request, 'surveys/admin/delete_user.html', {'target_user': user})
        
        username = user.username
        user.delete()
        messages.success(request, f'User "{username}" deleted successfully.')
        return redirect('admin_dash:users')
    
    return render(request, 'surveys/admin/delete_user.html', {'target_user': user})


@login_required
@user_passes_test(is_super_admin)
def reset_user_password(request, user_id):
    """Reset user password"""
    user = get_object_or_404(User, id=user_id)
    
    if request.method == 'POST':
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        
        # Validation
        errors = {}
        if not new_password:
            errors['new_password'] = 'New password is required.'
        elif len(new_password) < 8:
            errors['new_password'] = 'Password must be at least 8 characters long.'
        
        if new_password != confirm_password:
            errors['confirm_password'] = 'Passwords do not match.'
        
        if not errors:
            # Reset password
            user.set_password(new_password)
            user.save()
            
            messages.success(request, f'Password for "{user.username}" has been reset successfully.')
            return redirect('admin_dash:users')
        else:
            messages.error(request, 'Please correct the errors below.')
    
    return render(request, 'surveys/admin/reset_password.html', {'target_user': user})


class RoleBasedLoginView(auth_views.LoginView):
    """Custom login view that redirects users based on their role"""
    
    def get_success_url(self):
        user = self.request.user
        if user.is_superuser:
            return '/admin-dashboard/super-admin/'
        elif user.is_staff:
            return '/admin-dashboard/'
        else:
            return '/surveys/'
    
    def form_invalid(self, form):
        messages.error(self.request, 'Invalid username or password. Please try again.')
        return super().form_invalid(form)


@login_required
def create_survey(request):
    """Create a new clan"""
    if request.method == 'POST':
        # Get form data that matches Clan model fields
        name = request.POST.get('name')
        description = request.POST.get('description', '')
        village = request.POST.get('village')
        parish = request.POST.get('parish')
        sub_county = request.POST.get('sub_county')
        district = request.POST.get('district')
        clan_head_name = request.POST.get('clan_head_name')
        clan_head_contact = request.POST.get('clan_head_contact', '')
        clan_head_email = request.POST.get('clan_head_email', '')
        is_active = request.POST.get('is_active') == 'on'
        
        # Validate required fields
        if not name or not village or not parish or not sub_county or not district or not clan_head_name:
            messages.error(request, 'Please fill in all required fields marked with *.')
            return render(request, 'surveys/create_survey.html')
        
        try:
            # Check if clan name already exists
            if Clan.objects.filter(name=name).exists():
                messages.error(request, f'A clan named "{name}" already exists. Please choose a different name.')
                return render(request, 'surveys/create_survey.html')
            
            # Create a survey first (required by Clan model)
            survey = Survey.objects.create(
                title=name,
                description=description,
                allow_anonymous=False,
                is_active=is_active,
                is_clan=True,
                created_by=request.user
            )
            
            # Create the clan with all the fields
            clan = Clan.objects.create(
                name=name,
                description=description,
                village=village,
                parish=parish,
                sub_county=sub_county,
                district=district,
                clan_head_name=clan_head_name,
                clan_head_contact=clan_head_contact,
                clan_head_email=clan_head_email,
                is_active=is_active,
                created_by=request.user,
                survey=survey
            )
            
            messages.success(request, f'Clan "{name}" created successfully! You can now add sub-clans and manage clan data.')
            return redirect('surveys:survey_list')
            
        except Exception as e:
            messages.error(request, f'Error creating clan: {str(e)}')
            return render(request, 'surveys/create_survey.html')
    
    return render(request, 'surveys/create_survey.html')


@login_required
def create_sub_clan(request, clan_id=None):
    """Create a sub-clan under a parent clan"""
    # Check if clan models are available
    try:
        from .models import Clan, SubClan, Ridge
        clan_models_available = True
    except ImportError:
        clan_models_available = False
    
    if not clan_models_available:
        messages.error(request, 'Clan management features are not available.')
        return redirect('surveys:survey_list')
    
    # Get the parent clan
    if clan_id:
        clan = get_object_or_404(Clan, id=clan_id)
    else:
        clan_id = request.POST.get('clan_id')
        clan = get_object_or_404(Clan, id=clan_id)
    
    # Concurrent access control - lock the clan for sub-clan creation
    from .concurrent_utils import concurrent_access_required, release_form_lock
    lock_type = 'sub_clan_create'
    
    # Try to acquire lock for this clan
    from .models_concurrent import FormLock
    lock = FormLock.acquire_lock(
        lock_type=lock_type,
        object_id=clan.id,
        user=request.user,
        session_key=request.session.session_key,
        duration=30
    )
    
    if not lock:
        # Get existing lock info
        existing_lock = FormLock.get_active_lock(lock_type, clan.id)
        if existing_lock:
            messages.error(
                request,
                f'This clan is currently being edited by {existing_lock.user.get_full_name() or existing_lock.user.username}. '
                f'Please try again in a few minutes.'
            )
        else:
            messages.error(request, 'Unable to acquire lock for this clan. Please try again.')
        return redirect('surveys:survey_list')
    
    # Start editing session
    from .models_concurrent import EditSession, CollaborationEvent
    EditSession.start_session(
        session_type='sub_clan_create',
        object_id=clan.id,
        user=request.user,
        session_key=request.session.session_key
    )
    
    # Log collaboration event
    CollaborationEvent.objects.create(
        event_type='form_locked',
        session_type='sub_clan_create',
        object_id=clan.id,
        user=request.user,
        data={'lock_type': lock_type, 'clan_name': clan.name}
    )
    
    if request.method == 'POST':
        # Get form data that matches SubClan model fields
        name = request.POST.get('name')
        address = request.POST.get('address')
        leader_name = request.POST.get('leader_name')
        leader_contact = request.POST.get('leader_contact', '')
        is_active = request.POST.get('is_active') == 'on'
        
        # Validate required fields
        if not name or not address or not leader_name:
            messages.error(request, 'Please fill in all required fields marked with *.')
            return render(request, 'surveys/create_sub_clan.html', {'clan': clan})
        
        try:
            # Check if sub-clan name already exists for this clan
            if SubClan.objects.filter(clan=clan, name=name).exists():
                messages.error(request, f'A sub-clan named "{name}" already exists in {clan.name}. Please choose a different name.')
                return render(request, 'surveys/create_sub_clan.html', {'clan': clan})
            
            # Debug: Print the values we're trying to save
            print(f"Creating sub-clan with: clan={clan}, name={name}, address={address}, leader_name={leader_name}, leader_contact={leader_contact}, is_active={is_active}, created_by={request.user}")
            
            # Create the sub-clan with all the fields
            sub_clan = SubClan.objects.create(
                clan=clan,
                name=name,
                address=address,
                leader_name=leader_name,
                leader_contact=leader_contact,
                is_active=is_active,
                created_by=request.user
            )
            
            # Log form submission event
            CollaborationEvent.objects.create(
                event_type='form_submitted',
                session_type='sub_clan_create',
                object_id=clan.id,
                user=request.user,
                data={'sub_clan_name': name, 'clan_name': clan.name}
            )
            
            # Release the lock
            release_form_lock(lock_type, clan.id, request.user)
            
            # End editing session
            EditSession.end_session('sub_clan_create', clan.id, request.user, request.session.session_key)
            
            messages.success(request, f'Sub-clan "{name}" created successfully under {clan.name}!')
            return redirect('surveys:survey_list')
            
        except Exception as e:
            # Debug: Print the full error
            print(f"Error creating sub-clan: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            messages.error(request, f'Error creating sub-clan: {str(e)}')
            return render(request, 'surveys/create_sub_clan.html', {'clan': clan})
    
    return render(request, 'surveys/create_sub_clan.html', {'clan': clan})


@login_required
def create_sub_clan_survey(request, sub_clan_id=None):
    """Create a sub-clan survey questionnaire"""
    # Check if sub-clan models are available
    try:
        from .models import Clan, SubClan, Ridge, SubClanSurvey, SubClanQuestion
        sub_clan_models_available = True
    except ImportError:
        sub_clan_models_available = False
    
    if not sub_clan_models_available:
        messages.error(request, 'Sub-clan survey features are not available.')
        return redirect('surveys:survey_list')
    
    # Get the sub-clan
    if sub_clan_id:
        sub_clan = get_object_or_404(SubClan, id=sub_clan_id)
    else:
        sub_clan_id = request.POST.get('sub_clan_id')
        sub_clan = get_object_or_404(SubClan, id=sub_clan_id)
    
    if request.method == 'POST':
        # Get form data
        title = request.POST.get('title')
        description = request.POST.get('description', '')
        is_active = request.POST.get('is_active') == 'on'
        allow_anonymous = request.POST.get('allow_anonymous') == 'on'
        
        # Validate required fields
        if not title:
            messages.error(request, 'Please provide a title for the sub-clan survey.')
            return render(request, 'surveys/create_sub_clan_survey.html', {'sub_clan': sub_clan})
        
        try:
            # Create the sub-clan survey
            sub_clan_survey = SubClanSurvey.objects.create(
                sub_clan=sub_clan,
                title=title,
                description=description,
                is_active=is_active,
                allow_anonymous=allow_anonymous,
                created_by=request.user
            )
            
            # Copy questions from the parent clan survey
            try:
                # Get the parent clan survey
                clan = sub_clan.clan
                clan_survey = clan.survey
                
                if clan_survey and clan_survey.is_clan:
                    # Copy all questions from the clan survey to the sub-clan survey
                    clan_questions = clan_survey.questions.all().order_by('order')
                    
                    for clan_question in clan_questions:
                        SubClanQuestion.objects.create(
                            sub_clan_survey=sub_clan_survey,
                            text=clan_question.text,
                            question_type=clan_question.question_type,
                            required=clan_question.required,
                            order=clan_question.order,
                            options=clan_question.options
                        )
                    
                    messages.success(request, f'Sub-clan survey "{title}" created successfully for {sub_clan.name} with {clan_questions.count()} questions copied from the clan survey!')
                else:
                    messages.success(request, f'Sub-clan survey "{title}" created successfully for {sub_clan.name}!')
                    
            except Exception as copy_error:
                # If copying fails, still create the survey but notify the user
                messages.warning(request, f'Sub-clan survey "{title}" created for {sub_clan.name}, but could not copy questions: {str(copy_error)}')
            
            return redirect('surveys:survey_list')
            
        except Exception as e:
            messages.error(request, f'Error creating sub-clan survey: {str(e)}')
            return render(request, 'surveys/create_sub_clan_survey.html', {'sub_clan': sub_clan})
    
    return render(request, 'surveys/create_sub_clan_survey.html', {'sub_clan': sub_clan})


@login_required
def take_sub_clan_survey(request, sub_clan_id):
    """Take a sub-clan survey - fill in information about the sub-clan"""
    # Check if sub-clan models are available
    try:
        from .models import SubClan, Survey, Question, SurveyResponse, Answer
        sub_clan_models_available = True
    except ImportError:
        sub_clan_models_available = False
    
    if not sub_clan_models_available:
        messages.error(request, 'Sub-clan survey features are not available.')
        return redirect('surveys:survey_list')
    
    # Get the sub-clan
    sub_clan = get_object_or_404(SubClan, id=sub_clan_id)
    
    # Get the parent clan survey to use its questions
    try:
        clan = sub_clan.clan
        clan_survey = clan.survey
        questions = clan_survey.questions.all().order_by('order') if clan_survey else []
    except:
        questions = []
    
    # Check if user has already completed this sub-clan survey
    user_responses_count = SurveyResponse.objects.filter(
        survey=clan_survey, user=request.user
    ).count() if clan_survey else 0
    
    if request.method == 'POST':
        # Check if user has already submitted
        if user_responses_count > 0:
            messages.error(request, 'You have already completed this sub-clan survey.')
            return redirect('surveys:survey_list')
        
        try:
            # Create the survey response
            response = SurveyResponse.objects.create(
                survey=clan_survey,
                user=request.user,
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            # Process each question
            for question in questions:
                answer_key = f'question_{question.id}'
                answer_text = request.POST.get(answer_key, '')
                
                # Store the answer
                Answer.objects.create(
                    response=response,
                    question=question,
                    answer_text=answer_text,
                    answer_data={'answer': answer_text, 'sub_clan_id': sub_clan.id}
                )
            
            messages.success(request, f'Thank you for completing the survey for {sub_clan.name}!')
            return redirect('surveys:survey_list')
            
        except Exception as e:
            messages.error(request, f'Error submitting survey: {str(e)}')
            return render(request, 'surveys/take_sub_clan_survey.html', {
                'sub_clan': sub_clan,
                'clan_survey': clan_survey,
                'questions': questions
            })
    
    return render(request, 'surveys/take_sub_clan_survey.html', {
        'sub_clan': sub_clan,
        'clan_survey': clan_survey,
        'questions': questions,
        'user_responses_count': user_responses_count
    })


@login_required
def sub_clan_obb_survey(request, sub_clan_id):
    """Comprehensive OBB survey form for sub-clans"""
    # Check if sub-clan models are available
    try:
        from .models import SubClan, SubClanSurveyData
        sub_clan_models_available = True
    except ImportError:
        sub_clan_models_available = False
    
    if not sub_clan_models_available:
        messages.error(request, 'Sub-clan survey features are not available.')
        return redirect('surveys:survey_list')
    
    # Get the sub-clan
    sub_clan = get_object_or_404(SubClan, id=sub_clan_id)
    
    if request.method == 'POST':
        try:
            # Create sub-clan survey data record
            survey_data = SubClanSurveyData.objects.create(
                sub_clan=sub_clan,
                surveyor=request.user,
                # Basic Details
                households_count=request.POST.get('households_count'),
                ridges_count=request.POST.get('ridges_count'),
                village=request.POST.get('village'),
                parish=request.POST.get('parish'),
                sub_county=request.POST.get('sub_county'),
                district=request.POST.get('district'),
                
                # Population Data
                total_households=request.POST.get('total_households'),
                total_population=request.POST.get('total_population'),
                male_population=request.POST.get('male_population'),
                female_population=request.POST.get('female_population'),
                youth_population=request.POST.get('youth_population'),
                
                # Meeting Information
                meeting_frequency=request.POST.get('meeting_frequency'),
                meeting_frequency_other=request.POST.get('meeting_frequency_other'),
                
                # Saving Group Information
                saving_group=request.POST.get('saving_group'),
                saving_group_name=request.POST.get('saving_group_name'),
                saving_group_no_reason=request.POST.get('saving_group_no_reason'),
                saving_group_year=request.POST.get('saving_group_year'),
                saving_group_initiator=request.POST.get('saving_group_initiator'),
                saving_group_initiator_spec=request.POST.get('saving_group_initiator_spec'),
                saving_group_registered=request.POST.get('saving_group_registered'),
                membership_fee=request.POST.get('membership_fee'),
                membership_fee_amount=request.POST.get('membership_fee_amount'),
                shares_required=request.POST.get('shares_required'),
                shares_amount=request.POST.get('shares_amount'),
                annual_subscription=request.POST.get('annual_subscription'),
                annual_amount=request.POST.get('annual_amount'),
                adults_male=request.POST.get('adults_male'),
                adults_female=request.POST.get('adults_female'),
                youth_male=request.POST.get('youth_male'),
                youth_female=request.POST.get('youth_female'),
                coordinator_name=request.POST.get('coordinator_name'),
                coordinator_education=request.POST.get('coordinator_education'),
                coordinator_phone=request.POST.get('coordinator_phone'),
                loan_officer_name=request.POST.get('loan_officer_name'),
                loan_officer_education=request.POST.get('loan_officer_education'),
                loan_officer_phone=request.POST.get('loan_officer_phone'),
                gov_programs_heard=request.POST.get('gov_programs_heard'),
                gov_programs_benefited=request.POST.get('gov_programs_benefited'),
                info_source=request.POST.get('info_source'),
                
                # Store all additional form data as JSON
                additional_data={}
            )
            
            # Store executive committee data
            executive_data = []
            executive_count = int(request.POST.get('executive_count', 1))
            for i in range(1, executive_count + 1):
                if request.POST.get(f'exec_name_{i}'):
                    executive_data.append({
                        'name': request.POST.get(f'exec_name_{i}'),
                        'sex': request.POST.get(f'exec_sex_{i}'),
                        'position': request.POST.get(f'exec_position_{i}'),
                        'education': request.POST.get(f'exec_education_{i}'),
                        'phone': request.POST.get(f'exec_phone_{i}')
                    })
            survey_data.executive_committee = executive_data
            
            # Store structures data
            structures_data = []
            structure_count = int(request.POST.get('structure_count', 1))
            for i in range(1, structure_count + 1):
                if request.POST.get(f'struct_address_{i}'):
                    structures_data.append({
                        'address': request.POST.get(f'struct_address_{i}'),
                        'type': request.POST.get(f'struct_type_{i}'),
                        'staff': request.POST.get(f'struct_staff_{i}')
                    })
            survey_data.structures = structures_data
            
            # Store resources data
            resources_data = []
            resource_count = int(request.POST.get('resource_count', 4))
            for i in range(1, resource_count + 1):
                if request.POST.get(f'resource_item_{i}'):
                    resources_data.append({
                        'item': request.POST.get(f'resource_item_{i}'),
                        'size': request.POST.get(f'resource_size_{i}'),
                        'value': request.POST.get(f'resource_value_{i}'),
                        'owned': request.POST.get(f'resource_owned_{i}') == 'on',
                        'rented': request.POST.get(f'resource_rented_{i}') == 'on'
                    })
            survey_data.resources = resources_data
            
            # Store challenges data
            challenges = []
            for i in range(1, 10):
                if request.POST.get(f'challenge_{i}'):
                    challenges.append(request.POST.get(f'challenge_{i}'))
            if request.POST.get('challenge_other'):
                challenges.append(f"Other: {request.POST.get('challenge_other')}")
            survey_data.challenges = challenges
            
            # Store education data
            education_data = []
            education_count = int(request.POST.get('education_count', 9))
            for i in range(1, education_count + 1):
                if request.POST.get(f'edu_pop_{i}'):
                    education_data.append({
                        'level': request.POST.get(f'edu_level_{i}', f"Level {i}"),
                        'population': request.POST.get(f'edu_pop_{i}'),
                        'employment': request.POST.get(f'edu_employment_{i}')
                    })
            survey_data.education_data = education_data
            
            # Store educated persons data
            educated_persons_data = []
            educated_count = int(request.POST.get('educated_count', 1))
            for i in range(1, educated_count + 1):
                if request.POST.get(f'educated_name_{i}'):
                    educated_persons_data.append({
                        'name': request.POST.get(f'educated_name_{i}'),
                        'sex': request.POST.get(f'educated_sex_{i}'),
                        'age': request.POST.get(f'educated_age_{i}'),
                        'level': request.POST.get(f'educated_level_{i}'),
                        'specialization': request.POST.get(f'educated_specialization_{i}'),
                        'contact': request.POST.get(f'educated_contact_{i}'),
                        'location': request.POST.get(f'educated_location_{i}')
                    })
            survey_data.educated_persons = educated_persons_data
            
            # Store persons abroad data
            persons_abroad_data = []
            abroad_count = int(request.POST.get('abroad_count', 1))
            for i in range(1, abroad_count + 1):
                if request.POST.get(f'abroad_name_{i}'):
                    persons_abroad_data.append({
                        'name': request.POST.get(f'abroad_name_{i}'),
                        'sex': request.POST.get(f'abroad_sex_{i}'),
                        'age': request.POST.get(f'abroad_age_{i}'),
                        'contact': request.POST.get(f'abroad_contact_{i}'),
                        'country': request.POST.get(f'abroad_country_{i}')
                    })
            survey_data.persons_abroad = persons_abroad_data
            
            # Store political leaders data
            political_leaders = {
                'lci': {
                    'count': request.POST.get('pol_lci_count'),
                    'names': request.POST.get('pol_lci_names'),
                    'contacts': request.POST.get('pol_lci_contacts')
                },
                'lcii': {
                    'count': request.POST.get('pol_lcii_count'),
                    'names': request.POST.get('pol_lcii_names'),
                    'contacts': request.POST.get('pol_lcii_contacts')
                },
                'lciii': {
                    'count': request.POST.get('pol_lciii_count'),
                    'names': request.POST.get('pol_lciii_names'),
                    'contacts': request.POST.get('pol_lciii_contacts')
                },
                'district_councillors': {
                    'count': request.POST.get('pol_dc_count'),
                    'names': request.POST.get('pol_dc_names'),
                    'contacts': request.POST.get('pol_dc_contacts')
                },
                'lcv': {
                    'count': request.POST.get('pol_lcv_count'),
                    'names': request.POST.get('pol_lcv_names'),
                    'contacts': request.POST.get('pol_lcv_contacts')
                },
                'mp': {
                    'count': request.POST.get('pol_mp_count'),
                    'names': request.POST.get('pol_mp_names'),
                    'contacts': request.POST.get('pol_mp_contacts')
                },
                'minister': {
                    'count': request.POST.get('pol_minister_count'),
                    'names': request.POST.get('pol_minister_names'),
                    'contacts': request.POST.get('pol_minister_contacts')
                }
            }
            survey_data.political_leaders = political_leaders
            
            # Store enterprises data
            enterprises = []
            for i in range(1, 7):
                if request.POST.get(f'enterprise_{i}'):
                    enterprises.append(request.POST.get(f'enterprise_{i}'))
            survey_data.enterprises = enterprises
            
            # Store water sources data
            water_sources_data = []
            water_count = int(request.POST.get('water_count', 1))
            for i in range(1, water_count + 1):
                if request.POST.get(f'stream_name_{i}'):
                    water_sources_data.append({
                        'name': request.POST.get(f'stream_name_{i}'),
                        'heritage_type': request.POST.get(f'heritage_type_{i}'),
                        'village': request.POST.get(f'stream_village_{i}'),
                        'parish': request.POST.get(f'stream_parish_{i}'),
                        'historical_usage': request.POST.get(f'historical_usage_{i}')
                    })
            survey_data.water_sources = water_sources_data
            
            # Store environmental projects
            env_projects = []
            for i in range(1, 5):
                if request.POST.get(f'env_project_{i}'):
                    env_projects.append(request.POST.get(f'env_project_{i}'))
            if request.POST.get('env_project_other'):
                env_projects.append(f"Other: {request.POST.get('env_project_other')}")
            survey_data.environmental_projects = env_projects
            
            # Handle file uploads
            if 'leader_photo' in request.FILES:
                survey_data.leader_photo = request.FILES['leader_photo']
            
            if 'additional_photos' in request.FILES:
                survey_data.additional_photos = request.FILES['additional_photos']
            
            # Store signatures data
            signatures = {
                'data_collector': {
                    'name': request.POST.get('sig_data_collector_name'),
                    'title': request.POST.get('sig_data_collector_title'),
                    'date': request.POST.get('sig_data_collector_date'),
                    'contact': request.POST.get('sig_data_collector_contact'),
                    'signature_data': request.POST.get('sig_data_collector_data')
                },
                'sub_clan_leader': {
                    'name': request.POST.get('sig_clan_leader_name'),
                    'title': request.POST.get('sig_clan_leader_title'),
                    'date': request.POST.get('sig_clan_leader_date'),
                    'contact': request.POST.get('sig_clan_leader_contact'),
                    'signature_data': request.POST.get('sig_clan_leader_data')
                },
                'program_coordinator': {
                    'name': request.POST.get('sig_program_coordinator_name'),
                    'date': request.POST.get('sig_program_coordinator_date'),
                    'contact': request.POST.get('sig_program_coordinator_contact'),
                    'signature_data': request.POST.get('sig_program_coordinator_data')
                },
                'clan_head': {
                    'name': request.POST.get('sig_chairperson_name'),
                    'date': request.POST.get('sig_chairperson_date'),
                    'contact': request.POST.get('sig_chairperson_contact'),
                    'signature_data': request.POST.get('sig_chairperson_data')
                }
            }
            survey_data.signatures = signatures
            
            survey_data.save()
            
            messages.success(request, f'OBB survey for {sub_clan.name} sub-clan submitted successfully!')
            return redirect('surveys:survey_list')
            
        except Exception as e:
            messages.error(request, f'Error submitting survey: {str(e)}')
            return render(request, 'surveys/sub_clan_obb_survey.html', {'sub_clan': sub_clan})
    
    return render(request, 'surveys/sub_clan_obb_survey.html', {'sub_clan': sub_clan})


@login_required
def create_ridge(request, sub_clan_id=None):
    """Create a new ridge (Bitubhi)"""
    # Check if ridge models are available
    try:
        from .models import SubClan, Ridge
        ridge_models_available = True
    except ImportError:
        ridge_models_available = False
    
    if not ridge_models_available:
        messages.error(request, 'Ridge features are not available.')
        return redirect('surveys:survey_list')
    
    # Get the sub-clan if sub_clan_id is provided
    sub_clan = None
    if sub_clan_id:
        sub_clan = get_object_or_404(SubClan, id=sub_clan_id)
    else:
        sub_clan_id = request.POST.get('sub_clan_id')
        if sub_clan_id:
            sub_clan = get_object_or_404(SubClan, id=sub_clan_id)
    
    # Concurrent access control - lock the sub-clan for ridge creation
    if sub_clan:
        from .concurrent_utils import release_form_lock
        lock_type = 'ridge_create'
        
        # Try to acquire lock for this sub-clan
        from .models_concurrent import FormLock
        lock = FormLock.acquire_lock(
            lock_type=lock_type,
            object_id=sub_clan.id,
            user=request.user,
            session_key=request.session.session_key,
            duration=30
        )
        
        if not lock:
            # Get existing lock info
            existing_lock = FormLock.get_active_lock(lock_type, sub_clan.id)
            if existing_lock:
                messages.error(
                    request,
                    f'This sub-clan is currently being edited by {existing_lock.user.get_full_name() or existing_lock.user.username}. '
                    f'Please try again in a few minutes.'
                )
            else:
                messages.error(request, 'Unable to acquire lock for this sub-clan. Please try again.')
            return redirect('surveys:survey_list')
        
        # Start editing session
        from .models_concurrent import EditSession, CollaborationEvent
        EditSession.start_session(
            session_type='ridge_create',
            object_id=sub_clan.id,
            user=request.user,
            session_key=request.session.session_key
        )
        
        # Log collaboration event
        CollaborationEvent.objects.create(
            event_type='form_locked',
            session_type='ridge_create',
            object_id=sub_clan.id,
            user=request.user,
            data={'lock_type': lock_type, 'sub_clan_name': sub_clan.name}
        )
    
    if request.method == 'POST':
        try:
            # Create the ridge
            ridge = Ridge.objects.create(
                sub_clan=sub_clan,
                name=request.POST.get('name'),
                leader_name=request.POST.get('leader_name'),
                leader_contact=request.POST.get('leader_contact'),
                created_by=request.user
            )
            
            # Log form submission event
            CollaborationEvent.objects.create(
                event_type='form_submitted',
                session_type='ridge_create',
                object_id=sub_clan.id,
                user=request.user,
                data={'ridge_name': ridge.name, 'sub_clan_name': sub_clan.name}
            )
            
            # Release the lock
            release_form_lock(lock_type, sub_clan.id, request.user)
            
            # End editing session
            EditSession.end_session('ridge_create', sub_clan.id, request.user, request.session.session_key)
            
            messages.success(request, f'Ridge "{ridge.name}" created successfully!')
            return redirect('surveys:survey_list')
            
        except Exception as e:
            messages.error(request, f'Error creating ridge: {str(e)}')
            return render(request, 'surveys/create_ridge.html', {'sub_clan': sub_clan})
    
    return render(request, 'surveys/create_ridge.html', {'sub_clan': sub_clan})


@login_required
def create_ridge_survey(request, ridge_id=None):
    """Create a ridge survey questionnaire"""
    # Check if ridge models are available
    try:
        from .models import Ridge, RidgeSurvey, RidgeQuestion
        ridge_models_available = True
    except ImportError:
        ridge_models_available = False
    
    if not ridge_models_available:
        messages.error(request, 'Ridge survey features are not available.')
        return redirect('surveys:survey_list')
    
    # Get the ridge
    ridge = get_object_or_404(Ridge, id=ridge_id)
    
    if request.method == 'POST':
        try:
            # Create the ridge survey
            ridge_survey = RidgeSurvey.objects.create(
                ridge=ridge,
                title=request.POST.get('title'),
                description=request.POST.get('description'),
                is_active=request.POST.get('is_active') == 'on',
                allow_anonymous=request.POST.get('allow_anonymous') == 'on',
                created_by=request.user
            )
            
            # Copy questions from the parent sub-clan survey
            try:
                # Get the parent sub-clan survey
                sub_clan = ridge.sub_clan
                sub_clan_survey = sub_clan.sub_clan_surveys.first()
                
                if sub_clan_survey and sub_clan_survey.is_sub_clan:
                    # Copy all questions from the sub-clan survey to the ridge survey
                    sub_clan_questions = sub_clan_survey.sub_clan_questions.all().order_by('order')
                    
                    for sub_clan_question in sub_clan_questions:
                        RidgeQuestion.objects.create(
                            ridge_survey=ridge_survey,
                            text=sub_clan_question.text,
                            question_type=sub_clan_question.question_type,
                            required=sub_clan_question.required,
                            order=sub_clan_question.order,
                            options=sub_clan_question.options
                        )
                    
                    messages.success(request, f'Ridge survey "{ridge_survey.title}" created successfully for {ridge.name} with {sub_clan_questions.count()} questions copied from the sub-clan survey!')
                else:
                    messages.success(request, f'Ridge survey "{ridge_survey.title}" created successfully for {ridge.name}!')
                    
            except Exception as copy_error:
                # If copying fails, still create the survey but notify the user
                messages.warning(request, f'Ridge survey "{ridge_survey.title}" created for {ridge.name}, but could not copy questions: {str(copy_error)}')
            
            return redirect('surveys:survey_list')
            
        except Exception as e:
            messages.error(request, f'Error creating ridge survey: {str(e)}')
            return render(request, 'surveys/create_ridge_survey.html', {'ridge': ridge})
    
    return render(request, 'surveys/create_ridge_survey.html', {'ridge': ridge})


@login_required
def take_ridge_survey(request, ridge_id):
    """Take a ridge survey - fill in information about the ridge"""
    # Check if ridge models are available
    try:
        from .models import Ridge, Survey, Question, SurveyResponse, Answer
        ridge_models_available = True
    except ImportError:
        ridge_models_available = False
    
    if not ridge_models_available:
        messages.error(request, 'Ridge survey features are not available.')
        return redirect('surveys:survey_list')
    
    # Get the ridge
    ridge = get_object_or_404(Ridge, id=ridge_id)
    
    # Get parent sub-clan survey to use its questions
    try:
        sub_clan = ridge.sub_clan
        sub_clan_survey = sub_clan.sub_clan_surveys.first()
        questions = sub_clan_survey.sub_clan_questions.all().order_by('order') if sub_clan_survey else []
    except:
        questions = []
        sub_clan_survey = None
    
    # Check if user has already completed this ridge survey
    user_responses_count = 0
    if sub_clan_survey and isinstance(sub_clan_survey, Survey):
        user_responses_count = SurveyResponse.objects.filter(
            survey=sub_clan_survey, user=request.user
        ).count()
    
    if request.method == 'POST':
        # Check if user has already submitted
        if user_responses_count > 0:
            messages.error(request, 'You have already completed this ridge survey.')
            return redirect('surveys:survey_list')
        
        try:
            # Check if sub_clan_survey is a valid Survey instance
            if not sub_clan_survey or not isinstance(sub_clan_survey, Survey):
                messages.error(request, 'Invalid survey configuration for this ridge.')
                return redirect('surveys:survey_list')
            
            # Create a survey response
            response = SurveyResponse.objects.create(
                survey=sub_clan_survey,
                user=request.user,
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            # Process each question
            for question in questions:
                answer_key = f'question_{question.id}'
                answer_text = request.POST.get(answer_key, '')
                
                # Store the answer
                Answer.objects.create(
                    response=response,
                    question=question,
                    answer_text=answer_text,
                    answer_data={'answer': answer_text, 'ridge_id': ridge.id}
                )
            
            messages.success(request, f'Thank you for completing the survey for {ridge.name}!')
            return redirect('surveys:survey_list')
            
        except Exception as e:
            messages.error(request, f'Error submitting survey: {str(e)}')
            return render(request, 'surveys/take_ridge_survey.html', {
                'ridge': ridge,
                'sub_clan_survey': sub_clan_survey,
                'questions': questions
            })
    
    return render(request, 'surveys/take_ridge_survey.html', {
        'ridge': ridge,
        'sub_clan_survey': sub_clan_survey,
        'questions': questions,
        'user_responses_count': user_responses_count
    })


@login_required
def ridge_obb_survey(request, ridge_id):
    """Comprehensive OBB survey form for ridges"""
    # Check if ridge models are available
    try:
        from .models import Ridge, RidgeSurveyData
        ridge_models_available = True
    except ImportError:
        ridge_models_available = False
    
    if not ridge_models_available:
        messages.error(request, 'Ridge survey features are not available.')
        return redirect('surveys:survey_list')
    
    # Get the ridge
    ridge = get_object_or_404(Ridge, id=ridge_id)
    
    if request.method == 'POST':
        try:
            # Create ridge survey data record
            survey_data = RidgeSurveyData.objects.create(
                ridge=ridge,
                surveyor=request.user,
                # Basic Details
                households_count=request.POST.get('households_count'),
                village=request.POST.get('village'),
                parish=request.POST.get('parish'),
                sub_county=request.POST.get('sub_county'),
                district=request.POST.get('district'),
                
                # Population Data
                total_households=request.POST.get('total_households'),
                total_population=request.POST.get('total_population'),
                male_population=request.POST.get('male_population'),
                female_population=request.POST.get('female_population'),
                youth_population=request.POST.get('youth_population'),
                
                # Meeting Information
                meeting_frequency=request.POST.get('meeting_frequency'),
                meeting_frequency_other=request.POST.get('meeting_frequency_other'),
                
                # Saving Group Information
                saving_group=request.POST.get('saving_group'),
                saving_group_name=request.POST.get('saving_group_name'),
                saving_group_no_reason=request.POST.get('saving_group_no_reason'),
                saving_group_year=request.POST.get('saving_group_year'),
                saving_group_initiator=request.POST.get('saving_group_initiator'),
                saving_group_initiator_spec=request.POST.get('saving_group_initiator_spec'),
                saving_group_registered=request.POST.get('saving_group_registered'),
                membership_fee=request.POST.get('membership_fee'),
                membership_fee_amount=request.POST.get('membership_fee_amount'),
                shares_required=request.POST.get('shares_required'),
                shares_amount=request.POST.get('shares_amount'),
                annual_subscription=request.POST.get('annual_subscription'),
                annual_amount=request.POST.get('annual_amount'),
                adults_male=request.POST.get('adults_male'),
                adults_female=request.POST.get('adults_female'),
                youth_male=request.POST.get('youth_male'),
                youth_female=request.POST.get('youth_female'),
                coordinator_name=request.POST.get('coordinator_name'),
                coordinator_education=request.POST.get('coordinator_education'),
                coordinator_phone=request.POST.get('coordinator_phone'),
                loan_officer_name=request.POST.get('loan_officer_name'),
                loan_officer_education=request.POST.get('loan_officer_education'),
                loan_officer_phone=request.POST.get('loan_officer_phone'),
                gov_programs_heard=request.POST.get('gov_programs_heard'),
                gov_programs_benefited=request.POST.get('gov_programs_benefited'),
                info_source=request.POST.get('info_source'),
                
                # Store all additional form data as JSON
                additional_data={}
            )
            
            # Store executive committee data
            executive_data = []
            executive_count = int(request.POST.get('executive_count', 1))
            for i in range(1, executive_count + 1):
                if request.POST.get(f'exec_name_{i}'):
                    executive_data.append({
                        'name': request.POST.get(f'exec_name_{i}'),
                        'sex': request.POST.get(f'exec_sex_{i}'),
                        'position': request.POST.get(f'exec_position_{i}'),
                        'education': request.POST.get(f'exec_education_{i}'),
                        'phone': request.POST.get(f'exec_phone_{i}')
                    })
            survey_data.executive_committee = executive_data
            
            # Store structures data
            structures_data = []
            structure_count = int(request.POST.get('structure_count', 1))
            for i in range(1, structure_count + 1):
                if request.POST.get(f'struct_address_{i}'):
                    structures_data.append({
                        'address': request.POST.get(f'struct_address_{i}'),
                        'type': request.POST.get(f'struct_type_{i}'),
                        'staff': request.POST.get(f'struct_staff_{i}')
                    })
            survey_data.structures = structures_data
            
            # Store resources data
            resources_data = []
            resource_count = int(request.POST.get('resource_count', 4))
            for i in range(1, resource_count + 1):
                if request.POST.get(f'resource_item_{i}'):
                    resources_data.append({
                        'item': request.POST.get(f'resource_item_{i}'),
                        'size': request.POST.get(f'resource_size_{i}'),
                        'value': request.POST.get(f'resource_value_{i}'),
                        'owned': request.POST.get(f'resource_owned_{i}') == 'on',
                        'rented': request.POST.get(f'resource_rented_{i}') == 'on'
                    })
            survey_data.resources = resources_data
            
            # Store challenges data
            challenges = []
            for i in range(1, 10):
                if request.POST.get(f'challenge_{i}'):
                    challenges.append(request.POST.get(f'challenge_{i}'))
            if request.POST.get('challenge_other'):
                challenges.append(f"Other: {request.POST.get('challenge_other')}")
            survey_data.challenges = challenges
            
            # Store education data
            education_data = []
            education_count = int(request.POST.get('education_count', 9))
            for i in range(1, education_count + 1):
                if request.POST.get(f'edu_pop_{i}'):
                    education_data.append({
                        'level': request.POST.get(f'edu_level_{i}', f"Level {i}"),
                        'population': request.POST.get(f'edu_pop_{i}'),
                        'employment': request.POST.get(f'edu_employment_{i}')
                    })
            survey_data.education_data = education_data
            
            # Store educated persons data
            educated_persons_data = []
            educated_count = int(request.POST.get('educated_count', 1))
            for i in range(1, educated_count + 1):
                if request.POST.get(f'educated_name_{i}'):
                    educated_persons_data.append({
                        'name': request.POST.get(f'educated_name_{i}'),
                        'sex': request.POST.get(f'educated_sex_{i}'),
                        'age': request.POST.get(f'educated_age_{i}'),
                        'level': request.POST.get(f'educated_level_{i}'),
                        'specialization': request.POST.get(f'educated_specialization_{i}'),
                        'contact': request.POST.get(f'educated_contact_{i}'),
                        'location': request.POST.get(f'educated_location_{i}')
                    })
            survey_data.educated_persons = educated_persons_data
            
            # Store persons abroad data
            persons_abroad_data = []
            abroad_count = int(request.POST.get('abroad_count', 1))
            for i in range(1, abroad_count + 1):
                if request.POST.get(f'abroad_name_{i}'):
                    persons_abroad_data.append({
                        'name': request.POST.get(f'abroad_name_{i}'),
                        'sex': request.POST.get(f'abroad_sex_{i}'),
                        'age': request.POST.get(f'abroad_age_{i}'),
                        'contact': request.POST.get(f'abroad_contact_{i}'),
                        'country': request.POST.get(f'abroad_country_{i}')
                    })
            survey_data.persons_abroad = persons_abroad_data
            
            # Store political leaders data
            political_leaders = {
                'lci': {
                    'count': request.POST.get('pol_lci_count'),
                    'names': request.POST.get('pol_lci_names'),
                    'contacts': request.POST.get('pol_lci_contacts')
                },
                'lcii': {
                    'count': request.POST.get('pol_lcii_count'),
                    'names': request.POST.get('pol_lcii_names'),
                    'contacts': request.POST.get('pol_lcii_contacts')
                },
                'lciii': {
                    'count': request.POST.get('pol_lciii_count'),
                    'names': request.POST.get('pol_lciii_names'),
                    'contacts': request.POST.get('pol_lciii_contacts')
                },
                'district_councillors': {
                    'count': request.POST.get('pol_dc_count'),
                    'names': request.POST.get('pol_dc_names'),
                    'contacts': request.POST.get('pol_dc_contacts')
                },
                'lcv': {
                    'count': request.POST.get('pol_lcv_count'),
                    'names': request.POST.get('pol_lcv_names'),
                    'contacts': request.POST.get('pol_lcv_contacts')
                },
                'mp': {
                    'count': request.POST.get('pol_mp_count'),
                    'names': request.POST.get('pol_mp_names'),
                    'contacts': request.POST.get('pol_mp_contacts')
                },
                'minister': {
                    'count': request.POST.get('pol_minister_count'),
                    'names': request.POST.get('pol_minister_names'),
                    'contacts': request.POST.get('pol_minister_contacts')
                }
            }
            survey_data.political_leaders = political_leaders
            
            # Store enterprises data
            enterprises = []
            for i in range(1, 7):
                if request.POST.get(f'enterprise_{i}'):
                    enterprises.append(request.POST.get(f'enterprise_{i}'))
            survey_data.enterprises = enterprises
            
            # Store water sources data
            water_sources_data = []
            water_count = int(request.POST.get('water_count', 1))
            for i in range(1, water_count + 1):
                if request.POST.get(f'stream_name_{i}'):
                    water_sources_data.append({
                        'name': request.POST.get(f'stream_name_{i}'),
                        'heritage_type': request.POST.get(f'heritage_type_{i}'),
                        'village': request.POST.get(f'stream_village_{i}'),
                        'parish': request.POST.get(f'stream_parish_{i}'),
                        'historical_usage': request.POST.get(f'historical_usage_{i}')
                    })
            survey_data.water_sources = water_sources_data
            
            # Store environmental projects
            env_projects = []
            for i in range(1, 5):
                if request.POST.get(f'env_project_{i}'):
                    env_projects.append(request.POST.get(f'env_project_{i}'))
            if request.POST.get('env_project_other'):
                env_projects.append(f"Other: {request.POST.get('env_project_other')}")
            survey_data.environmental_projects = env_projects
            
            # Handle file uploads
            if 'leader_photo' in request.FILES:
                survey_data.leader_photo = request.FILES['leader_photo']
            
            if 'additional_photos' in request.FILES:
                survey_data.additional_photos = request.FILES['additional_photos']
            
            # Store signatures data
            signatures = {
                'data_collector': {
                    'name': request.POST.get('sig_data_collector_name'),
                    'title': request.POST.get('sig_data_collector_title'),
                    'date': request.POST.get('sig_data_collector_date'),
                    'contact': request.POST.get('sig_data_collector_contact'),
                    'signature_data': request.POST.get('sig_data_collector_data')
                },
                'ridge_leader': {
                    'name': request.POST.get('sig_ridge_leader_name'),
                    'title': request.POST.get('sig_ridge_leader_title'),
                    'date': request.POST.get('sig_ridge_leader_date'),
                    'contact': request.POST.get('sig_ridge_leader_contact'),
                    'signature_data': request.POST.get('sig_ridge_leader_data')
                },
                'program_coordinator': {
                    'name': request.POST.get('sig_program_coordinator_name'),
                    'date': request.POST.get('sig_program_coordinator_date'),
                    'contact': request.POST.get('sig_program_coordinator_contact'),
                    'signature_data': request.POST.get('sig_program_coordinator_data')
                },
                'sub_clan_head': {
                    'name': request.POST.get('sig_chairperson_name'),
                    'date': request.POST.get('sig_chairperson_date'),
                    'contact': request.POST.get('sig_chairperson_contact'),
                    'signature_data': request.POST.get('sig_chairperson_data')
                }
            }
            survey_data.signatures = signatures
            
            survey_data.save()
            
            messages.success(request, f'OBB survey for {ridge.name} ridge submitted successfully!')
            return redirect('surveys:survey_list')
            
        except Exception as e:
            messages.error(request, f'Error submitting survey: {str(e)}')
            return render(request, 'surveys/ridge_obb_survey.html', {'ridge': ridge})
    
    return render(request, 'surveys/ridge_obb_survey.html', {'ridge': ridge})


@login_required
def edit_survey(request, survey_id):
    """Edit survey and manage questions"""
    survey = get_object_or_404(Survey, id=survey_id)
    
    # Check if user can edit this survey (creator or admin)
    if survey.created_by != request.user and not request.user.is_staff:
        messages.error(request, 'You do not have permission to edit this survey.')
        return redirect('surveys:survey_list')
    
    if request.method == 'POST':
        # Handle survey update
        survey.title = request.POST.get('title')
        survey.description = request.POST.get('description')
        survey.allow_anonymous = request.POST.get('allow_anonymous') == 'on'
        survey.is_active = request.POST.get('is_active') == 'on'
        survey.is_clan = request.POST.get('is_clan') == 'on'
        survey.save()
        
        # Handle question addition
        question_text = request.POST.get('question_text')
        question_type = request.POST.get('question_type')
        options_text = request.POST.get('options_text')
        required = request.POST.get('required') == 'on'
        
        if question_text and question_type:
            question = Question.objects.create(
                survey=survey,
                text=question_text,
                question_type=question_type,
                required=required
            )
            
            # Handle options for choice-based questions
            if question_type in ['radio', 'checkbox', 'select'] and options_text:
                options = [opt.strip() for opt in options_text.split('\n') if opt.strip()]
                question.options = {'choices': options}
                question.save()
            
            messages.success(request, 'Question added successfully!')
        
        return redirect('surveys:edit_survey', survey_id=survey.id)
    
    questions = survey.questions.all().order_by('order')
    return render(request, 'surveys/edit_survey.html', {
        'survey': survey,
        'questions': questions,
    })


@login_required
def delete_question(request, survey_id, question_id):
    """Delete a question from a survey"""
    survey = get_object_or_404(Survey, id=survey_id)
    question = get_object_or_404(Question, id=question_id, survey=survey)
    
    # Check permissions
    if survey.created_by != request.user and not request.user.is_staff:
        messages.error(request, 'You do not have permission to delete this question.')
        return redirect('surveys:survey_list')
    
    question.delete()
    messages.success(request, 'Question deleted successfully!')
    return redirect('surveys:edit_survey', survey_id=survey.id)


@login_required
def surveyer_dashboard(request):
    """Surveyer dashboard for clan management"""
    # Import clan models (try to avoid circular imports)
    try:
        from .models import Clan, SubClan, Ridge, Population, ExecutiveCommittee, Structure, Resource
        clan_models_available = True
    except ImportError:
        clan_models_available = False
    
    # Get user's clan statistics
    if clan_models_available:
        user_clans = Clan.objects.filter(created_by=request.user)
        total_clans = user_clans.count()
        active_clans = user_clans.filter(is_active=True).count()
        
        # Safely count sub-clans and ridges
        try:
            total_sub_clans = SubClan.objects.filter(clan__created_by=request.user).count()
        except:
            total_sub_clans = 0
        
        try:
            total_ridges = Ridge.objects.filter(sub_clan__clan__created_by=request.user).count()
        except:
            total_ridges = 0
        
        # User's recent clans
        recent_clans = user_clans.order_by('-created_at')[:5]
        
        # User's clan hierarchy statistics
        clan_stats = []
        try:
            annotated_clans = user_clans.annotate(
                sub_clans_total=Count('sub_clans'),
                ridges_total=Count('ridges'),
                responses_total=Count('survey__responses')
            ).order_by('-created_at')[:5]
        except FieldError:
            # Fallback if ridge relationship doesn't exist (migrations not applied)
            annotated_clans = user_clans.annotate(
                sub_clans_total=Count('sub_clans'),
                responses_total=Count('survey__responses')
            ).order_by('-created_at')[:5]
        
        for clan in annotated_clans:
            clan_stats.append({
                'id': clan.id,
                'name': clan.name,
                'sub_clan_count': clan.sub_clans_total,
                'ridge_count': getattr(clan, 'ridges_total', 0),
                'response_count': clan.responses_total,
                'created_at': clan.created_at,
                'is_active': clan.is_active
            })
        
        # User's data collection activity
        user_responses = SurveyResponse.objects.filter(user=request.user).count()
        recent_collections = SurveyResponse.objects.filter(user=request.user).order_by('-submitted_at')[:5]
        
        # Available clans for data collection (all active clans)
        available_clans = Clan.objects.filter(is_active=True)[:10]
        
    else:
        total_clans = active_clans = total_sub_clans = total_ridges = 0
        recent_clans = []
        clan_stats = []
        user_responses = 0
        recent_collections = []
        available_clans = []
    
    context = {
        'clan_models_available': clan_models_available,
        'total_clans': total_clans,
        'active_clans': active_clans,
        'total_sub_clans': total_sub_clans,
        'total_ridges': total_ridges,
        'recent_clans': recent_clans,
        'clan_stats': clan_stats,
        'user_responses': user_responses,
        'recent_collections': recent_collections,
        'available_clans': available_clans,
    }
    
    return render(request, 'surveys/surveyer_dashboard.html', context)


@login_required
def survey_list(request):
    """Display list of available surveys for data collection"""
    # Show all active surveys (clans) for data collection, including user's own clans
    surveys = Survey.objects.filter(is_active=True, created_by__isnull=False).order_by('-created_at')
    
    # Filter to show only surveys that have associated Clan objects (more reliable than is_clan flag)
    clan_surveys = []
    for survey in surveys:
        try:
            # Check if there's a Clan associated with this survey
            clan = Clan.objects.get(survey=survey)
            clan_surveys.append(survey)
        except Clan.DoesNotExist:
            # If no Clan object exists, skip this survey
            continue
    
    # Convert to queryset for pagination
    clan_survey_ids = [survey.id for survey in clan_surveys]
    clan_surveys = Survey.objects.filter(id__in=clan_survey_ids).order_by('-created_at')
    
    # Get sub-clan surveys for each clan
    clan_surveys_with_sub_clans = []
    for clan_survey in clan_surveys:
        clan_data = {
            'survey': clan_survey,
            'sub_clans': []
        }
        
        # Get sub-clans for this clan
        try:
            clan = Clan.objects.get(survey=clan_survey)
            sub_clans = SubClan.objects.filter(clan=clan, is_active=True).order_by('name')
            
            for sub_clan in sub_clans:
                # Check if there are sub-clan surveys for this sub-clan
                sub_clan_surveys = []
                try:
                    from .models import SubClanSurvey
                    sub_clan_surveys = SubClanSurvey.objects.filter(
                        is_active=True, 
                        created_by__isnull=False
                    ).order_by('-created_at')
                except ImportError:
                    pass
                
                clan_data['sub_clans'].append({
                    'sub_clan': sub_clan,
                    'surveys': sub_clan_surveys
                })
                
        except Clan.DoesNotExist:
            pass
        
        clan_surveys_with_sub_clans.append(clan_data)
    
    paginator = Paginator(clan_surveys, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'surveys/survey_list.html', {
        'page_obj': page_obj,
        'surveys': clan_surveys,  # Add this for backward compatibility
        'clan_surveys_with_sub_clans': clan_surveys_with_sub_clans
    })


@login_required
def survey_detail(request, survey_id):
    """Display survey details and start taking the survey"""
    survey = get_object_or_404(Survey, id=survey_id, is_active=True)
    questions = survey.questions.all().order_by('order')
    
    # Check if user has already completed this survey
    user_responses_count = SurveyResponse.objects.filter(
        survey=survey, user=request.user
    ).count()
    
    # Get sub-clans if this is a clan survey
    sub_clans = []
    clan = None
    if survey.is_clan:
        try:
            clan = Clan.objects.get(survey=survey)
            sub_clans = SubClan.objects.filter(clan=clan).order_by('name')
        except Clan.DoesNotExist:
            pass
    
    return render(request, 'surveys/survey_detail.html', {
        'survey': survey,
        'questions': questions,
        'user_responses_count': user_responses_count,
        'clan': clan,
        'sub_clans': sub_clans
    })


@login_required
@require_http_methods(["GET", "POST"])
def take_survey(request, survey_id):
    """Handle survey taking and submission"""
    survey = get_object_or_404(Survey, id=survey_id, is_active=True)
    questions = survey.questions.all().order_by('order')
    
    if request.method == 'POST':
        return handle_obb_survey_submission(request, survey)
    
    # For GET request, show the appropriate survey form
    # Check if this is a clan survey by looking for associated Clan object
    is_clan_survey = False
    try:
        clan = Clan.objects.get(survey=survey)
        is_clan_survey = True
    except Clan.DoesNotExist:
        pass
    
    if is_clan_survey:
        return render(request, 'surveys/obb_survey_form.html', {
            'survey': survey
        })
    else:
        return render(request, 'surveys/take_survey.html', {
            'survey': survey,
            'questions': questions
        })


@transaction.atomic
def handle_obb_survey_submission(request, survey):
    """Process OBB comprehensive survey form submission"""
    form_data = request.POST
    files = request.FILES
    
    # Validate required fields
    required_fields = ['clan_name', 'physical_address', 'village', 'parish', 'sub_county', 'district']
    errors = {}
    
    for field in required_fields:
        if field not in form_data or not form_data[field].strip():
            errors[field] = "This field is required."
    
    if errors:
        messages.error(request, 'Please fill in all required fields.')
        return render(request, 'surveys/obb_survey_form.html', {
            'survey': survey,
            'errors': errors
        })
    
    # Create a comprehensive response record
    response_data = {}
    
    # Basic details
    response_data['clan_name'] = form_data.get('clan_name', '')
    response_data['sub_clans_count'] = form_data.get('sub_clans_count', '')
    response_data['ridges_count'] = form_data.get('ridges_count', '')
    response_data['physical_address'] = form_data.get('physical_address', '')
    response_data['village'] = form_data.get('village', '')
    response_data['parish'] = form_data.get('parish', '')
    response_data['sub_county'] = form_data.get('sub_county', '')
    response_data['district'] = form_data.get('district', '')
    response_data['county'] = form_data.get('county', '')
    
    # Meeting frequency
    response_data['meeting_frequency'] = form_data.get('meeting_frequency', '')
    response_data['meeting_frequency_other'] = form_data.get('meeting_frequency_other', '')
    
    # Population data
    response_data['total_households'] = form_data.get('total_households', '')
    response_data['total_population'] = form_data.get('total_population', '')
    response_data['male_population'] = form_data.get('male_population', '')
    response_data['female_population'] = form_data.get('female_population', '')
    response_data['youth_population'] = form_data.get('youth_population', '')
    
    # Dynamic table data
    response_data['sub_clans'] = []
    response_data['executive_committee'] = []
    response_data['structures'] = []
    response_data['resources'] = []
    
    # Process sub-clan data
    for i in range(1, 50):  # Process up to 50 rows
        if f'sub_clan_name_{i}' in form_data:
            response_data['sub_clans'].append({
                'name': form_data.get(f'sub_clan_name_{i}', ''),
                'address': form_data.get(f'sub_clan_address_{i}', ''),
                'leader': form_data.get(f'sub_clan_leader_{i}', ''),
                'contact': form_data.get(f'sub_clan_contact_{i}', ''),
                'education': form_data.get(f'sub_clan_education_{i}', '')
            })
    
    # Process executive committee data
    for i in range(1, 50):
        if f'exec_name_{i}' in form_data:
            response_data['executive_committee'].append({
                'name': form_data.get(f'exec_name_{i}', ''),
                'sex': form_data.get(f'exec_sex_{i}', ''),
                'position': form_data.get(f'exec_position_{i}', ''),
                'education': form_data.get(f'exec_education_{i}', ''),
                'phone': form_data.get(f'exec_phone_{i}', '')
            })
    
    # Process structures data
    for i in range(1, 50):
        if f'struct_address_{i}' in form_data:
            response_data['structures'].append({
                'address': form_data.get(f'struct_address_{i}', ''),
                'type': form_data.get(f'struct_type_{i}', ''),
                'staff': form_data.get(f'struct_staff_{i}', '')
            })
    
    # Process resources data
    for i in range(1, 50):
        if f'resource_item_{i}' in form_data:
            response_data['resources'].append({
                'item': form_data.get(f'resource_item_{i}', ''),
                'size': form_data.get(f'resource_size_{i}', ''),
                'value': form_data.get(f'resource_value_{i}', ''),
                'owned': f'resource_owned_{i}' in form_data,
                'rented': f'resource_rented_{i}' in form_data
            })
    
    # Process challenges
    challenges = []
    for i in range(1, 10):
        if f'challenge_{i}' in form_data:
            challenges.append(form_data.get(f'challenge_{i}', ''))
    response_data['challenges'] = challenges
    response_data['challenge_other'] = form_data.get('challenge_other', '')
    
    # Process education estimates
    response_data['education_estimates'] = []
    for i in range(1, 50):
        if f'edu_pop_{i}' in form_data:
            response_data['education_estimates'].append({
                'level': form_data.get(f'edu_level_{i}', ''),
                'population': form_data.get(f'edu_pop_{i}', ''),
                'employment': form_data.get(f'edu_employment_{i}', '')
            })
    
    # Process educated persons
    response_data['educated_persons'] = []
    for i in range(1, 50):
        if f'educated_name_{i}' in form_data:
            response_data['educated_persons'].append({
                'name': form_data.get(f'educated_name_{i}', ''),
                'sex': form_data.get(f'educated_sex_{i}', ''),
                'age': form_data.get(f'educated_age_{i}', ''),
                'level': form_data.get(f'educated_level_{i}', ''),
                'specialization': form_data.get(f'educated_specialization_{i}', ''),
                'contact': form_data.get(f'educated_contact_{i}', ''),
                'location': form_data.get(f'educated_location_{i}', '')
            })
    
    # Process persons abroad
    response_data['persons_abroad'] = []
    for i in range(1, 50):
        if f'abroad_name_{i}' in form_data:
            response_data['persons_abroad'].append({
                'name': form_data.get(f'abroad_name_{i}', ''),
                'sex': form_data.get(f'abroad_sex_{i}', ''),
                'age': form_data.get(f'abroad_age_{i}', ''),
                'contact': form_data.get(f'abroad_contact_{i}', ''),
                'country': form_data.get(f'abroad_country_{i}', '')
            })
    
    # Process political leaders
    response_data['political_leaders'] = {
        'lci': {
            'count': form_data.get('pol_lci_count', ''),
            'names': form_data.get('pol_lci_names', ''),
            'contacts': form_data.get('pol_lci_contacts', '')
        },
        'lcii': {
            'count': form_data.get('pol_lcii_count', ''),
            'names': form_data.get('pol_lcii_names', ''),
            'contacts': form_data.get('pol_lcii_contacts', '')
        },
        'lciii': {
            'count': form_data.get('pol_lciii_count', ''),
            'names': form_data.get('pol_lciii_names', ''),
            'contacts': form_data.get('pol_lciii_contacts', '')
        },
        'district_councillors': {
            'count': form_data.get('pol_dc_count', ''),
            'names': form_data.get('pol_dc_names', ''),
            'contacts': form_data.get('pol_dc_contacts', '')
        },
        'lcv': {
            'count': form_data.get('pol_lcv_count', ''),
            'names': form_data.get('pol_lcv_names', ''),
            'contacts': form_data.get('pol_lcv_contacts', '')
        },
        'mp': {
            'count': form_data.get('pol_mp_count', ''),
            'names': form_data.get('pol_mp_names', ''),
            'contacts': form_data.get('pol_mp_contacts', '')
        },
        'minister': {
            'count': form_data.get('pol_minister_count', ''),
            'names': form_data.get('pol_minister_names', ''),
            'contacts': form_data.get('pol_minister_contacts', '')
        }
    }
    
    # Process OBB leaders
    response_data['obb_leaders'] = {
        'village_chief': {
            'count': form_data.get('obb_village_chief_count', ''),
            'education': form_data.get('obb_village_chief_education', ''),
            'positions': form_data.get('obb_village_chief_positions', '')
        },
        'parish_chief': {
            'count': form_data.get('obb_parish_chief_count', ''),
            'education': form_data.get('obb_parish_chief_education', ''),
            'positions': form_data.get('obb_parish_chief_positions', '')
        },
        'subcounty_chief': {
            'count': form_data.get('obb_subcounty_chief_count', ''),
            'education': form_data.get('obb_subcounty_chief_education', ''),
            'positions': form_data.get('obb_subcounty_chief_positions', '')
        },
        'county_chief': {
            'count': form_data.get('obb_county_chief_count', ''),
            'education': form_data.get('obb_county_chief_education', ''),
            'positions': form_data.get('obb_county_chief_positions', '')
        },
        'minister': {
            'count': form_data.get('obb_minister_count', ''),
            'education': form_data.get('obb_minister_education', ''),
            'positions': form_data.get('obb_minister_positions', '')
        },
        'advisor': {
            'count': form_data.get('obb_advisor_count', ''),
            'education': form_data.get('obb_advisor_education', ''),
            'positions': form_data.get('obb_advisor_positions', '')
        }
    }
    
    # Process saving group information (Section B)
    response_data['saving_group'] = {
        'has_group': form_data.get('saving_group', ''),
        'group_name': form_data.get('saving_group_name', ''),
        'no_reason': form_data.get('saving_group_no_reason', ''),
        'formation_year': form_data.get('saving_group_year', ''),
        'initiator': form_data.get('saving_group_initiator', ''),
        'initiator_spec': form_data.get('saving_group_initiator_spec', ''),
        'registered': form_data.get('saving_group_registered', ''),
        'membership_fee': {
            'has_fee': form_data.get('membership_fee', ''),
            'amount': form_data.get('membership_fee_amount', '')
        },
        'shares_required': {
            'has_shares': form_data.get('shares_required', ''),
            'amount': form_data.get('shares_amount', '')
        },
        'annual_subscription': {
            'has_annual': form_data.get('annual_subscription', ''),
            'amount': form_data.get('annual_amount', '')
        },
        'membership_demographics': {
            'adults_male': form_data.get('adults_male', ''),
            'adults_female': form_data.get('adults_female', ''),
            'youth_male': form_data.get('youth_male', ''),
            'youth_female': form_data.get('youth_female', '')
        },
        'coordinator': {
            'name': form_data.get('coordinator_name', ''),
            'education': form_data.get('coordinator_education', ''),
            'phone': form_data.get('coordinator_phone', '')
        },
        'loan_officer': {
            'name': form_data.get('loan_officer_name', ''),
            'education': form_data.get('loan_officer_education', ''),
            'phone': form_data.get('loan_officer_phone', '')
        },
        'secretary': {
            'name': form_data.get('secretary_name', ''),
            'education': form_data.get('secretary_education', ''),
            'phone': form_data.get('secretary_phone', '')
        },
        'treasurer': {
            'name': form_data.get('treasurer_name', ''),
            'education': form_data.get('treasurer_education', ''),
            'phone': form_data.get('treasurer_phone', '')
        },
        'gov_programs': {
            'heard': form_data.get('gov_programs_heard', ''),
            'benefited': form_data.get('gov_programs_benefited', ''),
            'info_source': form_data.get('info_source', '')
        },
        'enterprises': [
            form_data.get('enterprise_1', ''),
            form_data.get('enterprise_2', ''),
            form_data.get('enterprise_3', ''),
            form_data.get('enterprise_4', ''),
            form_data.get('enterprise_5', ''),
            form_data.get('enterprise_6', '')
        ],
        'leadership_terms': {
            'chairperson': form_data.get('chairperson_terms', ''),
            'secretary': form_data.get('secretary_terms', ''),
            'treasurer': form_data.get('treasurer_terms', '')
        },
        'last_election_year': form_data.get('last_election_year', '')
    }
    
    # Process water sources and cultural heritages (Section C)
    response_data['water_sources'] = []
    for i in range(1, 50):
        if f'stream_name_{i}' in form_data:
            response_data['water_sources'].append({
                'name': form_data.get(f'stream_name_{i}', ''),
                'heritage_type': form_data.get(f'heritage_type_{i}', ''),
                'village': form_data.get(f'stream_village_{i}', ''),
                'parish': form_data.get(f'stream_parish_{i}', ''),
                'historical_usage': form_data.get(f'historical_usage_{i}', '')
            })
    
    # Process palm oil processing machines
    response_data['palm_oil_machines'] = []
    for i in range(1, 50):
        if f'machine_name_{i}' in form_data:
            response_data['palm_oil_machines'].append({
                'name': form_data.get(f'machine_name_{i}', ''),
                'location': form_data.get(f'machine_location_{i}', ''),
                'owner': form_data.get(f'machine_owner_{i}', '')
            })
    
    # Process environmental projects
    env_projects = []
    for i in range(1, 5):
        if f'env_project_{i}' in form_data:
            env_projects.append(form_data.get(f'env_project_{i}', ''))
    response_data['environmental_projects'] = env_projects
    response_data['env_project_other'] = form_data.get('env_project_other', '')
    
    # Process signatures (Section E)
    response_data['signatures'] = {
        'data_collector': {
            'name': form_data.get('sig_data_collector_name', ''),
            'title': form_data.get('sig_data_collector_title', ''),
            'signature_data': form_data.get('sig_data_collector_data', ''),
            'date': form_data.get('sig_data_collector_date', ''),
            'contact': form_data.get('sig_data_collector_contact', '')
        },
        'clan_leader': {
            'name': form_data.get('sig_clan_leader_name', ''),
            'title': form_data.get('sig_clan_leader_title', ''),
            'signature_data': form_data.get('sig_clan_leader_data', ''),
            'date': form_data.get('sig_clan_leader_date', ''),
            'contact': form_data.get('sig_clan_leader_contact', '')
        },
        'program_coordinator': {
            'name': form_data.get('sig_program_coordinator_name', ''),
            'signature_data': form_data.get('sig_program_coordinator_data', ''),
            'date': form_data.get('sig_program_coordinator_date', ''),
            'contact': form_data.get('sig_program_coordinator_contact', '')
        },
        'chairperson': {
            'name': form_data.get('sig_chairperson_name', ''),
            'signature_data': form_data.get('sig_chairperson_data', ''),
            'date': form_data.get('sig_chairperson_date', ''),
            'contact': form_data.get('sig_chairperson_contact', '')
        }
    }
    
    # Save the comprehensive response
    response = SurveyResponse.objects.create(
        survey=survey,
        user=request.user,
        response_text=json.dumps(response_data)
    )
    
    # Handle file uploads if any
    if 'leader_photo' in files:
        # Handle photo upload logic here
        pass
    
    messages.success(request, f'OBB Baseline Survey for "{response_data["clan_name"]}" submitted successfully!')
    return redirect('surveys:survey_thank_you', survey_id=survey.id)


@transaction.atomic
def handle_survey_submission(request, survey, questions):
    """Process survey form submission"""
    form_data = request.POST
    
    # Validate required questions
    errors = {}
    for question in questions:
        if question.required:
            field_name = f"question_{question.id}"
            if field_name not in form_data or not form_data[field_name].strip():
                errors[field_name] = "This field is required."
    
    if errors:
        return render(request, 'surveys/take_survey.html', {
            'survey': survey,
            'questions': questions,
            'errors': errors
        })
    
    # Save survey response
    response = SurveyResponse.objects.create(
        survey=survey,
        user=request.user
    )
    
    # Save answers
    for question in questions:
        field_name = f"question_{question.id}"
        if field_name in form_data:
            Answer.objects.create(
                response=response,
                question=question,
                answer_text=form_data[field_name]
            )
    
    messages.success(request, 'Survey submitted successfully!')
    return redirect('surveys:survey_thank_you', survey_id=survey.id)


def get_client_ip(request):
    """Get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def survey_thank_you(request, survey_id):
    """Thank you page after survey completion"""
    survey = get_object_or_404(Survey, id=survey_id)
    return render(request, 'surveys/thank_you.html', {'survey': survey})


@login_required
def my_responses(request):
    """Show user's survey responses"""
    responses = SurveyResponse.objects.filter(user=request.user).order_by('-submitted_at')
    
    paginator = Paginator(responses, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'surveys/my_responses.html', {
        'page_obj': page_obj,
        'responses': page_obj
    })


@login_required
def survey_results(request, survey_id):
    """Display survey results (basic analytics)"""
    survey = get_object_or_404(Survey, id=survey_id)
    
    # Check if user can view results (creator or admin)
    if survey.created_by != request.user and not request.user.is_staff:
        messages.error(request, 'You do not have permission to view survey results.')
        return redirect('surveys:survey_list')
    
    questions = survey.questions.all().order_by('order')
    responses = survey.responses.all()
    
    # Calculate statistics for each question
    question_stats = {}
    for question in questions:
        answers = Answer.objects.filter(question=question, response__in=responses)
        question_stats[question.id] = calculate_question_stats(question, answers)
    
    return render(request, 'surveys/survey_results.html', {
        'survey': survey,
        'questions': questions,
        'responses': responses,
        'question_stats': question_stats
    })


def calculate_question_stats(question, answers):
    """Calculate statistics for a question"""
    stats = {
        'total_responses': len(answers),
        'response_rate': 0,
        'data': {}
    }
    
    if not answers:
        return stats
    
    if question.question_type in ['radio', 'select']:
        # Multiple choice statistics
        choice_counts = {}
        for answer in answers:
            choice = answer.answer_data.get('choice', answer.answer_text)
            choice_counts[choice] = choice_counts.get(choice, 0) + 1
        
        stats['data'] = {
            'choices': choice_counts,
            'most_common': max(choice_counts.items(), key=lambda x: x[1]) if choice_counts else None
        }
    elif question.question_type == 'checkbox':
        # Checkbox statistics
        choice_counts = {}
        for answer in answers:
            selected = answer.answer_data.get('selected', [])
            for choice in selected:
                choice_counts[choice] = choice_counts.get(choice, 0) + 1
        
        stats['data'] = {
            'choices': choice_counts,
            'most_common': max(choice_counts.items(), key=lambda x: x[1]) if choice_counts else None
        }
    else:
        # Text/number statistics
        stats['data'] = {
            'responses': [answer.answer_text for answer in answers],
            'average_length': sum(len(answer.answer_text) for answer in answers) / len(answers)
        }
    
    return stats
