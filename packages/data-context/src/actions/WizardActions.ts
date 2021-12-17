import type { NexusGenEnums } from '@packages/graphql/src/gen/nxs.gen'
import type { DataContext } from '..'

export class WizardActions {
  constructor (private ctx: DataContext) {}

  private get data () {
    return this.ctx.wizardData
  }

  setFramework (framework: NexusGenEnums['FrontendFrameworkEnum'] | null) {
    this.ctx.coreData.wizard.chosenFramework = framework

    if (framework !== 'react' && framework !== 'vue') {
      this.setBundler('webpack')
    }

    return this.data
  }

  setBundler (bundler: NexusGenEnums['SupportedBundlers'] | null) {
    this.ctx.coreData.wizard.chosenBundler = bundler

    return this.data
  }

  setCodeLanguage (lang: NexusGenEnums['CodeLanguageEnum']) {
    this.ctx.coreData.wizard.chosenLanguage = lang

    return this.data
  }

  /// reset wizard history, useful for when changing to a new project
  resetWizard () {
    this.data.chosenBundler = null
    this.data.chosenFramework = null
    this.data.chosenLanguage = 'js'
    this.data.chosenManualInstall = false

    return this.data
  }
}
