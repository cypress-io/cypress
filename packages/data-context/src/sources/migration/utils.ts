import chokidar from 'chokidar'
import fs from 'fs-extra'
import path from 'path'
import globby from 'globby'
import {
  supportFileRegexps,
  formatMigrationFile,
} from './format'
import { substitute } from './autoRename'
import type { TestingType } from '@packages/types'
import prettier from 'prettier'
import type { MigrationFile } from '..'

type ConfigOptions = {
  global: Record<string, unknown>
  e2e: Record<string, unknown>
  component: Record<string, unknown>
}

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

export const defaultSupportFiles = {
  before: path.join('cypress', 'support', 'index.js'),
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

export async function createConfigString (cfg: OldCypressConfig, options: CreateConfigOptions) {
  return createCypressConfig(reduceConfig(cfg), await getPluginRelativePath(cfg, options.projectRoot), options)
}

interface FileToBeMigratedManually {
  relative: string
  moved: boolean
}

export interface ComponentTestingMigrationStatus {
  files: Map<string, FileToBeMigratedManually>
  completed: boolean
}

export function initComponentTestingMigration (
  projectRoot: string,
  componentFolder: string,
  testFiles: string[],
  onFileMoved: (status: ComponentTestingMigrationStatus) => void,
): Promise<{
  status: ComponentTestingMigrationStatus
  watcher: chokidar.FSWatcher
}> {
  const watchPaths = testFiles.map((glob) => {
    return path.join(componentFolder, glob)
  })

  const watcher = chokidar.watch(
    watchPaths, {
      cwd: projectRoot,
    },
  )

  let filesToBeMoved: Map<string, FileToBeMigratedManually> = globby.sync(watchPaths, {
    cwd: projectRoot,
  }).reduce<Map<string, FileToBeMigratedManually>>((acc, relative) => {
    acc.set(relative, { relative, moved: false })

    return acc
  }, new Map())

  watcher.on('unlink', (unlinkedPath) => {
    const file = filesToBeMoved.get(unlinkedPath)

    if (!file) {
      throw Error(`Watcher incorrectly triggered while watching ${file}`)
    }

    file.moved = true

    const completed = Array.from(filesToBeMoved.values()).every((value) => value.moved === true)

    onFileMoved({
      files: filesToBeMoved,
      completed,
    })
  })

  return new Promise((resolve) => {
    watcher.on('ready', () => {
      resolve({
        status: {
          files: filesToBeMoved,
          completed: false,
        },
        watcher,
      })
    })
  })
}

async function getPluginRelativePath (cfg: OldCypressConfig, root: string): Promise<string> {
  if (cfg.pluginsFile) {
    return cfg.pluginsFile
  }

  try {
    let pluginPath = path.normalize('cypress/plugins/index.ts')

    await fs.stat(path.join(root, pluginPath))

    return pluginPath
  } catch {
    return path.normalize('cypress/plugins/index.js')
  }
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
  const requirePlugins = `return require('.${path.sep}${pluginPath}')(on, config)`

  const setupNodeEvents = `setupNodeEvents(on, config) {
    ${hasPluginsFile ? requirePlugins : ''}
  }`

  return `e2e: {
    ${setupNodeEvents},${formatObjectForConfig(options)}
  },`
}

function createComponentTemplate (options: Record<string, unknown>) {
  return `component: {
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
  const glob = path.join(projectRoot, 'cypress', 'plugins', 'index.*')
  const files = await globby(glob)

  return files[0]
}

export async function tryGetDefaultLegacySupportFile (projectRoot: string) {
  const files = await globby(path.join(projectRoot, 'cypress', 'support', 'index.*'))

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
  const defaultSupportFile = await getDefaultLegacySupportFile(projectRoot)

  const defaultOldSupportFile = path.relative(projectRoot, defaultSupportFile)
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

export function moveSpecFiles (projectRoot: string, specs: SpecToMove[]) {
  specs.forEach((spec) => {
    const from = path.join(projectRoot, spec.from)
    const to = path.join(projectRoot, spec.to)

    fs.moveSync(from, to)
  })
}

export function renameSupportFilePath (relative: string) {
  const re = /cypress\/support\/(?<name>index)\.[j|t|s[x]?/
  const res = new RegExp(re).exec(relative)

  if (!res?.groups?.name) {
    throw new NonStandardMigrationError('support')
  }

  return relative.replace(res.groups.name, 'e2e')
}

export function reduceConfig (cfg: OldCypressConfig): ConfigOptions {
  const excludedFields = ['pluginsFile', '$schema']

  return Object.entries(cfg).reduce((acc, [key, val]) => {
    if (excludedFields.includes(key)) {
      return acc
    }

    if (key === 'e2e' || key === 'component') {
      const value = val as Cypress.ResolvedConfigOptions

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

    if (key === 'integrationFolder') {
      return {
        ...acc,
        e2e: { ...acc.e2e, specPattern: getSpecPattern(cfg, 'e2e') },
      }
    }

    if (key === 'componentFolder') {
      return {
        ...acc,
        component: { ...acc.component, specPattern: getSpecPattern(cfg, 'component') },
      }
    }

    if (key === 'testFiles') {
      return {
        ...acc,
        e2e: { ...acc.e2e, specPattern: getSpecPattern(cfg, 'e2e') },
        component: { ...acc.component, specPattern: getSpecPattern(cfg, 'component') },
      }
    }

    if (key === 'ignoreTestFiles') {
      return {
        ...acc,
        e2e: { ...acc.e2e, specExcludePattern: val },
        component: { ...acc.component, specExcludePattern: val },
      }
    }

    if (key === 'supportFile') {
      return {
        ...acc,
        e2e: { ...acc.e2e, supportFile: val },
      }
    }

    if (key === 'baseUrl') {
      return {
        ...acc,
        e2e: { ...acc.e2e, [key]: val },
      }
    }

    return { ...acc, global: { ...acc.global, [key]: val } }
  }, { global: {}, e2e: {}, component: {} })
}

// function getSpecPattern (cfg: OldCypressConfig, testingType: TestingType) {
//   // `componentFolder` is no longer a thing, we are forcing the user to co-locate
//   // component specs.
//   if (testingType === 'component') {
//     return '**/*.cy.{js,jsx,ts,tsx}'
//   }

//   const specPattern = cfg.e2e?.testFiles ?? cfg.testFiles ?? '**/*.cy.{js,jsx,ts,tsx}'

//   const customIntegrationFolder = cfg.e2e?.integrationFolder ?? cfg.integrationFolder ?? 'cypress/e2e'

//   if (customIntegrationFolder) {
//     return `${customIntegrationFolder}/${specPattern}`
//   }

//   return specPattern
// }

function getSpecPattern (cfg: OldCypressConfig, testType: TestingType) {
  const specPattern = cfg[testType]?.testFiles ?? cfg.testFiles ?? '**/*.cy.{js,jsx,ts,tsx}'
  const customComponentFolder = cfg.component?.componentFolder ?? cfg.componentFolder ?? null

  if (testType === 'component' && customComponentFolder) {
    return specPattern
  }

  if (testType === 'e2e') {
    const customIntegrationFolder = cfg.e2e?.integrationFolder ?? cfg.integrationFolder ?? null

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
    endOfLine: 'auto',
    parser: 'babel',
  })
}
