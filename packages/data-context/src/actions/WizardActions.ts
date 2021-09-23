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

  setSelectedNavItem (navItem: NexusGenEnums['NavItem']) {}

  setTestingType (type: 'component' | 'e2e') {
    this.ctx.coreData.wizard.chosenTestingType = type

    return this.data
  }

  setFramework (framework: NexusGenEnums['FrontendFramework']) {
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

  setManualInstall (isManual: boolean) {
    this.ctx.coreData.wizard.chosenManualInstall = isManual

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
    if (this.data.currentStep === 'initializePlugins') {
      this.navigateToStep('setupComplete')

      return this.data
    }

    if (this.data.currentStep === 'welcome' && this.data.chosenTestingType === 'component') {
      if (this.ctx.activeProject?.isFirstTimeCT) {
        this.navigateToStep('selectFramework')
      } else if (!this.ctx.activeProject?.ctPluginsInitialized) {
        // not first time, and we haven't initialized plugins - initialize them
        this.navigateToStep('initializePlugins')
      } else {
        // not first time, have already initialized plugins - just move to open browser screen
        this.navigateToStep('setupComplete')
      }

      return this.data
    }

    if (this.data.currentStep === 'welcome' && this.data.chosenTestingType === 'e2e') {
      if (this.ctx.activeProject?.isFirstTimeE2E) {
        this.navigateToStep('createConfig')
      } else if (!this.ctx.activeProject?.e2ePluginsInitialized) {
        // not first time, and we haven't initialized plugins - initialize them
        this.navigateToStep('initializePlugins')
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
      this.navigateToStep('createConfig')

      return this.data
    }

    if (this.data.currentStep === 'createConfig') {
      if (this.data.chosenTestingType === 'component') {
        if (this.ctx.activeProject?.ctPluginsInitialized) {
          this.navigateToStep('setupComplete')
        } else {
          this.navigateToStep('initializePlugins')
        }
      }

      if (this.data.chosenTestingType === 'e2e') {
        if (this.ctx.activeProject?.e2ePluginsInitialized) {
          this.navigateToStep('setupComplete')
        } else {
          this.navigateToStep('initializePlugins')
        }
      }
    }

    return this.data
  }
}
