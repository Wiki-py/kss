from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import (
    User, RegisteredDevice, SurveyData, EnvironmentalProject, Clan, SubClan,
    CommitteeMember, OfficeStructure, Resource, ClanResource, Challenge,
    ClanChallenge, EducationEstimate, EducatedPerson, PersonAbroad,
    PoliticalLeader, OBBLeader, SavingGroup, Enterprise, ClanEnterprise,
    WaterSource
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role',)}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('role',)}),
    )


class SubClanInline(admin.TabularInline):
    model = SubClan
    extra = 0
    fields = ['name', 'address', 'leader_name', 'contact', 
              'education_primary', 'education_secondary', 'education_institution',
              'education_diploma', 'education_university']


class CommitteeMemberInline(admin.TabularInline):
    model = CommitteeMember
    extra = 0
    fields = ['name', 'sex', 'position', 'education_level', 'phone_contact']


class OfficeStructureInline(admin.TabularInline):
    model = OfficeStructure
    extra = 0
    fields = ['physical_address', 'structure_type', 'number_of_staff']


class ClanResourceInline(admin.TabularInline):
    model = ClanResource
    extra = 0
    fields = ['resource', 'size_capacity', 'estimated_value', 'owned', 'rented']


class ClanChallengeInline(admin.TabularInline):
    model = ClanChallenge
    extra = 0
    fields = ['challenge']


class EducationEstimateInline(admin.TabularInline):
    model = EducationEstimate
    extra = 0
    fields = ['education_level', 'population_percent', 'area_of_employment']


class EducatedPersonInline(admin.TabularInline):
    model = EducatedPerson
    extra = 0
    fields = ['name', 'sex', 'age', 'education_level', 'area_of_specialization', 'contact', 'location']


class PersonAbroadInline(admin.TabularInline):
    model = PersonAbroad
    extra = 0
    fields = ['name', 'sex', 'age', 'contact_email', 'country']


class PoliticalLeaderInline(admin.TabularInline):
    model = PoliticalLeader
    extra = 0
    fields = ['position', 'number_of_persons', 'names', 'contacts']


class OBBLeaderInline(admin.TabularInline):
    model = OBBLeader
    extra = 0
    fields = ['position', 'number_of_persons', 'education_level', 'positions_held']


class ClanEnterpriseInline(admin.TabularInline):
    model = ClanEnterprise
    extra = 0
    fields = ['enterprise', 'is_main']


class WaterSourceInline(admin.TabularInline):
    model = WaterSource
    extra = 0
    fields = ['name', 'heritage_type', 'village', 'parish', 'historical_usage']


@admin.register(Clan)
class ClanAdmin(admin.ModelAdmin):
    list_display = ['name', 'district', 'village', 'total_population', 'total_households', 'survey_link']
    list_filter = ['district', 'meeting_frequency', 'survey__submitted_at']
    search_fields = ['name', 'village', 'district', 'parish']
    ordering = ['-survey__submitted_at', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('survey', 'name', 'number_of_sub_clans', 'number_of_bitubhi',
                      'headquarters_address', 'village', 'parish', 'sub_county', 'district', 'county')
        }),
        ('Meeting Information', {
            'fields': ('meeting_frequency', 'meeting_other_text')
        }),
        ('Population Data', {
            'fields': ('total_households', 'total_population', 'male_population',
                      'female_population', 'youth_population')
        }),
        ('Photo and Signatures', {
            'fields': ('clan_leader_photo', 'collector_name', 'collector_contact',
                      'collector_signature', 'clan_leader_name', 'clan_leader_title',
                      'clan_leader_signature', 'coordinator_name', 'coordinator_signature',
                      'chairperson_name', 'chairperson_signature')
        }),
        ('Additional Information', {
            'fields': ('palm_oil_machines', 'environmental_projects')
        }),
    )
    
    readonly_fields = ['survey']
    inlines = [
        SubClanInline, CommitteeMemberInline, OfficeStructureInline,
        ClanResourceInline, ClanChallengeInline, EducationEstimateInline,
        EducatedPersonInline, PersonAbroadInline, PoliticalLeaderInline,
        OBBLeaderInline, ClanEnterpriseInline, WaterSourceInline
    ]
    
    def survey_link(self, obj):
        if obj.survey:
            return format_html(
                '<a href="/admin/survey/surveydata/{}/change/">Survey {}</a>',
                obj.survey.id, obj.survey.id
            )
        return "No Survey"
    survey_link.short_description = 'Survey'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('survey', 'survey__agent')


@admin.register(SurveyData)
class SurveyDataAdmin(admin.ModelAdmin):
    list_display = ['id', 'agent', 'submitted_at', 'synced', 'clan_count']
    list_filter = ['synced', 'submitted_at', 'agent']
    search_fields = ['agent__username', 'agent__email']
    ordering = ['-submitted_at']
    readonly_fields = ['submitted_at']
    
    def clan_count(self, obj):
        return obj.clans.count()
    clan_count.short_description = 'Number of Clans'


@admin.register(RegisteredDevice)
class RegisteredDeviceAdmin(admin.ModelAdmin):
    list_display = ['device_unique_id', 'user', 'registered_at', 'last_seen', 'is_allowed']
    list_filter = ['is_allowed', 'registered_at']
    search_fields = ['device_unique_id', 'user__username']
    ordering = ['-registered_at']
    readonly_fields = ['registered_at']


@admin.register(EnvironmentalProject)
class EnvironmentalProjectAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(SubClan)
class SubClanAdmin(admin.ModelAdmin):
    list_display = ['name', 'clan', 'leader_name', 'contact']
    list_filter = ['clan__district']
    search_fields = ['name', 'clan__name', 'leader_name']
    ordering = ['clan__name', 'name']


@admin.register(CommitteeMember)
class CommitteeMemberAdmin(admin.ModelAdmin):
    list_display = ['name', 'clan', 'position', 'sex', 'phone_contact']
    list_filter = ['sex', 'clan__district']
    search_fields = ['name', 'clan__name', 'position']
    ordering = ['clan__name', 'name']


@admin.register(OfficeStructure)
class OfficeStructureAdmin(admin.ModelAdmin):
    list_display = ['clan', 'structure_type', 'number_of_staff']
    list_filter = ['structure_type', 'clan__district']
    search_fields = ['clan__name']
    ordering = ['clan__name']


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(ClanResource)
class ClanResourceAdmin(admin.ModelAdmin):
    list_display = ['clan', 'resource', 'size_capacity', 'estimated_value', 'owned', 'rented']
    list_filter = ['owned', 'rented', 'resource']
    search_fields = ['clan__name', 'resource__name']
    ordering = ['clan__name', 'resource__name']


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ['description']
    search_fields = ['description']


@admin.register(ClanChallenge)
class ClanChallengeAdmin(admin.ModelAdmin):
    list_display = ['clan', 'challenge']
    list_filter = ['challenge']
    search_fields = ['clan__name', 'challenge__description']
    ordering = ['clan__name']


@admin.register(EducationEstimate)
class EducationEstimateAdmin(admin.ModelAdmin):
    list_display = ['clan', 'education_level', 'population_percent', 'area_of_employment']
    list_filter = ['education_level']
    search_fields = ['clan__name', 'education_level']
    ordering = ['clan__name', 'education_level']


@admin.register(EducatedPerson)
class EducatedPersonAdmin(admin.ModelAdmin):
    list_display = ['name', 'clan', 'sex', 'age', 'education_level', 'area_of_specialization']
    list_filter = ['sex', 'education_level', 'clan__district']
    search_fields = ['name', 'clan__name', 'area_of_specialization']
    ordering = ['clan__name', 'name']


@admin.register(PersonAbroad)
class PersonAbroadAdmin(admin.ModelAdmin):
    list_display = ['name', 'clan', 'sex', 'age', 'country', 'contact_email']
    list_filter = ['sex', 'country', 'clan__district']
    search_fields = ['name', 'clan__name', 'country']
    ordering = ['clan__name', 'name']


@admin.register(PoliticalLeader)
class PoliticalLeaderAdmin(admin.ModelAdmin):
    list_display = ['clan', 'position', 'number_of_persons']
    list_filter = ['position', 'clan__district']
    search_fields = ['clan__name', 'position']
    ordering = ['clan__name', 'position']


@admin.register(OBBLeader)
class OBBLeaderAdmin(admin.ModelAdmin):
    list_display = ['clan', 'position', 'number_of_persons', 'education_level']
    list_filter = ['position', 'education_level', 'clan__district']
    search_fields = ['clan__name', 'position']
    ordering = ['clan__name', 'position']


@admin.register(SavingGroup)
class SavingGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'clan', 'exists', 'formation_year', 'registered']
    list_filter = ['exists', 'registered', 'clan__district']
    search_fields = ['name', 'clan__name']
    ordering = ['clan__name', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('clan', 'exists', 'name', 'reasons_if_no', 'formation_year',
                      'initiated_by', 'registered')
        }),
        ('Financial Information', {
            'fields': ('membership_fee', 'shares_amount', 'annual_subscription')
        }),
        ('Membership Counts', {
            'fields': ('adult_male', 'adult_female', 'youth_male', 'youth_female')
        }),
        ('Officials', {
            'fields': ('coordinator_name', 'coordinator_education', 'coordinator_phone',
                      'loan_officer_name', 'loan_officer_education', 'loan_officer_phone',
                      'secretary_name', 'secretary_education', 'secretary_phone',
                      'treasurer_name', 'treasurer_education', 'treasurer_phone')
        }),
        ('Government Programs', {
            'fields': ('heard_gov_programs', 'benefited', 'source_info')
        }),
        ('Election Information', {
            'fields': ('chairperson_terms', 'secretary_terms', 'treasurer_terms', 'last_election_year')
        }),
    )


@admin.register(Enterprise)
class EnterpriseAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(ClanEnterprise)
class ClanEnterpriseAdmin(admin.ModelAdmin):
    list_display = ['clan', 'enterprise', 'is_main']
    list_filter = ['is_main', 'enterprise']
    search_fields = ['clan__name', 'enterprise__name']
    ordering = ['clan__name', 'enterprise__name']


@admin.register(WaterSource)
class WaterSourceAdmin(admin.ModelAdmin):
    list_display = ['name', 'clan', 'heritage_type', 'village', 'parish']
    list_filter = ['heritage_type', 'clan__district']
    search_fields = ['name', 'clan__name', 'village', 'parish']
    ordering = ['clan__name', 'name']
