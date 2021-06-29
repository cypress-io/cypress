import * as React from 'react'

import type { TestingType } from '../types/shared'
// import { useStore } from '../store'
import { SelectFramework } from '../components/SelectFramework'
import { InstallDependencies } from '../components/InstallDependencies'

interface Step {
  number: number
  name: string
  component: React.ComponentType<any>
  canGoNextStep(): boolean
}

interface WizardDeclaration {
  name: string
  steps: Step[]
}

const componentTestingWizard: WizardDeclaration = {
  name: 'component',
  steps: [
    {
      number: 1,
      name: 'select-framework',
      component: SelectFramework,
      canGoNextStep () {
        return false
        // const store = useStore()
        // return !!store.getState().component.framework
      },
    },
    {
      number: 2,
      name: 'install-dependencies',
      component: InstallDependencies,
      canGoNextStep () {
        return true
      },
    },
  ],
}

const e2eTestingWizard: WizardDeclaration = {
  name: 'e2e',
  steps: [
    {
      number: 1,
      name: 'unknown',
      component: () => <div>TODO: Figure out wizard workflow for e2e.</div>,
      canGoNextStep () {
        return true
      },
    },
  ],
}

export const wizards: Record<TestingType, WizardDeclaration> = {
  component: componentTestingWizard,
  e2e: e2eTestingWizard,
}
