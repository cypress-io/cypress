import { BUNDLERS, CODE_LANGUAGES, FRONTEND_FRAMEWORKS, PACKAGES_DESCRIPTIONS, WIZARD_STEPS } from '@packages/types'
import type { NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import type { DataContext } from '..'
import { wizardGetConfigCodeCt, wizardGetConfigCodeE2E } from '../codegen/config-file'
import { wizardGetComponentIndexHtml } from '../codegen/template'

export class WizardDataSource {
  constructor (private ctx: DataContext) {}

  private get data () {
    return this.ctx.wizardData
  }

  get description () {
    return WIZARD_STEPS.find((step) => step.type === this.data.currentStep)?.description
  }

  get title () {
    return WIZARD_STEPS.find((step) => step.type === this.data.currentStep)?.title
  }

  packagesToInstall (): Array<NexusGenObjects['WizardNpmPackage']> | null {
    if (!this.chosenFramework || !this.chosenBundler) {
      return null
    }

    return [
      {
        name: this.chosenFramework.name,
        description: PACKAGES_DESCRIPTIONS[this.chosenFramework.package],
        package: this.chosenFramework.package,
      },
      {
        name: this.chosenBundler.name,
        description: PACKAGES_DESCRIPTIONS[this.chosenBundler.package],
        package: this.chosenBundler.package,
      },
    ]
  }

  get chosenTestingTypePluginsInitialized () {
    if (this.chosenTestingType === 'component' && this.ctx.activeProject?.ctPluginsInitialized) {
      return true
    }

    if (this.chosenTestingType === 'e2e' && this.ctx.activeProject?.e2ePluginsInitialized) {
      return true
    }

    return false
  }

  get canNavigateForward () {
    const data = this.ctx.wizardData

    if (data.currentStep === 'setupComplete') {
      return false
    }

    if (data.currentStep === 'selectFramework' && (!data.chosenBundler || !data.chosenFramework)) {
      return false
    }

    if (data.currentStep === 'initializePlugins') {
      if (data.chosenTestingType === 'component' && !this.ctx.activeProject?.ctPluginsInitialized) {
        return false
      }

      if (data.chosenTestingType === 'e2e' && !this.ctx.activeProject?.e2ePluginsInitialized) {
        return false
      }
    }

    // TODO: add constraints here to determine if we can move forward
    return true
  }

  async sampleCode () {
    const data = this.ctx.wizardData
    const storybookInfo = await this.ctx.storybook.storybookInfo

    if (!this.chosenLanguage) {
      return null
    }

    if (data.chosenTestingType === 'component') {
      if (!this.chosenFramework || !this.chosenBundler) {
        return null
      }

      return wizardGetConfigCodeCt({
        framework: this.chosenFramework,
        bundler: this.chosenBundler,
        lang: this.chosenLanguage,
        storybookInfo,
      })
    }

    if (this.chosenTestingType === 'e2e') {
      return wizardGetConfigCodeE2E({
        lang: this.chosenLanguage,
      })
    }

    return null
  }

  async sampleConfigFiles () {

  }

  async sampleTemplate () {
    const storybookInfo = await this.ctx.storybook.storybookInfo

    if (!this.chosenFramework || !this.chosenBundler) {
      return null
    }

    return wizardGetComponentIndexHtml({
      framework: this.chosenFramework,
      storybookInfo,
    })
  }

  get chosenTestingType () {
    return this.ctx.wizardData.chosenTestingType
  }

  get chosenFramework () {
    return FRONTEND_FRAMEWORKS.find((f) => f.type === this.ctx.wizardData.chosenFramework)
  }

  get chosenBundler () {
    return BUNDLERS.find((f) => f.type === this.ctx.wizardData.chosenBundler)
  }

  get chosenLanguage () {
    return CODE_LANGUAGES.find((f) => f.type === this.ctx.wizardData.chosenLanguage)
  }
}
