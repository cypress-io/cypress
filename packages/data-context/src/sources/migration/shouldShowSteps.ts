import globby from 'globby'
import { MIGRATION_STEPS } from '@packages/types'
import path from 'path'
import { getSpecs, OldCypressConfig, tryGetDefaultLegacySupportFile } from '.'

function getTestFilesGlobs (config: OldCypressConfig, type: 'component' | 'integration'): string[] {
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

export function getIntegrationTestFilesGlobs (config: OldCypressConfig): string[] {
  return getTestFilesGlobs(config, 'integration')
}

export function getComponentTestFilesGlobs (config: OldCypressConfig): string[] {
  return getTestFilesGlobs(config, 'component')
}

export function isDefaultTestFiles (config: OldCypressConfig, type: 'component' | 'integration') {
  const testFiles = type === 'component'
    ? getComponentTestFilesGlobs(config)
    : getIntegrationTestFilesGlobs(config)

  return testFiles.length === 1 && testFiles[0] === '**/*'
}

export function getPluginsFile (config: OldCypressConfig) {
  if (config.e2e?.pluginsFile === false || config.pluginsFile === false) {
    return false
  }

  return config.e2e?.pluginsFile ?? config.pluginsFile ?? 'cypress/plugins/index.js'
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

async function hasSpecFiles (projectRoot: string, dir: string, testFilesGlob: string[]): Promise<boolean> {
  const f = await globby(testFilesGlob.map((x) => path.join(projectRoot, dir, x)))

  return f.length > 0
}
export async function shouldShowAutoRenameStep (projectRoot: string, config: OldCypressConfig) {
  const specsToAutoMigrate = await getSpecs(projectRoot, config)

  // if we have at least one spec to auto migrate in either Ct or E2E, we return true.
  return specsToAutoMigrate.integration.length > 0 || specsToAutoMigrate.component.length > 0
}

async function anyIntegrationSpecsExist (projectRoot: string, config: OldCypressConfig) {
  const integrationFolder = getIntegrationFolder(config)

  if (integrationFolder === false) {
    return false
  }

  const integrationTestFiles = getIntegrationTestFilesGlobs(config)

  return hasSpecFiles(projectRoot, integrationFolder, integrationTestFiles)
}

// we only show rename support file if they are using the default
// if they have anything set in their config, we will not try to rename it.
// Also, if there are no **no** integration specs, we are doing a CT only migration,
// in which case we don't migrate the supportFile - they'll make a new support/component.js
// when they set CT up.
export async function shouldShowRenameSupport (projectRoot: string, config: OldCypressConfig) {
  if (!await anyIntegrationSpecsExist(projectRoot, config)) {
    return false
  }

  const defaultSupportFile = 'cypress/support/index.'
  let supportFile = config.e2e?.supportFile ?? config.supportFile

  if (supportFile === undefined) {
    supportFile = await tryGetDefaultLegacySupportFile(projectRoot)
  }

  return supportFile && supportFile.startsWith(defaultSupportFile)
}

// if they have component testing configured, they will need to
// rename/move their specs.
function shouldShowRenameManual (projectRoot: string, config: OldCypressConfig) {
  const componentFolder = getComponentFolder(config)

  if (componentFolder === false) {
    return false
  }

  const componentTestFiles = getComponentTestFilesGlobs(config)

  return hasSpecFiles(projectRoot, componentFolder, componentTestFiles)
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

    if (step === 'renameManual' && await shouldShowRenameManual(projectRoot, config)) {
      steps.push(step)
    }

    if (step === 'renameSupport' && await shouldShowRenameSupport(projectRoot, config)) {
      steps.push(step)
    }

    if (step === 'configFile' && shouldShowConfigFileStep(config)) {
      steps.push(step)
    }

    // if we are showing rename manual, this implies
    // component testing is configured.
    if (step === 'setupComponent' && steps.includes('renameManual')) {
      steps.push(step)
    }
  }

  return steps
}
