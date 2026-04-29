from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
from django.utils import timezone
from .models import Clan, SurveyData


def generate_pdf_report(clan_id=None, date_from=None, date_to=None, district=None):
    """Generate PDF report for OBB Kingdom Survey data."""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        textColor=colors.darkblue
    )
    
    normal_style = styles['Normal']
    normal_style.fontSize = 10
    
    # Build story
    story = []
    
    # Title
    story.append(Paragraph("OBB Kingdom – Clan Baseline Survey Report", title_style))
    story.append(Spacer(1, 12))
    
    # Report metadata
    report_date = timezone.now().strftime("%B %d, %Y")
    metadata = f"""
    <b>Report Generated:</b> {report_date}<br/>
    <b>Period:</b> {date_from or 'All Time'} to {date_to or 'Present'}<br/>
    <b>District Filter:</b> {district or 'All Districts'}
    """
    story.append(Paragraph(metadata, normal_style))
    story.append(Spacer(1, 20))
    
    # Get filtered clans
    clans = get_filtered_clans(clan_id, date_from, date_to, district)
    
    if not clans:
        story.append(Paragraph("No data found matching the specified criteria.", normal_style))
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    # Summary statistics
    story.append(Paragraph("Summary Statistics", heading_style))
    summary_data = [
        ['Total Clans', str(len(clans))],
        ['Total Population', str(sum(clan.total_population for clan in clans))],
        ['Total Households', str(sum(clan.total_households for clan in clans))],
        ['Total Male Population', str(sum(clan.male_population for clan in clans))],
        ['Total Female Population', str(sum(clan.female_population for clan in clans))],
        ['Total Youth Population', str(sum(clan.youth_population for clan in clans))],
    ]
    
    summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # District distribution
    story.append(Paragraph("District Distribution", heading_style))
    district_data = [['District', 'Number of Clans', 'Total Population']]
    district_stats = {}
    
    for clan in clans:
        district_name = clan.district
        if district_name not in district_stats:
            district_stats[district_name] = {'count': 0, 'population': 0}
        district_stats[district_name]['count'] += 1
        district_stats[district_name]['population'] += clan.total_population
    
    for district_name, stats in district_stats.items():
        district_data.append([district_name, str(stats['count']), str(stats['population'])])
    
    district_table = Table(district_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
    district_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(district_table)
    story.append(Spacer(1, 20))
    
    # Detailed clan information
    for clan in clans:
        story.append(Paragraph(f"Clan: {clan.name}", heading_style))
        
        # Basic information
        clan_info = f"""
        <b>Location:</b> {clan.village}, {clan.parish}, {clan.sub_county}, {clan.district}<br/>
        <b>Headquarters:</b> {clan.headquarters_address}<br/>
        <b>Meeting Frequency:</b> {clan.get_meeting_frequency_display()}<br/>
        <b>Sub-clans:</b> {clan.number_of_sub_clans}<br/>
        <b>Bitubhi:</b> {clan.number_of_bitubhi}
        """
        story.append(Paragraph(clan_info, normal_style))
        
        # Population breakdown
        pop_data = [
            ['Category', 'Count'],
            ['Total Households', str(clan.total_households)],
            ['Total Population', str(clan.total_population)],
            ['Male Population', str(clan.male_population)],
            ['Female Population', str(clan.female_population)],
            ['Youth Population', str(clan.youth_population)],
        ]
        
        pop_table = Table(pop_data, colWidths=[2*inch, 1.5*inch])
        pop_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(pop_table)
        story.append(Spacer(1, 12))
        
        # Committee members
        if clan.committee.exists():
            story.append(Paragraph("Committee Members", heading_style))
            committee_data = [['Name', 'Sex', 'Position', 'Education Level', 'Contact']]
            
            for member in clan.committee.all():
                committee_data.append([
                    member.name,
                    member.get_sex_display(),
                    member.position,
                    member.education_level,
                    member.phone_contact
                ])
            
            committee_table = Table(committee_data, colWidths=[1.5*inch, 0.8*inch, 1.5*inch, 1.2*inch, 1*inch])
            committee_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgreen),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            story.append(committee_table)
            story.append(Spacer(1, 12))
        
        # Resources
        if clan.resources.exists():
            story.append(Paragraph("Resources", heading_style))
            resource_data = [['Resource', 'Size/Capacity', 'Estimated Value', 'Owned', 'Rented']]
            
            for clan_resource in clan.resources.all():
                resource_data.append([
                    clan_resource.resource.name,
                    clan_resource.size_capacity,
                    f"UGX {clan_resource.estimated_value:,.2f}",
                    'Yes' if clan_resource.owned else 'No',
                    'Yes' if clan_resource.rented else 'No'
                ])
            
            resource_table = Table(resource_data, colWidths=[1.5*inch, 1.2*inch, 1.2*inch, 0.8*inch, 0.8*inch])
            resource_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightyellow),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            story.append(resource_table)
            story.append(Spacer(1, 12))
        
        # Challenges
        if clan.challenges.exists():
            story.append(Paragraph("Challenges", heading_style))
            challenge_data = [['Challenge']]
            
            for clan_challenge in clan.challenges.all():
                challenge_data.append([clan_challenge.challenge.description])
            
            challenge_table = Table(challenge_data, colWidths=[5*inch])
            challenge_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightcoral),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            story.append(challenge_table)
            story.append(Spacer(1, 12))
        
        # Educated persons
        if clan.educated_persons.exists():
            story.append(Paragraph("Educated Persons", heading_style))
            educated_data = [['Name', 'Sex', 'Age', 'Education Level', 'Specialization', 'Contact']]
            
            for person in clan.educated_persons.all():
                educated_data.append([
                    person.name,
                    person.get_sex_display(),
                    str(person.age),
                    person.get_education_level_display(),
                    person.area_of_specialization,
                    person.contact
                ])
            
            educated_table = Table(educated_data, colWidths=[1.2*inch, 0.6*inch, 0.6*inch, 1*inch, 1.2*inch, 0.8*inch])
            educated_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 7),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            story.append(educated_table)
            story.append(Spacer(1, 12))
        
        # Signatures section
        story.append(Paragraph("Signatures", heading_style))
        signature_info = f"""
        <b>Collector:</b> {clan.collector_name} ({clan.collector_contact})<br/>
        <b>Clan Leader:</b> {clan.clan_leader_name} ({clan.clan_leader_title})<br/>
        <b>Coordinator:</b> {clan.coordinator_name}<br/>
        <b>Chairperson:</b> {clan.chairperson_name}
        """
        story.append(Paragraph(signature_info, normal_style))
        
        # Add page break between clans (except for the last one)
        if clan != clans.last():
            story.append(Spacer(1, 30))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


def get_filtered_clans(clan_id=None, date_from=None, date_to=None, district=None):
    """Get clans based on filter criteria."""
    clans = Clan.objects.select_related('survey').prefetch_related(
        'committee', 'resources', 'challenges', 'educated_persons'
    )
    
    if clan_id:
        clans = clans.filter(id=clan_id)
    
    if date_from:
        try:
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
            clans = clans.filter(survey__submitted_at__date__gte=date_from_obj)
        except ValueError:
            pass
    
    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
            clans = clans.filter(survey__submitted_at__date__lte=date_to_obj)
        except ValueError:
            pass
    
    if district:
        clans = clans.filter(district__icontains=district)
    
    return clans.order_by('name')
