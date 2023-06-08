import fetch from 'cross-fetch'
import type { DataContext } from '../DataContext'
import { isDependencyInstalled, isDependencyInstalledByName } from '@packages/scaffold-config'

// Require rather than import since data-context is stricter than network and there are a fair amount of errors in agent.
const { agent } = require('@packages/network')

/**
 * this.ctx.util....
 *
 * Used as a central location for grab-bag utilities used
 * within the DataContext layer
 */
export class UtilDataSource {
  constructor (private ctx: DataContext) {}

  fetch (input: RequestInfo | URL, init?: RequestInit) {
    // @ts-ignore agent isn't a part of cross-fetch's API since it's not a part of the browser's fetch but it is a part of node-fetch
    // which is what will be used here
    return fetch(input, { agent, ...init })
  }

  isDependencyInstalled (dependency: Cypress.CypressComponentDependency, projectPath: string) {
    return isDependencyInstalled(dependency, projectPath)
  }

  isDependencyInstalledByName (packageName: string, projectPath: string) {
    return isDependencyInstalledByName(packageName, projectPath)
  }
}
