import type { BaseContext } from '../context/BaseContext'
import type { FoundBrowser, OpenProjectLaunchOptions, LaunchOpts, LaunchArgs, FullConfig } from '@packages/types'
import type { BrowserContract } from '../contracts/BrowserContract'
import type { IProjectActions } from './IProjectActions'

/**
 * Acts as the contract for all actions, inherited by:
 *  - ServerActions
 *  - ClientTestActions
 *
 * By having a "base actions" class, we can reuse this code on the client
 * and make the client-only test doubles work as realistically as possible
 */
export abstract class BaseActions {
  constructor (protected ctx: BaseContext) {}
  abstract get project(): IProjectActions

  abstract installDependencies (): void

  abstract createConfigFile (code: string, configFilename: string): void

  abstract getProjectId (projectRoot: string): Promise<string | null>
  abstract authenticate (): Promise<void>
  abstract logout (): Promise<void>

  abstract getBrowsers (): Promise<FoundBrowser[]>

  abstract initializeOpenProject (args: LaunchArgs, options: OpenProjectLaunchOptions, browsers: any): Promise<void>
  abstract launchOpenProject (
    browser: BrowserContract,
    spec: any, // Cypress.Cypress['spec'],
    options: LaunchOpts
  ): Promise<void>
  abstract resolveOpenProjectConfig (): FullConfig | null

  abstract isFirstTime (projectRoot: string, testingType: Cypress.TestingType): boolean
}
