// import Debug from 'debug'
import {
  TestingTypeEnum,
  WizardStepEnum,
  WizardCodeLanguageEnum,
} from '../constants/wizardConstants'
import { TestingTypeInfo } from './TestingTypeInfo'
import { WizardBundler } from './WizardBundler'
import { WizardFrontendFramework } from './WizardFrontendFramework'
import { WizardNpmPackage } from './WizardNpmPackage'
import { arg, nonNull, objectType } from 'nexus'

// const debug = Debug('cypress:graphql:wizard')

export const Wizard = objectType({
  name: 'Wizard',
  description: 'The Wizard is a container for any state associated with initial onboarding to Cypress',
  definition (t) {
    t.nonNull.list.nonNull.field('allBundlers', {
      type: WizardBundler,
      description: 'All of the bundlers to choose from',
    })

    t.field('bundler', {
      type: WizardBundler,
    })

    t.nonNull.boolean('canNavigateForward', {
      description: 'Given the current state, returns whether the user progress to the next step of the wizard',
    })

    t.string('description', {
      description: 'The title of the page, given the current step of the wizard',
    })

    t.field('framework', {
      type: WizardFrontendFramework,
    })

    t.nonNull.list.nonNull.field('frameworks', {
      type: WizardFrontendFramework,
      description: 'All of the component testing frameworks to choose from',
    })

    t.nonNull.boolean('isManualInstall', {
      description: 'Whether we have chosen manual install or not',
    })

    t.list.nonNull.field('packagesToInstall', {
      type: WizardNpmPackage,
      description: 'A list of packages to install, null if we have not chosen both a framework and bundler',
    })

    t.string('sampleCode', {
      description: 'Configuration file based on bundler and framework of choice',
      args: {
        lang: arg({
          type: nonNull(WizardCodeLanguageEnum),
          default: 'js',
        }),
      },
    })

    t.nonNull.field('step', {
      type: WizardStepEnum,
    })

    t.field('testingType', {
      type: TestingTypeEnum,
      description: 'The testing type we are setting in the wizard, null if this has not been chosen',
    })

    t.nonNull.list.nonNull.field('testingTypes', { type: TestingTypeInfo })
    t.string('title', { description: 'The title of the page, given the current step of the wizard' })
  },
})

// @nxs.objectType({
//   description: 'The Wizard is a container for any state associated with initial onboarding to Cypress',
// })
// export class Wizard {
//   private currentStep: WizardStep = 'welcome'
//   private chosenTestingType: TestingType | null
//   private chosenBundler: Bundler | null
//   private chosenFramework: FrontendFramework | null
//   private chosenManualInstall: boolean
//   private _history: WizardStep[] = ['welcome']
//   constructor (private _ctx: BaseContext) {
//     this.chosenTestingType = null
//     this.chosenBundler = null
//     this.chosenFramework = null
//     this.chosenManualInstall = false
//   }
//   get history (): WizardStep[] {
//     return this._history
//   }
//   @nxs.field.type(() => WizardFrontendFramework)
//   get framework (): NxsResult<'Wizard', 'framework'> | null {
//     return this.chosenFramework ? new WizardFrontendFramework(this, this.chosenFramework) : null
//   }
//   @nxs.field.type(() => WizardBundler)
//   get bundler (): NxsResult<'Wizard', 'bundler'> | null {
//     return this.chosenBundler ? new WizardBundler(this, this.chosenBundler) : null
//   }
//   @nxs.field.list.nonNull.type(() => WizardNpmPackage, {
//     description: 'A list of packages to install, null if we have not chosen both a framework and bundler',
//   })
//   get packagesToInstall (): NxsResult<'Wizard', 'packagesToInstall'> {
//     if (!this.chosenFramework || !this.chosenBundler) {
//       return null
//     }
//     return [
//       new WizardNpmPackage(PackageMapping[this.chosenFramework]),
//       new WizardNpmPackage(BundleMapping[this.chosenBundler]),
//     ]
//   }
//   @nxs.field.string({
//     description: 'The title of the page, given the current step of the wizard',
//   })
//   get title (): NxsResult<'Wizard', 'title'> {
//     return WIZARD_TITLES[this.currentStep]
//   }
//   @nxs.field.string({
//     description: 'The title of the page, given the current step of the wizard',
//   })
//   get description (): NxsResult<'Wizard', 'title'> {
//     return WIZARD_DESCRIPTIONS[this.currentStep]
//   }
//   @nxs.field.nonNull.boolean({
//     description: 'Whether we have chosen manual install or not',
//   })
//   get isManualInstall (): NxsResult<'Wizard', 'isManualInstall'> {
//     return this.chosenManualInstall
//   }

//   // GraphQL Fields:

//   @nxs.field.nonNull.type(() => WizardStepEnum)
//   get step (): NxsResult<'Wizard', 'step'> {
//     return this.currentStep
//   }
//   @nxs.field.type(() => TestingTypeEnum, {
//     description: 'The testing type we are setting in the wizard, null if this has not been chosen',
//   })
//   get testingType (): NxsResult<'Wizard', 'testingType'> {
//     return this.chosenTestingType
//   }
//   @nxs.field.nonNull.list.nonNull.type(() => TestingTypeInfo)
//   testingTypes (): NxsResult<'Wizard', 'testingTypes'> {
//     return TESTING_TYPES.map((t) => new TestingTypeInfo(t))
//   }
//   @nxs.field.nonNull.list.nonNull.type(() => WizardFrontendFramework, {
//     description: 'All of the component testing frameworks to choose from',
//   })
//   frameworks (): NxsResult<'Wizard', 'frameworks'> {
//     return FRONTEND_FRAMEWORK.map((f) => new WizardFrontendFramework(this, f))
//   }
//   @nxs.field.nonNull.list.nonNull.type(() => WizardBundler, {
//     description: 'All of the bundlers to choose from',
//   })
//   allBundlers (): NxsResult<'Wizard', 'allBundlers'> {
//     return BUNDLER.map((bundler) => new WizardBundler(this, bundler))
//   }
//   @nxs.field.string({
//     description: 'Configuration file based on bundler and framework of choice',
//     args (t) {
//       t.nonNull.arg('lang', {
//         type: WizardCodeLanguageEnum,
//         default: 'js',
//       })
//     },
//   })
//   sampleCode (args: NxsArgs<'Wizard', 'sampleCode'>): NxsResult<'Wizard', 'sampleCode'> {
//     if (this.chosenTestingType === 'component') {
//       if (!this.framework || !this.bundler) {
//         return null
//       }
//       return wizardGetConfigCode({
//         type: 'component',
//         framework: this.framework,
//         bundler: this.bundler,
//         lang: args.lang,
//       })
//     }
//     if (this.chosenTestingType === 'e2e') {
//       return wizardGetConfigCode({
//         type: 'e2e',
//         lang: args.lang,
//       })
//     }
//     return null
//   }
//   // Internal Setters:

//   setTestingType (testingType: TestingType | null): Wizard {
//     this.chosenTestingType = testingType
//     return this
//   }

//   setFramework (framework: FrontendFramework | null): Wizard {
//     this.chosenFramework = framework

//     if (framework === null) {
//       return this
//     }

//     if (framework !== 'react' && framework !== 'vue') {
//       this.chosenBundler = 'webpack'
//     }

//     return this
//   }

//   setBundler (bundler?: Bundler | null): Wizard {
//     this.chosenBundler = bundler ?? null

//     return this
//   }

//   setManualInstall (isManual: boolean): Wizard {
//     this.chosenManualInstall = isManual

//     return this
//   }

//   @nxs.field.nonNull.boolean({
//     description: 'Given the current state, returns whether the user progress to the next step of the wizard',
//   })
//   canNavigateForward (): NxsResult<'Wizard', 'canNavigateForward'> {
//     if (this.currentStep === 'setupComplete') {
//       return false
//     }

//     if (this.currentStep === 'selectFramework' && !this.chosenBundler && !this.chosenFramework) {
//       return false
//     }

//     if (this.currentStep === 'initializePlugins') {
//       if (this.testingType === 'component' && !this._ctx.activeProject?.ctPluginsInitialized) {
//         return false
//       }

//       if (this.testingType === 'e2e' && !this._ctx.activeProject?.e2ePluginsInitialized) {
//         return false
//       }
//     }
//     // TODO: add constraints here to determine if we can move forward
//     return true
//   }
//   navigate (direction: WizardNavigateDirection): Wizard {
//     debug(`_history is ${this._history.join(',')}`)
//     if (direction === 'back') {
//       this._history.pop()
//       const previous = this._history[this._history.length - 1]
//       if (previous) {
//         debug(`navigating back from ${previous} to %s`, previous)
//         this.currentStep = previous
//       }
//       return this
//     }
//     if (!this.canNavigateForward()) {
//       return this
//     }
//     return this.navigateForward()
//   }
//   private navigateToStep (step: WizardStep): void {
//     this._history.push(step)
//     this.currentStep = step
//   }
//   private navigateForward (): Wizard {
//     if (this.currentStep === 'initializePlugins') {
//       this.navigateToStep('setupComplete')
//       return this
//     }
//     if (this.currentStep === 'welcome' && this.testingType === 'component') {
//       if (this._ctx.activeProject?.isFirstTimeCT) {
//         this.navigateToStep('selectFramework')
//       } else {
//         this.navigateToStep('initializePlugins')
//       }
//       return this
//     }
//     if (this.currentStep === 'welcome' && this.testingType === 'e2e') {
//       if (this._ctx.activeProject?.isFirstTimeE2E) {
//         this.navigateToStep('createConfig')
//       } else {
//         this.navigateToStep('initializePlugins')
//       }
//       return this
//     }
//     if (this.currentStep === 'selectFramework') {
//       this.navigateToStep('installDependencies')
//       return this
//     }
//     if (this.currentStep === 'installDependencies') {
//       this.navigateToStep('createConfig')
//       return this
//     }
//     if (this.currentStep === 'createConfig') {
//       this.navigateToStep('initializePlugins')
//       return this
//     }
//     return this
//   }
//   validateManualInstall (): Wizard {
//     //
//     return this
//   }
//   // for testing - bypass canNavigateForward checks
//   setStep (step: typeof WIZARD_STEP[number]): Wizard {
//     this.currentStep = step
//     return this
//   }
// }
