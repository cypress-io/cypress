import type { CodeGenType, SpecType } from '@packages/graphql/src/gen/nxs.gen'
import { FrontendFramework, FRONTEND_FRAMEWORKS, ResolvedFromConfig, RESOLVED_FROM, SpecFileWithExtension, STORYBOOK_GLOB } from '@packages/types'
import { scanFSForAvailableDependency } from 'create-cypress-tests'
import path from 'path'
import _ from 'lodash'

import type { DataContext } from '..'
import type { Maybe } from '../data/coreDataShape'

export class ProjectDataSource {
  constructor (private ctx: DataContext) {}

  private get api () {
    return this.ctx._apis.projectApi
  }

  async projectId (projectRoot: string) {
    const config = this.getLoadedConfig()

    return config?.projectId ?? null
  }

  projectTitle (projectRoot: string) {
    return path.basename(projectRoot)
  }

  getLoadedConfig () {
    return this.ctx.currentProject?.config
  }

  async findSpecs (specType: Maybe<SpecType> = null) {
    const config = this.ctx.currentProject?.config

    if (!this.ctx.currentProject || !config) {
      return null
    }

    const specs = await this.api.findSpecs({
      projectRoot: this.ctx.currentProject.projectRoot,
      fixturesFolder: config.fixturesFolder ?? false,
      supportFile: config.supportFile ?? false,
      testFiles: Array.from(config.testFiles ?? []),
      ignoreTestFiles: config.ignoreTestFiles as string[] ?? [],
      componentFolder: config.projectRoot ?? false,
      integrationFolder: config.integrationFolder ?? '',
    })

    if (!specType) {
      return specs
    }

    return specs.filter((spec) => spec.specType === specType)
  }

  async getCurrentSpecByAbsolute (absolute: string) {
    // TODO: should cache current specs so we don't need to
    // call findSpecs each time we ask for the current spec.
    const specs = await this.findSpecs()

    return specs?.find((x) => x.absolute === absolute)
  }

  async getCurrentSpecById (base64Id: string) {
    // TODO: should cache current specs so we don't need to
    // call findSpecs each time we ask for the current spec.
    const specs = await this.findSpecs()

    // id is base64 formatted as per Relay: <type>:<string>
    // in this case, Spec:/my/abs/path
    const currentSpecAbs = Buffer.from(base64Id, 'base64').toString().split(':')[1]

    return specs?.find((x) => x.absolute === currentSpecAbs) ?? null
  }

  getResolvedConfigFields (): ResolvedFromConfig[] | null {
    const config = this.ctx.currentProject?.config

    if (!config) {
      return null
    }

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

    return Object.entries(config.resolved).map(([key, value]) => {
      if (key === 'env' && value) {
        return mapEnvResolvedConfigToObj(value)
      }

      return { ...value, field: key }
    }) as ResolvedFromConfig[]
  }

  isCTConfigured () {
    return this.isTestingTypeConfigured('component')
  }

  isE2EConfigured () {
    return this.isTestingTypeConfigured('e2e')
  }

  private async isTestingTypeConfigured (testingType: 'e2e' | 'component') {
    if (!this.ctx.currentProject) {
      return false
    }

    const config = this.ctx.currentProject.config

    try {
      if (!config) {
        return true
      }

      if (testingType === 'e2e') {
        return _.has(config, 'e2e')
      }

      if (testingType === 'component') {
        return _.has(config, 'component')
      }

      return false
    } catch (error: any) {
      if (error.type === 'NO_DEFAULT_CONFIG_FILE_FOUND') {
        return false
      }

      throw error
    }
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

  async getCodeGenGlob (type: CodeGenType) {
    const project = this.ctx.currentProject

    if (!project) {
      throw Error(`Cannot find glob without currentProject.`)
    }

    const looseComponentGlob = '/**/*.{js,jsx,ts,tsx,.vue}'

    if (type === 'story') {
      return STORYBOOK_GLOB
    }

    const framework = await this.frameworkLoader.load(project.projectRoot)

    return framework?.glob ?? looseComponentGlob
  }

  async getCodeGenCandidates (glob: string): Promise<SpecFileWithExtension[]> {
    // Storybook can support multiple globs, so show default one while
    // still fetching all stories
    if (glob === STORYBOOK_GLOB) {
      return this.ctx.storybook.getStories()
    }

    const project = this.ctx.currentProject

    if (!project || !project.config) {
      throw Error(`Cannot find components without currentProject.`)
    }

    const config = project.config
    const codeGenCandidates = await this.ctx.file.getFilesByGlob(config.projectRoot || process.cwd(), glob)

    return codeGenCandidates.map(
      (file) => {
        return this.ctx.file.normalizeFileToFileParts({
          absolute: file,
          projectRoot: project.projectRoot,
          searchFolder: project.projectRoot ?? config.componentFolder,
        })
      },
    )
  }

  async needsOnboarding () {
    if (this.ctx.currentProject?.currentTestingType === 'e2e') {
      if (await this.ctx.project.isE2EConfigured()) {
        return false
      }
    }

    if (this.ctx.currentProject?.currentTestingType === 'component') {
      if (await this.ctx.project.isCTConfigured()) {
        return false
      }
    }

    return true
  }
}
