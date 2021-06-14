import { SelectFramework } from '../SelectFramework'
import { InstallDependencies } from '../InstallDependencies'
import { TestingType } from './shared'
import { useStore } from '../store'

interface Step {
  number: number
  name: string
  component: React.ComponentType
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
      canGoNextStep() {
        const store = useStore()

        return !!store.getState().component.framework
      },
    },
    {
      number: 2,
      name: 'install-dependencies',
      component: InstallDependencies,
      canGoNextStep() {
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
      canGoNextStep() {
        return true
      },
    },
  ],
}

export const wizards: Record<TestingType, WizardDeclaration> = {
  component: componentTestingWizard,
  e2e: e2eTestingWizard,
}
