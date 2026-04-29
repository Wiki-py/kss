// OBB Baseline Survey System - Agent Form Fields from Backend Models

window.AgentFormFields = {
    // Main Clan Information (from Clan model)
    clan: {
        name: {
            type: 'text',
            label: 'Clan Name',
            required: true,
            maxLength: 255,
            placeholder: 'Enter clan name'
        },
        number_of_sub_clans: {
            type: 'number',
            label: 'Number of Sub-Clans',
            required: true,
            min: 0,
            placeholder: '0'
        },
        number_of_bitubhi: {
            type: 'number',
            label: 'Number of Bitubhi',
            required: true,
            min: 0,
            placeholder: '0'
        },
        headquarters_address: {
            type: 'textarea',
            label: 'Headquarters Address',
            required: true,
            rows: 3,
            placeholder: 'Enter headquarters address'
        },
        village: {
            type: 'text',
            label: 'Village',
            required: true,
            maxLength: 255,
            placeholder: 'Enter village name'
        },
        parish: {
            type: 'text',
            label: 'Parish',
            required: true,
            maxLength: 255,
            placeholder: 'Enter parish name'
        },
        sub_county: {
            type: 'text',
            label: 'Sub-County',
            required: true,
            maxLength: 255,
            placeholder: 'Enter sub-county name'
        },
        district: {
            type: 'text',
            label: 'District',
            required: true,
            maxLength: 255,
            placeholder: 'Enter district name'
        },
        county: {
            type: 'text',
            label: 'County',
            required: true,
            maxLength: 255,
            placeholder: 'Enter county name'
        },
        meeting_frequency: {
            type: 'select',
            label: 'Meeting Frequency',
            required: true,
            options: [
                { value: 'once_year', label: 'Once a Year' },
                { value: 'twice_year', label: 'Twice a Year' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'other', label: 'Other' }
            ]
        },
        meeting_other_text: {
            type: 'textarea',
            label: 'Other Meeting Frequency',
            required: false,
            rows: 2,
            placeholder: 'Describe other meeting frequency',
            conditional: { field: 'meeting_frequency', value: 'other' }
        },
        total_households: {
            type: 'number',
            label: 'Total Households',
            required: true,
            min: 0,
            placeholder: '0'
        },
        total_population: {
            type: 'number',
            label: 'Total Population',
            required: true,
            min: 0,
            placeholder: '0'
        },
        male_population: {
            type: 'number',
            label: 'Male Population',
            required: true,
            min: 0,
            placeholder: '0'
        },
        female_population: {
            type: 'number',
            label: 'Female Population',
            required: true,
            min: 0,
            placeholder: '0'
        },
        youth_population: {
            type: 'number',
            label: 'Youth Population',
            required: false,
            min: 0,
            placeholder: '0'
        },
        clan_leader_photo: {
            type: 'file',
            label: 'Clan Leader Photo',
            required: false,
            accept: 'image/*',
            help: 'Upload a photo of the clan leader'
        },
        palm_oil_machines: {
            type: 'textarea',
            label: 'Palm Oil Machines',
            required: false,
            rows: 3,
            placeholder: 'Describe palm oil machines and equipment'
        },
        environmental_projects: {
            type: 'checkbox',
            label: 'Environmental Projects',
            required: false,
            options: [
                { value: 'agro_forestry', label: 'Agro Forestry' },
                { value: 'agro_ecology', label: 'Agro Ecology' },
                { value: 'apiculture', label: 'Apiculture' }
            ]
        }
    },
    
    // Collector Information (from Clan model)
    collector: {
        collector_name: {
            type: 'text',
            label: 'Collector Name',
            required: true,
            maxLength: 255,
            placeholder: 'Enter collector name'
        },
        collector_contact: {
            type: 'text',
            label: 'Collector Contact',
            required: true,
            maxLength: 20,
            placeholder: 'Enter phone number'
        },
        collector_signature: {
            type: 'signature',
            label: 'Collector Signature',
            required: true,
            help: 'Draw your signature in the box below'
        }
    },
    
    // Clan Leader Information (from Clan model)
    clan_leader: {
        clan_leader_name: {
            type: 'text',
            label: 'Clan Leader Name',
            required: true,
            maxLength: 255,
            placeholder: 'Enter clan leader name'
        },
        clan_leader_title: {
            type: 'text',
            label: 'Clan Leader Title',
            required: true,
            maxLength: 255,
            placeholder: 'Enter clan leader title'
        },
        clan_leader_signature: {
            type: 'signature',
            label: 'Clan Leader Signature',
            required: true,
            help: 'Draw your signature in the box below'
        }
    },
    
    // Coordinator Information (from Clan model)
    coordinator: {
        coordinator_name: {
            type: 'text',
            label: 'Coordinator Name',
            required: true,
            maxLength: 255,
            placeholder: 'Enter coordinator name'
        },
        coordinator_signature: {
            type: 'signature',
            label: 'Coordinator Signature',
            required: true,
            help: 'Draw your signature in the box below'
        }
    },
    
    // Chairperson Information (from Clan model)
    chairperson: {
        chairperson_name: {
            type: 'text',
            label: 'Chairperson Name',
            required: true,
            maxLength: 255,
            placeholder: 'Enter chairperson name'
        },
        chairperson_signature: {
            type: 'signature',
            label: 'Chairperson Signature',
            required: true,
            help: 'Draw your signature in the box below'
        }
    },
    
    // Dynamic Sections
    dynamic: {
        sub_clans: {
            title: 'Sub-Clans',
            fields: {
                name: {
                    type: 'text',
                    label: 'Sub-Clan Name',
                    required: true,
                    maxLength: 255,
                    placeholder: 'Enter sub-clan name'
                },
                address: {
                    type: 'textarea',
                    label: 'Address',
                    required: false,
                    rows: 2,
                    placeholder: 'Enter sub-clan address'
                },
                leader_name: {
                    type: 'text',
                    label: 'Leader Name',
                    required: false,
                    maxLength: 255,
                    placeholder: 'Enter leader name'
                },
                contact: {
                    type: 'text',
                    label: 'Contact',
                    required: false,
                    maxLength: 20,
                    placeholder: 'Enter contact number'
                },
                education_primary: {
                    type: 'checkbox',
                    label: 'Primary Education',
                    required: false
                },
                education_secondary: {
                    type: 'checkbox',
                    label: 'Secondary Education',
                    required: false
                },
                education_institution: {
                    type: 'checkbox',
                    label: 'Institution Education',
                    required: false
                },
                education_diploma: {
                    type: 'checkbox',
                    label: 'Diploma',
                    required: false
                },
                education_university: {
                    type: 'checkbox',
                    label: 'University Education',
                    required: false
                }
            }
        },
        
        committee_members: {
            title: 'Executive Committee Members',
            fields: {
                name: {
                    type: 'text',
                    label: 'Member Name',
                    required: true,
                    maxLength: 255,
                    placeholder: 'Enter member name'
                },
                sex: {
                    type: 'select',
                    label: 'Sex',
                    required: true,
                    options: [
                        { value: 'M', label: 'Male' },
                        { value: 'F', label: 'Female' }
                    ]
                },
                position: {
                    type: 'text',
                    label: 'Position',
                    required: false,
                    maxLength: 255,
                    placeholder: 'Enter position'
                },
                education_level: {
                    type: 'text',
                    label: 'Education Level',
                    required: false,
                    maxLength: 255,
                    placeholder: 'Enter education level'
                },
                phone_contact: {
                    type: 'text',
                    label: 'Phone Contact',
                    required: false,
                    maxLength: 20,
                    placeholder: 'Enter phone number'
                }
            }
        },
        
        office_structures: {
            title: 'Office Structures',
            fields: {
                physical_address: {
                    type: 'textarea',
                    label: 'Physical Address',
                    required: true,
                    rows: 2,
                    placeholder: 'Enter physical address'
                },
                structure_type: {
                    type: 'select',
                    label: 'Structure Type',
                    required: true,
                    options: [
                        { value: 'permanent', label: 'Permanent' },
                        { value: 'semi_permanent', label: 'Semi-Permanent' },
                        { value: 'temporary', label: 'Temporary' }
                    ]
                },
                number_of_staff: {
                    type: 'number',
                    label: 'Number of Staff',
                    required: true,
                    min: 0,
                    placeholder: '0'
                }
            }
        },
        
        educated_persons: {
            title: 'Educated Persons (Degree+)',
            fields: {
                name: {
                    type: 'text',
                    label: 'Name',
                    required: true,
                    maxLength: 255,
                    placeholder: 'Enter person name'
                },
                sex: {
                    type: 'select',
                    label: 'Sex',
                    required: true,
                    options: [
                        { value: 'M', label: 'Male' },
                        { value: 'F', label: 'Female' }
                    ]
                },
                age: {
                    type: 'number',
                    label: 'Age',
                    required: true,
                    min: 0,
                    placeholder: 'Enter age'
                },
                education_level: {
                    type: 'select',
                    label: 'Education Level',
                    required: true,
                    options: [
                        { value: 'degree', label: 'Degree' },
                        { value: 'masters', label: 'Masters' },
                        { value: 'phd', label: 'PhD' }
                    ]
                },
                area_of_specialization: {
                    type: 'text',
                    label: 'Area of Specialization',
                    required: true,
                    maxLength: 255,
                    placeholder: 'Enter specialization'
                },
                contact: {
                    type: 'text',
                    label: 'Contact',
                    required: true,
                    maxLength: 20,
                    placeholder: 'Enter contact number'
                },
                location: {
                    type: 'text',
                    label: 'Location',
                    required: true,
                    maxLength: 255,
                    placeholder: 'Enter location'
                }
            }
        },
        
        persons_abroad: {
            title: 'Persons Abroad',
            fields: {
                name: {
                    type: 'text',
                    label: 'Name',
                    required: true,
                    maxLength: 255,
                    placeholder: 'Enter person name'
                },
                sex: {
                    type: 'select',
                    label: 'Sex',
                    required: true,
                    options: [
                        { value: 'M', label: 'Male' },
                        { value: 'F', label: 'Female' }
                    ]
                },
                age: {
                    type: 'number',
                    label: 'Age',
                    required: true,
                    min: 0,
                    placeholder: 'Enter age'
                },
                contact_email: {
                    type: 'email',
                    label: 'Contact Email',
                    required: true,
                    placeholder: 'Enter email address'
                },
                country: {
                    type: 'text',
                    label: 'Country',
                    required: true,
                    maxLength: 255,
                    placeholder: 'Enter country'
                }
            }
        },
        
        political_leaders: {
            title: 'Political Leaders',
            fields: {
                position: {
                    type: 'text',
                    label: 'Position',
                    required: true,
                    maxLength: 255,
                    placeholder: 'Enter political position'
                },
                number_of_persons: {
                    type: 'number',
                    label: 'Number of Persons',
                    required: true,
                    min: 0,
                    placeholder: '0'
                },
                names: {
                    type: 'textarea',
                    label: 'Names',
                    required: true,
                    rows: 3,
                    placeholder: 'Enter names of political leaders'
                },
                contacts: {
                    type: 'textarea',
                    label: 'Contacts',
                    required: false,
                    rows: 2,
                    placeholder: 'Enter contact information'
                }
            }
        },
        
        obb_leaders: {
            title: 'OBB Leaders',
            fields: {
                position: {
                    type: 'text',
                    label: 'Position',
                    required: true,
                    maxLength: 255,
                    placeholder: 'Enter OBB position'
                },
                number_of_persons: {
                    type: 'number',
                    label: 'Number of Persons',
                    required: true,
                    min: 0,
                    placeholder: '0'
                },
                education_level: {
                    type: 'text',
                    label: 'Education Level',
                    required: true,
                    maxLength: 255,
                    placeholder: 'Enter education level'
                },
                positions_held: {
                    type: 'textarea',
                    label: 'Positions Held',
                    required: true,
                    rows: 3,
                    placeholder: 'Enter positions held'
                }
            }
        }
    },
    
    // Saving Group (conditional section)
    saving_group: {
        exists: {
            type: 'radio',
            label: 'Does the clan have a saving group?',
            required: true,
            options: [
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' }
            ]
        },
        reasons_if_no: {
            type: 'textarea',
            label: 'Reasons if No',
            required: false,
            rows: 3,
            placeholder: 'Explain why there is no saving group',
            conditional: { field: 'exists', value: 'false' }
        },
        name: {
            type: 'text',
            label: 'Saving Group Name',
            required: false,
            maxLength: 255,
            placeholder: 'Enter saving group name',
            conditional: { field: 'exists', value: 'true' }
        },
        formation_year: {
            type: 'number',
            label: 'Formation Year',
            required: false,
            min: 1900,
            max: new Date().getFullYear(),
            placeholder: 'Enter formation year',
            conditional: { field: 'exists', value: 'true' }
        },
        initiated_by: {
            type: 'text',
            label: 'Initiated By',
            required: false,
            maxLength: 255,
            placeholder: 'Enter who initiated the group',
            conditional: { field: 'exists', value: 'true' }
        },
        registered: {
            type: 'checkbox',
            label: 'Registered',
            required: false,
            conditional: { field: 'exists', value: 'true' }
        },
        membership_fee: {
            type: 'number',
            label: 'Membership Fee',
            required: false,
            min: 0,
            step: '0.01',
            placeholder: '0.00',
            conditional: { field: 'exists', value: 'true' }
        },
        shares_amount: {
            type: 'number',
            label: 'Shares Amount',
            required: false,
            min: 0,
            step: '0.01',
            placeholder: '0.00',
            conditional: { field: 'exists', value: 'true' }
        },
        annual_subscription: {
            type: 'number',
            label: 'Annual Subscription',
            required: false,
            min: 0,
            step: '0.01',
            placeholder: '0.00',
            conditional: { field: 'exists', value: 'true' }
        }
    },
    
    // Enterprises (multi-select)
    enterprises: {
        type: 'checkbox',
        label: 'Enterprises',
        required: false,
        options: [
            // This would be populated from the Enterprise model
        ]
    },
    
    // Water Sources
    water_sources: {
        title: 'Water Sources',
        fields: {
            name: {
                type: 'text',
                label: 'Water Source Name',
                required: true,
                maxLength: 255,
                placeholder: 'Enter water source name'
            },
            heritage_type: {
                type: 'text',
                label: 'Heritage Type',
                required: true,
                maxLength: 255,
                placeholder: 'Enter heritage type'
            },
            village: {
                type: 'text',
                label: 'Village',
                required: true,
                maxLength: 255,
                placeholder: 'Enter village'
            },
            parish: {
                type: 'text',
                label: 'Parish',
                required: true,
                maxLength: 255,
                placeholder: 'Enter parish'
            },
            historical_usage: {
                type: 'textarea',
                label: 'Historical Usage',
                required: true,
                rows: 3,
                placeholder: 'Describe historical usage'
            }
        }
    }
};

// Form field types and their corresponding HTML elements
window.FormFieldTypes = {
    text: 'text',
    number: 'number',
    email: 'email',
    textarea: 'textarea',
    select: 'select',
    radio: 'radio',
    checkbox: 'checkbox',
    file: 'file',
    signature: 'signature'
};

// Validation rules for different field types
window.ValidationRules = {
    text: {
        required: 'This field is required',
        maxLength: 'Maximum length exceeded'
    },
    number: {
        required: 'This field is required',
        min: 'Minimum value is {min}',
        max: 'Maximum value is {max}'
    },
    email: {
        required: 'This field is required',
        pattern: 'Please enter a valid email address'
    },
    phone: {
        required: 'This field is required',
        pattern: 'Please enter a valid phone number'
    },
    textarea: {
        required: 'This field is required',
        maxLength: 'Maximum length exceeded'
    },
    select: {
        required: 'Please select an option'
    },
    radio: {
        required: 'Please select an option'
    },
    checkbox: {
        required: 'This field is required'
    },
    file: {
        required: 'Please select a file',
        fileType: 'Please select a valid file type',
        fileSize: 'File size too large'
    },
    signature: {
        required: 'Please provide a signature'
    }
};

// Helper function to get form field HTML
window.getFormFieldHTML = function(fieldConfig, fieldName, sectionName = '') {
    const { type, label, required, placeholder, options, help, conditional } = fieldConfig;
    
    let html = `<div class="form-group">`;
    
    // Label
    html += `<label class="form-label">${label}${required ? ' *' : ''}</label>`;
    
    // Help text
    if (help) {
        html += `<small class="form-help text-gray-500">${help}</small>`;
    }
    
    // Conditional field wrapper
    if (conditional) {
        html += `<div class="conditional-field" data-field="${conditional.field}" data-value="${conditional.value}">`;
    }
    
    // Field input
    switch (type) {
        case 'text':
        case 'email':
        case 'number':
            html += `<input type="${type}" name="${fieldName}" class="form-control"`;
            if (placeholder) html += ` placeholder="${placeholder}"`;
            if (required) html += ` required`;
            if (fieldConfig.maxLength) html += ` maxlength="${fieldConfig.maxLength}"`;
            if (fieldConfig.min) html += ` min="${fieldConfig.min}"`;
            if (fieldConfig.max) html += ` max="${fieldConfig.max}"`;
            if (fieldConfig.step) html += ` step="${fieldConfig.step}"`;
            html += `>`;
            break;
            
        case 'textarea':
            html += `<textarea name="${fieldName}" class="form-control"`;
            if (placeholder) html += ` placeholder="${placeholder}"`;
            if (required) html += ` required`;
            if (fieldConfig.maxLength) html += ` maxlength="${fieldConfig.maxLength}"`;
            if (fieldConfig.rows) html += ` rows="${fieldConfig.rows}"`;
            html += `></textarea>`;
            break;
            
        case 'select':
            html += `<select name="${fieldName}" class="form-control"`;
            if (required) html += ` required`;
            html += `><option value="">Select...</option>`;
            if (options) {
                options.forEach(option => {
                    html += `<option value="${option.value}">${option.label}</option>`;
                });
            }
            html += `</select>`;
            break;
            
        case 'radio':
            if (options) {
                html += `<div class="radio-group">`;
                options.forEach(option => {
                    html += `
                        <label class="radio-label">
                            <input type="radio" name="${fieldName}" value="${option.value}" ${required ? 'required' : ''}>
                            ${option.label}
                        </label>
                    `;
                });
                html += `</div>`;
            }
            break;
            
        case 'checkbox':
            if (options) {
                html += `<div class="checkbox-group">`;
                options.forEach(option => {
                    html += `
                        <label class="checkbox-label">
                            <input type="checkbox" name="${fieldName}" value="${option.value}">
                            ${option.label}
                        </label>
                    `;
                });
                html += `</div>`;
            } else {
                html += `
                    <label class="checkbox-label">
                        <input type="checkbox" name="${fieldName}" ${required ? 'required' : ''}>
                        ${label}
                    </label>
                `;
            }
            break;
            
        case 'file':
            html += `<input type="file" name="${fieldName}" class="form-control"`;
            if (required) html += ` required`;
            if (fieldConfig.accept) html += ` accept="${fieldConfig.accept}"`;
            html += `>`;
            break;
            
        case 'signature':
            html += `
                <canvas id="${fieldName}_canvas" class="signature-canvas" width="300" height="150"></canvas>
                <div class="signature-controls">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="clearSignature('${fieldName}_canvas')">Clear</button>
                </div>
                <input type="hidden" name="${fieldName}" id="${fieldName}_data">
            `;
            break;
    }
    
    // Close conditional wrapper
    if (conditional) {
        html += `</div>`;
    }
    
    html += `</div>`;
    
    return html;
};

// Helper function to validate form field
window.validateFormField = function(fieldName, value, fieldConfig) {
    const { type, required, maxLength, min, max, pattern } = fieldConfig;
    
    // Required validation
    if (required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return { valid: false, message: ValidationRules[type].required };
    }
    
    // Skip validation if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return { valid: true };
    }
    
    // Type-specific validation
    switch (type) {
        case 'text':
        case 'textarea':
            if (maxLength && value.length > maxLength) {
                return { valid: false, message: ValidationRules.text.maxLength };
            }
            break;
            
        case 'number':
            const numValue = parseFloat(value);
            if (min !== undefined && numValue < min) {
                return { valid: false, message: ValidationRules.number.min.replace('{min}', min) };
            }
            if (max !== undefined && numValue > max) {
                return { valid: false, message: ValidationRules.number.max.replace('{max}', max) };
            }
            break;
            
        case 'email':
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
                return { valid: false, message: ValidationRules.email.pattern };
            }
            break;
            
        case 'phone':
            const phonePattern = /^\+?[\d\s\-()]+$/;
            if (!phonePattern.test(value)) {
                return { valid: false, message: ValidationRules.phone.pattern };
            }
            break;
    }
    
    return { valid: true };
};

// Helper function to get all form sections
window.getFormSections = function() {
    return {
        clan: AgentFormFields.clan,
        collector: AgentFormFields.collector,
        clan_leader: AgentFormFields.clan_leader,
        coordinator: AgentFormFields.coordinator,
        chairperson: AgentFormFields.chairperson,
        dynamic: AgentFormFields.dynamic,
        saving_group: AgentFormFields.saving_group,
        enterprises: AgentFormFields.enterprises,
        water_sources: AgentFormFields.water_sources
    };
};

// Helper function to get field configuration by path
window.getFieldConfig = function(path) {
    const [section, fieldName] = path.split('.');
    const sections = getFormSections();
    
    if (section === 'dynamic') {
        // Handle dynamic sections
        const [dynamicSection, dynamicField] = fieldName.split('.');
        return sections.dynamic[dynamicSection]?.fields[dynamicField];
    }
    
    return sections[section]?.[fieldName];
};
