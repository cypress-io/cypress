import type { TestingType } from '@packages/types'
import chokidar from 'chokidar'
import fs from 'fs-extra'
import stringify from 'stringify-object'
import path from 'path'
import globby from 'globby'
import dedent from 'dedent'
import type { FilesForMigrationUI } from '../sources'

type ConfigOptions = {
  global: Record<string, unknown>
  e2e: Record<string, unknown>
  component: Record<string, unknown>
}

export const defaultSupportFiles = {
  before: path.join('cypress', 'support', 'index.js'),
}

interface MigrationRegexp {
  beforeRegexp: string
  afterRegexp: string
}

interface MigrationRegexpGroup {
  e2e: MigrationRegexp
  component: MigrationRegexp
}

function getLegacyHighlightRegexp (defaultFolder: 'integration' | 'component') {
  return `cypress\/(?<main>${defaultFolder})\/.*?(?<ext>[._-]?[s|S]pec.|[.])(?=[j|t]s[x]?)`
}

function getNewHighlightRegexp (defaultFolder: 'e2e' | 'component') {
  return `cypress\/(?<main>${defaultFolder})\/.*?(?<ext>.cy.)`
}

export const supportFileRegexps: MigrationRegexpGroup = {
  e2e: {
    beforeRegexp: 'cypress/\support\/(?<main>index)\.(?=[j|t]s[x]?)',
    afterRegexp: 'cypress/\support\/(?<main>e2e)\.(?=[j|t]s[x]?)',
  },
  component: {
    beforeRegexp: 'cypress/\support\/(?<file>index)\.(?=[j|t]s[x]?)',
    afterRegexp: 'cypress/\support\/(?<file>e2e)\.(?=[j|t]s[x]?)',
  },
}

export const regexps: MigrationRegexpGroup = {
  e2e: {
    beforeRegexp: getLegacyHighlightRegexp('integration'),
    afterRegexp: getNewHighlightRegexp('e2e'),
  },
  component: {
    beforeRegexp: getLegacyHighlightRegexp('component'),
    afterRegexp: getNewHighlightRegexp('component'),
  },
} as const

export interface FilePart {
  text: string
  highlight: boolean
}

export class NonSpecFileError extends Error {
  constructor (message: string) {
    super()
    this.message = message
  }
}

export class NonStandardMigrationError extends Error {
  constructor (fileType: 'support' | 'config') {
    super()
    this.message = `Failed to find default ${fileType}. Bailing automation migration.`
  }
}

export function formatMigrationFile (file: string, regexp: RegExp): FilePart[] {
  const match = regexp.exec(file)

  if (!match?.groups) {
    throw new NonSpecFileError(dedent`
      Expected groups main and ext in ${file} using ${regexp} when matching ${file}
      Perhaps this isn't a spec file, or it is an unexpected format?`)
  }

  // sometimes `.` gets in here as the <ext> group
  // filter it out
  const higlights = Object.values(match.groups).filter((x) => x.length > 1)
  const delimiters = higlights.join('|')
  const re = new RegExp(`(${delimiters})`)
  const split = file.split(re)

  return split.map<FilePart>((text) => {
    return {
      text,
      highlight: higlights.includes(text),
    }
  })
}

export async function createConfigString (cfg: Partial<Cypress.ConfigOptions>) {
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
  testFiles: string | string[],
  onFileMoved: (status: ComponentTestingMigrationStatus) => void,
): Promise<{
  status: ComponentTestingMigrationStatus
  watcher: chokidar.FSWatcher
}> {
  const globs = Array.isArray(testFiles) ? testFiles : [testFiles]

  const watchPaths = globs.map((glob) => {
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

function getPluginRelativePath (cfg: Partial<Cypress.ConfigOptions>) {
  const DEFAULT_PLUGIN_PATH = path.normalize('/cypress/plugins/index.js')

  return cfg.pluginsFile ? cfg.pluginsFile : DEFAULT_PLUGIN_PATH
}

function reduceConfig (cfg: Partial<Cypress.ConfigOptions>) {
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

export interface RelativeSpecWithTestingType {
  testingType: TestingType
  relative: string
}

async function findByTestingType (cwd: string, dir: string | null, testingType: TestingType) {
  if (!dir) {
    return []
  }

  return (await globby(`${dir}/**/*`, { onlyFiles: true, cwd }))
  .map((relative) => ({ relative, testingType }))
}

export async function getSpecs (
  projectRoot: string,
  componentDirPath: string | null,
  e2eDirPath: string | null,
): Promise<{
  before: RelativeSpecWithTestingType[]
  after: RelativeSpecWithTestingType[]
}> {
  const [comp, e2e] = await Promise.all([
    findByTestingType(projectRoot, componentDirPath, 'component'),
    findByTestingType(projectRoot, e2eDirPath, 'e2e'),
  ])

  return {
    before: [...comp, ...e2e],
    after: [...comp, ...e2e].map((x) => {
      return {
        testingType: x.testingType,
        relative: renameSpecPath(x.relative),
      }
    }),
  }
}

export async function getDefaultLegacySupportFile (projectRoot: string) {
  const files = await globby(path.join(projectRoot, 'cypress', 'support', 'index.*'))

  const defaultSupportFile = files[0]

  if (!defaultSupportFile) {
    throw new NonStandardMigrationError('support')
  }

  return defaultSupportFile
}

export async function supportFilesForMigration (projectRoot: string): Promise<FilesForMigrationUI> {
  const defaultSupportFile = await getDefaultLegacySupportFile(projectRoot)

  const defaultOldSupportFile = path.relative(projectRoot, defaultSupportFile)
  const defaultNewSupportFile = renameSupportFilePath(defaultOldSupportFile)

  return {
    before: [
      {
        relative: defaultOldSupportFile,
        parts: formatMigrationFile(defaultOldSupportFile, new RegExp(supportFileRegexps.e2e.beforeRegexp)),
        testingType: 'e2e',
      },
    ],
    after: [
      {
        relative: defaultNewSupportFile,
        parts: formatMigrationFile(defaultNewSupportFile, new RegExp(supportFileRegexps.e2e.afterRegexp)),
        testingType: 'e2e',
      },
    ],
  }
}

export function moveSpecFiles (e2eDirPath: string) {
  const specs = fs.readdirSync(e2eDirPath).map((file) => {
    const filePath = path.join(e2eDirPath, file)

    return {
      from: filePath,
      to: renameSpecPath(filePath),
    }
  })

  specs.forEach((spec) => {
    fs.moveSync(spec.from, spec.to)
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

export function renameSpecPath (spec: string) {
  return spec
  .replace('integration', 'e2e')
  .replace(/([._-]?[s|S]pec.|[.])(?=[j|t]s[x]?)/, '.cy.')
}
