import type { SpecType } from '@packages/graphql/src/gen/nxs.gen'
import { FrontendFramework, FRONTEND_FRAMEWORKS, ResolvedFromConfig, RESOLVED_FROM, SpecFileWithExtension, STORYBOOK_GLOB } from '@packages/types'
import { scanFSForAvailableDependency } from 'create-cypress-tests'
import path from 'path'
import assert from 'assert'

import type { DataContext } from '..'
import type { Maybe } from '../data/coreDataShape'

export class ProjectDataSource {
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

  async findSpecs (projectRoot: string, specType: Maybe<SpecType>) {
    const config = this.getConfig()

    if (!config) {
      return []
    }

    const specs = await this.api.findSpecs({
      projectRoot,
      fixturesFolder: config.fixturesFolder ?? false,
      supportFile: config.supportFile ?? false,
      testFiles: config.testFiles ?? [],
      ignoreTestFiles: config.ignoreTestFiles as string[] ?? [],
      componentFolder: config.projectRoot ?? false,
      integrationFolder: config.integrationFolder ?? '',
    })

    if (!specType) {
      return specs
    }

    return specs.filter((spec) => spec.specType === specType)
  }

  async getCurrentSpecByAbsolute (projectRoot: string, absolute: string) {
    // TODO: should cache current specs so we don't need to
    // call findSpecs each time we ask for the current spec.
    const specs = await this.findSpecs(projectRoot, null)

    return specs.find((x) => x.absolute === absolute)
  }

  async getCurrentSpecById (projectRoot: string, base64Id: string) {
    // TODO: should cache current specs so we don't need to
    // call findSpecs each time we ask for the current spec.
    const specs = await this.findSpecs(projectRoot, null)

    // id is base64 formatted as per Relay: <type>:<string>
    // in this case, Spec:/my/abs/path
    const currentSpecAbs = Buffer.from(base64Id, 'base64').toString().split(':')[1]

    return specs.find((x) => x.absolute === currentSpecAbs) ?? null
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
