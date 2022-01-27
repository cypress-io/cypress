import { MIGRATION_STEPS } from '@packages/types'
import type { OldCypressConfig } from '../../util'

export function getIntegrationTestFiles (config: OldCypressConfig) {
  return config.e2e?.testFiles ?? config.testFiles ?? '**/*'
}

export function getIntegrationFolder (config: OldCypressConfig) {
  if (config.e2e?.integrationFolder === false || config.integrationFolder === false) {
    return false
  }

  return config.e2e?.integrationFolder ?? config.integrationFolder ?? 'cypress/integration'
}

export function getComponentTestFiles (config: OldCypressConfig) {
  return config.component?.testFiles ?? config.testFiles ?? '**/*'
}

export function getComponentFolder (config: OldCypressConfig) {
  if (config.component?.componentFolder === false || config.componentFolder === false) {
    return false
  }

  return config.component?.componentFolder ?? config.componentFolder ?? 'cypress/component'
}

export function shouldShowAutoRenameStep (config: OldCypressConfig) {
  const integrationFolder = getIntegrationFolder(config)
  const testFiles = getIntegrationTestFiles(config)

  // defaults, migrate
  if (integrationFolder === 'cypress/integration') {
    return true
  }

  // non default integration, but default test files, we can migrate
  if (testFiles === '**/*') {
    return true
  }

  return false
}

// we only show rename support file if they are using the default
// if they have anything set in their config, we will not try to rename it.
export function shouldShowRenameSupport (config: OldCypressConfig) {
  const defaultSupportFile = 'cypress/support/index.js'
  const supportFile = config.e2e?.supportFile ?? config.supportFile ?? defaultSupportFile

  return supportFile === defaultSupportFile
}

// if they have component testing configured, they will need to
// rename/move their specs.
function shouldShowRenameManual (config: OldCypressConfig) {
  return config.component !== undefined
}

// if they have component testing configured, they will need to
// reconfigure it.
function shouldShowSetupComponent (config: OldCypressConfig) {
  return config.component !== undefined
}

// All projects must move from cypress.json to cypress.config.js!
export function shouldShowConfigFileStep (config: OldCypressConfig) {
  return true
}

export type Step = typeof MIGRATION_STEPS[number]

export function getStepsForMigration (
  config: OldCypressConfig,
): Step[] {
  return MIGRATION_STEPS.reduce<Step[]>((acc, curr) => {
    if (curr === 'renameAuto' && shouldShowAutoRenameStep(config)) {
      return acc.concat(curr)
    }

    if (curr === 'renameManual' && shouldShowRenameManual(config)) {
      return acc.concat(curr)
    }

    if (curr === 'renameSupport' && shouldShowRenameSupport(config)) {
      return acc.concat(curr)
    }

    if (curr === 'configFile' && shouldShowConfigFileStep(config)) {
      return acc.concat(curr)
    }

    if (curr === 'setupComponent' && shouldShowSetupComponent(config)) {
      return acc.concat(curr)
    }

    return acc
  }, [])
}
