import { defineComponent, h, DefineComponent } from 'vue'
import SelectFramework from './components/SelectFramework.vue'
import InstallDependencies from './components/InstallDependencies.vue'
import { TestingType } from './types/shared'

interface WizardDeclaration {
  name: string
  steps: Array<{
    number: number
    name: string
    component: DefineComponent
  }>
}

const componentTestingWizard: WizardDeclaration = {
  name: 'component',
  steps: [
    {
      number: 1,
      name: 'select-framework',
      // TODO: type .vue shim properly.
      component: SelectFramework as unknown as DefineComponent,
    },
    {
      number: 2,
      name: 'install-dependencies',
      component: InstallDependencies as unknown as DefineComponent,
    },
  ],
}

const e2eTestingWizard: WizardDeclaration = {
  name: 'e2e',
  steps: [
    {
      number: 1,
      name: 'unknown',
      component: defineComponent({
        render () {
          return h('div', 'TODO: Figure out wizard workflow for e2e.')
        },
      }),
    },
  ],
}

export const wizards: Record<TestingType, WizardDeclaration> = {
  component: componentTestingWizard,
  e2e: e2eTestingWizard,
}
