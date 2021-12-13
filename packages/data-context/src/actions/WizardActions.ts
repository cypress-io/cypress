import type { NexusGenEnums } from '@packages/graphql/src/gen/nxs.gen'
import type { DataContext } from '..'

export class WizardActions {
  constructor (private ctx: DataContext) {}

  private get data () {
    return this.ctx.wizardData
  }

  private get _history () {
    return this.data.history
  }

  validateManualInstall () {
    //
  }

  setFramework (framework: NexusGenEnums['FrontendFrameworkEnum']) {
    this.ctx.coreData.wizard.chosenFramework = framework

    if (framework !== 'react' && framework !== 'vue') {
      this.setBundler('webpack')
    }

    return this.data
  }

  setBundler (bundler: NexusGenEnums['SupportedBundlers']) {
    this.ctx.coreData.wizard.chosenBundler = bundler

    return this.data
  }

  setCodeLanguage (lang: NexusGenEnums['CodeLanguageEnum']) {
    this.ctx.coreData.wizard.chosenLanguage = lang

    return this.data
  }

  navigate (direction: NexusGenEnums['WizardNavigateDirection']) {
    this.ctx.debug(`_history is ${this._history.join(',')}`)

    if (direction === 'back') {
      this._history.pop()

      const previous = this._history[this._history.length - 1]

      if (previous) {
        this.ctx.debug(`navigating back from ${previous} to %s`, previous)
        this.data.currentStep = previous
      }

      return this.data
    }

    if (!this.ctx.wizard.canNavigateForward) {
      return this.data
    }

    return this.navigateForward()
  }

  private navigateToStep (step: NexusGenEnums['WizardStep']): void {
    this._history.push(step)
    this.data.currentStep = step
  }

  private navigateForward () {
    if (this.data.currentStep === 'welcome' && this.data.currentTestingType === 'component') {
      if (!this.ctx.lifecycleManager.isTestingTypeConfigured('component')) {
        this.navigateToStep('selectFramework')
      } else {
        // not first time, have already initialized plugins - just move to open browser screen
        this.navigateToStep('setupComplete')
      }

      return this.data
    }

    if (this.data.currentStep === 'welcome' && this.data.currentTestingType === 'e2e') {
      if (!this.ctx.lifecycleManager.isTestingTypeConfigured('e2e')) {
        this.navigateToStep('configFiles')
      } else {
        // not first time, have already initialized plugins - just move to open browser screen
        this.navigateToStep('setupComplete')
      }

      return this.data
    }

    if (this.data.currentStep === 'selectFramework') {
      this.navigateToStep('installDependencies')

      return this.data
    }

    if (this.data.currentStep === 'installDependencies') {
      this.navigateToStep('configFiles')

      return this.data
    }

    if (this.data.currentStep === 'configFiles') {
      this.navigateToStep('setupComplete')
    }

    return this.data
  }

  /// reset wizard history, useful for when changing to a new project
  resetWizard () {
    this.data.currentStep = 'welcome'
    this.data.history = ['welcome']
    this.data.chosenBundler = null
    this.data.currentTestingType = null
    this.data.chosenFramework = null
    this.data.chosenLanguage = 'js'
    this.data.chosenManualInstall = false

    return this.data
  }
}
