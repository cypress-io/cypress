import { nxs, NxsArgs, NxsResult } from 'nexus-decorators'
import { BUNDLER, FrontendFramework, Bundler, FRONTEND_FRAMEWORK, TestingTypeEnum, WizardStepEnum, WIZARD_STEP, WizardStep, WIZARD_TITLES, WIZARD_DESCRIPTIONS, TESTING_TYPES, TestingType, PackageMapping, BundleMapping, WizardCodeLanguageEnum } from '../constants/wizardConstants'
import { wizardGetConfigCode } from '../util/wizardGetConfigCode'
import { TestingTypeInfo } from './TestingTypeInfo'
import { WizardBundler } from './WizardBundler'
import { WizardFrontendFramework } from './WizardFrontendFramework'
import { WizardNpmPackage } from './WizardNpmPackage'

@nxs.objectType({
  description: 'The Wizard is a container for any state associated with initial onboarding to Cypress',
})
export class Wizard {
  private currentStep: WizardStep = 'welcome'
  private chosenTestingType: TestingType | null
  private chosenBundler: Bundler | null
  private chosenFramework: FrontendFramework | null
  private chosenManualInstall: boolean

  constructor () {
    this.chosenTestingType = null
    this.chosenBundler = null
    this.chosenFramework = null
    this.chosenManualInstall = false
  }

  @nxs.field.type(() => WizardFrontendFramework)
  get framework (): NxsResult<'Wizard', 'framework'> | null {
    return this.chosenFramework ? new WizardFrontendFramework(this, this.chosenFramework) : null
  }

  @nxs.field.type(() => WizardBundler)
  get bundler (): NxsResult<'Wizard', 'bundler'> | null {
    return this.chosenBundler ? new WizardBundler(this, this.chosenBundler) : null
  }

  @nxs.field.list.nonNull.type(() => WizardNpmPackage, {
    description: 'A list of packages to install, null if we have not chosen both a framework and bundler',
  })
  get packagesToInstall (): NxsResult<'WizardFrontendFramework', 'packagesToInstall'> {
    if (!this.chosenFramework || !this.chosenBundler) {
      return null
    }

    return [
      new WizardNpmPackage(PackageMapping[this.chosenFramework]),
      new WizardNpmPackage(BundleMapping[this.chosenBundler]),
    ]
  }

  @nxs.field.string({
    description: 'The title of the page, given the current step of the wizard',
  })
  get title (): NxsResult<'Wizard', 'title'> {
    return WIZARD_TITLES[this.currentStep]
  }

  @nxs.field.string({
    description: 'The title of the page, given the current step of the wizard',
  })
  get description (): NxsResult<'Wizard', 'title'> {
    return WIZARD_DESCRIPTIONS[this.currentStep]
  }

  @nxs.field.nonNull.boolean({
    description: 'Whether we have chosen manual install or not',
  })
  get isManualInstall (): NxsResult<'Wizard', 'isManualInstall'> {
    return this.chosenManualInstall
  }

  // GraphQL Fields:

  @nxs.field.nonNull.type(() => WizardStepEnum)
  get step (): NxsResult<'Wizard', 'step'> {
    return this.currentStep
  }

  @nxs.field.type(() => TestingTypeEnum, {
    description: 'The testing type we are setting in the wizard, null if this has not been chosen',
  })
  testingType (): NxsResult<'Wizard', 'testingType'> {
    return this.chosenTestingType
  }

  @nxs.field.list.nonNull.type(() => TestingTypeInfo)
  testingTypes (): NxsResult<'Wizard', 'testingTypes'> {
    return TESTING_TYPES.map((t) => new TestingTypeInfo(t))
  }

  @nxs.field.nonNull.list.nonNull.type(() => WizardFrontendFramework, {
    description: 'All of the component testing frameworks to choose from',
  })
  frameworks (): NxsResult<'Wizard', 'frameworks'> {
    return FRONTEND_FRAMEWORK.map((f) => new WizardFrontendFramework(this, f))
  }

  @nxs.field.nonNull.list.nonNull.type(() => WizardBundler, {
    description: 'All of the bundlers to choose from',
  })
  allBundlers (): NxsResult<'Wizard', 'allBundlers'> {
    return BUNDLER.map((bundler) => new WizardBundler(this, bundler))
  }

  @nxs.field.string({
    description: 'Configuration file based on bundler and framework of choice',
    args (t) {
      t.nonNull.arg('lang', {
        type: WizardCodeLanguageEnum,
        default: 'js',
      })
    },
  })
  sampleCode (args: NxsArgs<'Wizard', 'sampleCode'>): NxsResult<'Wizard', 'configFile'> {
    if (!this.framework || !this.bundler) {
      return null
    }

    return wizardGetConfigCode({
      framework: this.framework,
      bundler: this.bundler,
      lang: args.lang,
    })
  }

  // Internal Setters:

  setTestingType (testingType: TestingType | null): Wizard {
    this.chosenTestingType = testingType
    this.currentStep = 'selectFramework'

    return this
  }

  setFramework (framework: FrontendFramework): Wizard {
    this.chosenFramework = framework
    if (framework !== 'react' && framework !== 'vue') {
      this.chosenBundler = 'webpack'
    }

    return this
  }

  setBundler (bundler?: Bundler | null): Wizard {
    this.chosenBundler = bundler ?? null

    return this
  }

  setManualInstall (isManual: boolean): Wizard {
    this.chosenManualInstall = isManual

    return this
  }

  @nxs.field.nonNull.boolean()
  canNavigateForward (): NxsResult<'Wizard', 'canNavigateForward'> {
    // TODO: add constraints here to determine if we can move forward
    return true
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
