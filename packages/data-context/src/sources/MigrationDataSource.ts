import path from 'path'
import { MIGRATION_STEPS } from '@packages/types'
import type { DataContext } from '..'
import { createConfigString } from '../util/migration'

type MIGRATION_STEP = typeof MIGRATION_STEPS[number]

export class MigrationDataSource {
  private _config: Cypress.ConfigOptions | null = null
  private _step: MIGRATION_STEP = 'renameAuto'
  public filteredSteps: MIGRATION_STEP[] = MIGRATION_STEPS.filter(() => true)
  public hasCustomIntegrationFolder: boolean = false
  public hasCustomIntegrationSpecPattern: boolean = false
  public hasCustomComponentFolder: boolean = false
  public hasCustomComponentSpecPattern: boolean = false
  public hasComponentTesting: boolean = true
  constructor (private ctx: DataContext) { }

  async initialize () {
    await this.initializeFlags()
    this.filteredSteps = MIGRATION_STEPS.filter((step) => this.shouldShowStep(step))
    if (this.filteredSteps[0]) {
      this.setStep(this.filteredSteps[0])
    }
  }

  async getConfig () {
    const config = await this.parseCypressConfig()

    return JSON.stringify(config, null, 2)
  }

  async createConfigString () {
    const config = await this.parseCypressConfig()

    return createConfigString(config)
  }

  async getIntegrationFolder () {
    const config = await this.parseCypressConfig()

    if (config.e2e?.integrationFolder) {
      return config.e2e.integrationFolder
    }

    if (config.integrationFolder) {
      return config.integrationFolder
    }

    return 'cypress/integration'
  }

  async getComponentFolder () {
    const config = await this.parseCypressConfig()

    if (config.component?.componentFolder) {
      return config.component.componentFolder
    }

    if (config.componentFolder) {
      return config.componentFolder
    }

    return 'cypress/component'
  }

  // FIXME: Cypress.ConfigOptions is the updated type for options but
  // cypress.json uses the old model and won't fit the new one.
  // If it did, why would we even be migrating ;)
  private async parseCypressConfig (): Promise<Cypress.ConfigOptions> {
    if (this._config) {
      return this._config
    }

    if (this.ctx.lifecycleManager.metaState.hasLegacyCypressJson) {
      const cfgPath = path.join(this.ctx.lifecycleManager?.projectRoot, 'cypress.json')

      this._config = this.ctx.file.readJsonFile(cfgPath) as Cypress.ConfigOptions

      return this._config
    }

    return {}
  }

  private async initializeFlags () {
    const config = await this.parseCypressConfig()

    if (config.testFiles || config.e2e?.testFiles) {
      this.hasCustomIntegrationSpecPattern = true
    }

    if (config.integrationFolder || config.e2e?.integrationFolder) {
      this.hasCustomIntegrationFolder = true
    }

    if (config.componentFolder || config.component?.componentFolder) {
      this.hasCustomComponentFolder = true
    }

    if (config.testFiles || config.component?.testFiles) {
      this.hasCustomComponentSpecPattern = true
    }

    // TODO: implement this properly
    this.hasComponentTesting = true
  }

  private shouldShowStep (step: MIGRATION_STEP): boolean {
    switch (step) {
      case 'renameAuto': return !this.hasCustomIntegrationSpecPattern || !this.hasCustomComponentSpecPattern
      case 'renameManual': return this.hasComponentTesting
      case 'setupComponent': return this.hasComponentTesting
      default: return true
    }
  }

  get step (): MIGRATION_STEP {
    return this._step
  }

  private setStep (step: MIGRATION_STEP) {
    this._step = step
  }

  nextStep () {
    const index = this.filteredSteps.indexOf(this._step)

    if (index === -1) {
      throw new Error('Invalid step')
    }

    const nextStep = this.filteredSteps[index + 1]

    if (nextStep) {
      this.setStep(nextStep)
    }
  }
}
