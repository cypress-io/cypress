import { ConcreteComponent, h } from 'vue'
import SelectFramework from '../components/SelectFramework.vue'
import InstallDependencies from '../components/InstallDependencies.vue'
import { TestingType } from '../types/shared'
import { useStore } from '../store'

interface Step {
    number: number
    name: string
    component: ConcreteComponent
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
        const store = useStore()

        return !!store.getState().component.framework
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
      component: {
        setup () {
          return () => h('div', 'TODO: Figure out wizard workflow for e2e.')
        },
      },
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
