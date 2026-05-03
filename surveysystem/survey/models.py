from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.utils import timezone
import uuid


class User(AbstractUser):
    ROLE_CHOICES = [
        ('agent', 'Agent'),
        ('admin', 'Admin'),
        ('superadmin', 'Super Admin'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='agent')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'survey_user'


class RegisteredDevice(models.Model):
    device_unique_id = models.CharField(max_length=255, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'agent'})
    registered_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    is_allowed = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'survey_registered_device'
    
    def __str__(self):
        return f"{self.device_unique_id} - {self.user.username}"
    
    def update_last_seen(self):
        """Update the last_seen timestamp to current time."""
        self.last_seen = timezone.now()
        self.save(update_fields=['last_seen'])


class SurveyData(models.Model):
    agent = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'agent'})
    submitted_at = models.DateTimeField(auto_now_add=True)
    synced = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'survey_data'
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"Survey by {self.agent.username} on {self.submitted_at}"


class EnvironmentalProject(models.Model):
    PROJECT_CHOICES = [
        ('agro_forestry', 'Agro Forestry'),
        ('agro_ecology', 'Agro Ecology'),
        ('apiculture', 'Apiculture'),
    ]
    
    name = models.CharField(max_length=100, choices=PROJECT_CHOICES, unique=True)
    
    class Meta:
        db_table = 'survey_environmental_project'
    
    def __str__(self):
        return self.get_name_display()


class Clan(models.Model):
    MEETING_FREQUENCY_CHOICES = [
        ('once_year', 'Once a Year'),
        ('twice_year', 'Twice a Year'),
        ('quarterly', 'Quarterly'),
        ('monthly', 'Monthly'),
        ('other', 'Other'),
    ]
    
    survey = models.ForeignKey(SurveyData, on_delete=models.CASCADE, related_name='clans', null=True, blank=True)
    name = models.CharField(max_length=255)
    number_of_sub_clans = models.IntegerField(default=0)
    number_of_bitubhi = models.IntegerField(default=0)
    headquarters_address = models.TextField(blank=True, null=True)
    village = models.CharField(max_length=255, blank=True, null=True)
    parish = models.CharField(max_length=255, blank=True, null=True)
    sub_county = models.CharField(max_length=255, blank=True, null=True)
    district = models.CharField(max_length=255, blank=True, null=True)
    county = models.CharField(max_length=255, blank=True, null=True)
    meeting_frequency = models.CharField(max_length=20, choices=MEETING_FREQUENCY_CHOICES, blank=True, null=True)
    meeting_other_text = models.TextField(blank=True, null=True)
    total_households = models.IntegerField(default=0)
    total_population = models.IntegerField(default=0)
    male_population = models.IntegerField(default=0)
    female_population = models.IntegerField(default=0)
    youth_population = models.IntegerField(default=0)
    clan_leader_photo = models.ImageField(upload_to='clan_leaders/', blank=True, null=True)
    
    # Multi-user hierarchy fields
    clan_leader_name = models.CharField(max_length=255, blank=True, null=True)
    clan_leader_contact = models.CharField(max_length=20, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_clans')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    # Signature fields (for backward compatibility)
    collector_name = models.CharField(max_length=255, blank=True, null=True)
    collector_contact = models.CharField(max_length=20, blank=True, null=True)
    collector_signature = models.TextField(blank=True, null=True)  # base64
    clan_leader_title = models.CharField(max_length=255, blank=True, null=True)
    clan_leader_signature = models.TextField(blank=True, null=True)  # base64
    coordinator_name = models.CharField(max_length=255, blank=True, null=True)
    coordinator_signature = models.TextField(blank=True, null=True)  # base64
    chairperson_name = models.CharField(max_length=255, blank=True, null=True)
    chairperson_signature = models.TextField(blank=True, null=True)  # base64
    
    # Additional fields
    palm_oil_machines = models.TextField(blank=True, null=True)
    environmental_projects = models.ManyToManyField(EnvironmentalProject, blank=True)
    
    class Meta:
        db_table = 'survey_clan'
    
    def __str__(self):
        return self.name


class ClanAssignment(models.Model):
    """Model to track user assignments to clan hierarchy levels"""
    HIERARCHY_LEVELS = [
        ('clan', 'Clan'),
        ('subclan', 'Sub-Clan'),
        ('ridge', 'Ridge'),
    ]
    
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='assigned_users')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clan_assignments')
    level = models.CharField(max_length=20, choices=HIERARCHY_LEVELS)
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='made_assignments')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'survey_clan_assignment'
        unique_together = ['clan', 'user', 'level']
    
    def __str__(self):
        return f"{self.user.username} - {self.clan.name} ({self.level})"


class SubClan(models.Model):
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='subclans')
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)
    leader_name = models.CharField(max_length=255, blank=True, null=True)
    contact = models.CharField(max_length=20, blank=True, null=True)
    
    # Location fields for multi-user hierarchy
    village = models.CharField(max_length=255, blank=True, null=True)
    parish = models.CharField(max_length=255, blank=True, null=True)
    sub_county = models.CharField(max_length=255, blank=True, null=True)
    district = models.CharField(max_length=255, blank=True, null=True)
    county = models.CharField(max_length=255, blank=True, null=True)
    
    # Multi-user hierarchy fields
    subclan_leader_name = models.CharField(max_length=255, blank=True, null=True)
    subclan_leader_contact = models.CharField(max_length=20, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_subclans')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    number_of_ridges = models.IntegerField(default=0)
    
    # Education fields (for backward compatibility)
    education_primary = models.BooleanField(default=False)
    education_secondary = models.BooleanField(default=False)
    education_institution = models.BooleanField(default=False)
    education_diploma = models.BooleanField(default=False)
    education_university = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'survey_subclan'
    
    def __str__(self):
        return f"{self.name} - {self.clan.name}"


class Ridge(models.Model):
    """Model for ridge hierarchy level"""
    subclan = models.ForeignKey(SubClan, on_delete=models.CASCADE, related_name='ridges')
    name = models.CharField(max_length=255)
    
    # Location fields for multi-user hierarchy
    village = models.CharField(max_length=255, blank=True, null=True)
    parish = models.CharField(max_length=255, blank=True, null=True)
    sub_county = models.CharField(max_length=255, blank=True, null=True)
    district = models.CharField(max_length=255, blank=True, null=True)
    county = models.CharField(max_length=255, blank=True, null=True)
    
    # Multi-user hierarchy fields
    ridge_leader_name = models.CharField(max_length=255, blank=True, null=True)
    ridge_leader_contact = models.CharField(max_length=20, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_ridges')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    number_of_households = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'survey_ridge'
    
    def __str__(self):
        return f"{self.name} - {self.subclan.name}"


class CommitteeMember(models.Model):
    SEX_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]
    
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='committee')
    name = models.CharField(max_length=255)
    sex = models.CharField(max_length=1, choices=SEX_CHOICES)
    position = models.CharField(max_length=255)
    education_level = models.CharField(max_length=255)
    phone_contact = models.CharField(max_length=20)
    
    class Meta:
        db_table = 'survey_committee_member'
    
    def __str__(self):
        return f"{self.name} - {self.clan.name}"


class OfficeStructure(models.Model):
    STRUCTURE_TYPE_CHOICES = [
        ('permanent', 'Permanent'),
        ('semi_permanent', 'Semi-Permanent'),
        ('temporary', 'Temporary'),
    ]
    
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='offices')
    physical_address = models.TextField()
    structure_type = models.CharField(max_length=20, choices=STRUCTURE_TYPE_CHOICES)
    number_of_staff = models.IntegerField()
    
    class Meta:
        db_table = 'survey_office_structure'
    
    def __str__(self):
        return f"{self.clan.name} - {self.get_structure_type_display()}"


class Resource(models.Model):
    name = models.CharField(max_length=255, unique=True)
    
    class Meta:
        db_table = 'survey_resource'
    
    def __str__(self):
        return self.name


class ClanResource(models.Model):
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='resources')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    size_capacity = models.CharField(max_length=255)
    estimated_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    owned = models.BooleanField(default=False)
    rented = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'survey_clan_resource'
        unique_together = ['clan', 'resource']
    
    def __str__(self):
        return f"{self.clan.name} - {self.resource.name}"


class Challenge(models.Model):
    description = models.CharField(max_length=500, unique=True)
    
    class Meta:
        db_table = 'survey_challenge'
    
    def __str__(self):
        return self.description


class ClanChallenge(models.Model):
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='challenges')
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'survey_clan_challenge'
        unique_together = ['clan', 'challenge']
    
    def __str__(self):
        return f"{self.clan.name} - {self.challenge.description}"


class EducationEstimate(models.Model):
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='education_estimates')
    education_level = models.CharField(max_length=255)
    population_percent = models.DecimalField(max_digits=5, decimal_places=2)
    area_of_employment = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        db_table = 'survey_education_estimate'
    
    def __str__(self):
        return f"{self.clan.name} - {self.education_level}"


class EducatedPerson(models.Model):
    SEX_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]
    
    EDUCATION_LEVEL_CHOICES = [
        ('degree', 'Degree'),
        ('masters', 'Masters'),
        ('phd', 'PhD'),
    ]
    
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='educated_persons')
    name = models.CharField(max_length=255)
    sex = models.CharField(max_length=1, choices=SEX_CHOICES)
    age = models.IntegerField()
    education_level = models.CharField(max_length=20, choices=EDUCATION_LEVEL_CHOICES)
    area_of_specialization = models.CharField(max_length=255)
    contact = models.CharField(max_length=20)
    location = models.CharField(max_length=255)
    
    class Meta:
        db_table = 'survey_educated_person'
    
    def __str__(self):
        return f"{self.name} - {self.clan.name}"


class PersonAbroad(models.Model):
    SEX_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]
    
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='abroad_persons')
    name = models.CharField(max_length=255)
    sex = models.CharField(max_length=1, choices=SEX_CHOICES)
    age = models.IntegerField()
    contact_email = models.EmailField()
    country = models.CharField(max_length=255)
    
    class Meta:
        db_table = 'survey_person_abroad'
    
    def __str__(self):
        return f"{self.name} - {self.country}"


class PoliticalLeader(models.Model):
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='political_leaders')
    position = models.CharField(max_length=255)
    number_of_persons = models.IntegerField()
    names = models.TextField()
    contacts = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'survey_political_leader'
    
    def __str__(self):
        return f"{self.clan.name} - {self.position}"


class OBBLeader(models.Model):
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='obb_leaders')
    position = models.CharField(max_length=255)
    number_of_persons = models.IntegerField()
    education_level = models.CharField(max_length=255)
    positions_held = models.TextField()
    
    class Meta:
        db_table = 'survey_obb_leader'
    
    def __str__(self):
        return f"{self.clan.name} - {self.position}"


class SavingGroup(models.Model):
    clan = models.OneToOneField(Clan, on_delete=models.CASCADE, null=True, blank=True, related_name='saving_group')
    exists = models.BooleanField(default=False)
    name = models.CharField(max_length=255, blank=True, null=True)
    reasons_if_no = models.TextField(blank=True, null=True)
    formation_year = models.IntegerField(null=True, blank=True)
    initiated_by = models.CharField(max_length=255, blank=True, null=True)
    registered = models.BooleanField(default=False)
    
    # Financial fields
    membership_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    shares_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    annual_subscription = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Membership counts
    adult_male = models.IntegerField(null=True, blank=True)
    adult_female = models.IntegerField(null=True, blank=True)
    youth_male = models.IntegerField(null=True, blank=True)
    youth_female = models.IntegerField(null=True, blank=True)
    
    # Officials
    coordinator_name = models.CharField(max_length=255, blank=True, null=True)
    coordinator_education = models.CharField(max_length=255, blank=True, null=True)
    coordinator_phone = models.CharField(max_length=20, blank=True, null=True)
    
    loan_officer_name = models.CharField(max_length=255, blank=True, null=True)
    loan_officer_education = models.CharField(max_length=255, blank=True, null=True)
    loan_officer_phone = models.CharField(max_length=20, blank=True, null=True)
    
    secretary_name = models.CharField(max_length=255, blank=True, null=True)
    secretary_education = models.CharField(max_length=255, blank=True, null=True)
    secretary_phone = models.CharField(max_length=20, blank=True, null=True)
    
    treasurer_name = models.CharField(max_length=255, blank=True, null=True)
    treasurer_education = models.CharField(max_length=255, blank=True, null=True)
    treasurer_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Government programs
    heard_gov_programs = models.BooleanField(default=False)
    benefited = models.BooleanField(default=False)
    source_info = models.CharField(max_length=255, blank=True, null=True)
    
    # Election terms
    chairperson_terms = models.IntegerField(null=True, blank=True)
    secretary_terms = models.IntegerField(null=True, blank=True)
    treasurer_terms = models.IntegerField(null=True, blank=True)
    last_election_year = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'survey_saving_group'
    
    def __str__(self):
        return f"{self.name} - {self.clan.name if self.clan else 'No Clan'}"


class Enterprise(models.Model):
    name = models.CharField(max_length=255, unique=True)
    
    class Meta:
        db_table = 'survey_enterprise'
    
    def __str__(self):
        return self.name


class ClanEnterprise(models.Model):
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='enterprises')
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    is_main = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'survey_clan_enterprise'
        unique_together = ['clan', 'enterprise']
    
    def __str__(self):
        return f"{self.clan.name} - {self.enterprise.name}"


class WaterSource(models.Model):
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='water_sources')
    name = models.CharField(max_length=255)
    heritage_type = models.CharField(max_length=255)
    village = models.CharField(max_length=255)
    parish = models.CharField(max_length=255)
    historical_usage = models.TextField()
    
    class Meta:
        db_table = 'survey_water_source'
    
    def __str__(self):
        return f"{self.name} - {self.clan.name}"
