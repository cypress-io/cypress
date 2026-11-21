// Separating this, so we don't pull all of the server side
// babel transforms, etc. into client-side usage of the config code
import type * as AstUtils from './ast-utils/addToCypressConfig'

export * from './browser'

export * from './project'

export type { AddTestingTypeToCypressConfigOptions } from './ast-utils/addToCypressConfig'

// The AST utilities load babel and recast, which only the setup wizard needs, so keep them out of startup
export const addProjectIdToCypressConfig: typeof AstUtils.addProjectIdToCypressConfig = async (...args) => {
  return (await import('./ast-utils/addToCypressConfig')).addProjectIdToCypressConfig(...args)
}

export const addToCypressConfig: typeof AstUtils.addToCypressConfig = async (...args) => {
  return (await import('./ast-utils/addToCypressConfig')).addToCypressConfig(...args)
}

export const addTestingTypeToCypressConfig: typeof AstUtils.addTestingTypeToCypressConfig = async (...args) => {
  return (await import('./ast-utils/addToCypressConfig')).addTestingTypeToCypressConfig(...args)
}

export * from './utils'

export * from './developmentCloudWorkspaceUrl'

export { isUnsafePort } from './unsafe_ports'
