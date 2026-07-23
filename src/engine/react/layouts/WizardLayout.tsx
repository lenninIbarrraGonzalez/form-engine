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

  const progressPct = ((currentStep + 1) / total) * 100

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-500 mb-1.5">Step {currentStep + 1} of {total}</p>
        <div
          role="progressbar"
          aria-label={`Step ${currentStep + 1} of ${total}`}
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          className="bg-gray-200 rounded-full h-1.5"
        >
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <FormRenderer
        fields={step.fields}
        register={register}
        errors={errors}
        store={store}
        control={control}
      />

      <div className="flex justify-between mt-6">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s - 1)}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        {currentStep < total - 1 && (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s + 1)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
