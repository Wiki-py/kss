from django.contrib import admin
from django.contrib.admin import AdminSite
from django.http import HttpResponseRedirect
from django.urls import reverse
from .models import Survey, Question, SurveyResponse, Answer


# Custom Admin Site for Superusers Only
class SuperAdminSite(AdminSite):
    """Custom admin site that only allows superusers to access Django admin"""
    
    def has_permission(self, request):
        """Only superusers can access this admin site"""
        return request.user.is_active and request.user.is_superuser
    
    def login(self, request, extra_context=None):
        """Redirect non-superusers to the custom admin dashboard"""
        if request.user.is_authenticated and not request.user.is_superuser:
            # Redirect to custom admin dashboard
            return HttpResponseRedirect(reverse('admin_dash:dashboard'))
        return super().login(request, extra_context)


# Create custom admin site instance
super_admin_site = SuperAdminSite(name='superadmin')

# Import clan models with error handling
try:
    from .models import (
        Clan, SubClan, Ridge, ExecutiveCommittee, Structure, Population,
        Resource, EducationEstimate, EducatedPerson, PersonAbroad,
        PoliticalLeader, OBBLeader, SavingGroup, SavingGroupMember,
        WaterSource, PalmOilMachine, EnvironmentalProject, Signature, ClanPhoto
    )
    clan_models_available = True
except ImportError:
    clan_models_available = False


# ──────────────────────────────────────────────
# SURVEY ADMIN
# ──────────────────────────────────────────────

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title']
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'survey', 'question_type', 'required']
    list_filter = ['question_type', 'survey']
    search_fields = ['text']


@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ['survey', 'respondent_email', 'submitted_at']
    list_filter = ['survey', 'submitted_at']
    search_fields = ['survey__title', 'respondent_email']


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['response', 'question', 'answer_text']
    list_filter = ['question__survey']
    search_fields = ['answer_text']


# ──────────────────────────────────────────────
# CLAN HIERARCHY ADMIN
# ──────────────────────────────────────────────

if clan_models_available:

    @admin.register(Clan)
    class ClanAdmin(admin.ModelAdmin):
        list_display = ['name', 'village', 'district', 'clan_head_name', 'is_active']
        list_filter = ['district', 'is_active']
        search_fields = ['name', 'village', 'clan_head_name']


    @admin.register(SubClan)
    class SubClanAdmin(admin.ModelAdmin):
        list_display = ['name', 'clan', 'leader_name', 'is_active']
        list_filter = ['clan', 'is_active']
        search_fields = ['name', 'leader_name']


    @admin.register(Ridge)
    class RidgeAdmin(admin.ModelAdmin):
        list_display = ['name', 'sub_clan', 'leader_name', 'is_active']
        list_filter = ['is_active']
        search_fields = ['name', 'leader_name']


    @admin.register(ExecutiveCommittee)
    class ExecutiveCommitteeAdmin(admin.ModelAdmin):
        # Fields: clan, sub_clan, name, position, sex, age, education_level, contact, email, is_active
        list_display = ['name', 'position', 'sex', 'age', 'education_level', 'is_active']
        list_filter = ['position', 'sex', 'is_active']
        search_fields = ['name', 'position']


    @admin.register(Structure)
    class StructureAdmin(admin.ModelAdmin):
        # Fields: clan, name, type, location, condition, year_built, is_active
        list_display = ['name', 'type', 'clan', 'condition', 'year_built', 'is_active']
        list_filter = ['type', 'condition', 'clan', 'is_active']
        search_fields = ['name', 'type']


    @admin.register(Population)
    class PopulationAdmin(admin.ModelAdmin):
        # Fields: clan (OneToOne), total_population, male_population, female_population,
        #         youth_male/female, adults_male/female, children_male/female,
        #         meeting_frequency, meeting_location, last_meeting_date
        list_display = ['clan', 'total_population', 'male_population', 'female_population']
        list_filter = ['clan']
        search_fields = ['clan__name']


    @admin.register(Resource)
    class ResourceAdmin(admin.ModelAdmin):
        # Fields: clan, name, type, description, size_area, estimated_value, is_owned, is_rented, is_active
        list_display = ['name', 'type', 'clan', 'is_owned', 'is_rented', 'is_active']
        list_filter = ['type', 'is_owned', 'is_rented', 'clan']
        search_fields = ['name', 'type']


    @admin.register(EducationEstimate)
    class EducationEstimateAdmin(admin.ModelAdmin):
        # Fields: clan, education_level, population_percentage, area_of_employment
        list_display = ['clan', 'education_level', 'population_percentage', 'area_of_employment']
        list_filter = ['clan', 'education_level']
        search_fields = ['clan__name', 'education_level']


    @admin.register(EducatedPerson)
    class EducatedPersonAdmin(admin.ModelAdmin):
        # Fields: clan, name, sex, age, education_level, area_of_specialization,
        #         contact, email, location, is_active
        list_display = ['name', 'clan', 'education_level', 'sex', 'location', 'is_active']
        list_filter = ['education_level', 'sex', 'clan']
        search_fields = ['name', 'area_of_specialization']


    @admin.register(PersonAbroad)
    class PersonAbroadAdmin(admin.ModelAdmin):
        # Fields: clan, name, sex, age, contact_email, country, is_active
        list_display = ['name', 'clan', 'country', 'sex', 'contact_email', 'is_active']
        list_filter = ['country', 'sex', 'clan']
        search_fields = ['name', 'country']


    @admin.register(PoliticalLeader)
    class PoliticalLeaderAdmin(admin.ModelAdmin):
        # Fields: clan, position, number_of_persons, names, contacts
        list_display = ['clan', 'position', 'number_of_persons']
        list_filter = ['clan', 'position']
        search_fields = ['clan__name', 'position', 'names']


    @admin.register(OBBLeader)
    class OBBLeaderAdmin(admin.ModelAdmin):
        # Fields: clan, position, number_of_persons, education_level, positions_held
        list_display = ['clan', 'position', 'number_of_persons', 'education_level']
        list_filter = ['clan', 'position']
        search_fields = ['clan__name', 'position']


    @admin.register(SavingGroup)
    class SavingGroupAdmin(admin.ModelAdmin):
        # Fields: clan, has_group, group_name, no_reason, formation_year,
        #         initiator_type, is_registered, membership_fee_required, is_active
        list_display = ['clan', 'has_group', 'group_name', 'is_registered', 'is_active']
        list_filter = ['clan', 'has_group', 'is_registered']
        search_fields = ['clan__name', 'group_name']


    @admin.register(SavingGroupMember)
    class SavingGroupMemberAdmin(admin.ModelAdmin):
        # Fields: saving_group, adults_male, adults_female, youth_male, youth_female,
        #         coordinator_name, loan_officer_name, secretary_name, treasurer_name, etc.
        list_display = ['saving_group', 'adults_male', 'adults_female', 'youth_male', 'youth_female']
        list_filter = ['saving_group__clan']
        search_fields = ['saving_group__clan__name']


    @admin.register(WaterSource)
    class WaterSourceAdmin(admin.ModelAdmin):
        # Fields: clan, name, heritage_type, village, parish, historical_usage, is_active
        list_display = ['name', 'clan', 'heritage_type', 'village', 'parish', 'is_active']
        list_filter = ['clan', 'heritage_type']
        search_fields = ['name', 'village']


    @admin.register(PalmOilMachine)
    class PalmOilMachineAdmin(admin.ModelAdmin):
        # Fields: clan, name, location, owner, is_active
        list_display = ['name', 'clan', 'owner', 'location', 'is_active']
        list_filter = ['clan']
        search_fields = ['name', 'owner']


    @admin.register(EnvironmentalProject)
    class EnvironmentalProjectAdmin(admin.ModelAdmin):
        # Fields: clan, project_type, description, status, start_date, is_active
        list_display = ['clan', 'project_type', 'status', 'start_date', 'is_active']
        list_filter = ['clan', 'project_type', 'status']
        search_fields = ['clan__name', 'project_type']


    @admin.register(Signature)
    class SignatureAdmin(admin.ModelAdmin):
        # Fields: clan, role, name, title, signature_data, signature_date, contact
        list_display = ['clan', 'role', 'name', 'title', 'signature_date']
        list_filter = ['clan', 'role']
        search_fields = ['clan__name', 'name', 'role']


    @admin.register(ClanPhoto)
    class ClanPhotoAdmin(admin.ModelAdmin):
        # Fields: clan, title, description, image, photo_type
        list_display = ['title', 'clan', 'photo_type']
        list_filter = ['clan', 'photo_type']
        search_fields = ['title', 'clan__name']


# ──────────────────────────────────────────────
# REGISTER MODELS WITH SUPER ADMIN SITE ONLY
# ──────────────────────────────────────────────

# Register survey models with super admin site
super_admin_site.register(Survey, SurveyAdmin)
super_admin_site.register(Question, QuestionAdmin)
super_admin_site.register(SurveyResponse, SurveyResponseAdmin)
super_admin_site.register(Answer, AnswerAdmin)

# Register clan models with super admin site if available
if clan_models_available:
    super_admin_site.register(Clan, ClanAdmin)
    super_admin_site.register(SubClan, SubClanAdmin)
    super_admin_site.register(Ridge, RidgeAdmin)
    super_admin_site.register(ExecutiveCommittee, ExecutiveCommitteeAdmin)
    super_admin_site.register(Structure, StructureAdmin)
    super_admin_site.register(Population, PopulationAdmin)
    super_admin_site.register(Resource, ResourceAdmin)
    super_admin_site.register(EducationEstimate, EducationEstimateAdmin)
    super_admin_site.register(EducatedPerson, EducatedPersonAdmin)
    super_admin_site.register(PersonAbroad, PersonAbroadAdmin)
    super_admin_site.register(PoliticalLeader, PoliticalLeaderAdmin)
    super_admin_site.register(OBBLeader, OBBLeaderAdmin)
    super_admin_site.register(SavingGroup, SavingGroupAdmin)
    super_admin_site.register(SavingGroupMember, SavingGroupMemberAdmin)
    super_admin_site.register(WaterSource, WaterSourceAdmin)
    super_admin_site.register(PalmOilMachine, PalmOilMachineAdmin)
    super_admin_site.register(EnvironmentalProject, EnvironmentalProjectAdmin)
    super_admin_site.register(Signature, SignatureAdmin)
    super_admin_site.register(ClanPhoto, ClanPhotoAdmin)
