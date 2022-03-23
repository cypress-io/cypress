import os from 'os'
import type { ResolvedFromConfig, RESOLVED_FROM, FoundSpec } from '@packages/types'
import { FrontendFramework, FRONTEND_FRAMEWORKS } from '@packages/scaffold-config'
import { scanFSForAvailableDependency } from 'create-cypress-tests'
import minimatch from 'minimatch'
import { debounce, isEqual } from 'lodash'
import path from 'path'
import Debug from 'debug'
import commonPathPrefix from 'common-path-prefix'
import type { FSWatcher } from 'chokidar'
import parseGlob from 'parse-glob'
import mm from 'micromatch'
import RandExp from 'randexp'

const debug = Debug('cypress:data-context')
import assert from 'assert'

import type { DataContext } from '..'
import { toPosix } from '../util/file'
import type { FilePartsShape } from '@packages/graphql/src/schemaTypes/objectTypes/gql-FileParts'
import { STORIES_GLOB } from '.'
import { getDefaultSpecPatterns } from '../util/config-options'

export type SpecWithRelativeRoot = FoundSpec & { relativeToCommonRoot: string }

interface MatchedSpecs {
  projectRoot: string
  testingType: Cypress.TestingType
  specAbsolutePaths: string[]
  specPattern: string | string[]
}
export function matchedSpecs ({
  projectRoot,
  testingType,
  specAbsolutePaths,
}: MatchedSpecs): SpecWithRelativeRoot[] {
  debug('found specs %o', specAbsolutePaths)

  let commonRoot: string = ''

  if (specAbsolutePaths.length === 1) {
    commonRoot = path.dirname(specAbsolutePaths[0]!)
  } else {
    commonRoot = commonPathPrefix(specAbsolutePaths)
  }

  const specs = specAbsolutePaths.map((absolute) => {
    return transformSpec({ projectRoot, absolute, testingType, commonRoot, platform: os.platform(), sep: path.sep })
  })

  return specs
}

export interface TransformSpec {
  projectRoot: string
  absolute: string
  testingType: Cypress.TestingType
  commonRoot: string
  platform: NodeJS.Platform
  sep: string
}

export function transformSpec ({
  projectRoot,
  absolute,
  testingType,
  commonRoot,
  platform,
  sep,
}: TransformSpec): SpecWithRelativeRoot {
  if (platform === 'win32') {
    absolute = toPosix(absolute, sep)
    projectRoot = toPosix(projectRoot, sep)
  }

  const relative = path.relative(projectRoot, absolute)
  const parsedFile = path.parse(absolute)
  const fileExtension = path.extname(absolute)

  const specFileExtension = ['.spec', '.test', '-spec', '-test', '.cy']
  .map((ext) => ext + fileExtension)
  .find((ext) => absolute.endsWith(ext)) || fileExtension

  const parts = absolute.split(projectRoot)
  let name = parts[parts.length - 1] || ''

  if (name.startsWith('/')) {
    name = name.slice(1)
  }

  const LEADING_SLASH = /^\/|/g
  const relativeToCommonRoot = absolute.replace(commonRoot, '').replace(LEADING_SLASH, '')

  return {
    fileExtension,
    baseName: parsedFile.base,
    fileName: parsedFile.base.replace(specFileExtension, ''),
    specFileExtension,
    relativeToCommonRoot,
    specType: testingType === 'component' ? 'component' : 'integration',
    name,
    relative,
    absolute,
  }
}

export function getDefaultSpecFileName (specPattern: string, fileExtensionToUse?: 'js' | 'ts') {
  function replaceWildCard (s: string, fallback: string) {
    return s.replace(/\*/g, fallback)
  }

  const parsedGlob = parseGlob(specPattern)

  if (!parsedGlob.is.glob) {
    return specPattern
  }

  let dirname = parsedGlob.path.dirname

  if (dirname.startsWith('**')) {
    dirname = dirname.replace('**', 'cypress')
  }

  const splittedDirname = dirname.split('/').filter((s) => s !== '**').map((x) => replaceWildCard(x, 'e2e')).join('/')
  const fileName = replaceWildCard(parsedGlob.path.filename, 'filename')

  const extnameWithoutExt = parsedGlob.path.extname.replace(parsedGlob.path.ext, '')
  let extname = replaceWildCard(extnameWithoutExt, 'cy')

  if (extname.startsWith('.')) {
    extname = extname.substr(1)
  }

  if (extname.endsWith('.')) {
    extname = extname.slice(0, -1)
  }

  const basename = [fileName, extname, parsedGlob.path.ext].filter(Boolean).join('.')

  const glob = splittedDirname + basename

  const globWithoutBraces = mm.braces(glob, { expand: true })

  let finalGlob = globWithoutBraces[0]

  if (fileExtensionToUse) {
    const filteredGlob = mm(globWithoutBraces, `*.${fileExtensionToUse}`, { basename: true })

    if (filteredGlob?.length) {
      finalGlob = filteredGlob[0]
    }
  }

  if (!finalGlob) {
    return
  }

  const randExp = new RandExp(finalGlob.replace(/\./g, '\\.'))

  return randExp.gen()
}

export class ProjectDataSource {
  private _specWatcher: FSWatcher | null = null
  private _specs: FoundSpec[] = []

  constructor (private ctx: DataContext) {}

  private get api () {
    return this.ctx._apis.projectApi
  }

  projectId () {
    return this.ctx.lifecycleManager.getProjectId()
  }

  projectTitle (projectRoot: string) {
    return path.basename(projectRoot)
  }

  async getConfig () {
    return await this.ctx.lifecycleManager.getFullInitialConfig()
  }

  getCurrentProjectSavedState () {
    return this.api.getCurrentProjectSavedState()
  }

  get specs () {
    return this._specs
  }

  setSpecs (specs: FoundSpec[]) {
    this._specs = specs
  }

  setRelaunchBrowser (relaunchBrowser: boolean) {
    this.ctx.coreData.app.relaunchBrowser = relaunchBrowser
  }

  async specPatternsForTestingType (projectRoot: string, testingType: Cypress.TestingType): Promise<{
    specPattern?: string[]
    excludeSpecPattern?: string[]
  }> {
    const toArray = (val?: string | string[]) => val ? typeof val === 'string' ? [val] : val : undefined

    const config = await this.getConfig()

    return {
      specPattern: toArray(config[testingType]?.specPattern),
      excludeSpecPattern: toArray(config[testingType]?.excludeSpecPattern),
    }
  }

  async findSpecs (
    projectRoot: string,
    testingType: Cypress.TestingType,
    specPattern: string[],
    excludeSpecPattern: string[],
    globToRemove: string[],
  ): Promise<FoundSpec[]> {
    const specAbsolutePaths = await this.ctx.file.getFilesByGlob(
      projectRoot,
      specPattern, {
        absolute: true,
        ignore: [...excludeSpecPattern, ...globToRemove],
      },
    )

    const matched = matchedSpecs({
      projectRoot,
      testingType,
      specAbsolutePaths,
      specPattern,
    })

    return matched
  }

  startSpecWatcher (
    projectRoot: string,
    testingType: Cypress.TestingType,
    specPattern: string[],
    excludeSpecPattern: string[],
    additionalIgnore: string[],
  ) {
    this.stopSpecWatcher()

    const currentProject = this.ctx.currentProject

    if (!currentProject) {
      throw new Error('Cannot start spec watcher without current project')
    }

    const onSpecsChanged = debounce(async () => {
      const specs = await this.findSpecs(projectRoot, testingType, specPattern, excludeSpecPattern, additionalIgnore)

      this.ctx.actions.project.setSpecs(specs)
    })

    this._specWatcher = this.ctx.lifecycleManager.addWatcher(specPattern)
    this._specWatcher.on('add', onSpecsChanged)
    this._specWatcher.on('unlink', onSpecsChanged)
  }

  async defaultSpecFileName () {
    const defaultFileName = 'cypress/e2e/filename.cy.js'

    try {
      if (!this.ctx.currentProject || !this.ctx.coreData.currentTestingType) {
        return null
      }

      let specPatternSet: string | undefined
      const { specPattern = [] } = await this.ctx.project.specPatternsForTestingType(this.ctx.currentProject, this.ctx.coreData.currentTestingType)

      if (Array.isArray(specPattern)) {
        specPatternSet = specPattern[0]
      }

      if (!specPatternSet) {
        return defaultFileName
      }

      const specFileName = getDefaultSpecFileName(specPatternSet, this.ctx.lifecycleManager.fileExtensionToUse)

      if (!specFileName) {
        return defaultFileName
      }

      return specFileName
    } catch {
      return defaultFileName
    }
  }

  async matchesSpecPattern (specFile: string): Promise<boolean> {
    if (!this.ctx.currentProject || !this.ctx.coreData.currentTestingType) {
      return false
    }

    const MINIMATCH_OPTIONS = { dot: true, matchBase: true }

    const { specPattern = [], excludeSpecPattern = [] } = await this.ctx.project.specPatternsForTestingType(this.ctx.currentProject, this.ctx.coreData.currentTestingType)

    for (const pattern of excludeSpecPattern) {
      if (minimatch(specFile, pattern, MINIMATCH_OPTIONS)) {
        return false
      }
    }

    for (const pattern of specPattern) {
      if (minimatch(specFile, pattern, MINIMATCH_OPTIONS)) {
        return true
      }
    }

    return false
  }

  stopSpecWatcher () {
    if (!this._specWatcher) {
      return
    }

    this.ctx.lifecycleManager.closeWatcher(this._specWatcher)
  }

  getCurrentSpecByAbsolute (absolute: string) {
    return this.ctx.project.specs.find((x) => x.absolute === absolute)
  }

  async getProjectPreferences (projectTitle: string) {
    const preferences = await this.api.getProjectPreferencesFromCache()

    return preferences[projectTitle] ?? null
  }

  frameworkLoader = this.ctx.loader<string, FrontendFramework | null>((projectRoots) => {
    return Promise.all(projectRoots.map((projectRoot) => Promise.resolve(this.guessFramework(projectRoot))))
  })

  private guessFramework (projectRoot: string) {
    const guess = FRONTEND_FRAMEWORKS.find((framework) => {
      const lookingForDeps = framework.detectors.map((x) => x.dependency).reduce(
        (acc, dep) => ({ ...acc, [dep]: '*' }),
        {},
      )

      return scanFSForAvailableDependency(projectRoot, lookingForDeps)
    })

    return guess ?? null
  }

  async getCodeGenGlobs () {
    assert(this.ctx.currentProject, `Cannot find glob without currentProject.`)

    const looseComponentGlob = '*.{js,jsx,ts,tsx,.vue}'

    const framework = await this.frameworkLoader.load(this.ctx.currentProject)

    return {
      component: framework?.glob ?? looseComponentGlob,
      story: STORIES_GLOB,
    }
  }

  async getResolvedConfigFields (): Promise<ResolvedFromConfig[]> {
    const config = this.ctx.lifecycleManager.loadedFullConfig?.resolved ?? {}

    interface ResolvedFromWithField extends ResolvedFromConfig {
      field: typeof RESOLVED_FROM[number]
    }

    const mapEnvResolvedConfigToObj = (config: ResolvedFromConfig): ResolvedFromWithField => {
      return Object.entries(config).reduce<ResolvedFromWithField>((acc, [field, value]) => {
        return {
          ...acc,
          value: { ...acc.value, [field]: value.value },
        }
      }, {
        value: {},
        field: 'env',
        from: 'env',
      })
    }

    return Object.entries(config ?? {}).map(([key, value]) => {
      if (key === 'env' && value) {
        return mapEnvResolvedConfigToObj(value)
      }

      return { ...value, field: key }
    }) as ResolvedFromConfig[]
  }

  async getCodeGenCandidates (glob: string): Promise<FilePartsShape[]> {
    if (!glob.startsWith('**/')) {
      glob = `**/${glob}`
    }

    const projectRoot = this.ctx.currentProject

    if (!projectRoot) {
      throw Error(`Cannot find components without currentProject.`)
    }

    const codeGenCandidates = await this.ctx.file.getFilesByGlob(projectRoot, glob, { expandDirectories: true })

    return codeGenCandidates.map((absolute) => ({ absolute }))
  }

  async getIsDefaultSpecPattern () {
    assert(this.ctx.currentProject)
    assert(this.ctx.coreData.currentTestingType)

    const { e2e, component } = getDefaultSpecPatterns()

    const { specPattern } = await this.ctx.project.specPatternsForTestingType(this.ctx.currentProject, this.ctx.coreData.currentTestingType)

    if (this.ctx.coreData.currentTestingType === 'e2e') {
      return isEqual(specPattern, [e2e])
    }

    return isEqual(specPattern, [component])
  }
}
