import globby from 'globby'
import { MIGRATION_STEPS } from '@packages/types'
import type { OldCypressConfig } from '../../util'
import path from 'path'

function getTestFiles (config: OldCypressConfig, type: 'component' | 'integration'): string[] {
  // super awkward how we call it integration tests, but the key to override
  // the config is `e2e`
  const k = type === 'component' ? 'component' : 'e2e'

  const glob = config[k]?.testFiles ?? config.testFiles

  if (glob && Array.isArray(glob)) {
    return glob
  }

  if (glob && typeof glob === 'string') {
    return [glob]
  }

  return ['**/*']
}

export function getIntegrationTestFiles (config: OldCypressConfig): string[] {
  return getTestFiles(config, 'integration')
}

export function getComponentTestFiles (config: OldCypressConfig): string[] {
  return getTestFiles(config, 'component')
}

export function isDefaultTestFiles (config: OldCypressConfig, type: 'component' | 'integration') {
  const testFiles = type === 'component'
    ? getComponentTestFiles(config)
    : getIntegrationTestFiles(config)

  return testFiles.length === 1 && testFiles[0] === '**/*'
}

export function getIntegrationFolder (config: OldCypressConfig) {
  if (config.e2e?.integrationFolder === false || config.integrationFolder === false) {
    return false
  }

  return config.e2e?.integrationFolder ?? config.integrationFolder ?? 'cypress/integration'
}

export function getComponentFolder (config: OldCypressConfig) {
  if (config.component?.componentFolder === false || config.componentFolder === false) {
    return false
  }

  return config.component?.componentFolder ?? config.componentFolder ?? 'cypress/component'
}

export async function shouldShowAutoRenameStep (projectRoot: string, config: OldCypressConfig) {
  const integrationFolder = getIntegrationFolder(config)
  const testFiles = getIntegrationTestFiles(config)

  const hasSpecFiles = async (dir: string, testFilesGlob: string[]): Promise<boolean> => {
    const f = await globby(testFilesGlob.map((x) => path.join(projectRoot, dir, x)))

    return f.length > 0
  }

  // default or custom integrationFolder,
  // non custom test files glob
  // migrate (unless they have no specs, nothing to rename?)
  if (
    integrationFolder !== false &&
    await hasSpecFiles(integrationFolder, testFiles)
  ) {
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

export async function getStepsForMigration (
  projectRoot: string,
  config: OldCypressConfig,
): Promise<Step[]> {
  const steps: Step[] = []

  for (const step of MIGRATION_STEPS) {
    if (step === 'renameAuto' && await shouldShowAutoRenameStep(projectRoot, config)) {
      steps.push(step)
    }

    if (step === 'renameManual' && shouldShowRenameManual(config)) {
      steps.push(step)
    }

    if (step === 'renameSupport' && shouldShowRenameSupport(config)) {
      steps.push(step)
    }

    if (step === 'configFile' && shouldShowConfigFileStep(config)) {
      steps.push(step)
    }

    if (step === 'setupComponent' && shouldShowSetupComponent(config)) {
      steps.push(step)
    }
  }

  return steps
}
