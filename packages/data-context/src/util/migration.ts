import chokidar from 'chokidar'
import fs from 'fs-extra'
import stringify from 'stringify-object'
import path from 'path'
import globby from 'globby'
import {
  supportFileRegexps,
  formatMigrationFile,
} from './migrationFormat'
import type { MigrationFile } from '../sources'
import { substitute } from '../sources/migration/autoRename'

type ConfigOptions = {
  global: Record<string, unknown>
  e2e: Record<string, unknown>
  component: Record<string, unknown>
}

/**
 * config format pre-10.0
 */
export interface OldCypressConfig {
  component?: Omit<OldCypressConfig, 'component' | 'e2e'>
  e2e?: Omit<OldCypressConfig, 'component' | 'e2e'>
  pluginsFile?: string | false
  supportFile?: string | false
  componentFolder?: string | false
  integrationFolder?: string | false
  testFiles?: string | string[]
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

export async function createConfigString (cfg: OldCypressConfig) {
  return createCypressConfigJs(reduceConfig(cfg), getPluginRelativePath(cfg))
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

function getPluginRelativePath (cfg: OldCypressConfig): string {
  const DEFAULT_PLUGIN_PATH = path.normalize('/cypress/plugins/index.js')

  return cfg.pluginsFile ? cfg.pluginsFile : DEFAULT_PLUGIN_PATH
}

function reduceConfig (cfg: OldCypressConfig): ConfigOptions {
  const excludedFields = ['pluginsFile', '$schema', 'componentFolder']

  return Object.entries(cfg).reduce((acc, [key, val]) => {
    if (excludedFields.includes(key)) {
      return acc
    }

    if (key === 'e2e' || key === 'component') {
      const value = val as Record<string, unknown>

      return { ...acc, [key]: { ...acc[key], ...value } }
    }

    if (key === 'testFiles') {
      return {
        ...acc,
        e2e: { ...acc.e2e, specPattern: val },
        component: { ...acc.component, specPattern: val },
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

function createCypressConfigJs (config: ConfigOptions, pluginPath: string) {
  const globalString = Object.keys(config.global).length > 0 ? `\n${formatObjectForConfig(config.global, 2)},` : ''
  const componentString = Object.keys(config.component).length > 0 ? createTestingTypeTemplate('component', pluginPath, config.component) : ''
  const e2eString = Object.keys(config.e2e).length > 0 ? createTestingTypeTemplate('e2e', pluginPath, config.e2e) : ''

  return `const { defineConfig } = require('cypress')

module.exports = defineConfig({${globalString}${e2eString}${componentString}
})`
}

function formatObjectForConfig (obj: Record<string, unknown>, spaces: number) {
  return stringify(obj, {
    indent: Array(spaces).fill(' ').join(''),
  }).replace(/^[{]|[}]$/g, '') // remove opening and closing {}
  .trim() // remove trailing spaces
}

function createTestingTypeTemplate (testingType: 'e2e' | 'component', pluginPath: string, options: Record<string, unknown>) {
  return `
  ${testingType}: {
    setupNodeEvents(on, config) {
      return require('${pluginPath}')
    },
    ${formatObjectForConfig(options, 4)}
  },`
}

export interface RelativeSpec {
  relative: string
}

/**
 * Checks that at least one spec file exist for component testing
 *
 * NOTE: this is what we use to see if CT is set up
 * @param projectRoot
 * @param componentFolder
 * @param componentGlob
 * @returns
 */
export async function hasComponentSpecFile (projectRoot: string, componentFolder: string, componentGlob: string | string[]): Promise<boolean> {
  return (await globby(componentGlob, {
    cwd: path.join(projectRoot, componentFolder),
    onlyFiles: true,
  })).length > 0
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
