import globby from 'globby'
import path from 'path'
import { MIGRATION_STEPS } from '@packages/types'
import { applyMigrationTransform, getSpecs, isDefaultSupportFile, legacyIntegrationFolder, tryGetDefaultLegacySupportFile } from '.'
import type { LegacyCypressConfigJson } from '..'

export const defaultTestFilesGlob = '**/*.{js,ts,jsx,tsx,coffee,cjsx}'

function getTestFilesGlobs (config: LegacyCypressConfigJson, type: 'component' | 'integration'): string[] {
  // super awkward how we call it integration tests, but the key to override
  // the config is `e2e`
  const k = type === 'component' ? 'component' : 'e2e'

  const glob = config[k]?.testFiles ?? config.testFiles

  if (glob) {
    return ([] as string[]).concat(glob)
  }

  return [defaultTestFilesGlob]
}

export function getIntegrationTestFilesGlobs (config: LegacyCypressConfigJson): string[] {
  return getTestFilesGlobs(config, 'integration')
}

export function getComponentTestFilesGlobs (config: LegacyCypressConfigJson): string[] {
  return getTestFilesGlobs(config, 'component')
}

export function isDefaultTestFiles (config: LegacyCypressConfigJson, type: 'component' | 'integration') {
  const testFiles = type === 'component'
    ? getComponentTestFilesGlobs(config)
    : getIntegrationTestFilesGlobs(config)

  return testFiles.length === 1 && testFiles[0] === defaultTestFilesGlob
}

export function getPluginsFile (config: LegacyCypressConfigJson) {
  if (config.e2e?.pluginsFile === false || config.pluginsFile === false) {
    return false
  }

  return config.e2e?.pluginsFile ?? config.pluginsFile ?? 'cypress/plugins/index.js'
}

export function getIntegrationFolder (config: LegacyCypressConfigJson) {
  return config.e2e?.integrationFolder ?? config.integrationFolder ?? legacyIntegrationFolder
}

export function getComponentFolder (config: LegacyCypressConfigJson): false | string {
  if (config.component?.componentFolder === false || config.componentFolder === false) {
    return false
  }

  return config.component?.componentFolder ?? config.componentFolder ?? 'cypress/component'
}

async function hasSpecFiles (projectRoot: string, dir: string, testFilesGlob: string[]): Promise<boolean> {
  const f = await globby(testFilesGlob, { cwd: path.join(projectRoot, dir) })

  return f.length > 0
}

export async function shouldShowAutoRenameStep (projectRoot: string, config: LegacyCypressConfigJson) {
  const specsToAutoMigrate = await getSpecs(projectRoot, config)

  const e2eMigrationOptions = {
    // If the configFile has projectId, we do not want to change the preExtension
    // so, we can keep the cloud history
    shouldMigratePreExtension: !config.projectId && !config.e2e?.projectId,
  }

  const integrationCleaned = specsToAutoMigrate.integration.filter((spec) => {
    const transformed = applyMigrationTransform(spec, e2eMigrationOptions)

    return transformed.before.relative !== transformed.after.relative
  })

  const componentCleaned = specsToAutoMigrate.component.filter((spec) => {
    const transformed = applyMigrationTransform(spec)

    return transformed.before.relative !== transformed.after.relative
  })

  // if we have at least one spec to auto migrate in either Ct or E2E, we return true.
  return integrationCleaned.length > 0 || componentCleaned.length > 0
}

async function anyComponentSpecsExist (projectRoot: string, config: LegacyCypressConfigJson) {
  const componentFolder = getComponentFolder(config)

  if (componentFolder === false) {
    return false
  }

  const componentTestFiles = getComponentTestFilesGlobs(config)

  return hasSpecFiles(projectRoot, componentFolder, componentTestFiles)
}

async function anyIntegrationSpecsExist (projectRoot: string, config: LegacyCypressConfigJson) {
  const integrationFolder = getIntegrationFolder(config)

  const integrationTestFiles = getIntegrationTestFilesGlobs(config)

  return hasSpecFiles(projectRoot, integrationFolder, integrationTestFiles)
}

// we only show rename support file if they are using the default
// if they have anything set in their config, we will not try to rename it.
// Also, if there are no **no** integration specs, we are doing a CT only migration,
// in which case we don't migrate the supportFile - they'll make a new support/component.js
// when they set CT up.
export async function shouldShowRenameSupport (projectRoot: string, config: LegacyCypressConfigJson) {
  if (!await anyIntegrationSpecsExist(projectRoot, config)) {
    return false
  }

  let supportFile = config.e2e?.supportFile ?? config.supportFile

  if (supportFile === undefined) {
    const foundDefaultSupportFile = await tryGetDefaultLegacySupportFile(projectRoot)

    if (foundDefaultSupportFile) {
      supportFile = foundDefaultSupportFile
    }
  }

  // if the support file is set to false, we don't show the rename step
  // if the support file does not exist (value is undefined), we don't show the rename step
  if (!supportFile) {
    return false
  }

  // if the support file is custom, we don't show the rename step
  // only if the support file matches the default do we show the rename step
  return isDefaultSupportFile(supportFile)
}

// if they have component testing configured using the defaults, they will need to
// rename/move their specs.
async function shouldShowRenameManual (projectRoot: string, config: LegacyCypressConfigJson) {
  const componentFolder = getComponentFolder(config)

  const usingAllDefaults = componentFolder === 'cypress/component' && isDefaultTestFiles(config, 'component')

  if (componentFolder === false || !usingAllDefaults) {
    return false
  }

  return anyComponentSpecsExist(projectRoot, config)
}

// All projects must move from cypress.json to cypress.config.js!
export function shouldShowConfigFileStep (config: LegacyCypressConfigJson) {
  return true
}

export type Step = typeof MIGRATION_STEPS[number]

export async function getStepsForMigration (
  projectRoot: string,
  config: LegacyCypressConfigJson,
  configFileExists: boolean,
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

    if (step === 'configFile' && configFileExists) {
      steps.push(step)
    }

    // if we are showing rename manual, this implies
    // component testing is configured.
    if (step === 'setupComponent' && await anyComponentSpecsExist(projectRoot, config)) {
      steps.push(step)
    }
  }

  return steps
}
