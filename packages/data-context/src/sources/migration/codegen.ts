import chokidar from 'chokidar'
import fs from 'fs-extra'
import path from 'path'
import globby from 'globby'
import prettier from 'prettier'
import type { TestingType } from '@packages/types'
import { formatMigrationFile } from './format'
import { substitute } from './autoRename'
import { supportFileRegexps } from './regexps'
import type { MigrationFile } from '../MigrationDataSource'
import { toPosix } from '../../util'
import Debug from 'debug'
import dedent from 'dedent'
import { hasDefaultExport } from './parserUtils'

const debug = Debug('cypress:data-context:sources:migration:codegen')

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
  const newConfig = reduceConfig(cfg)
  const relativePluginPath = await getPluginRelativePath(cfg, options.projectRoot)

  return createCypressConfig(newConfig, relativePluginPath, options)
}

interface FileToBeMigratedManually {
  relative: string
  moved: boolean
}

export interface ComponentTestingMigrationStatus {
  files: Map<string, FileToBeMigratedManually>
  completed: boolean
}

export async function initComponentTestingMigration (
  projectRoot: string,
  componentFolder: string,
  testFiles: string[],
  onFileMoved: (status: ComponentTestingMigrationStatus) => void,
): Promise<{
  status: ComponentTestingMigrationStatus
  watcher: chokidar.FSWatcher | null
}> {
  debug('initComponentTestingMigration %O', { projectRoot, componentFolder, testFiles })
  const watchPaths = testFiles.map((glob) => {
    return `${componentFolder}/${glob}`
  })

  const watcher = chokidar.watch(
    watchPaths, {
      cwd: projectRoot,
    },
  )

  debug('watchPaths %o', watchPaths)

  let filesToBeMoved: Map<string, FileToBeMigratedManually> = (await globby(watchPaths, {
    cwd: projectRoot,
  })).reduce<Map<string, FileToBeMigratedManually>>((acc, relative) => {
    acc.set(relative, { relative, moved: false })

    return acc
  }, new Map())

  debug('files to be moved manually %o', filesToBeMoved)
  if (filesToBeMoved.size === 0) {
    // this should not happen as the step should be hidden in this case
    // but files can have been moved manually before clicking next
    return {
      status: {
        files: filesToBeMoved,
        completed: true,
      },
      watcher: null,
    }
  }

  watcher.on('unlink', (unlinkedPath) => {
    const posixUnlinkedPath = toPosix(unlinkedPath)
    const file = filesToBeMoved.get(posixUnlinkedPath)

    if (!file) {
      throw Error(`Watcher incorrectly triggered ${posixUnlinkedPath}
      while watching ${Array.from(filesToBeMoved.keys()).join(', ')}
      projectRoot: ${projectRoot}`)
    }

    file.moved = true

    const completed = Array.from(filesToBeMoved.values()).every((value) => value.moved === true)

    onFileMoved({
      files: filesToBeMoved,
      completed,
    })
  })

  return new Promise((resolve, reject) => {
    watcher.on('ready', () => {
      debug('watcher ready')
      resolve({
        status: {
          files: filesToBeMoved,
          completed: false,
        },
        watcher,
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
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
    ? createE2ETemplate(pluginPath, options, config.e2e)
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

function createE2ETemplate (pluginPath: string, createConfigOptions: CreateConfigOptions, options: Record<string, unknown>) {
  if (!createConfigOptions.hasPluginsFile) {
    return dedent`
      e2e: {
        setupNodeEvents(on, config) {}
      }
    `
  }

  const pluginFile = fs.readFileSync(path.join(createConfigOptions.projectRoot, pluginPath), 'utf8')
  const relPluginsPath = path.normalize(`'./${pluginPath}'`)

  const requirePlugins = hasDefaultExport(pluginFile)
    ? `return require(${relPluginsPath}).default(on, config)`
    : `return require(${relPluginsPath})(on, config)`

  const setupNodeEvents = dedent`
  // We've imported your old cypress plugins here.
  // You may want to clean this up later by importing these.
  setupNodeEvents(on, config) {
    ${requirePlugins}
  }`

  return dedent`
    e2e: {
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
  const files = await globby('cypress/plugins/index.*', { cwd: projectRoot, ignore: ['cypress/plugins/index.d.ts'] })

  return files[0]
}

export async function tryGetDefaultLegacySupportFile (projectRoot: string) {
  const files = await globby('cypress/support/index.*', { cwd: projectRoot, ignore: ['cypress/support/index.d.ts'] })

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

    if (from !== to) {
      await fs.move(from, to)
    }
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

  if (!res?.groups?.supportFileName) {
    throw new NonStandardMigrationError('support')
  }

  return relative.slice(0, res.index) + relative.slice(res.index).replace(res.groups.supportFileName, 'e2e')
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

export function getSpecPattern (cfg: OldCypressConfig, testType: TestingType) {
  const specPattern = cfg[testType]?.testFiles ?? cfg.testFiles ?? '**/*.cy.{js,jsx,ts,tsx}'
  const customComponentFolder = cfg.component?.componentFolder ?? cfg.componentFolder ?? null

  if (testType === 'component' && customComponentFolder) {
    return `${customComponentFolder}/${specPattern}`
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
    endOfLine: 'lf',
    parser: 'babel',
  })
}
