import * as React from 'react'
import { NewUserWelcome } from './NewUserWelcome'
import { RunnerButton } from './RunnerButton'

export const SelectWizard = (props) => {
  return (
    <div>
      <h2 className="text-xl text-left mb-4">
        Welcome! What kind of tests would you like to run?
      </h2>

      <div className="max-w-128 mx-auto my-0">
        {showNewUserFlow && <NewUserWelcome />}
      </div>

      <div className="text-center">
        {props.testingTypes.map((testingType) => (
          <RunnerButton
            key={testingType}
            selected={props.selectedTestingType === testingType}
            testingType={testingType}
          />
        ))}
        {/* <RunnerButton
          v-for="testingType of testingTypes"
          key="testingType"
          testingType="testingType"
          selected="selectedTestingType === testingType"
        /> */}
      </div>
    </div>
  )
}
