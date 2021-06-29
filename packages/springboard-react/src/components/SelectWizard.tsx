import { gql, useMutation, useQuery } from '@apollo/client'
import React, { ChangeEventHandler, useState } from 'react'
import type { TestingType } from '../types/shared'
import { NewUserWelcome } from './NewUserWelcome'
import { RunnerButton } from './RunnerButton'

interface SelectWizardProps {
  testingTypes: TestingType[]
  showNewUserFlow: boolean
}

const SelectWizardQuery = gql`
  query SelectWizardQuery {
    app {
      cypressVersion
    }
    wizard {
      showNewUserWelcome
    }
  }
`

const DismissNewUserWelcome = gql`
  mutation DismissNewUserWelcomeMutation {
    wizardSetDismissedHelper {
      showNewUserWelcome
    }
  }
`

export const SelectWizard: React.FC<SelectWizardProps> = (props) => {
  const { data, loading, error } = useQuery(SelectWizardQuery)
  const [dismissNewUserWelcome] = useMutation(DismissNewUserWelcome)
  // const [setSelectedTestingType] = useMutation(SetSelectedTestingTypeMutation)

  const [selectedTestingType, setSelectedTestingType] = useState<string>()
  const selectTestingType = (testingType: TestingType): ChangeEventHandler<HTMLInputElement> => {
    return (e) => {
      setSelectedTestingType(e.target.value)
    }
  }

  if (error) {
    return <div>{JSON.stringify(error)}</div>
  }

  if (loading) {
    return null
  }

  return (
    <>
      <h2 className="text-xl text-left mb-4">
        Welcome! What kind of tests would you like to run?
      </h2>

      <div className="max-w-128 mx-auto my-0">
        {data.wizard.showNewUserWelcome && <NewUserWelcome onClose={dismissNewUserWelcome} />}
      </div>

      <div className="text-center">
        {props.testingTypes.map((testingType, idx) => (
          <RunnerButton
            key={testingType}
            testingType={testingType}
            selected={selectedTestingType === testingType}
            onChange={selectTestingType(testingType)}
          />
        ))}
      </div>
    </>
  )
}
