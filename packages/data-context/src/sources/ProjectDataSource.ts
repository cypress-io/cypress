import os from 'os'
import { FrontendFramework, FRONTEND_FRAMEWORKS, ResolvedFromConfig, RESOLVED_FROM, SpecFileWithExtension, STORYBOOK_GLOB, FoundSpec } from '@packages/types'
import { scanFSForAvailableDependency } from 'create-cypress-tests'
import { debounce } from 'lodash'
import path from 'path'
import Debug from 'debug'
import commonPathPrefix from 'common-path-prefix'
import type { FSWatcher } from 'chokidar'

const debug = Debug('cypress:data-context')
import assert from 'assert'

import type { DataContext } from '..'
import { toPosix } from '../util/file'

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

export interface TranformSpec {
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
}: TranformSpec): SpecWithRelativeRoot {
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

  getConfig () {
    return this.ctx.lifecycleManager.loadedFullConfig
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

  async specPatternsForTestingType (projectRoot: string, testingType: Cypress.TestingType): Promise<{
    specPattern?: string[]
    ignoreSpecPattern?: string[]
  }> {
    const toArray = (val?: string | string[]) => val ? typeof val === 'string' ? [val] : val : undefined

    const config = this.getConfig()

    if (!config) {
      throw Error(`Config for ${projectRoot} was not loaded`)
    }

    return {
      specPattern: toArray(config[testingType]?.specPattern),
      ignoreSpecPattern: toArray(config[testingType]?.ignoreSpecPattern),
    }
  }

  async findSpecs (
    projectRoot: string,
    testingType: Cypress.TestingType,
    specPattern: string[],
    ignoreSpecPattern: string[],
    globToRemove: string[],
  ): Promise<FoundSpec[]> {
    const specAbsolutePaths = await this.ctx.file.getFilesByGlob(
      projectRoot,
      specPattern, {
        absolute: true,
        ignore: [...ignoreSpecPattern, ...globToRemove],
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
    ignoreSpecPattern: string[],
    additionalIgnore: string[],
  ) {
    this.stopSpecWatcher()

    const currentProject = this.ctx.currentProject

    if (!currentProject) {
      throw new Error('Cannot start spec watcher without current project')
    }

    const onSpecsChanged = debounce(async () => {
      const specs = await this.findSpecs(projectRoot, testingType, specPattern, ignoreSpecPattern, additionalIgnore)

      this.setSpecs(specs)
      if (testingType === 'component') {
        this.api.getDevServer().updateSpecs(specs)
      }

      this.ctx.emitter.toApp()
    })

    this._specWatcher = this.ctx.lifecycleManager.addWatcher(specPattern)
    this._specWatcher.on('add', onSpecsChanged)
    this._specWatcher.on('unlink', onSpecsChanged)
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
      const lookingForDeps = (framework.deps as readonly string[]).reduce(
        (acc, dep) => ({ ...acc, [dep]: '*' }),
        {},
      )

      return scanFSForAvailableDependency(projectRoot, lookingForDeps)
    })

    return guess ?? null
  }

  async getCodeGenGlobs () {
    assert(this.ctx.currentProject, `Cannot find glob without currentProject.`)

    const looseComponentGlob = '/**/*.{js,jsx,ts,tsx,.vue}'

    const framework = await this.frameworkLoader.load(this.ctx.currentProject)

    return {
      component: framework?.glob ?? looseComponentGlob,
      story: STORYBOOK_GLOB,
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

  async getCodeGenCandidates (glob: string): Promise<SpecFileWithExtension[]> {
    // Storybook can support multiple globs, so show default one while
    // still fetching all stories
    if (glob === STORYBOOK_GLOB) {
      return this.ctx.storybook.getStories()
    }

    const projectRoot = this.ctx.currentProject

    if (!projectRoot) {
      throw Error(`Cannot find components without currentProject.`)
    }

    const config = await this.ctx.lifecycleManager.getFullInitialConfig()

    const codeGenCandidates = await this.ctx.file.getFilesByGlob(config.projectRoot || process.cwd(), glob)

    return codeGenCandidates.map(
      (file) => {
        return this.ctx.file.normalizeFileToFileParts({
          absolute: file,
          projectRoot,
          searchFolder: projectRoot ?? config.componentFolder,
        })
      },
    )
  }
}
