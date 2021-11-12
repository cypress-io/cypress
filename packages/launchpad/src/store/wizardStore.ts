import { defineStore } from 'pinia'
import { Bundler, BUNDLERS, CodeLanguage, FrontendFramework, FRONTEND_FRAMEWORKS, PACKAGES_DESCRIPTIONS } from '@packages/types/src/constants'

const WIZARD_STEPS = ['selectFramework', 'installDependencies', 'configFiles'] as const

export interface WizardStoreState {
  testingType: 'component' | 'e2e' | null
  wizardStep: typeof WIZARD_STEPS[number]
  wizardBundler: Bundler['type'] | null
  wizardFramework: FrontendFramework['type'] | null
  wizardCodeLanguage: CodeLanguage['type']
}

function initState (): WizardStoreState {
  return {
    testingType: null,
    wizardStep: 'selectFramework',
    wizardBundler: null,
    wizardFramework: null,
    wizardCodeLanguage: 'js',
  }
}

type S = WizardStoreState

export const useWizardStore = defineStore({
  id: 'wizard',
  state (): WizardStoreState {
    return initState()
  },
  getters: {
    bundlerOptions (this: S) {
      if (this.wizardFramework) {
        const framework = FRONTEND_FRAMEWORKS.find((t) => t.type === this.wizardFramework)

        if (!framework) {
          return BUNDLERS
        }

        return BUNDLERS.filter((b) => framework.supportedBundlers.includes(b.type as any)) as Bundler[]
      }

      return BUNDLERS
    },
    toInstall (this: S) {
      const framework = FRONTEND_FRAMEWORKS.find((f) => f.type === this.wizardFramework)
      const bundler = BUNDLERS.find((f) => f.type === this.wizardBundler)

      return [framework.package, bundler.package].map((p) => {
        return {
          package: p,
          description: PACKAGES_DESCRIPTIONS[p],
        }
      })
    },
  },
  actions: {
    next (this: S) {
      const idx = WIZARD_STEPS.indexOf(this.wizardStep)

      if (idx < WIZARD_STEPS.length - 1) {
        this.wizardStep = WIZARD_STEPS[idx + 1]
      }
    },
    previous (this: S) {
      const idx = WIZARD_STEPS.indexOf(this.wizardStep)

      if (idx > 0) {
        this.wizardStep = WIZARD_STEPS[idx - 1]
      }
    },
    setTestingType (this: S, testingType: 'component' | 'e2e' | null) {
      if (testingType !== this.testingType) {
        for (const [key, val] of Object.entries(initState())) {
          this[key] = val
        }
      }

      this.testingType = testingType
    },
    setWizardStep (this: S, wizardStep: WizardStoreState['wizardStep'] | null) {
      this.wizardStep = wizardStep
    },
    setFramework (this: S, wizardFramework: WizardStoreState['wizardFramework']) {
      this.wizardFramework = wizardFramework
      const framework = FRONTEND_FRAMEWORKS.find((f) => f.type === wizardFramework)

      if (framework.supportedBundlers.length === 1) {
        this.wizardBundler = framework.supportedBundlers[0]
      }
    },
    setBundler (this: S, wizardBundler: Bundler['type']) {
      this.wizardBundler = wizardBundler
    },
    setCodeLanguage (this: S, language: CodeLanguage['type']) {
      this.wizardCodeLanguage = language
    },
  },
})
