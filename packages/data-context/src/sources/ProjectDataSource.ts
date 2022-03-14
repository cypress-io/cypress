import os from 'os'
import type { ResolvedFromConfig, RESOLVED_FROM, FoundSpec } from '@packages/types'
import { FrontendFramework, FRONTEND_FRAMEWORKS } from '@packages/scaffold-config'
import { scanFSForAvailableDependency } from 'create-cypress-tests'
import { debounce } from 'lodash'
import path from 'path'
import Debug from 'debug'
import commonPathPrefix from 'common-path-prefix'
import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'

const debug = Debug('cypress:data-context')
import assert from 'assert'

import type { DataContext } from '..'
import { toPosix } from '../util/file'
import { STORIES_GLOB } from '.'

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

export class ProjectDataSource {
  private _specWatcher: FSWatcher | null = null
  private _specs: FoundSpec[] = []

  constructor (private ctx: DataContext) {}

  private get api () {
    return this.ctx._apis.projectApi
  }

  projectId () {
    return this.ctx.lifecycleManager?.getProjectId()
  }

  projectTitle (projectRoot: string) {
    return path.basename(projectRoot)
  }

  async getConfig () {
    return await this.ctx.lifecycleManager?.getFullInitialConfig()
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

      this.setSpecs(specs)

      if (testingType === 'component') {
        this.api.getDevServer().updateSpecs(specs)
      }

      this.ctx.emitter.toApp()
    })

    this._specWatcher = chokidar.watch(specPattern, {
      cwd: projectRoot,
      ignoreInitial: true,
    })

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
}
