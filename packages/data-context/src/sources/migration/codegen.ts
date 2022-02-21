import fs from 'fs-extra'
import path from 'path'
import globby from 'globby'
import {
  formatMigrationFile,
} from './format'
import { substitute } from './autoRename'
import type { TestingType } from '@packages/types'
import prettier from 'prettier'
import type { MigrationFile } from '../MigrationDataSource'
import { supportFileRegexps } from './regexps'
import Debug from 'debug'

const debug = Debug('cypress:data-context:sources:migration:codegen')

type ConfigOptions = {
  global: Record<string, unknown>
  e2e: Record<string, unknown>
  component: Record<string, unknown>
}

const BREAKING_CONFIG_PROPS = [
  'testFiles',
  'ignoreTestFiles',
  'supportFile',
  'integrationFolder',
  'componentFolder',
  'baseUrl',
] as const

/**
 * config format pre-10.0
 */
export interface OldCypressConfig {
  // limited subset of properties, used for unit tests
  viewportWidth?: number
  baseUrl?: string
  retries?: number

  component?: Omit<OldCypressConfig, 'component' | 'e2e'>
  e2e?: Omit<OldCypressConfig, 'component' | 'e2e'>
  pluginsFile?: string | false
  supportFile?: string | false
  componentFolder?: string | false
  integrationFolder?: string | false
  testFiles?: string | string[]
  ignoreTestFiles?: string
}

interface OldCypressConfigCombo{
  jsonConf: OldCypressConfig
  e2eConf: OldCypressConfig
  componentConf: OldCypressConfig
}

export class NonStandardMigrationError extends Error {
  constructor (fileType: 'support' | 'config') {
    super()
    this.message = `Failed to find default ${fileType}. Bailing automation migration.`
  }
}

export interface CreateConfigOptions {
  hasE2ESpec: boolean
  hasPluginsFile: boolean
  hasComponentTesting: boolean
  projectRoot: string
  hasTypescript: boolean
}

export async function createConfigString (cfg: OldCypressConfigCombo, options: CreateConfigOptions) {
  return createCypressConfig(reduceConfig(cfg),
    await getPluginRelativePath(cfg.jsonConf, options.projectRoot),
    options)
}

async function getPluginRelativePath (cfg: OldCypressConfig, projectRoot: string): Promise<string> {
  return cfg.pluginsFile ? cfg.pluginsFile : await tryGetDefaultLegacyPluginsFile(projectRoot) || ''
}

// If they are running an old version of Cypress
// or running Cypress that isn't installed in their
// project's node_modules, we don't want to include
// defineConfig(/***/) in their cypress.config.js,
// since it won't exist.
function defineConfigAvailable (projectRoot: string) {
  try {
    const cypress = require.resolve('cypress', {
      paths: [projectRoot],
    })
    const api = require(cypress)

    return 'defineConfig' in api
  } catch (e) {
    return false
  }
}

function createCypressConfig (config: ConfigOptions, pluginPath: string, options: CreateConfigOptions): string {
  const globalString = Object.keys(config.global).length > 0 ? `${formatObjectForConfig(config.global)},` : ''
  const componentString = options.hasComponentTesting ? createComponentTemplate(config.component) : ''
  const e2eString = options.hasE2ESpec
    ? createE2eTemplate(pluginPath, options.hasPluginsFile, config.e2e)
    : ''

  if (defineConfigAvailable(options.projectRoot)) {
    if (options.hasTypescript) {
      return formatConfig(
        `import { defineConfig } from 'cypress'
  
        export default defineConfig({${globalString}${e2eString}${componentString}})`,
      )
    }

    return formatConfig(
      `const { defineConfig } = require('cypress')

      module.exports = defineConfig({${globalString}${e2eString}${componentString}})`,
    )
  }

  if (options.hasTypescript) {
    return formatConfig(`export default {${globalString}${e2eString}${componentString}}`)
  }

  return formatConfig(`module.exports = {${globalString}${e2eString}${componentString}}`)
}

function formatObjectForConfig (obj: Record<string, unknown>) {
  return JSON.stringify(obj, null, 2).replace(/^[{]|[}]$/g, '') // remove opening and closing {}
}

function createE2eTemplate (pluginPath: string, hasPluginsFile: boolean, options: Record<string, unknown>) {
  const requirePlugins = `return require('./${pluginPath}')(on, config)`

  const setupNodeEvents = `// We've imported your old cypress plugins here.
  // You may want to clean this up later by importing these.
  setupNodeEvents(on, config) {
    ${hasPluginsFile ? requirePlugins : ''}
  }`

  return `e2e: {
    ${setupNodeEvents},${formatObjectForConfig(options)}
  },`
}

function createComponentTemplate (options: Record<string, unknown>) {
  return `component: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {},${formatObjectForConfig(options)}
  },`
}

export interface RelativeSpec {
  relative: string
}

/**
 * Checks that at least one spec file exist for testing type
 *
 * NOTE: this is what we use to see if CT/E2E is set up
 */
export async function hasSpecFile (projectRoot: string, folder: string, glob: string | string[]): Promise<boolean> {
  return (await globby(glob, {
    cwd: path.join(projectRoot, folder),
    onlyFiles: true,
  })).length > 0
}

export async function tryGetDefaultLegacyPluginsFile (projectRoot: string) {
  const files = await globby('cypress/plugins/index.*', { cwd: projectRoot })

  return files[0]
}

export async function tryGetDefaultLegacySupportFile (projectRoot: string) {
  const files = await globby('cypress/support/index.*', { cwd: projectRoot })

  debug('tryGetDefaultLegacySupportFile: files %O', files)

  return files[0]
}

export async function getDefaultLegacySupportFile (projectRoot: string) {
  const defaultSupportFile = await tryGetDefaultLegacySupportFile(projectRoot)

  if (!defaultSupportFile) {
    throw new NonStandardMigrationError('support')
  }

  return defaultSupportFile
}

export async function supportFilesForMigration (projectRoot: string): Promise<MigrationFile> {
  debug('Checking for support files in %s', projectRoot)
  const defaultOldSupportFile = await getDefaultLegacySupportFile(projectRoot)
  const defaultNewSupportFile = renameSupportFilePath(defaultOldSupportFile)

  const afterParts = formatMigrationFile(
    defaultOldSupportFile,
    new RegExp(supportFileRegexps.e2e.beforeRegexp),
  ).map(substitute)

  return {
    testingType: 'e2e',
    before: {
      relative: defaultOldSupportFile,
      parts: formatMigrationFile(defaultOldSupportFile, new RegExp(supportFileRegexps.e2e.beforeRegexp)),
    },
    after: {
      relative: defaultNewSupportFile,
      parts: afterParts,
    },
  }
}

export interface SpecToMove {
  from: string
  to: string
}

export async function moveSpecFiles (projectRoot: string, specs: SpecToMove[]) {
  await Promise.all(specs.map(async (spec) => {
    const from = path.join(projectRoot, spec.from)
    const to = path.join(projectRoot, spec.to)

    await fs.move(from, to)
  }))
}

export async function cleanUpIntegrationFolder (projectRoot: string) {
  const integrationPath = path.join(projectRoot, 'cypress', 'integration')

  try {
    fs.rmSync(integrationPath, { recursive: true })
  } catch (e: any) {
    // only throw if the folder exists
    if (e.code !== 'ENOENT') {
      throw Error(`Failed to remove ${integrationPath}`)
    }
  }
}

export function renameSupportFilePath (relative: string) {
  const res = new RegExp(supportFileRegexps.e2e.beforeRegexp).exec(relative)

  if (!res?.groups?.name) {
    throw new NonStandardMigrationError('support')
  }

  return relative.replace(res.groups.name, 'e2e')
}

const keyHandlers: Record<typeof BREAKING_CONFIG_PROPS[number], (acc: ConfigOptions, cfg: OldCypressConfigCombo, val: any) => any> = {
  integrationFolder: (acc, cfg) => {
    return {
      ...acc,
      e2e: { ...acc.e2e, specPattern: getSpecPattern(cfg, 'e2e') },
    }
  },
  componentFolder: (acc, cfg) => {
    return {
      ...acc,
      component: { ...acc.component, specPattern: getSpecPattern(cfg, 'component') },
    }
  },
  testFiles: (acc, cfg) => {
    return {
      ...acc,
      e2e: { ...acc.e2e, specPattern: getSpecPattern(cfg, 'e2e') },
      component: { ...acc.component, specPattern: getSpecPattern(cfg, 'component') },
    }
  },
  ignoreTestFiles: (acc, cfg, val) => {
    return {
      ...acc,
      e2e: { ...acc.e2e, specExcludePattern: val },
      component: { ...acc.component, specExcludePattern: val },
    }
  },
  supportFile: (acc, cfg, val) => {
    return {
      ...acc,
      e2e: { ...acc.e2e, supportFile: val },
    }
  },
  baseUrl: (acc, cfg, val) => {
    return {
      ...acc,
      e2e: { ...acc.e2e, baseUrl: val },
    }
  },
}

export function reduceConfig (cfg: OldCypressConfigCombo): ConfigOptions {
  const excludedFields = ['pluginsFile', '$schema']

  const reducedConfig = Object.entries(cfg).reduce((acc, [key, val]) => {
    if (excludedFields.includes(key)) {
      return acc
    }

    if (key === 'e2e' || key === 'component') {
      const value = val as OldCypressConfig

      if (!value) {
        return acc
      }

      const { testFiles, ignoreTestFiles, ...rest } = value

      // don't include if it's the default! No need.
      const specPattern = getSpecPattern(cfg, key)
      const ext = '**/*.cy.{js,jsx,ts,tsx}'
      const isDefaultE2E = key === 'e2e' && specPattern === `cypress/e2e/${ext}`
      const isDefaultCT = key === 'component' && specPattern === ext

      if (isDefaultE2E || isDefaultCT) {
        return {
          ...acc, [key]: {
            ...rest,
            ...acc[key],
          },
        }
      }

      return {
        ...acc, [key]: {
          ...rest,
          ...acc[key],
          specPattern,
        },
      }
    }

    if (BREAKING_CONFIG_PROPS.includes(key as any)) {
      return keyHandlers[key as any as typeof BREAKING_CONFIG_PROPS[number]](acc, cfg, val)
    }

    return { ...acc, global: { ...acc.global, [key]: val } }
  }, { global: {}, e2e: {}, component: {} })

  debug('reduceConfig: %O', reducedConfig)

  return reducedConfig
}

function getSpecPattern (cfg: OldCypressConfigCombo, testType: TestingType) {
  const configTyped = cfg[`${testType}Conf`]
  const specPattern = configTyped[testType]?.testFiles ?? configTyped.testFiles ?? '**/*.cy.{js,jsx,ts,tsx}'

  if (testType === 'component') {
    const customComponentFolder = configTyped.component?.componentFolder ?? configTyped.componentFolder ?? null

    return customComponentFolder
      ? `${customComponentFolder}/${specPattern}`
      : specPattern
  }

  if (testType === 'e2e') {
    const customIntegrationFolder = configTyped.e2e?.integrationFolder ?? configTyped.integrationFolder ?? null

    if (customIntegrationFolder) {
      return `${customIntegrationFolder}/${specPattern}`
    }

    return `cypress/e2e/${specPattern}`
  }

  return specPattern
}

export function formatConfig (config: string) {
  return prettier.format(config, {
    semi: false,
    singleQuote: true,
    endOfLine: 'lf',
    parser: 'babel',
  })
}
