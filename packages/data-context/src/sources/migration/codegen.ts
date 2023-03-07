import chokidar from 'chokidar'
import fs from 'fs-extra'
import path from 'path'
import globby from 'globby'
import type { TestingType } from '@packages/types'
import { formatMigrationFile } from './format'
import { substitute } from './autoRename'
import { supportFileRegexps } from './regexps'
import type { MigrationFile } from '../MigrationDataSource'
import { toPosix } from '../../util'
import Debug from 'debug'
import dedent from 'dedent'
import { hasDefaultExport } from './parserUtils'
import { isDefaultSupportFile, LegacyCypressConfigJson, legacyIntegrationFolder } from '..'
import { parse } from '@babel/parser'
import generate from '@babel/generator'
import _ from 'lodash'
import { defineConfigAvailable, getBreakingKeys } from '@packages/config'

const debug = Debug('cypress:data-context:sources:migration:codegen')

type ConfigOptions = {
  global: Record<string, unknown>
  e2e: Record<string, unknown>
  component: Record<string, unknown>
}

type ResolvedConfigOptions = Cypress.ResolvedConfigOptions & {
  testFiles: string | string[]
  ignoreTestFiles: string | string[]
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
  isUsingTypeScript: boolean
  isProjectUsingESModules: boolean
  shouldAddCustomE2ESpecPattern: boolean
}

export async function createConfigString (cfg: LegacyCypressConfigJson, options: CreateConfigOptions) {
  const newConfig = reduceConfig(cfg, options)
  const relativePluginPath = await getPluginRelativePath(cfg, options.projectRoot)

  debug('creating cypress.config from newConfig %o relativePluginPath %s options %o', newConfig, relativePluginPath, options)

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
      ignorePermissionErrors: true,
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

async function getPluginRelativePath (cfg: LegacyCypressConfigJson, projectRoot: string): Promise<string | undefined> {
  return cfg.pluginsFile ? cfg.pluginsFile : await tryGetDefaultLegacyPluginsFile(projectRoot)
}

async function createCypressConfig (config: ConfigOptions, pluginPath: string | undefined, options: CreateConfigOptions): Promise<string> {
  const globalString = Object.keys(config.global).length > 0 ? `${formatObjectForConfig(config.global)},` : ''
  const componentString = options.hasComponentTesting ? createComponentTemplate(config.component) : ''
  const e2eString = options.hasE2ESpec
    ? await createE2ETemplate(pluginPath, options, config.e2e)
    : ''

  if (defineConfigAvailable(options.projectRoot)) {
    if (options.isUsingTypeScript || options.isProjectUsingESModules) {
      return formatConfig(dedent`
        import { defineConfig } from 'cypress'
  
        export default defineConfig({
          ${globalString}
          ${e2eString}
          ${componentString}
        })`)
    }

    return formatConfig(dedent`
      const { defineConfig } = require('cypress')

      module.exports = defineConfig({
        ${globalString}
        ${e2eString}
        ${componentString}
      })`)
  }

  if (options.isUsingTypeScript || options.isProjectUsingESModules) {
    return formatConfig(`export default {${globalString}${e2eString}${componentString}}`)
  }

  return formatConfig(`module.exports = {${globalString}${e2eString}${componentString}}`)
}

function formatObjectForConfig (obj: Record<string, unknown>) {
  return JSON.stringify(obj, null, 2).replace(/^[{]|[}]$/g, '') // remove opening and closing {}
}

// Returns path of `pluginsFile` relative to projectRoot
// Considers cases of:
// 1. `pluginsFile` pointing to a directory containing an index file
// 2. `pluginsFile` pointing to a file
//
// Example:
// - projectRoot
// --- cypress
// ----- plugins
// -------- index.js
// Both { "pluginsFile": "cypress/plugins"} and { "pluginsFile": "cypress/plugins/index.js" } are valid.
//
// Will return `cypress/plugins/index.js` for both cases.
export async function getLegacyPluginsCustomFilePath (projectRoot: string, pluginPath: string): Promise<string> {
  debug('looking for pluginPath %s in projectRoot %s', pluginPath, projectRoot)

  const pluginLoc = path.join(projectRoot, pluginPath)

  debug('fs.stats on %s', pluginLoc)

  let stats: fs.Stats

  try {
    stats = await fs.stat(pluginLoc)
  } catch (e) {
    throw Error(`Looked for pluginsFile at ${pluginPath}, but it was not found.`)
  }

  if (stats.isFile()) {
    debug('found pluginsFile %s', pluginLoc)

    return pluginPath
  }

  if (stats.isDirectory()) {
    // Although you are supposed to pass a file to `pluginsFile`, we also supported
    // passing a directory containing an `index` file.
    // If pluginsFile is a directory, see if there is an index.{js,ts} and grab that.
    // {
    //    "pluginsFile": "plugins"
    // }
    // Where cypress/plugins contains an `index.{js,ts,coffee...}` but NOT `index.d.ts`.
    const ls = await fs.readdir(pluginLoc)
    const indexFile = ls.find((file) => file.startsWith('index.') && !file.endsWith('.d.ts'))

    debug('pluginsFile was a directory containing %o, looks like we want %s', ls, indexFile)

    if (indexFile) {
      const pathToIndex = path.join(pluginPath, indexFile)

      debug('found pluginsFile %s', pathToIndex)

      return pathToIndex
    }
  }

  debug('error, could not find path to pluginsFile!')

  throw Error(`Could not find pluginsFile. Received projectRoot ${projectRoot} and pluginPath: ${pluginPath}`)
}

async function createE2ETemplate (pluginPath: string | undefined, createConfigOptions: CreateConfigOptions, options: Record<string, unknown>) {
  if (createConfigOptions.shouldAddCustomE2ESpecPattern && !options.specPattern) {
    options.specPattern = 'cypress/e2e/**/*.{js,jsx,ts,tsx}'
  }

  if (!createConfigOptions.hasPluginsFile || !pluginPath) {
    return dedent`
      e2e: {
        setupNodeEvents(on, config) {},${formatObjectForConfig(options)}
      },
    `
  }

  let relPluginsPath: string

  const startsWithDotSlash = new RegExp(/^.\//)

  if (startsWithDotSlash.test(pluginPath)) {
    relPluginsPath = `'${pluginPath}'`
  } else {
    relPluginsPath = `'./${pluginPath}'`
  }

  const legacyPluginFileLoc = await getLegacyPluginsCustomFilePath(createConfigOptions.projectRoot, pluginPath)
  const pluginFile = await fs.readFile(path.join(createConfigOptions.projectRoot, legacyPluginFileLoc), 'utf8')

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
export async function hasSpecFile (projectRoot: string, folder: string | false, glob: string | string[]): Promise<boolean> {
  if (!folder) {
    return false
  }

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
  ).map((part) => substitute(part))

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
  await Promise.all(specs.map((spec) => {
    const from = path.join(projectRoot, spec.from)
    const to = path.join(projectRoot, spec.to)

    if (from === to) {
      return
    }

    return fs.move(from, to)
  }))
}

export async function cleanUpIntegrationFolder (projectRoot: string) {
  const integrationPath = path.join(projectRoot, 'cypress', 'integration')
  const e2ePath = path.join(projectRoot, 'cypress', 'e2e')

  try {
    await fs.copy(integrationPath, e2ePath, { recursive: true })
    await fs.remove(integrationPath)
  } catch (e: any) {
    // only throw if the folder exists
    if (e.code !== 'ENOENT') {
      throw e
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

export function reduceConfig (cfg: LegacyCypressConfigJson, options: CreateConfigOptions): ConfigOptions {
  return Object.entries(cfg).reduce((acc, [key, val]) => {
    switch (key) {
      case 'pluginsFile':
      case '$schema':
        return acc

      case 'e2e':
      case 'component': {
        const value = val as ResolvedConfigOptions

        if (!value) {
          return acc
        }

        const { testFiles, ignoreTestFiles, ...rest } = value

        // don't include if it's the default! No need.
        const specPattern = getSpecPattern(cfg, key, options.shouldAddCustomE2ESpecPattern)
        const ext = '**/*.cy.{js,jsx,ts,tsx}'
        const isDefaultE2E = key === 'e2e' && specPattern === `cypress/e2e/${ext}`
        const isDefaultCT = key === 'component' && specPattern === ext

        const breakingKeys = getBreakingKeys()
        const restWithoutBreakingKeys = _.omit(rest, breakingKeys)
        const existingWithoutBreakingKeys = _.omit(acc[key], breakingKeys)

        if (isDefaultE2E || isDefaultCT) {
          return {
            ...acc, [key]: {
              ...restWithoutBreakingKeys,
              ...existingWithoutBreakingKeys,
            },
          }
        }

        return {
          ...acc, [key]: {
            ...restWithoutBreakingKeys,
            ...existingWithoutBreakingKeys,
            specPattern,
          },
        }
      }
      case 'integrationFolder':
        // If the integration folder is set, but the value is the same as the default legacy one
        // we do not want to update the config value, we keep using the new default.
        if (val === legacyIntegrationFolder) {
          return acc
        }

        return {
          ...acc,
          e2e: { ...acc.e2e, specPattern: getSpecPattern(cfg, 'e2e', options.shouldAddCustomE2ESpecPattern) },
        }
      case 'componentFolder':
        return {
          ...acc,
          component: { ...acc.component, specPattern: getSpecPattern(cfg, 'component') },
        }
      case 'testFiles':
        return {
          ...acc,
          e2e: { ...acc.e2e, specPattern: getSpecPattern(cfg, 'e2e', options.shouldAddCustomE2ESpecPattern) },
          component: { ...acc.component, specPattern: getSpecPattern(cfg, 'component') },
        }
      case 'ignoreTestFiles':
        return {
          ...acc,
          e2e: { ...acc.e2e, excludeSpecPattern: val },
          component: { ...acc.component, excludeSpecPattern: val },
        }
      case 'supportFile':
        // If the supportFile is set, but is the same value as the default one; where
        // we migrate it, we do not want to put the legacy value in the migrated config.
        // It can be .ts or .js
        if (isDefaultSupportFile(val)) {
          return acc
        }

        return {
          ...acc,
          e2e: { ...acc.e2e, supportFile: val },
        }
      case 'baseUrl':
        return {
          ...acc,
          e2e: { ...acc.e2e, [key]: val },
        }
      case 'slowTestThreshold':
        return {
          ...acc,
          component: { ...acc.component, [key]: val },
          e2e: { ...acc.e2e, [key]: val },
        }
      default:
        return { ...acc, global: { ...acc.global, [key]: val } }
    }
  }, { global: {}, e2e: {}, component: {} })
}

function propOrArrayProp<T> (val: T[]): T | T[] {
  if (val[0] && val.length === 1) {
    return val[0]
  }

  return val
}

export function getSpecPattern (cfg: LegacyCypressConfigJson, testingType: TestingType, shouldAddCustomE2ESpecPattern: boolean = false) {
  let _specPattern = cfg[testingType]?.testFiles ?? cfg.testFiles ?? (testingType === 'e2e' && shouldAddCustomE2ESpecPattern ? '**/*.{js,jsx,ts,tsx}' : '**/*.cy.{js,jsx,ts,tsx}')
  const specPattern = _.castArray(_specPattern)

  const customComponentFolder = cfg.component?.componentFolder ?? cfg.componentFolder ?? null

  if (testingType === 'component' && customComponentFolder) {
    return propOrArrayProp(specPattern.map((pattern) => `${customComponentFolder}/${pattern}`))
  }

  if (testingType === 'e2e') {
    const customIntegrationFolder = cfg.e2e?.integrationFolder ?? cfg.integrationFolder ?? null

    if (customIntegrationFolder && customIntegrationFolder !== legacyIntegrationFolder) {
      return propOrArrayProp(specPattern.map((pattern) => `${customIntegrationFolder}/${pattern}`))
    }

    return propOrArrayProp(specPattern.map((pattern) => `cypress/e2e/${pattern}`))
  }

  return propOrArrayProp(specPattern)
}

function formatWithBundledBabel (config: string) {
  const ast = parse(config)

  // @ts-ignore - transitive babel types have a minor conflict - readonly vs non readonly.
  let { code } = generate(ast, {}, config)
  // By default babel generates imports like this:
  // const {
  //   defineConfig
  // } = require('cypress');
  // So we replace them with a one-liner, since we know this will never
  // be more than one import.
  //
  // Babel also adds empty lines, for example:
  //
  // export default defineConfig({
  //   component: {
  //   },
  //               <===== empty line
  //   e2e: {
  //
  //   }
  // })
  // Which we don't want, so we change those to single carriage returns.
  const replacers = [
    {
      from: dedent`
        const {
          defineConfig
        } = require('cypress');
      `,
      to: dedent`
        const { defineConfig } = require('cypress');
      `,
    },
    {

      from: dedent`
        import {
          defineConfig
        } from 'cypress';
      `,
      to: dedent`
        import { defineConfig } from 'cypress';
      `,
    },
    {
      from: `,\n\n`,
      to: `,\n`,
    },
  ]

  for (const rep of replacers) {
    if (code.includes(rep.from)) {
      code = code.replaceAll(rep.from, rep.to)
    }
  }

  return code
}

export function formatConfig (config: string): string {
  try {
    const prettier = require('prettier') as typeof import('prettier')

    return prettier.format(config, {
      semi: false,
      singleQuote: true,
      endOfLine: 'lf',
      parser: 'babel',
    })
  } catch (e) {
    // If they do not have prettier
    // We do a basic format using babel, which we
    // bundle as part of the binary.
    // We don't ship a fully fledged formatter like
    // prettier, since it's massively bloats the bundle.
    return formatWithBundledBabel(config)
  }
}
