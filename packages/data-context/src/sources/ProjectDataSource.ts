import os from 'os'
import chokidar from 'chokidar'
import type { ResolvedFromConfig, RESOLVED_FROM, TestingType, SpecWithRelativeRoot } from '@packages/types'
import minimatch from 'minimatch'
import _ from 'lodash'
import path from 'path'
import Debug from 'debug'
import commonPathPrefix from 'common-path-prefix'
import type { FSWatcher } from 'chokidar'
import { defaultSpecPattern, defaultExcludeSpecPattern } from '@packages/config'
import parseGlob from 'parse-glob'
import micromatch from 'micromatch'
import RandExp from 'randexp'
import fs from 'fs'

const debug = Debug('cypress:data-context:sources:ProjectDataSource')
import assert from 'assert'

import type { DataContext } from '..'
import { toPosix } from '../util/file'
import type { FilePartsShape } from '@packages/graphql/src/schemaTypes/objectTypes/gql-FileParts'
import type { ProjectShape } from '../data'
import type { FindSpecs } from '../actions'
import { FileExtension, getDefaultSpecFileName } from './migration/utils'

type SpecPatterns = {
  specPattern?: string[]
  excludeSpecPattern?: string[]
}

interface MatchedSpecs {
  projectRoot: string
  testingType: Cypress.TestingType
  specAbsolutePaths: string[]
  specPattern: string | string[]
}

const toArray = (val?: string | string[]) => val ? typeof val === 'string' ? [val] : val : undefined

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

export function getLongestCommonPrefixFromPaths (paths: string[]): string {
  if (!paths[0]) return ''

  function getPathParts (pathname: string) {
    return pathname.split(/[\/\\]/g)
  }

  const lcp = getPathParts(paths[0])

  if (paths.length === 1) return lcp.slice(0, -1).join(path.sep)

  let endIndex = paths[0].length

  for (const filename of paths.slice(1)) {
    const pathParts = getPathParts(filename)

    for (let i = endIndex - 1; i >= 0; i--) {
      if (lcp[i] !== pathParts[i]) {
        endIndex = i
        delete lcp[i]
      }
    }

    if (lcp.length === 0) return ''
  }

  return lcp.slice(0, endIndex).join(path.sep)
}

export function getPathFromSpecPattern ({
  specPattern,
  testingType,
  fileExtensionToUse,
  name = '' }:
{ specPattern: string
  testingType: TestingType
  fileExtensionToUse?: FileExtension
  name?: string}) {
  function replaceWildCard (s: string, fallback: string) {
    return s.replace(/\*/g, fallback)
  }

  const parsedGlob = parseGlob(specPattern)

  if (!parsedGlob.is.glob) {
    return specPattern
  }

  // Remove double-slashes from dirname (like if specPattern has /**/*/)
  let dirname = parsedGlob.path.dirname.replaceAll(/\/\/+/g, '/')

  // If a spec can be in any root dir, go ahead and use "cypress/"
  if (dirname.startsWith('**')) dirname = dirname.replace('**', 'cypress')

  const splittedDirname = dirname.split('/').filter((s) => s !== '**').map((x) => replaceWildCard(x, testingType)).join('/')
  const fileName = replaceWildCard(parsedGlob.path.filename, name ? name : testingType === 'e2e' ? 'spec' : 'ComponentName')

  const extnameWithoutExt = parsedGlob.path.extname.replace(parsedGlob.path.ext, '')
    || `.cy.${fileExtensionToUse}`

  let extname = replaceWildCard(extnameWithoutExt, 'cy')

  if (extname.startsWith('.')) extname = extname.slice(1)

  if (extname.endsWith('.')) extname = extname.slice(0, -1)

  const basename = [fileName, extname, parsedGlob.path.ext].filter(Boolean).join('.')

  const glob = splittedDirname + basename

  const globWithoutBraces = micromatch.braces(glob, { expand: true })

  let finalGlob

  if (fileExtensionToUse) {
    finalGlob = globWithoutBraces.find((glob) => glob.includes(fileExtensionToUse)) || globWithoutBraces[0]
  } else {
    finalGlob = globWithoutBraces[0]
  }

  if (fileExtensionToUse) {
    const filteredGlob = micromatch(globWithoutBraces, `*.${fileExtensionToUse}`, { basename: true })

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
  private _specs: SpecWithRelativeRoot[] = []
  private _hasNonExampleSpec: boolean = false

  #runAllSpecs: string[] = []

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

  setSpecs (specs: SpecWithRelativeRoot[]) {
    this._specs = specs
  }

  get runAllSpecs () {
    return this.#runAllSpecs
  }

  setRunAllSpecs (specs: string[]) {
    this.#runAllSpecs = specs
  }

  get hasNonExampleSpec () {
    return this._hasNonExampleSpec
  }

  setHasNonExampleSpec (hasNonExampleSpec: boolean) {
    this._hasNonExampleSpec = hasNonExampleSpec
  }

  setRelaunchBrowser (relaunchBrowser: boolean) {
    this.ctx.coreData.app.relaunchBrowser = relaunchBrowser
  }

  /**
   * Retrieve the applicable spec patterns for the current testing type
   */
  async specPatterns (): Promise<SpecPatterns> {
    const config = await this.getConfig()

    return {
      specPattern: toArray(config.specPattern),
      excludeSpecPattern: toArray(config.excludeSpecPattern),
    }
  }

  /**
   * Retrieve the applicable spec patterns for a given testing type. Can be used to check whether
   * a spec satisfies the pattern when outside a given testing type.
   */
  async specPatternsByTestingType (testingType: TestingType): Promise<SpecPatterns> {
    const configFile = await this.ctx.lifecycleManager.getConfigFileContents()

    if (testingType === 'e2e') {
      return {
        specPattern: toArray(configFile.e2e?.specPattern ?? defaultSpecPattern.e2e),
        excludeSpecPattern: toArray(configFile.e2e?.excludeSpecPattern ?? defaultExcludeSpecPattern.e2e),
      }
    }

    return {
      specPattern: toArray(configFile.component?.specPattern ?? defaultSpecPattern.component),
      excludeSpecPattern: toArray(configFile.component?.excludeSpecPattern ?? defaultExcludeSpecPattern.component),
    }
  }

  async findSpecs ({
    projectRoot,
    testingType,
    specPattern,
    configSpecPattern,
    excludeSpecPattern,
    additionalIgnorePattern,
  }: FindSpecs<string[]>): Promise<SpecWithRelativeRoot[]> {
    let specAbsolutePaths = await this.ctx.file.getFilesByGlob(
      projectRoot,
      specPattern, {
        absolute: true,
        ignore: [...excludeSpecPattern, ...additionalIgnorePattern],
      },
    )

    // If the specPattern and configSpecPattern are different,
    // it means the user passed something non-default via --spec (run mode only)
    // in this scenario, we want to grab everything that matches `--spec`
    // that falls within their default specPattern. The reason is so we avoid
    // attempting to run things that are not specs, eg source code, videos, etc.
    //
    // Example: developer wants to run tests associated with timers in packages/driver
    // So they run yarn cypress:run --spec **/timers*
    // we do **not** want to capture `timers.ts` (source code) or a video in
    // cypress/videos/timers.cy.ts.mp4, so we take the intersection between specPattern
    // and --spec.
    if (!_.isEqual(specPattern, configSpecPattern)) {
      const defaultSpecAbsolutePaths = await this.ctx.file.getFilesByGlob(
        projectRoot,
        configSpecPattern, {
          absolute: true,
          ignore: [...excludeSpecPattern, ...additionalIgnorePattern],
        },
      )

      specAbsolutePaths = _.intersection(specAbsolutePaths, defaultSpecAbsolutePaths)
    }

    const matched = matchedSpecs({
      projectRoot,
      testingType,
      specAbsolutePaths,
      specPattern,
    })

    return matched
  }

  async startSpecWatcher ({
    projectRoot,
    testingType,
    specPattern,
    configSpecPattern,
    excludeSpecPattern,
    additionalIgnorePattern,
  }: FindSpecs<string[]>) {
    await this.stopSpecWatcher()

    // Early return the spec watcher if we're in run mode, we do not want to
    // init a lot of files watchers that are unneeded
    if (this.ctx.isRunMode) {
      return
    }

    const currentProject = this.ctx.currentProject

    if (!currentProject) {
      throw new Error('Cannot start spec watcher without current project')
    }

    // When file system changes are detected, we retrieve any spec files matching
    // the determined specPattern. This function is debounced to limit execution
    // during sequential file operations.
    const onProjectFileSystemChange = _.debounce(async (_type, _filePath) => {
      const specs = await this.findSpecs({
        projectRoot,
        testingType,
        specPattern,
        configSpecPattern,
        excludeSpecPattern,
        additionalIgnorePattern,
      })

      try {
        const config = await this.ctx.project.getConfig()

        // If running the justInTimeCompile for CT,
        // ignore this watcher since we only handle one spec at a time and do not need to recompile any time the file system changes.
        if (config.justInTimeCompile && testingType === 'component') {
          this.ctx.actions.project.refreshSpecs(specs)

          // If no differences are found, we do not need to emit events
          return
        }
      } catch (e) {
        // for cy-in-cy tests the config is the second instance of cypress isn't considered initialized yet.
        // in this case since we only need it for JITCompile in open mode, swallow the error
      }

      if (_.isEqual(this.specs, specs)) {
        this.ctx.actions.project.refreshSpecs(specs)

        // If no differences are found, we do not need to emit events
        return
      }

      this.ctx.actions.project.setSpecs(specs)
    }, 250)

    // We respond to all changes to the project's filesystem when
    // files or directories are added and removed that are not explicitly
    // ignored by config
    this._specWatcher = this._makeSpecWatcher({
      projectRoot,
      specPattern,
      excludeSpecPattern,
      additionalIgnorePattern,
    })

    // the 'all' event includes: add, addDir, change, unlink, unlinkDir
    this._specWatcher.on('all', onProjectFileSystemChange)
  }

  _makeSpecWatcher ({ projectRoot, specPattern, excludeSpecPattern, additionalIgnorePattern }: { projectRoot: string, excludeSpecPattern: string[], additionalIgnorePattern: string[], specPattern: string[] }) {
    return chokidar.watch('.', {
      ignoreInitial: true,
      ignorePermissionErrors: true,
      cwd: projectRoot,
      ignored: ['**/node_modules/**', ...excludeSpecPattern, ...additionalIgnorePattern, (file: string, stats?: fs.Stats) => {
        // Add a extra safe to prevent watching node_modules, in case the glob
        // pattern is not taken into account by the ignored
        if (file.includes('node_modules')) {
          return true
        }

        // We need stats arg to make the determination of whether to watch it, because we need to watch directories
        // chokidar is extremely inconsistent in whether or not it has the stats arg internally
        if (!stats) {
          try {
            // TODO: find a way to avoid this sync call - might require patching chokidar
            // eslint-disable-next-line no-restricted-syntax
            stats = fs.statSync(file)
          } catch {
            // If the file/folder is removed do not ignore it, in case it is added
            // again
            return false
          }
        }

        // don't ignore directories
        if (stats.isDirectory()) {
          return false
        }

        // If none of the spec patterns match, we don't need to watch it
        return !specPattern.some((s) => minimatch(path.relative(projectRoot, file), s))
      }],
    })
  }

  async defaultSpecFileName (): Promise<string> {
    const { specPattern = [] } = await this.ctx.project.specPatterns()
    let fileExtensionToUse: FileExtension = this.ctx.lifecycleManager.fileExtensionToUse

    // If generating a component test then check whether there are JSX/TSX files present in the project.
    // If project uses JSX then user likely wants to use JSX for their tests as well.
    // JSX can be used (or not used) with a variety of frameworks depending on user preference/config, so
    // the only reliable way to determine is whether there are files with JSX extension present
    if (this.ctx.coreData.currentTestingType === 'component') {
      debug('Checking for jsx/tsx files to determine file extension for default spec filename')
      const projectJsxFiles = await this.ctx.file.getFilesByGlob(this.ctx.currentProject ?? '', '**/*.[jt]sx')

      if (projectJsxFiles.length > 0) {
        debug('At least one jsx/tsx file found in project, utilizing for default spec filename')
        const generatedSpecFileName = await getDefaultSpecFileName({
          currentProject: this.ctx.currentProject,
          testingType: this.ctx.coreData.currentTestingType,
          fileExtensionToUse: `${fileExtensionToUse}x`,
          specs: this.specs,
          specPattern,
        })

        // There is the possibility that a specPattern has been configured to exclude spec files using jsx/tsx extensions
        // In this case, fallback to default logic which will generate js/ts filename
        if (await this.matchesSpecPattern(generatedSpecFileName)) {
          return generatedSpecFileName
        }

        debug('jsx/tsx extension would violate configured specPattern, utilizing default spec filename')
      } else {
        debug('No jsx/tsx files found, utilizing default spec filename')
      }
    }

    return getDefaultSpecFileName({
      currentProject: this.ctx.currentProject,
      testingType: this.ctx.coreData.currentTestingType,
      fileExtensionToUse,
      specs: this.specs,
      specPattern,
    })
  }

  /**
   * Determines whether a given spec file satisfies the spec pattern *and* does not satisfy any
   * exclusionary pattern. By default it will check the spec pattern for the currently-active
   * testing type, but a target testing type can be supplied via optional parameter.
   */
  async matchesSpecPattern (specFile: string, testingType?: TestingType): Promise<boolean> {
    const targetTestingType = testingType || this.ctx.coreData.currentTestingType

    if (!this.ctx.currentProject || !targetTestingType) {
      return false
    }

    const MINIMATCH_OPTIONS = { dot: true, matchBase: true }

    const { specPattern = [], excludeSpecPattern = [] } = await this.ctx.project.specPatternsByTestingType(targetTestingType)

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

  async destroy () {
    await this.stopSpecWatcher()
  }

  async stopSpecWatcher () {
    if (!this._specWatcher) {
      return
    }

    await this._specWatcher.close().catch(() => {})
    this._specWatcher = null
  }

  getCurrentSpecByAbsolute (absolute: string) {
    return this.ctx.project.specs.find((x) => x.absolute === absolute)
  }

  async getProjectPreferences (projectTitle: string) {
    const preferences = await this.api.getProjectPreferencesFromCache()

    return preferences[projectTitle] ?? null
  }

  async getCodeGenGlobs () {
    assert(this.ctx.currentProject, `Cannot find glob without currentProject.`)

    const looseComponentGlob = '*.{js,jsx,ts,tsx,vue}'

    const framework = this.ctx.actions.codegen.getWizardFrameworkFromConfig()

    return {
      component: framework?.glob ?? looseComponentGlob,
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

    const codeGenCandidates = await this.ctx.file.getFilesByGlob(
      projectRoot,
      glob,
      { expandDirectories: true, ignore: ['**/*.config.{js,ts}', '**/*.{cy,spec}.{js,ts,jsx,tsx}'] },
    )

    return codeGenCandidates.map((absolute) => ({ absolute }))
  }

  async getIsDefaultSpecPattern () {
    assert(this.ctx.currentProject)
    assert(this.ctx.coreData.currentTestingType)

    const { e2e, component } = defaultSpecPattern

    const { specPattern } = await this.ctx.project.specPatterns()

    if (this.ctx.coreData.currentTestingType === 'e2e') {
      return _.isEqual(specPattern, [e2e])
    }

    return _.isEqual(specPattern, [component])
  }

  async maybeGetProjectId (source: ProjectShape) {
    // If this is the currently active project, we can look at the project id
    if (source.projectRoot === this.ctx.currentProject) {
      return await this.projectId()
    }

    // Get the saved state & resolve the lastProjectId
    const savedState = await source.savedState?.()

    if (savedState?.lastProjectId) {
      return savedState.lastProjectId
    }

    // Otherwise, we can try to derive the projectId by reading it from the config file
    // (implement this in the future, if we ever want to display runs for a project in global mode)
    return null
  }
}
