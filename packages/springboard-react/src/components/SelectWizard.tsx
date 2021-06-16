import React from 'react'
import { gql, useMutation, useQuery } from '@apollo/client'
import type { TestingType } from '../types/shared'
import { NewUserWelcome } from './NewUserWelcome'
import { RunnerButton } from './RunnerButton'
import { DismissNewUserWelcomeMutationDocument, SelectWizardQueryDocument } from '../generated/graphql'

interface SelectWizardProps {
  testingTypes: TestingType[]
  showNewUserFlow: boolean
  setTestingType?: any
  selectedTestingType: string | undefined
}

gql`
  query SelectWizardQuery {
    app {
      cypressVersion
    }
    wizard {
      showNewUserWelcome
    }
  }
`

gql`
  mutation DismissNewUserWelcomeMutation {
    wizardSetDismissedHelper {
      showNewUserWelcome
    }
  }
`

export const SelectWizard: React.FC<SelectWizardProps> = (props) => {
  const { data, loading, error } = useQuery(SelectWizardQueryDocument)
  const [dismissNewUserWelcome] = useMutation(DismissNewUserWelcomeMutationDocument)

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
            selected={props.selectedTestingType === testingType}
            onChange={props.setTestingType(testingType)}
          />
        ))}
      </div>
    </>
  )
}
