# Generated migration for concurrent access models

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('surveys', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='FormLock',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('lock_type', models.CharField(max_length=50, choices=[('clan', 'Clan'), ('sub_clan', 'Sub-Clan'), ('ridge', 'Ridge')], verbose_name='Lock Type')),
                ('object_id', models.PositiveIntegerField(verbose_name='Object ID')),
                ('locked_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.user', verbose_name='Locked By')),
                ('locked_at', models.DateTimeField(auto_now_add=True, verbose_name='Locked At')),
                ('expires_at', models.DateTimeField(verbose_name='Expires At')),
                ('is_active', models.BooleanField(default=True, verbose_name='Is Active')),
            ],
            options={
                'verbose_name': 'Form Lock',
                'verbose_name_plural': 'Form Locks',
            },
        ),
        migrations.CreateModel(
            name='EditSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_type', models.CharField(max_length=50, choices=[('clan', 'Clan'), ('sub_clan', 'Sub-Clan'), ('ridge', 'Ridge')], verbose_name='Session Type')),
                ('object_id', models.PositiveIntegerField(verbose_name='Object ID')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.user', verbose_name='User')),
                ('started_at', models.DateTimeField(auto_now_add=True, verbose_name='Started At')),
                ('last_activity', models.DateTimeField(auto_now=True, verbose_name='Last Activity')),
                ('is_active', models.BooleanField(default=True, verbose_name='Is Active')),
                ('progress', models.JSONField(default=dict, verbose_name='Progress')),
            ],
            options={
                'verbose_name': 'Edit Session',
                'verbose_name_plural': 'Edit Sessions',
            },
        ),
        migrations.CreateModel(
            name='CollaborationEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_type', models.CharField(max_length=50, choices=[('lock_acquired', 'Lock Acquired'), ('lock_released', 'Lock Released'), ('session_started', 'Session Started'), ('session_ended', 'Session Ended'), ('conflict_detected', 'Conflict Detected')], verbose_name='Event Type')),
                ('object_type', models.CharField(max_length=50, choices=[('clan', 'Clan'), ('sub_clan', 'Sub-Clan'), ('ridge', 'Ridge')], verbose_name='Object Type')),
                ('object_id', models.PositiveIntegerField(verbose_name='Object ID')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.user', verbose_name='User')),
                ('timestamp', models.DateTimeField(auto_now_add=True, verbose_name='Timestamp')),
                ('details', models.JSONField(default=dict, verbose_name='Details')),
            ],
            options={
                'verbose_name': 'Collaboration Event',
                'verbose_name_plural': 'Collaboration Events',
            },
        ),
        migrations.AlterUniqueTogether(
            name='formlock',
            unique_together={('lock_type', 'object_id')},
        ),
    ]
