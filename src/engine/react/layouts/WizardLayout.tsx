// WizardLayout — multi-step form layout strategy over FormRenderer.
// Each step is rendered one at a time with forward/back navigation and a progress indicator.
import { useState } from 'react'
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'
import type { StepDefinition } from '../../schema/types'
import type { VisibilityStore } from '../../store/visibility-store'
import { FormRenderer } from '../FormRenderer'

interface WizardLayoutProps {
  steps: StepDefinition[]
  register: UseFormRegister<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
  store: VisibilityStore
  control: Control<Record<string, unknown>>
}

export function WizardLayout({ steps, register, errors, store, control }: WizardLayoutProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const total = steps.length
  const step = steps[currentStep]

  return (
    <div>
      <div aria-label="Progress">
        Step {currentStep + 1} of {total}
      </div>
      <FormRenderer
        fields={step.fields}
        register={register}
        errors={errors}
        store={store}
        control={control}
      />
      <div>
        {currentStep > 0 && (
          <button type="button" onClick={() => setCurrentStep((s) => s - 1)}>
            Back
          </button>
        )}
        {currentStep < total - 1 && (
          <button type="button" onClick={() => setCurrentStep((s) => s + 1)}>
            Next
          </button>
        )}
      </div>
    </div>
  )
}
