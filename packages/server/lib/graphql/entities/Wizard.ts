import { nxs, NxsResult } from 'nexus-decorators'
import { FrontendFrameworkEnum, BUNDLER, FrontendFramework, Bundler, FRONTEND_FRAMEWORK, TestingType, TestingTypeEnum, BundlerDisplayNames, BundlerEnum, WizardStepEnum, WIZARD_STEP, WizardStep } from '../constants/WizardConstants'

@nxs.objectType({
  description: 'The Wizard is a container for any state associated with initial onboarding to Cypress',
})
export class Wizard {
  private currentStep: WizardStep = 'welcome'
  private chosenTestingType: TestingType | null
  private chosenBundler: Bundler | null
  private chosenFramework: FrontendFramework | null

  constructor () {
    this.chosenTestingType = null
    this.chosenBundler = null
    this.chosenFramework = null
  }

  get framework (): FrontendFramework | null {
    return this.chosenFramework
  }

  get bundler (): Bundler | null {
    return this.chosenBundler
  }

  // GraphQL Fields:

  @nxs.field.type(() => WizardStepEnum)
  step (): NxsResult<'Wizard', 'step'> {
    return this.currentStep
  }

  @nxs.field.type(() => TestingTypeEnum, {
    description: 'The testing type we are setting in the wizard, null if this has not been chosen',
  })
  testingType (): NxsResult<'Wizard', 'testingType'> {
    return this.chosenTestingType
  }

  @nxs.field.list.type(() => WizardFrontendFramework, {
    description: 'All of the component testing frameworks to choose from',
  })
  frameworks (): NxsResult<'Wizard', 'frameworks'> {
    return FRONTEND_FRAMEWORK.map((f) => new WizardFrontendFramework(f))
  }

  @nxs.field.list.type(() => WizardBundler, {
    description: 'All of the bundlers to choose from',
  })
  allBundlers (): NxsResult<'Wizard', 'allBundlers'> {
    return BUNDLER.map((bundler) => new WizardBundler(this, bundler))
  }

  // Internal Setters:

  setTestingType (testingType: TestingType | null): Wizard {
    this.chosenTestingType = testingType
    this.currentStep = 'selectFramework'

    return this
  }

  setFramework (framework: FrontendFramework): Wizard {
    this.chosenFramework = framework

    return this
  }

  setBundler (bundler?: Bundler | null): Wizard {
    this.chosenBundler = bundler ?? null

    return this
  }

  navigateBack (): Wizard {
    const idx = WIZARD_STEP.indexOf(this.currentStep)

    if (idx !== 0) {
      this.currentStep = WIZARD_STEP[idx - 1]
    }

    return this
  }

  navigateForward (): Wizard {
    const idx = WIZARD_STEP.indexOf(this.currentStep)

    if (idx !== WIZARD_STEP.length - 1) {
      this.currentStep = WIZARD_STEP[idx + 1]
    }

    return this
  }

  validateManualInstall (): Wizard {
    //
    return this
  }
}

@nxs.objectType({
  description: 'A frontend framework that we can setup within the app',
})
export class WizardFrontendFramework {
  constructor (private framework: FrontendFramework) {}

  @nxs.field.type(() => FrontendFrameworkEnum, {
    description: 'The name of the framework',
  })
  get name (): NxsResult<'WizardFrontendFramework', 'name'> {
    return this.framework
  }

  @nxs.field.list.type(() => WizardBundler, {
    description: 'All of the supported bundlers for this framework',
  })
  get supportedBundlers (): NxsResult<'WizardFrontendFramework', 'supportedBundlers'> {
    return []
  }

  @nxs.field.list.type(() => WizardNpmPackage, {
    description: 'A list of packages to install, null if we have not chosen both a framework and bundler',
  })
  get packagesToInstall (): NxsResult<'WizardFrontendFramework', 'packagesToInstall'> {
    return []
  }

  @nxs.field.boolean({
    description: 'Whether this is the selected framework in the wizard',
  })
  get isSelected (): NxsResult<'WizardFrontendFramework', 'isSelected'> {
    return true
  }
}

@nxs.objectType({
  description: 'Wizard bundler',
})
export class WizardBundler {
  constructor (private wizard: Wizard, private bundler: Bundler) {}

  @nxs.field.type(() => BundlerEnum)
  get id (): NxsResult<'WizardBundler', 'id'> {
    return this.bundler
  }

  @nxs.field.string()
  get name (): NxsResult<'WizardBundler', 'name'> {
    return BundlerDisplayNames[this.bundler]
  }

  @nxs.field.boolean({
    description: 'Whether this is the selected framework bundler',
  })
  isSelected (): NxsResult<'WizardBundler', 'isSelected'> {
    return this.wizard.bundler === this.bundler
  }

  @nxs.field.boolean({
    description: 'Whether there are multiple options to choose from given the framework',
  })
  isOnlyOption (): NxsResult<'WizardBundler', 'isOnlyOption'> {
    return true
  }
}

@nxs.objectType({
  description: 'Details about an NPM Package listed during the wizard install',
})
export class WizardNpmPackage {
  @nxs.field.string({
    description: 'The package name that you would npm install',
  })
  name (): NxsResult<'WizardNpmPackage', 'name'> {
    return 'name'
  }

  @nxs.field.string()
  description (): NxsResult<'WizardNpmPackage', 'description'> {
    return 'description'
  }
}
