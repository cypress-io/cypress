import * as React from 'react'
import { SelectWizard } from './SelectWizard'

export interface AppSpringboardProps {
  isCurrentStep: boolean
  children: React.ReactChildren
}

export const AppSpringboard: React.FC<AppSpringboardProps> = (props) => {
  const goBack = (e) => {
    //
  }
  const goNext = (e) => {
    //
  }

  return (
    <div className="h-150 max-w-200 mx-auto rounded-xl bg-white relative">
      <div>
        <div className="flex justify-between p-2 bg-gray-900 text-white">
          Cypress Dashboard
          <button>Log in</button>
        </div>
        <div className="flex flex-col justify-center h-120 p-2">
          {props.isCurrentStep ? props.children : <SelectWizard />}
        </div>
      </div>

      <div className="text-right absolute bottom-2 right-2">
        <button
          className="text-blue-500 m-5 px-4 py-2 rounded border-blue-500 border-1 border-inset { 'invisible': !currentStep }"
          onClick={goBack}
        >
          Previous Step
        </button>

        <button
          disabled={!props.selectedTestingType || !props.canGoNextStep}
          data-cy="previous"
          className="bg-blue-500 text-white m-5 px-4 py-2 rounded { 'opacity-50': !selectedTestingType || !canGoNextStep }"
          onClick={goNext}
        >
          {props.nextStepText}
        </button>
      </div>
    </div>
  )
}
