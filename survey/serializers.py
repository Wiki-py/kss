from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db import transaction
from .models import (
    User, RegisteredDevice, SurveyData, Clan, ClanAssignment, SubClan, Ridge, CommitteeMember,
    OfficeStructure, Resource, ClanResource, Challenge, ClanChallenge,
    EducationEstimate, EducatedPerson, PersonAbroad, PoliticalLeader,
    OBBLeader, SavingGroup, Enterprise, ClanEnterprise, WaterSource,
    EnvironmentalProject
)


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password', 'is_active']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            data['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password')
        
        return data


class RegisteredDeviceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = RegisteredDevice
        fields = ['id', 'device_unique_id', 'user', 'user_name', 'registered_at', 'last_seen', 'is_allowed']
        read_only_fields = ['registered_at', 'last_seen']


class EnvironmentalProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnvironmentalProject
        fields = ['id', 'name']


class SubClanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubClan
        fields = [
            'id', 'name', 'address', 'leader_name', 'contact',
            'education_primary', 'education_secondary', 'education_institution',
            'education_diploma', 'education_university'
        ]


class CommitteeMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommitteeMember
        fields = ['id', 'name', 'sex', 'position', 'education_level', 'phone_contact']


class OfficeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficeStructure
        fields = ['id', 'physical_address', 'structure_type', 'number_of_staff']


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id', 'name']


class ClanResourceSerializer(serializers.ModelSerializer):
    resource_name = serializers.CharField(source='resource.name', read_only=True)
    
    class Meta:
        model = ClanResource
        fields = ['id', 'resource', 'resource_name', 'size_capacity', 'estimated_value', 'owned', 'rented']


class ChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Challenge
        fields = ['id', 'description']


class ClanChallengeSerializer(serializers.ModelSerializer):
    challenge_description = serializers.CharField(source='challenge.description', read_only=True)
    
    class Meta:
        model = ClanChallenge
        fields = ['id', 'challenge', 'challenge_description']


class EducationEstimateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationEstimate
        fields = ['id', 'education_level', 'population_percent', 'area_of_employment']


class EducatedPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducatedPerson
        fields = ['id', 'name', 'sex', 'age', 'education_level', 'area_of_specialization', 'contact', 'location']


class PersonAbroadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonAbroad
        fields = ['id', 'name', 'sex', 'age', 'contact_email', 'country']


class PoliticalLeaderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PoliticalLeader
        fields = ['id', 'position', 'number_of_persons', 'names', 'contacts']


class OBBLeaderSerializer(serializers.ModelSerializer):
    class Meta:
        model = OBBLeader
        fields = ['id', 'position', 'number_of_persons', 'education_level', 'positions_held']


class SavingGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavingGroup
        fields = [
            'id', 'exists', 'name', 'reasons_if_no', 'formation_year', 'initiated_by', 'registered',
            'membership_fee', 'shares_amount', 'annual_subscription',
            'adult_male', 'adult_female', 'youth_male', 'youth_female',
            'coordinator_name', 'coordinator_education', 'coordinator_phone',
            'loan_officer_name', 'loan_officer_education', 'loan_officer_phone',
            'secretary_name', 'secretary_education', 'secretary_phone',
            'treasurer_name', 'treasurer_education', 'treasurer_phone',
            'heard_gov_programs', 'benefited', 'source_info',
            'chairperson_terms', 'secretary_terms', 'treasurer_terms', 'last_election_year'
        ]


class EnterpriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enterprise
        fields = ['id', 'name']


class ClanEnterpriseSerializer(serializers.ModelSerializer):
    enterprise_name = serializers.CharField(source='enterprise.name', read_only=True)
    
    class Meta:
        model = ClanEnterprise
        fields = ['id', 'enterprise', 'enterprise_name', 'is_main']


class WaterSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterSource
        fields = ['id', 'name', 'heritage_type', 'village', 'parish', 'historical_usage']


class ClanSerializer(serializers.ModelSerializer):
    subclans = SubClanSerializer(many=True, required=False)
    committee = CommitteeMemberSerializer(many=True, required=False)
    offices = OfficeStructureSerializer(many=True, required=False)
    resources = ClanResourceSerializer(many=True, required=False, source='clan_resources')
    challenges = ClanChallengeSerializer(many=True, required=False, source='clan_challenges')
    education_estimates = EducationEstimateSerializer(many=True, required=False)
    educated_persons = EducatedPersonSerializer(many=True, required=False)
    abroad_persons = PersonAbroadSerializer(many=True, required=False)
    political_leaders = PoliticalLeaderSerializer(many=True, required=False)
    obb_leaders = OBBLeaderSerializer(many=True, required=False)
    saving_group = SavingGroupSerializer(required=False)
    enterprises = ClanEnterpriseSerializer(many=True, required=False, source='clan_enterprises')
    water_sources = WaterSourceSerializer(many=True, required=False)
    environmental_projects = EnvironmentalProjectSerializer(many=True, required=False)
    
    class Meta:
        model = Clan
        fields = [
            'id', 'name', 'number_of_sub_clans', 'number_of_bitubhi', 'headquarters_address',
            'village', 'parish', 'sub_county', 'district', 'county', 'meeting_frequency',
            'meeting_other_text', 'total_households', 'total_population', 'male_population',
            'female_population', 'youth_population', 'clan_leader_photo',
            'collector_name', 'collector_contact', 'collector_signature',
            'clan_leader_name', 'clan_leader_title', 'clan_leader_signature',
            'coordinator_name', 'coordinator_signature', 'chairperson_name', 'chairperson_signature',
            'palm_oil_machines', 'environmental_projects',
            'subclans', 'committee', 'offices', 'resources', 'challenges',
            'education_estimates', 'educated_persons', 'abroad_persons',
            'political_leaders', 'obb_leaders', 'saving_group', 'enterprises',
            'water_sources'
        ]
        read_only_fields = ['id']
    
    @transaction.atomic
    def create(self, validated_data):
        # Extract nested data
        subclans_data = validated_data.pop('subclans', [])
        committee_data = validated_data.pop('committee', [])
        offices_data = validated_data.pop('offices', [])
        resources_data = validated_data.pop('clan_resources', [])
        challenges_data = validated_data.pop('clan_challenges', [])
        education_estimates_data = validated_data.pop('education_estimates', [])
        educated_persons_data = validated_data.pop('educated_persons', [])
        abroad_persons_data = validated_data.pop('abroad_persons', [])
        political_leaders_data = validated_data.pop('political_leaders', [])
        obb_leaders_data = validated_data.pop('obb_leaders', [])
        saving_group_data = validated_data.pop('saving_group', {})
        enterprises_data = validated_data.pop('clan_enterprises', [])
        water_sources_data = validated_data.pop('water_sources', [])
        environmental_projects_data = validated_data.pop('environmental_projects', [])
        
        # Create clan
        clan = Clan.objects.create(**validated_data)
        
        # Create related objects
        self._create_subclans(clan, subclans_data)
        self._create_committee_members(clan, committee_data)
        self._create_offices(clan, offices_data)
        self._create_resources(clan, resources_data)
        self._create_challenges(clan, challenges_data)
        self._create_education_estimates(clan, education_estimates_data)
        self._create_educated_persons(clan, educated_persons_data)
        self._create_abroad_persons(clan, abroad_persons_data)
        self._create_political_leaders(clan, political_leaders_data)
        self._create_obb_leaders(clan, obb_leaders_data)
        self._create_saving_group(clan, saving_group_data)
        self._create_enterprises(clan, enterprises_data)
        self._create_water_sources(clan, water_sources_data)
        self._create_environmental_projects(clan, environmental_projects_data)
        
        return clan
    
    @transaction.atomic
    def update(self, instance, validated_data):
        # Extract nested data
        subclans_data = validated_data.pop('subclans', None)
        committee_data = validated_data.pop('committee', None)
        offices_data = validated_data.pop('offices', None)
        resources_data = validated_data.pop('clan_resources', None)
        challenges_data = validated_data.pop('clan_challenges', None)
        education_estimates_data = validated_data.pop('education_estimates', None)
        educated_persons_data = validated_data.pop('educated_persons', None)
        abroad_persons_data = validated_data.pop('abroad_persons', None)
        political_leaders_data = validated_data.pop('political_leaders', None)
        obb_leaders_data = validated_data.pop('obb_leaders', None)
        saving_group_data = validated_data.pop('saving_group', None)
        enterprises_data = validated_data.pop('clan_enterprises', None)
        water_sources_data = validated_data.pop('water_sources', None)
        environmental_projects_data = validated_data.pop('environmental_projects', None)
        
        # Update clan
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update related objects if provided
        if subclans_data is not None:
            instance.subclans.all().delete()
            self._create_subclans(instance, subclans_data)
        
        if committee_data is not None:
            instance.committee.all().delete()
            self._create_committee_members(instance, committee_data)
        
        if offices_data is not None:
            instance.offices.all().delete()
            self._create_offices(instance, offices_data)
        
        if resources_data is not None:
            instance.resources.all().delete()
            self._create_resources(instance, resources_data)
        
        if challenges_data is not None:
            instance.challenges.all().delete()
            self._create_challenges(instance, challenges_data)
        
        if education_estimates_data is not None:
            instance.education_estimates.all().delete()
            self._create_education_estimates(instance, education_estimates_data)
        
        if educated_persons_data is not None:
            instance.educated_persons.all().delete()
            self._create_educated_persons(instance, educated_persons_data)
        
        if abroad_persons_data is not None:
            instance.abroad_persons.all().delete()
            self._create_abroad_persons(instance, abroad_persons_data)
        
        if political_leaders_data is not None:
            instance.political_leaders.all().delete()
            self._create_political_leaders(instance, political_leaders_data)
        
        if obb_leaders_data is not None:
            instance.obb_leaders.all().delete()
            self._create_obb_leaders(instance, obb_leaders_data)
        
        if saving_group_data is not None:
            if hasattr(instance, 'saving_group'):
                instance.saving_group.delete()
            self._create_saving_group(instance, saving_group_data)
        
        if enterprises_data is not None:
            instance.enterprises.all().delete()
            self._create_enterprises(instance, enterprises_data)
        
        if water_sources_data is not None:
            instance.water_sources.all().delete()
            self._create_water_sources(instance, water_sources_data)
        
        if environmental_projects_data is not None:
            instance.environmental_projects.clear()
            self._create_environmental_projects(instance, environmental_projects_data)
        
        return instance
    
    def _create_subclans(self, clan, subclans_data):
        for subclan_data in subclans_data:
            SubClan.objects.create(clan=clan, **subclan_data)
    
    def _create_committee_members(self, clan, committee_data):
        for member_data in committee_data:
            CommitteeMember.objects.create(clan=clan, **member_data)
    
    def _create_offices(self, clan, offices_data):
        for office_data in offices_data:
            OfficeStructure.objects.create(clan=clan, **office_data)
    
    def _create_resources(self, clan, resources_data):
        for resource_data in resources_data:
            resource_id = resource_data.pop('resource')
            resource = Resource.objects.get(id=resource_id)
            ClanResource.objects.create(clan=clan, resource=resource, **resource_data)
    
    def _create_challenges(self, clan, challenges_data):
        for challenge_data in challenges_data:
            challenge_id = challenge_data.pop('challenge')
            challenge = Challenge.objects.get(id=challenge_id)
            ClanChallenge.objects.create(clan=clan, challenge=challenge, **challenge_data)
    
    def _create_education_estimates(self, clan, education_estimates_data):
        for estimate_data in education_estimates_data:
            EducationEstimate.objects.create(clan=clan, **estimate_data)
    
    def _create_educated_persons(self, clan, educated_persons_data):
        for person_data in educated_persons_data:
            EducatedPerson.objects.create(clan=clan, **person_data)
    
    def _create_abroad_persons(self, clan, abroad_persons_data):
        for person_data in abroad_persons_data:
            PersonAbroad.objects.create(clan=clan, **person_data)
    
    def _create_political_leaders(self, clan, political_leaders_data):
        for leader_data in political_leaders_data:
            PoliticalLeader.objects.create(clan=clan, **leader_data)
    
    def _create_obb_leaders(self, clan, obb_leaders_data):
        for leader_data in obb_leaders_data:
            OBBLeader.objects.create(clan=clan, **leader_data)
    
    def _create_saving_group(self, clan, saving_group_data):
        if saving_group_data:
            SavingGroup.objects.create(clan=clan, **saving_group_data)
    
    def _create_enterprises(self, clan, enterprises_data):
        for enterprise_data in enterprises_data:
            enterprise_id = enterprise_data.pop('enterprise')
            enterprise = Enterprise.objects.get(id=enterprise_id)
            ClanEnterprise.objects.create(clan=clan, enterprise=enterprise, **enterprise_data)
    
    def _create_water_sources(self, clan, water_sources_data):
        for water_data in water_sources_data:
            WaterSource.objects.create(clan=clan, **water_data)
    
    def _create_environmental_projects(self, clan, environmental_projects_data):
        for project_data in environmental_projects_data:
            project_id = project_data.pop('id') if 'id' in project_data else None
            if project_id:
                project = EnvironmentalProject.objects.get(id=project_id)
                clan.environmental_projects.add(project)
            elif 'name' in project_data:
                project, created = EnvironmentalProject.objects.get_or_create(name=project_data['name'])
                clan.environmental_projects.add(project)


class SurveyDataSerializer(serializers.ModelSerializer):
    clans = ClanSerializer(many=True, read_only=True)
    agent_name = serializers.CharField(source='agent.username', read_only=True)
    
    class Meta:
        model = SurveyData
        fields = ['id', 'agent', 'agent_name', 'submitted_at', 'synced', 'clans']
        read_only_fields = ['id', 'agent', 'submitted_at']
    
    def create(self, validated_data):
        clans_data = validated_data.pop('clans', [])
        survey = SurveyData.objects.create(**validated_data)
        
        for clan_data in clans_data:
            clan_data['survey'] = survey
            clan_serializer = ClanSerializer(data=clan_data)
            if clan_serializer.is_valid():
                clan_serializer.save()
        
        return survey


class SurveyNestedSerializer(serializers.ModelSerializer):
    clans = ClanSerializer(many=True)
    
    class Meta:
        model = SurveyData
        fields = ['id', 'agent', 'submitted_at', 'synced', 'clans']
        read_only_fields = ['id', 'agent', 'submitted_at']
    
    @transaction.atomic
    def create(self, validated_data):
        clans_data = validated_data.pop('clans', [])
        
        # Get agent from context (set in view)
        agent = self.context['request'].user
        validated_data['agent'] = agent
        
        survey = SurveyData.objects.create(**validated_data)
        
        for clan_data in clans_data:
            clan_data['survey'] = survey
            clan_serializer = ClanSerializer(data=clan_data)
            if clan_serializer.is_valid():
                clan_serializer.save()
        
        return survey


class OfflineSyncSerializer(serializers.Serializer):
    surveys = SurveyNestedSerializer(many=True)
    
    @transaction.atomic
    def create(self, validated_data):
        surveys_data = validated_data['surveys']
        created_surveys = []
        
        agent = self.context['request'].user
        
        for survey_data in surveys_data:
            survey_data['agent'] = agent
            survey_serializer = SurveyNestedSerializer(data=survey_data, context=self.context)
            if survey_serializer.is_valid():
                created_surveys.append(survey_serializer.save())

        return {'surveys': created_surveys}


# Clan Management Serializers for Multi-User Hierarchy System

class ClanAssignmentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = ClanAssignment
        fields = ['id', 'user', 'user_name', 'user_id', 'clan', 'level', 'assigned_at', 'assigned_by', 'is_active']
        read_only_fields = ['assigned_at', 'assigned_by']


class ClanSerializer(serializers.ModelSerializer):
    assigned_users = ClanAssignmentSerializer(source='assigned_users', many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Clan
        fields = [
            'id', 'name', 'number_of_sub_clans', 'number_of_bitubhi', 'headquarters_address',
            'village', 'parish', 'sub_county', 'district', 'county', 'meeting_frequency',
            'meeting_other_text', 'total_households', 'total_population', 'male_population',
            'female_population', 'youth_population', 'clan_leader_name', 'clan_leader_contact',
            'created_by', 'created_by_name', 'created_at', 'updated_at', 'assigned_users'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class SubClanSerializer(serializers.ModelSerializer):
    clan_name = serializers.CharField(source='clan.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = SubClan
        fields = [
            'id', 'clan', 'clan_name', 'name', 'address', 'leader_name', 'contact',
            'village', 'parish', 'sub_county', 'district', 'county',
            'subclan_leader_name', 'subclan_leader_contact', 'number_of_ridges',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class RidgeSerializer(serializers.ModelSerializer):
    subclan_name = serializers.CharField(source='subclan.name', read_only=True)
    clan_name = serializers.CharField(source='subclan.clan.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Ridge
        fields = [
            'id', 'subclan', 'subclan_name', 'clan_name', 'name',
            'village', 'parish', 'sub_county', 'district', 'county',
            'ridge_leader_name', 'ridge_leader_contact', 'number_of_households',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class ClanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating clans with basic info"""
    class Meta:
        model = Clan
        fields = [
            'name', 'clan_leader_name', 'clan_leader_contact',
            'village', 'parish', 'sub_county', 'district', 'county',
            'number_of_sub_clans', 'number_of_bitubhi', 'total_households', 
            'total_population', 'male_population', 'female_population', 
            'youth_population', 'headquarters_address', 'meeting_frequency'
        ]

    def create(self, validated_data):
        try:
            validated_data['created_by'] = self.context['request'].user
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError(f"Failed to create clan: {str(e)}")


class SubClanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating sub-clans"""
    clan_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = SubClan
        fields = [
            'clan_id', 'name', 'subclan_leader_name', 'subclan_leader_contact',
            'village', 'parish', 'sub_county', 'district', 'county'
        ]

    def create(self, validated_data):
        clan_id = validated_data.pop('clan_id')
        validated_data['clan_id'] = clan_id
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class RidgeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating ridges"""
    subclan_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Ridge
        fields = [
            'subclan_id', 'name', 'ridge_leader_name', 'ridge_leader_contact',
            'village', 'parish', 'sub_county', 'district', 'county',
            'number_of_households'
        ]

    def create(self, validated_data):
        subclan_id = validated_data.pop('subclan_id')
        validated_data['subclan_id'] = subclan_id
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
