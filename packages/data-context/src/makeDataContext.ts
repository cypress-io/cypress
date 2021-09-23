import { DataContext, DataContextConfig } from './DataContext'

/**
 * Creates & initializes a "Data Context" instance,
 */
export function makeDataContext (config: DataContextConfig) {
  const ctx = new DataContext(config)

  if (config.launchArgs.projectRoot) {
    ctx.actions.project.setActiveProject(config.launchArgs.projectRoot)
  }

  return ctx
}
