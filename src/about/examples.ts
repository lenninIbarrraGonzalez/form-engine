export interface Example {
  schema: object
}

const examples: Example[] = [
  // 1 — Hello World
  {
    schema: {
      title: 'Hello World',
      fields: [
        {
          name: 'firstName',
          type: 'text',
          label: 'First name',
          placeholder: 'e.g. Jane',
        },
        {
          name: 'lastName',
          type: 'text',
          label: 'Last name',
          placeholder: 'e.g. Doe',
        },
      ],
    },
  },

  // 2 — Contact Form
  {
    schema: {
      title: 'Contact Form',
      fields: [
        {
          name: 'fullName',
          type: 'text',
          label: 'Full name',
          placeholder: 'e.g. Jane Doe',
          validations: { required: true, minLength: 3 },
        },
        {
          name: 'email',
          type: 'text',
          label: 'Email address',
          placeholder: 'e.g. jane@example.com',
          validations: { required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        },
        {
          name: 'subject',
          type: 'select',
          label: 'Subject',
          validations: { required: true },
          items: [
            { label: 'General inquiry', value: 'general' },
            { label: 'Technical support', value: 'support' },
            { label: 'Partnership', value: 'partnership' },
          ],
        },
        {
          name: 'message',
          type: 'text',
          label: 'Message',
          placeholder: 'How can we help you?',
          validations: { required: true, minLength: 20, maxLength: 500 },
        },
      ],
    },
  },

  // 3 — Conditional Registration
  {
    schema: {
      title: 'Account Registration',
      fields: [
        {
          name: 'accountType',
          type: 'select',
          label: 'Account type',
          validations: { required: true },
          items: [
            { label: 'Individual', value: 'individual' },
            { label: 'Company', value: 'company' },
          ],
        },
        {
          name: 'fullName',
          type: 'text',
          label: 'Full name',
          placeholder: 'e.g. Jane Doe',
          validations: { required: true },
          showIf: { field: 'accountType', operator: 'equals', value: 'individual' },
        },
        {
          name: 'companyName',
          type: 'text',
          label: 'Company name',
          placeholder: 'e.g. Acme Corp',
          validations: { required: true },
          showIf: { field: 'accountType', operator: 'equals', value: 'company' },
        },
        {
          name: 'taxId',
          type: 'text',
          label: 'Tax ID',
          placeholder: 'e.g. 12-3456789',
          validations: { required: true },
          showIf: { field: 'accountType', operator: 'equals', value: 'company' },
        },
        {
          name: 'email',
          type: 'text',
          label: 'Work email',
          placeholder: 'e.g. jane@acme.com',
          validations: { required: true },
        },
        {
          name: 'newsletter',
          type: 'checkbox',
          label: 'Subscribe to our newsletter',
          showIf: { field: 'accountType', operator: 'notEquals', value: 'company' },
        },
      ],
    },
  },

  // 4 — Multi-step Survey
  {
    schema: {
      title: 'Developer Experience Survey',
      steps: [
        {
          title: 'About you',
          fields: [
            {
              name: 'name',
              type: 'text',
              label: 'Your name',
              placeholder: 'e.g. Jane Doe',
              validations: { required: true },
            },
            {
              name: 'role',
              type: 'select',
              label: 'Your role',
              validations: { required: true },
              items: [
                { label: 'Frontend developer', value: 'frontend' },
                { label: 'Backend developer', value: 'backend' },
                { label: 'Fullstack developer', value: 'fullstack' },
                { label: 'Engineering manager', value: 'manager' },
              ],
            },
            {
              name: 'teamSize',
              type: 'number',
              label: 'Team size',
              placeholder: 'e.g. 8',
              validations: { required: true, min: 1, max: 500 },
              showIf: { field: 'role', operator: 'equals', value: 'manager' },
            },
          ],
        },
        {
          title: 'Your tools',
          fields: [
            {
              name: 'mainLanguage',
              type: 'select',
              label: 'Primary language',
              validations: { required: true },
              items: [
                { label: 'TypeScript', value: 'ts' },
                { label: 'JavaScript', value: 'js' },
                { label: 'Python', value: 'py' },
                { label: 'Go', value: 'go' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'otherLanguage',
              type: 'text',
              label: 'Which language?',
              placeholder: 'e.g. Rust',
              validations: { required: true },
              showIf: { field: 'mainLanguage', operator: 'equals', value: 'other' },
            },
            {
              name: 'yearsOfExperience',
              type: 'number',
              label: 'Years of experience',
              validations: { required: true, min: 0, max: 50 },
            },
          ],
        },
        {
          title: 'Feedback',
          fields: [
            {
              name: 'satisfaction',
              type: 'select',
              label: 'Overall satisfaction with your current stack',
              validations: { required: true },
              items: [
                { label: '⭐ Very dissatisfied', value: '1' },
                { label: '⭐⭐ Dissatisfied', value: '2' },
                { label: '⭐⭐⭐ Neutral', value: '3' },
                { label: '⭐⭐⭐⭐ Satisfied', value: '4' },
                { label: '⭐⭐⭐⭐⭐ Very satisfied', value: '5' },
              ],
            },
            {
              name: 'comments',
              type: 'text',
              label: 'Any additional comments?',
              placeholder: 'Your feedback helps us improve…',
            },
          ],
        },
      ],
    },
  },

  // 5 — Credit Application (complex)
  {
    schema: {
      title: 'Credit Application',
      steps: [
        {
          title: 'Applicant information',
          fields: [
            {
              name: 'applicantType',
              type: 'select',
              label: 'Applicant type',
              validations: { required: true },
              items: [
                { label: 'Individual', value: 'individual' },
                { label: 'Legal entity', value: 'company' },
              ],
            },
            {
              name: 'fullName',
              type: 'text',
              label: 'Full name',
              placeholder: 'e.g. Jane Doe',
              validations: { required: true },
              showIf: { field: 'applicantType', operator: 'equals', value: 'individual' },
            },
            {
              name: 'companyName',
              type: 'text',
              label: 'Company name',
              placeholder: 'e.g. Acme Corp',
              validations: { required: true },
              showIf: { field: 'applicantType', operator: 'equals', value: 'company' },
            },
            {
              name: 'taxId',
              type: 'text',
              label: 'Tax ID',
              placeholder: 'e.g. 12-3456789',
              validations: { required: true, pattern: '^\\d{2}-\\d{7}$' },
              showIf: { field: 'applicantType', operator: 'equals', value: 'company' },
            },
            {
              name: 'phone',
              type: 'tel',
              label: 'Phone number',
              placeholder: 'e.g. +1 555 000 1234',
              validations: { required: true },
            },
          ],
        },
        {
          title: 'Financial information',
          fields: [
            {
              name: 'monthlyIncome',
              type: 'number',
              label: 'Monthly income (USD)',
              placeholder: 'e.g. 5000',
              validations: { required: true, min: 500 },
            },
            {
              name: 'requestedAmount',
              type: 'number',
              label: 'Requested amount (USD)',
              placeholder: 'e.g. 15000',
              validations: { required: true, min: 1000, max: 500000 },
            },
            {
              name: 'loanPurpose',
              type: 'select',
              label: 'Loan purpose',
              validations: { required: true },
              items: [
                { label: 'Home purchase', value: 'home' },
                { label: 'Vehicle', value: 'vehicle' },
                { label: 'Education', value: 'education' },
                { label: 'Business', value: 'business' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'collateral',
              type: 'select',
              label: 'Collateral available?',
              validations: { required: true },
              items: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ],
              showIf: {
                or: [
                  { field: 'loanPurpose', operator: 'equals', value: 'home' },
                  { field: 'loanPurpose', operator: 'equals', value: 'vehicle' },
                  { field: 'loanPurpose', operator: 'equals', value: 'business' },
                ],
              },
            },
          ],
        },
        {
          title: 'Personal references',
          fields: [
            {
              name: 'references',
              type: 'array',
              label: 'Personal references',
              validations: { minItems: 1, maxItems: 3 },
              fields: [
                {
                  name: 'refName',
                  type: 'text',
                  label: 'Full name',
                  placeholder: 'e.g. John Smith',
                  validations: { required: true },
                },
                {
                  name: 'refPhone',
                  type: 'tel',
                  label: 'Phone',
                  placeholder: 'e.g. +1 555 000 5678',
                  validations: { required: true },
                },
                {
                  name: 'refRelationship',
                  type: 'select',
                  label: 'Relationship',
                  validations: { required: true },
                  items: [
                    { label: 'Family', value: 'family' },
                    { label: 'Friend', value: 'friend' },
                    { label: 'Colleague', value: 'colleague' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
]

export default examples
