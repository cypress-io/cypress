import { ComponentOptions, h } from 'vue'
import SelectFramework from './components/SelectFramework.vue'
import InstallDependencies from './components/InstallDependencies.vue'
import { TestingType } from './types/shared'
import { defineWizardStep } from './wizards/shared'

interface WizardDeclaration {
  name: string
  steps: Array<{
    number: number
    name: string
    // is this the correct definition?
    component: ComponentOptions
  }>
}

const componentTestingWizard: WizardDeclaration = {
  name: 'component',
  steps: [
    {
      number: 1,
      name: 'select-framework',
      // TODO: type .vue shim properly.
      component: SelectFramework as unknown as any,
    },
    {
      number: 2,
      name: 'install-dependencies',
      component: InstallDependencies as unknown as any,
    },
  ],
}

const e2eTestingWizard: WizardDeclaration = {
  name: 'e2e',
  steps: [
    {
      number: 1,
      name: 'unknown',
      component: defineWizardStep({
        setup () {
          return () => h('div', 'TODO: Figure out wizard workflow for e2e.')
        },
      }),
    },
  ],
}

export const wizards: Record<TestingType, WizardDeclaration> = {
  component: componentTestingWizard,
  e2e: e2eTestingWizard,
}
