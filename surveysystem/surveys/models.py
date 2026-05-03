from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import RegexValidator


class Survey(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    allow_anonymous = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='surveys_created', null=True, blank=True)
    is_clan = models.BooleanField(default=False, help_text="Mark this survey as a clan for the Bwamba Kingdom")
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']


class Question(models.Model):
    QUESTION_TYPES = [
        ('text', 'Text'),
        ('textarea', 'Paragraph'),
        ('radio', 'Multiple Choice'),
        ('checkbox', 'Checkboxes'),
        ('select', 'Dropdown'),
        ('number', 'Number'),
        ('email', 'Email'),
        ('date', 'Date'),
    ]
    
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    required = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    options = models.JSONField(default=dict, blank=True, help_text="For multiple choice questions")
    
    def __str__(self):
        return f"{self.survey.title} - {self.text[:50]}"
    
    class Meta:
        ordering = ['order']


class SurveyResponse(models.Model):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='responses')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    respondent_email = models.EmailField(blank=True)
    submitted_at = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    def __str__(self):
        user_info = self.user.username if self.user else self.respondent_email or "Anonymous"
        return f"Response to {self.survey.title} by {user_info}"
    
    class Meta:
        ordering = ['-submitted_at']


class Answer(models.Model):
    response = models.ForeignKey(SurveyResponse, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    answer_text = models.TextField(blank=True)
    answer_data = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"Answer to {self.question.text[:30]}"
    
    class Meta:
        unique_together = ['response', 'question']


# Sub-Clan Questionnaire Models (mirroring clan structure)
class SubClanSurvey(models.Model):
    """Sub-Clan questionnaire for the Bwamba Kingdom"""
    sub_clan = models.ForeignKey('SubClan', on_delete=models.CASCADE, related_name='sub_clan_surveys', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    allow_anonymous = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sub_clan_surveys_created', null=True, blank=True)
    is_sub_clan = models.BooleanField(default=True, help_text="Mark this survey as a sub-clan questionnaire for the Bwamba Kingdom")
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Sub-Clan Survey"
        verbose_name_plural = "Sub-Clan Surveys"


class SubClanQuestion(models.Model):
    """Questions for sub-clan questionnaires"""
    QUESTION_TYPES = [
        ('text', 'Text'),
        ('textarea', 'Paragraph'),
        ('radio', 'Multiple Choice'),
        ('checkbox', 'Checkboxes'),
        ('select', 'Dropdown'),
        ('number', 'Number'),
        ('email', 'Email'),
        ('date', 'Date'),
    ]
    
    sub_clan_survey = models.ForeignKey(SubClanSurvey, on_delete=models.CASCADE, related_name='sub_clan_questions')
    text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    required = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    options = models.JSONField(default=dict, blank=True, help_text="For multiple choice questions")
    
    def __str__(self):
        return f"{self.sub_clan_survey.title} - {self.text[:50]}"
    
    class Meta:
        ordering = ['order']
        verbose_name = "Sub-Clan Question"
        verbose_name_plural = "Sub-Clan Questions"


class SubClanSurveyResponse(models.Model):
    """Responses to sub-clan questionnaires"""
    sub_clan_survey = models.ForeignKey(SubClanSurvey, on_delete=models.CASCADE, related_name='sub_clan_responses')
    sub_clan = models.ForeignKey('SubClan', on_delete=models.CASCADE, related_name='sub_clan_survey_responses')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    respondent_email = models.EmailField(blank=True)
    submitted_at = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    def __str__(self):
        user_info = self.user.username if self.user else self.respondent_email or "Anonymous"
        return f"Sub-Clan Response to {self.sub_clan_survey.title} by {user_info} for {self.sub_clan.name}"
    
    class Meta:
        ordering = ['-submitted_at']
        verbose_name = "Sub-Clan Survey Response"
        verbose_name_plural = "Sub-Clan Survey Responses"


class SubClanAnswer(models.Model):
    """Answers to sub-clan questionnaire questions"""
    response = models.ForeignKey(SubClanSurveyResponse, on_delete=models.CASCADE, related_name='sub_clan_answers')
    question = models.ForeignKey(SubClanQuestion, on_delete=models.CASCADE)
    answer_text = models.TextField(blank=True)
    answer_data = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"Sub-Clan Answer to {self.question.text[:30]}"
    
    class Meta:
        unique_together = ['response', 'question']
        verbose_name = "Sub-Clan Answer"
        verbose_name_plural = "Sub-Clan Answers"


class SubClanSurveyData(models.Model):
    """Comprehensive OBB survey data for sub-clans"""
    sub_clan = models.ForeignKey('SubClan', on_delete=models.CASCADE, related_name='obb_survey_data')
    surveyor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sub_clan_surveys_conducted')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Basic Details
    households_count = models.PositiveIntegerField(null=True, blank=True)
    ridges_count = models.PositiveIntegerField(null=True, blank=True)
    village = models.CharField(max_length=200, blank=True)
    parish = models.CharField(max_length=200, blank=True)
    sub_county = models.CharField(max_length=200, blank=True)
    district = models.CharField(max_length=200, blank=True)
    
    # Population Data
    total_households = models.PositiveIntegerField(null=True, blank=True)
    total_population = models.PositiveIntegerField(null=True, blank=True)
    male_population = models.PositiveIntegerField(null=True, blank=True)
    female_population = models.PositiveIntegerField(null=True, blank=True)
    youth_population = models.PositiveIntegerField(null=True, blank=True)
    
    # Meeting Information
    meeting_frequency = models.CharField(max_length=100, blank=True)
    meeting_frequency_other = models.CharField(max_length=200, blank=True)
    
    # Saving Group Information
    saving_group = models.CharField(max_length=10, blank=True)  # Yes/No
    saving_group_name = models.CharField(max_length=200, blank=True)
    saving_group_no_reason = models.TextField(blank=True)
    saving_group_year = models.PositiveIntegerField(null=True, blank=True)
    saving_group_initiator = models.CharField(max_length=100, blank=True)
    saving_group_initiator_spec = models.CharField(max_length=200, blank=True)
    saving_group_registered = models.CharField(max_length=10, blank=True)  # Yes/No
    membership_fee = models.CharField(max_length=10, blank=True)  # Yes/No
    membership_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    shares_required = models.CharField(max_length=10, blank=True)  # Yes/No
    shares_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    annual_subscription = models.CharField(max_length=10, blank=True)  # Yes/No
    annual_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    adults_male = models.PositiveIntegerField(null=True, blank=True)
    adults_female = models.PositiveIntegerField(null=True, blank=True)
    youth_male = models.PositiveIntegerField(null=True, blank=True)
    youth_female = models.PositiveIntegerField(null=True, blank=True)
    coordinator_name = models.CharField(max_length=200, blank=True)
    coordinator_education = models.CharField(max_length=200, blank=True)
    coordinator_phone = models.CharField(max_length=20, blank=True)
    loan_officer_name = models.CharField(max_length=200, blank=True)
    loan_officer_education = models.CharField(max_length=200, blank=True)
    loan_officer_phone = models.CharField(max_length=20, blank=True)
    gov_programs_heard = models.CharField(max_length=10, blank=True)  # Yes/No
    gov_programs_benefited = models.CharField(max_length=10, blank=True)  # Yes/No
    info_source = models.CharField(max_length=500, blank=True)
    
    # JSON fields for complex data
    executive_committee = models.JSONField(default=list, blank=True)
    structures = models.JSONField(default=list, blank=True)
    resources = models.JSONField(default=list, blank=True)
    challenges = models.JSONField(default=list, blank=True)
    education_data = models.JSONField(default=list, blank=True)
    educated_persons = models.JSONField(default=list, blank=True)
    persons_abroad = models.JSONField(default=list, blank=True)
    political_leaders = models.JSONField(default=dict, blank=True)
    enterprises = models.JSONField(default=list, blank=True)
    water_sources = models.JSONField(default=list, blank=True)
    environmental_projects = models.JSONField(default=list, blank=True)
    signatures = models.JSONField(default=dict, blank=True)
    
    # File uploads
    leader_photo = models.ImageField(upload_to='sub_clan_photos/', null=True, blank=True)
    additional_photos = models.ImageField(upload_to='sub_clan_photos/', null=True, blank=True)
    
    def __str__(self):
        return f"OBB Survey Data for {self.sub_clan.name}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Sub-Clan OBB Survey Data"
        verbose_name_plural = "Sub-Clan OBB Survey Data"


# Ridge Questionnaire Models (mirroring sub-clan structure)
class RidgeSurvey(models.Model):
    """Ridge questionnaire for the Bwamba Kingdom"""
    ridge = models.ForeignKey('Ridge', on_delete=models.CASCADE, related_name='ridge_surveys', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    allow_anonymous = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ridge_surveys_created', null=True, blank=True)
    is_ridge = models.BooleanField(default=True, help_text="Mark this survey as a ridge questionnaire for the Bwamba Kingdom")
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Ridge Survey"
        verbose_name_plural = "Ridge Surveys"


class RidgeQuestion(models.Model):
    """Questions for ridge questionnaires"""
    QUESTION_TYPES = [
        ('text', 'Text'),
        ('textarea', 'Paragraph'),
        ('radio', 'Multiple Choice'),
        ('checkbox', 'Checkboxes'),
        ('select', 'Dropdown'),
        ('number', 'Number'),
        ('email', 'Email'),
        ('date', 'Date'),
    ]
    
    ridge_survey = models.ForeignKey(RidgeSurvey, on_delete=models.CASCADE, related_name='ridge_questions')
    text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    required = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    options = models.JSONField(default=dict, blank=True, help_text="For multiple choice questions")
    
    def __str__(self):
        return f"{self.ridge_survey.title} - {self.text[:50]}"
    
    class Meta:
        ordering = ['order']
        verbose_name = "Ridge Question"
        verbose_name_plural = "Ridge Questions"


class RidgeSurveyResponse(models.Model):
    """Responses to ridge questionnaires"""
    ridge_survey = models.ForeignKey(RidgeSurvey, on_delete=models.CASCADE, related_name='ridge_responses')
    ridge = models.ForeignKey('Ridge', on_delete=models.CASCADE, related_name='ridge_survey_responses')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    respondent_email = models.EmailField(blank=True)
    submitted_at = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    def __str__(self):
        user_info = self.user.username if self.user else self.respondent_email or "Anonymous"
        return f"Ridge Response to {self.ridge_survey.title} by {user_info} for {self.ridge.name}"
    
    class Meta:
        ordering = ['-submitted_at']
        verbose_name = "Ridge Survey Response"
        verbose_name_plural = "Ridge Survey Responses"


class RidgeAnswer(models.Model):
    """Answers to ridge questionnaire questions"""
    response = models.ForeignKey(RidgeSurveyResponse, on_delete=models.CASCADE, related_name='ridge_answers')
    question = models.ForeignKey(RidgeQuestion, on_delete=models.CASCADE)
    answer_text = models.TextField(blank=True)
    answer_data = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"Ridge Answer to {self.question.text[:30]}"
    
    class Meta:
        unique_together = ['response', 'question']
        verbose_name = "Ridge Answer"
        verbose_name_plural = "Ridge Answers"


class RidgeSurveyData(models.Model):
    """Comprehensive OBB survey data for ridges"""
    ridge = models.ForeignKey('Ridge', on_delete=models.CASCADE, related_name='obb_survey_data')
    surveyor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ridge_surveys_conducted')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Basic Details
    households_count = models.PositiveIntegerField(null=True, blank=True)
    village = models.CharField(max_length=200, blank=True)
    parish = models.CharField(max_length=200, blank=True)
    sub_county = models.CharField(max_length=200, blank=True)
    district = models.CharField(max_length=200, blank=True)
    
    # Population Data
    total_households = models.PositiveIntegerField(null=True, blank=True)
    total_population = models.PositiveIntegerField(null=True, blank=True)
    male_population = models.PositiveIntegerField(null=True, blank=True)
    female_population = models.PositiveIntegerField(null=True, blank=True)
    youth_population = models.PositiveIntegerField(null=True, blank=True)
    
    # Meeting Information
    meeting_frequency = models.CharField(max_length=100, blank=True)
    meeting_frequency_other = models.CharField(max_length=200, blank=True)
    
    # Saving Group Information
    saving_group = models.CharField(max_length=10, blank=True)  # Yes/No
    saving_group_name = models.CharField(max_length=200, blank=True)
    saving_group_no_reason = models.TextField(blank=True)
    saving_group_year = models.PositiveIntegerField(null=True, blank=True)
    saving_group_initiator = models.CharField(max_length=100, blank=True)
    saving_group_initiator_spec = models.CharField(max_length=200, blank=True)
    saving_group_registered = models.CharField(max_length=10, blank=True)  # Yes/No
    membership_fee = models.CharField(max_length=10, blank=True)  # Yes/No
    membership_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    shares_required = models.CharField(max_length=10, blank=True)  # Yes/No
    shares_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    annual_subscription = models.CharField(max_length=10, blank=True)  # Yes/No
    annual_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    adults_male = models.PositiveIntegerField(null=True, blank=True)
    adults_female = models.PositiveIntegerField(null=True, blank=True)
    youth_male = models.PositiveIntegerField(null=True, blank=True)
    youth_female = models.PositiveIntegerField(null=True, blank=True)
    coordinator_name = models.CharField(max_length=200, blank=True)
    coordinator_education = models.CharField(max_length=200, blank=True)
    coordinator_phone = models.CharField(max_length=20, blank=True)
    loan_officer_name = models.CharField(max_length=200, blank=True)
    loan_officer_education = models.CharField(max_length=200, blank=True)
    loan_officer_phone = models.CharField(max_length=20, blank=True)
    gov_programs_heard = models.CharField(max_length=10, blank=True)  # Yes/No
    gov_programs_benefited = models.CharField(max_length=10, blank=True)  # Yes/No
    info_source = models.CharField(max_length=500, blank=True)
    
    # JSON fields for complex data
    executive_committee = models.JSONField(default=list, blank=True)
    structures = models.JSONField(default=list, blank=True)
    resources = models.JSONField(default=list, blank=True)
    challenges = models.JSONField(default=list, blank=True)
    education_data = models.JSONField(default=list, blank=True)
    educated_persons = models.JSONField(default=list, blank=True)
    persons_abroad = models.JSONField(default=list, blank=True)
    political_leaders = models.JSONField(default=dict, blank=True)
    enterprises = models.JSONField(default=list, blank=True)
    water_sources = models.JSONField(default=list, blank=True)
    environmental_projects = models.JSONField(default=list, blank=True)
    signatures = models.JSONField(default=dict, blank=True)
    
    # File uploads
    leader_photo = models.ImageField(upload_to='ridge_photos/', null=True, blank=True)
    additional_photos = models.ImageField(upload_to='ridge_photos/', null=True, blank=True)
    
    def __str__(self):
        return f"OBB Survey Data for {self.ridge.name}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Ridge OBB Survey Data"
        verbose_name_plural = "Ridge OBB Survey Data"


# CLAN HIERARCHY MODELS

class Clan(models.Model):
    """Main clan model representing a Bwamba Kingdom clan"""
    name = models.CharField(max_length=200, unique=True, help_text="Name of the clan")
    description = models.TextField(blank=True, help_text="Description of the clan")
    village = models.CharField(max_length=200, help_text="Village where clan is located")
    parish = models.CharField(max_length=200, help_text="Parish where clan is located")
    sub_county = models.CharField(max_length=200, help_text="Sub-county where clan is located")
    district = models.CharField(max_length=200, help_text="District where clan is located")
    
    # Leadership information
    clan_head_name = models.CharField(max_length=200, help_text="Name of clan head")
    clan_head_contact = models.CharField(max_length=20, blank=True, help_text="Contact number of clan head")
    clan_head_email = models.EmailField(blank=True, help_text="Email of clan head")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clans_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    # Survey relationship
    survey = models.OneToOneField(Survey, on_delete=models.CASCADE, null=True, blank=True, related_name='clan')
    
    class Meta:
        ordering = ['name']
        verbose_name = "Clan"
        verbose_name_plural = "Clans"
    
    def __str__(self):
        return self.name
    
    @property
    def sub_clan_count(self):
        return self.sub_clans.count()
    
    @property
    def ridge_count(self):
        return self.ridges.count()


class SubClan(models.Model):
    """Sub-clan (Kanumbha) model under a main clan"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='sub_clans')
    name = models.CharField(max_length=200, help_text="Name of the sub-clan (Kanumbha)")
    address = models.CharField(max_length=500, help_text="Address of the sub-clan")
    leader_name = models.CharField(max_length=200, help_text="Name of sub-clan leader")
    leader_contact = models.CharField(max_length=20, blank=True, help_text="Contact of sub-clan leader")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sub_clans_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Sub-Clan (Kanumbha)"
        verbose_name_plural = "Sub-Clans (Kanumbha)"
        unique_together = ['clan', 'name']
    
    def __str__(self):
        return f"{self.clan.name} - {self.name}"


class Ridge(models.Model):
    """Ridge (Bitubhi) model under a sub-clan"""
    sub_clan = models.ForeignKey(SubClan, on_delete=models.CASCADE, related_name='ridges')
    name = models.CharField(max_length=200, help_text="Name of the ridge (Bitubhi)")
    leader_name = models.CharField(max_length=200, help_text="Name of ridge leader")
    leader_contact = models.CharField(max_length=20, blank=True, help_text="Contact of ridge leader")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ridges_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Ridge (Bitubhi)"
        verbose_name_plural = "Ridges (Bitubhi)"
        unique_together = ['sub_clan', 'name']
    
    def __str__(self):
        return f"{self.sub_clan.clan.name} - {self.sub_clan.name} - {self.name}"


# EXECUTIVE COMMITTEE MODELS

class ExecutiveCommittee(models.Model):
    """Executive committee members for clans and sub-clans"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='executive_committee', null=True, blank=True)
    sub_clan = models.ForeignKey(SubClan, on_delete=models.CASCADE, related_name='executive_committee', null=True, blank=True)
    
    name = models.CharField(max_length=200, help_text="Name of committee member")
    position = models.CharField(max_length=100, help_text="Position in committee")
    sex = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female')], help_text="Gender")
    age = models.PositiveIntegerField(help_text="Age of committee member")
    education_level = models.CharField(max_length=100, help_text="Education level")
    contact = models.CharField(max_length=20, blank=True, help_text="Contact number")
    email = models.EmailField(blank=True, help_text="Email address")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='committee_members_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['position', 'name']
        verbose_name = "Executive Committee Member"
        verbose_name_plural = "Executive Committee Members"
    
    def __str__(self):
        entity = self.clan.name if self.clan else self.sub_clan.name
        return f"{entity} - {self.position} - {self.name}"


# STRUCTURE MODELS

class Structure(models.Model):
    """Physical structures owned by clans"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='structures')
    name = models.CharField(max_length=200, help_text="Name of structure")
    type = models.CharField(max_length=100, help_text="Type of structure (e.g., Church, School, Health Center)")
    location = models.CharField(max_length=500, help_text="Location of structure")
    condition = models.CharField(max_length=100, help_text="Condition of structure")
    year_built = models.PositiveIntegerField(null=True, blank=True, help_text="Year structure was built")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='structures_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['type', 'name']
        verbose_name = "Structure"
        verbose_name_plural = "Structures"
    
    def __str__(self):
        return f"{self.clan.name} - {self.type}: {self.name}"


# POPULATION MODELS

class Population(models.Model):
    """Population statistics for clans"""
    clan = models.OneToOneField(Clan, on_delete=models.CASCADE, related_name='population')
    
    # Total population
    total_population = models.PositiveIntegerField(help_text="Total population of clan")
    male_population = models.PositiveIntegerField(help_text="Male population")
    female_population = models.PositiveIntegerField(help_text="Female population")
    
    # Age demographics
    youth_male = models.PositiveIntegerField(default=0, help_text="Male youth (18-30 years)")
    youth_female = models.PositiveIntegerField(default=0, help_text="Female youth (18-30 years)")
    adults_male = models.PositiveIntegerField(default=0, help_text="Male adults (30+ years)")
    adults_female = models.PositiveIntegerField(default=0, help_text="Female adults (30+ years)")
    children_male = models.PositiveIntegerField(default=0, help_text="Male children (0-17 years)")
    children_female = models.PositiveIntegerField(default=0, help_text="Female children (0-17 years)")
    
    # Meeting information
    meeting_frequency = models.CharField(max_length=100, help_text="How often clan meets")
    meeting_location = models.CharField(max_length=500, help_text="Where clan meets")
    last_meeting_date = models.DateField(null=True, blank=True, help_text="Date of last clan meeting")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='population_records_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Population Statistics"
        verbose_name_plural = "Population Statistics"
    
    def __str__(self):
        return f"{self.clan.name} - Population: {self.total_population}"


# RESOURCE MODELS

class Resource(models.Model):
    """Resources owned by clans"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='resources')
    name = models.CharField(max_length=200, help_text="Name of resource")
    type = models.CharField(max_length=100, help_text="Type of resource (e.g., Land, Building, Vehicle)")
    description = models.TextField(blank=True, help_text="Description of resource")
    size_area = models.CharField(max_length=100, blank=True, help_text="Size/area of resource")
    estimated_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Estimated monetary value")
    is_owned = models.BooleanField(default=True, help_text="Whether resource is owned by clan")
    is_rented = models.BooleanField(default=False, help_text="Whether resource is rented by clan")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resources_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['type', 'name']
        verbose_name = "Resource"
        verbose_name_plural = "Resources"
    
    def __str__(self):
        return f"{self.clan.name} - {self.type}: {self.name}"


# EDUCATION MODELS

class EducationEstimate(models.Model):
    """Education level estimates for clan population"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='education_estimates')
    education_level = models.CharField(max_length=100, help_text="Education level (e.g., P.7, S.4, Degree)")
    population_percentage = models.DecimalField(max_digits=5, decimal_places=2, help_text="Percentage of population at this level")
    area_of_employment = models.CharField(max_length=200, blank=True, help_text="Common areas of employment")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='education_estimates_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['education_level']
        verbose_name = "Education Estimate"
        verbose_name_plural = "Education Estimates"
        unique_together = ['clan', 'education_level']
    
    def __str__(self):
        return f"{self.clan.name} - {self.education_level}: {self.population_percentage}%"


class EducatedPerson(models.Model):
    """Individual educated persons (Degree, Masters, PhD)"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='educated_persons')
    name = models.CharField(max_length=200, help_text="Name of educated person")
    sex = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female')])
    age = models.PositiveIntegerField(help_text="Age of person")
    education_level = models.CharField(max_length=50, choices=[
        ('Degree', 'Degree'),
        ('Masters', 'Masters'),
        ('PhD', 'PhD')
    ])
    area_of_specialization = models.CharField(max_length=200, help_text="Area of specialization")
    contact = models.CharField(max_length=20, blank=True, help_text="Contact number")
    email = models.EmailField(blank=True, help_text="Email address")
    location = models.CharField(max_length=500, help_text="Current location")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='educated_persons_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['education_level', 'name']
        verbose_name = "Educated Person"
        verbose_name_plural = "Educated Persons"
    
    def __str__(self):
        return f"{self.clan.name} - {self.name} ({self.education_level})"


class PersonAbroad(models.Model):
    """Persons living abroad from the clan"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='persons_abroad')
    name = models.CharField(max_length=200, help_text="Name of person abroad")
    sex = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female')])
    age = models.PositiveIntegerField(help_text="Age of person")
    contact_email = models.EmailField(help_text="Email or contact information")
    country = models.CharField(max_length=100, help_text="Country where person lives")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='persons_abroad_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['country', 'name']
        verbose_name = "Person Abroad"
        verbose_name_plural = "Persons Abroad"
    
    def __str__(self):
        return f"{self.clan.name} - {self.name} ({self.country})"


# LEADERSHIP MODELS

class PoliticalLeader(models.Model):
    """Political leaders from the clan"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='political_leaders')
    position = models.CharField(max_length=100, help_text="Political position")
    number_of_persons = models.PositiveIntegerField(default=1, help_text="Number of persons in this position")
    names = models.TextField(help_text="Names of persons holding this position")
    contacts = models.TextField(blank=True, help_text="Contact information")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='political_leaders_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['position']
        verbose_name = "Political Leader"
        verbose_name_plural = "Political Leaders"
        unique_together = ['clan', 'position']
    
    def __str__(self):
        return f"{self.clan.name} - {self.position}"


class OBBLeader(models.Model):
    """OBB (Obuku Bwamba Bwambo) leaders from the clan"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='obb_leaders')
    position = models.CharField(max_length=100, help_text="OBB position")
    number_of_persons = models.PositiveIntegerField(default=1, help_text="Number of persons in this position")
    education_level = models.CharField(max_length=100, help_text="Education level of holders")
    positions_held = models.TextField(help_text="Other positions held")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='obb_leaders_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['position']
        verbose_name = "OBB Leader"
        verbose_name_plural = "OBB Leaders"
        unique_together = ['clan', 'position']
    
    def __str__(self):
        return f"{self.clan.name} - OBB {self.position}"


# ECONOMIC MODELS

class SavingGroup(models.Model):
    """Saving group information for clan"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='saving_groups')
    
    has_group = models.BooleanField(default=False, help_text="Whether clan has a saving group")
    group_name = models.CharField(max_length=200, blank=True, help_text="Name of saving group")
    no_reason = models.TextField(blank=True, help_text="Reason for not having saving group")
    formation_year = models.PositiveIntegerField(null=True, blank=True, help_text="Year group was formed")
    
    # Group initiator
    initiator_type = models.CharField(max_length=100, blank=True, help_text="Who initiated the group")
    initiator_specification = models.CharField(max_length=200, blank=True, help_text="Specific government/NGO name")
    
    # Registration
    is_registered = models.BooleanField(default=False, help_text="Whether group is registered")
    
    # Financial structure
    membership_fee_required = models.BooleanField(default=False, help_text="Membership fee required")
    membership_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Membership fee amount")
    
    shares_required = models.BooleanField(default=False, help_text="Shares required")
    shares_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Shares amount")
    
    annual_subscription = models.BooleanField(default=False, help_text="Annual subscription required")
    annual_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Annual subscription amount")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saving_groups_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Saving Group"
        verbose_name_plural = "Saving Groups"
    
    def __str__(self):
        return f"{self.clan.name} - Saving Group"


class SavingGroupMember(models.Model):
    """Members of the saving group"""
    saving_group = models.ForeignKey(SavingGroup, on_delete=models.CASCADE, related_name='members')
    
    # Demographics
    adults_male = models.PositiveIntegerField(default=0, help_text="Adult male members (30+ years)")
    adults_female = models.PositiveIntegerField(default=0, help_text="Adult female members (30+ years)")
    youth_male = models.PositiveIntegerField(default=0, help_text="Youth male members (18-30 years)")
    youth_female = models.PositiveIntegerField(default=0, help_text="Youth female members (18-30 years)")
    
    # Leadership positions
    coordinator_name = models.CharField(max_length=200, help_text="Coordinator name")
    coordinator_education = models.CharField(max_length=100, help_text="Coordinator education level")
    coordinator_phone = models.CharField(max_length=20, help_text="Coordinator phone")
    
    loan_officer_name = models.CharField(max_length=200, help_text="Loan officer name")
    loan_officer_education = models.CharField(max_length=100, help_text="Loan officer education")
    loan_officer_phone = models.CharField(max_length=20, help_text="Loan officer phone")
    
    secretary_name = models.CharField(max_length=200, help_text="Secretary name")
    secretary_education = models.CharField(max_length=100, help_text="Secretary education")
    secretary_phone = models.CharField(max_length=20, help_text="Secretary phone")
    
    treasurer_name = models.CharField(max_length=200, help_text="Treasurer name")
    treasurer_education = models.CharField(max_length=100, help_text="Treasurer education")
    treasurer_phone = models.CharField(max_length=20, help_text="Treasurer phone")
    
    # Government programs
    heard_gov_programs = models.BooleanField(default=False, help_text="Heard about government programs")
    benefited_gov_programs = models.BooleanField(default=False, help_text="Benefited from government programs")
    info_source = models.CharField(max_length=200, blank=True, help_text="Source of information about programs")
    
    # Enterprises
    main_enterprises = models.TextField(blank=True, help_text="Main enterprises (6 main ones)")
    
    # Leadership terms
    chairperson_terms = models.PositiveIntegerField(default=1, help_text="Number of terms chairperson has served")
    secretary_terms = models.PositiveIntegerField(default=1, help_text="Number of terms secretary has served")
    treasurer_terms = models.PositiveIntegerField(default=1, help_text="Number of terms treasurer has served")
    
    last_election_year = models.PositiveIntegerField(null=True, blank=True, help_text="Year of last election")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saving_group_members_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Saving Group Member"
        verbose_name_plural = "Saving Group Members"
    
    def __str__(self):
        return f"{self.saving_group.clan.name} - Saving Group Members"


# ENVIRONMENT MODELS

class WaterSource(models.Model):
    """Water sources and cultural heritages"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='water_sources')
    
    name = models.CharField(max_length=200, help_text="Name of stream/water source")
    heritage_type = models.CharField(max_length=100, help_text="Type of cultural heritage")
    village = models.CharField(max_length=200, help_text="Village where located")
    parish = models.CharField(max_length=200, help_text="Parish where located")
    historical_usage = models.TextField(help_text="Historical usage of the water source")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='water_sources_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Water Source / Heritage"
        verbose_name_plural = "Water Sources / Heritages"
    
    def __str__(self):
        return f"{self.clan.name} - {self.name}"


class PalmOilMachine(models.Model):
    """Palm oil processing machines (Mulhee)"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='palm_oil_machines')
    
    name = models.CharField(max_length=200, help_text="Name of machine")
    location = models.CharField(max_length=500, help_text="Location of machine")
    owner = models.CharField(max_length=200, help_text="Owner of machine")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='palm_oil_machines_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Palm Oil Machine (Mulhee)"
        verbose_name_plural = "Palm Oil Machines (Mulhee)"
    
    def __str__(self):
        return f"{self.clan.name} - {self.name}"


class EnvironmentalProject(models.Model):
    """Environmental projects in the clan"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='environmental_projects')
    
    project_type = models.CharField(max_length=100, help_text="Type of environmental project")
    description = models.TextField(blank=True, help_text="Description of project")
    status = models.CharField(max_length=50, default='Planned', help_text="Status of project")
    start_date = models.DateField(null=True, blank=True, help_text="Project start date")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='environmental_projects_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['project_type']
        verbose_name = "Environmental Project"
        verbose_name_plural = "Environmental Projects"
    
    def __str__(self):
        return f"{self.clan.name} - {self.project_type}"


# SIGNATURE MODELS

class Signature(models.Model):
    """Official signatures for clan documentation"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='signatures')
    
    role = models.CharField(max_length=100, help_text="Role of signatory")
    name = models.CharField(max_length=200, help_text="Name of signatory")
    title = models.CharField(max_length=200, blank=True, help_text="Title of signatory")
    signature_data = models.TextField(blank=True, help_text="Base64 encoded signature image")
    signature_date = models.DateField(help_text="Date of signature")
    contact = models.CharField(max_length=20, blank=True, help_text="Contact information")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='signatures_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['role']
        verbose_name = "Signature"
        verbose_name_plural = "Signatures"
        unique_together = ['clan', 'role']
    
    def __str__(self):
        return f"{self.clan.name} - {self.role}: {self.name}"


# PHOTO MODELS

class ClanPhoto(models.Model):
    """Photos related to clan documentation"""
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name='photos')
    
    title = models.CharField(max_length=200, help_text="Title of photo")
    description = models.TextField(blank=True, help_text="Description of photo")
    image = models.ImageField(upload_to='clan_photos/', help_text="Photo file")
    photo_type = models.CharField(max_length=50, help_text="Type of photo (Leader, Structure, Event, etc.)")
    
    # Administrative information
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clan_photos_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Clan Photo"
        verbose_name_plural = "Clan Photos"
    
    def __str__(self):
        return f"{self.clan.name} - {self.title}"
