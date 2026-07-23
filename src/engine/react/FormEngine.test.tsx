// Integration tests for FormEngine (Stage 6)
// RED first — FormEngine.tsx and all field components do not exist yet
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FormDefinition } from '../schema/types'
import { FormEngine } from './FormEngine'
import { registerField, type FieldComponent } from './field-registry'

// ---- Schema fixtures --------------------------------------------------

const WIZARD_SCHEMA: FormDefinition = {
  title: 'Wizard Form',
  steps: [
    {
      title: 'Step One',
      fields: [
        { name: 'firstName', type: 'text', label: 'First Name', validations: { required: true } },
      ],
    },
    {
      title: 'Step Two',
      fields: [
        { name: 'lastName', type: 'text', label: 'Last Name', validations: { required: true } },
      ],
    },
  ],
}

const TEXT_SCHEMA: FormDefinition = {
  title: 'Simple Form',
  fields: [
    { name: 'fullName', type: 'text', label: 'Full Name', validations: { required: true } },
  ],
}

const CONDITIONAL_SCHEMA: FormDefinition = {
  title: 'Conditional Form',
  fields: [
    {
      name: 'tipo',
      type: 'select',
      label: 'Person Type',
      items: [
        { label: 'Natural', value: 'natural' },
        { label: 'Juridica', value: 'juridica' },
      ],
    },
    {
      name: 'nit',
      type: 'text',
      label: 'NIT',
      showIf: { field: 'tipo', operator: 'equals', value: 'juridica' },
    },
  ],
}

const HIDDEN_REQUIRED_SCHEMA: FormDefinition = {
  title: 'Hidden Required',
  fields: [
    {
      name: 'show',
      type: 'select',
      label: 'Show extra?',
      items: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
    {
      name: 'extra',
      type: 'text',
      label: 'Extra Field',
      showIf: { field: 'show', operator: 'equals', value: 'yes' },
      validations: { required: true },
    },
  ],
}

const ARRAY_SCHEMA: FormDefinition = {
  title: 'Array Form',
  fields: [
    {
      name: 'referencias',
      type: 'array',
      label: 'References',
      fields: [
        { name: 'nombre', type: 'text', label: 'Name' },
      ],
    },
  ],
}

// ---- Tests ------------------------------------------------------------

describe('FormEngine', () => {
  describe('basic rendering', () => {
    it('renders a text field from the schema', () => {
      render(<FormEngine schema={TEXT_SCHEMA} onSubmit={vi.fn()} />)
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    })

    it('renders a submit button', () => {
      render(<FormEngine schema={TEXT_SCHEMA} onSubmit={vi.fn()} />)
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    })
  })

  describe('conditional visibility', () => {
    it('hides conditional field initially when showIf condition is not met', () => {
      render(<FormEngine schema={CONDITIONAL_SCHEMA} onSubmit={vi.fn()} />)
      // NIT field depends on tipo === 'juridica'; initially tipo is empty → NIT hidden
      expect(screen.queryByLabelText('NIT')).not.toBeInTheDocument()
    })

    it('shows conditional field when its showIf condition becomes true', async () => {
      const user = userEvent.setup()
      render(<FormEngine schema={CONDITIONAL_SCHEMA} onSubmit={vi.fn()} />)

      const select = screen.getByLabelText('Person Type')
      await user.selectOptions(select, 'juridica')

      expect(await screen.findByLabelText('NIT')).toBeInTheDocument()
    })

    it('hides conditional field again when condition becomes false', async () => {
      const user = userEvent.setup()
      render(<FormEngine schema={CONDITIONAL_SCHEMA} onSubmit={vi.fn()} />)

      const select = screen.getByLabelText('Person Type')
      await user.selectOptions(select, 'juridica')
      expect(await screen.findByLabelText('NIT')).toBeInTheDocument()

      await user.selectOptions(select, 'natural')
      await waitFor(() => {
        expect(screen.queryByLabelText('NIT')).not.toBeInTheDocument()
      })
    })
  })

  describe('hidden field is not validated on submit', () => {
    it('submit succeeds when hidden required field is empty', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<FormEngine schema={HIDDEN_REQUIRED_SCHEMA} onSubmit={onSubmit} />)

      // Don't touch 'show' — 'extra' stays hidden
      // 'show' itself has no required validation
      await user.click(screen.getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('array field', () => {
    it('renders add button for array field', () => {
      render(<FormEngine schema={ARRAY_SCHEMA} onSubmit={vi.fn()} />)
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
    })

    it('adds item fields when add button is clicked', async () => {
      const user = userEvent.setup()
      render(<FormEngine schema={ARRAY_SCHEMA} onSubmit={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: /add/i }))

      // After adding, should see item field
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    })

    it('removes item when remove button is clicked', async () => {
      const user = userEvent.setup()
      render(<FormEngine schema={ARRAY_SCHEMA} onSubmit={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: /add/i }))
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /remove/i }))
      await waitFor(() => {
        expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('submit with valid data', () => {
    it('calls onSubmit with the form values when data is valid', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<FormEngine schema={TEXT_SCHEMA} onSubmit={onSubmit} />)

      const input = screen.getByLabelText('Full Name')
      await user.type(input, 'John Doe')
      await user.click(screen.getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ fullName: 'John Doe' }),
        )
      })
    })
  })

  describe('a11y requirements', () => {
    it('label is associated with input via htmlFor/id (getByLabelText works)', () => {
      render(<FormEngine schema={TEXT_SCHEMA} onSubmit={vi.fn()} />)
      // getByLabelText only works when <label htmlFor> matches input id
      const input = screen.getByLabelText('Full Name')
      expect(input.tagName).toBe('INPUT')
    })

    it('shows aria-invalid on invalid field after submit attempt', async () => {
      const user = userEvent.setup()
      render(<FormEngine schema={TEXT_SCHEMA} onSubmit={vi.fn()} />)

      // Submit without filling required field
      await user.click(screen.getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        const input = screen.getByLabelText('Full Name')
        expect(input).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('shows error message with role="alert" when validation fails', async () => {
      const user = userEvent.setup()
      render(<FormEngine schema={TEXT_SCHEMA} onSubmit={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        const alerts = screen.queryAllByRole('alert')
        expect(alerts.length).toBeGreaterThan(0)
      })
    })

    it('shows aria-describedby on invalid input pointing to error element', async () => {
      const user = userEvent.setup()
      render(<FormEngine schema={TEXT_SCHEMA} onSubmit={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        const input = screen.getByLabelText('Full Name')
        const describedById = input.getAttribute('aria-describedby')
        expect(describedById).toBeTruthy()
        const errorEl = document.getElementById(describedById!)
        expect(errorEl).not.toBeNull()
      })
    })

    // A1 — form-level error announcement
    it('announces validation error count in a live region after failed submit', async () => {
      const user = userEvent.setup()
      render(<FormEngine schema={TEXT_SCHEMA} onSubmit={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        const status = screen.getByRole('status')
        expect(status.textContent).toMatch(/1 error/i)
      })
    })

    // A2 — wizard progress bar ARIA attributes
    it('wizard progress bar has role="progressbar" with aria-valuenow/min/max', () => {
      render(<FormEngine schema={WIZARD_SCHEMA} layout="wizard" onSubmit={vi.fn()} />)
      const bar = screen.getByRole('progressbar')
      expect(bar).toHaveAttribute('aria-valuenow', '1')
      expect(bar).toHaveAttribute('aria-valuemin', '1')
      expect(bar).toHaveAttribute('aria-valuemax', '2')
    })

    it('wizard progress bar aria-valuenow updates when advancing steps', async () => {
      const user = userEvent.setup()
      render(<FormEngine schema={WIZARD_SCHEMA} layout="wizard" onSubmit={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
      })
    })
  })

  describe('array field a11y', () => {
    // A3 — remove button contextual aria-label
    it('remove button has contextual aria-label identifying the item', async () => {
      const user = userEvent.setup()
      render(<FormEngine schema={ARRAY_SCHEMA} onSubmit={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: /add/i }))

      await waitFor(() => {
        const removeBtn = screen.getByRole('button', { name: /remove references 1/i })
        expect(removeBtn).toBeInTheDocument()
      })
    })

    // A4 — live region announces item added
    it('announces item addition in a live region', async () => {
      const user = userEvent.setup()
      render(<FormEngine schema={ARRAY_SCHEMA} onSubmit={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: /add/i }))

      await waitFor(() => {
        const statuses = screen.getAllByRole('status')
        const hasAnnouncement = statuses.some((el) =>
          /references 1 added/i.test(el.textContent ?? ''),
        )
        expect(hasAnnouncement).toBe(true)
      })
    })
  })

  describe('typeform layout a11y', () => {
    // A5 — Enter in textarea does not advance to next field
    it('Enter key in a textarea does not advance to next field', async () => {
      function TextareaField({ name }: { name: string }) {
        return <textarea data-testid="textarea-field" name={name} />
      }
      registerField('textarea-custom', TextareaField as FieldComponent)

      const TYPEFORM_SCHEMA: FormDefinition = {
        title: 'Typeform',
        fields: [
          // @ts-expect-error custom type not in FieldType union
          { name: 'comment', type: 'textarea-custom', label: 'Comment' },
          { name: 'name', type: 'text', label: 'Name' },
        ],
      }

      const user = userEvent.setup()
      render(<FormEngine schema={TYPEFORM_SCHEMA} layout="one-field-per-screen" onSubmit={vi.fn()} />)

      expect(screen.getByTestId('textarea-field')).toBeInTheDocument()

      await user.click(screen.getByTestId('textarea-field'))
      await user.keyboard('{Enter}')

      // Must still be on first field — textarea Enter should not advance
      expect(screen.getByTestId('textarea-field')).toBeInTheDocument()
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
    })
  })

  describe('layout prop', () => {
    it('wizard layout renders Step 1 progress indicator', () => {
      render(<FormEngine schema={WIZARD_SCHEMA} layout="wizard" onSubmit={vi.fn()} />)
      expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument()
    })

    it('wizard layout shows only step 1 fields on mount', () => {
      render(<FormEngine schema={WIZARD_SCHEMA} layout="wizard" onSubmit={vi.fn()} />)
      expect(screen.getByLabelText('First Name')).toBeInTheDocument()
      expect(screen.queryByLabelText('Last Name')).not.toBeInTheDocument()
    })

    it('wizard layout advances to step 2 when Next is clicked', async () => {
      const user = userEvent.setup()
      render(<FormEngine schema={WIZARD_SCHEMA} layout="wizard" onSubmit={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: /next/i }))

      expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
      expect(screen.queryByLabelText('First Name')).not.toBeInTheDocument()
      expect(screen.getByText(/step 2 of 2/i)).toBeInTheDocument()
    })

    it('flat layout (default) shows all fields from all steps', () => {
      render(<FormEngine schema={WIZARD_SCHEMA} onSubmit={vi.fn()} />)
      expect(screen.getByLabelText('First Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
    })
  })

  describe('field registry', () => {
    it('renders unknown field type with role="alert" error message', () => {
      const UNKNOWN_TYPE_SCHEMA: FormDefinition = {
        title: 'Unknown Type Form',
        fields: [
          // @ts-expect-error intentionally using unsupported type for test
          { name: 'signature', type: 'signature', label: 'Signature' },
        ],
      }
      render(<FormEngine schema={UNKNOWN_TYPE_SCHEMA} onSubmit={vi.fn()} />)
      const alert = screen.getByRole('alert')
      expect(alert.textContent).toContain('signature')
    })

    it('renders a custom field component registered via registerField()', () => {
      function CustomWidget({ label }: { label: string }) {
        return <div data-testid="custom-widget">{label}</div>
      }
      registerField('custom', CustomWidget as FieldComponent)

      const CUSTOM_SCHEMA: FormDefinition = {
        title: 'Custom Field Form',
        fields: [
          // @ts-expect-error custom type not in FieldType union
          { name: 'myCustom', type: 'custom', label: 'My Custom Field' },
        ],
      }
      render(<FormEngine schema={CUSTOM_SCHEMA} onSubmit={vi.fn()} />)
      expect(screen.getByTestId('custom-widget')).toBeInTheDocument()
      expect(screen.getByTestId('custom-widget').textContent).toBe('My Custom Field')
    })
  })
})
