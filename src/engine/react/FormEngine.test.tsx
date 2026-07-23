// Integration tests for FormEngine (Stage 6)
// RED first — FormEngine.tsx and all field components do not exist yet
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FormDefinition } from '../schema/types'
import { FormEngine } from './FormEngine'

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
})
