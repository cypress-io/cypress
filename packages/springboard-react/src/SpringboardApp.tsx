import gql from 'graphql-tag'
import React from 'react'
import { SelectWizard } from './components/SelectWizard'
import { testingTypes } from './types/shared'

gql`
  query SpringboardAppQuery {
    app {
      cypressVersion
    }
  }
`

export const SpringboardApp = (props) => {
  const { currentStep } = props
  const goBack = () => {}
  const goNext = () => {}

  return (
    <div className="h-150 max-w-200 mx-auto rounded-xl bg-white relative">
      <div>
        <div className="flex justify-between p-2 bg-gray-900 text-white">
          Cypress Dashboard
          <button>Log in</button>
        </div>
        <div className="flex flex-col justify-center h-120 p-2">
          {!currentStep ? (
            <SelectWizard testingTypes={testingTypes} showNewUserFlow />
          ) : (
            currentStep.component
          )}
        </div>
      </div>

      <div className="text-right absolute bottom-2 right-2">
        <button
          className={`text-blue-500 m-5 px-4 py-2 rounded border-blue-500 border-1 border-inset ${
            !currentStep ? 'invisible' : ''
          }`}
          onClick={goBack}
        >
          Previous Step
        </button>

        <button
          disabled={!props.selectedTestingType || !props.canGoNextStep}
          data-cy="previous"
          className={`bg-blue-500 text-white m-5 px-4 py-2 rounded ${
            !props.selectedTestingType || !props.canGoNextStep
              ? 'opacity-50'
              : ''
          }`}
          onClick={goNext}
        >
          Next Step
        </button>
      </div>
    </div>
  )
}
