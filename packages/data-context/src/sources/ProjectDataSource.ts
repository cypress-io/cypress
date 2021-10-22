import type { CodeGenType, SpecType } from '@packages/graphql/src/gen/nxs.gen'
import { FrontendFramework, FRONTEND_FRAMEWORKS, FullConfig, ResolvedFromConfig, RESOLVED_FROM, SettingsOptions, SpecFile, STORYBOOK_GLOB } from '@packages/types'
import { scanFSForAvailableDependency } from 'create-cypress-tests/src/findPackageJson'
import path from 'path'

import type { DataContext } from '..'
import type { Maybe } from '../data/coreDataShape'

export class ProjectDataSource {
  constructor (private ctx: DataContext) {}

  private get api () {
    return this.ctx._apis.projectApi
  }

  async projectId (projectRoot: string) {
    const config = await this.getConfig(projectRoot)

    return config?.projectId ?? null
  }

  projectTitle (projectRoot: string) {
    return path.basename(projectRoot)
  }

  async findSpecs (projectRoot: string, specType: Maybe<SpecType>) {
    const config = await this.ctx.project.getConfig(projectRoot)
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

  async getCurrentSpecById (projectRoot: string, base64Id: string) {
    // TODO: should cache current specs so we don't need to
    // call findSpecs each time we ask for the current spec.
    const specs = await this.findSpecs(projectRoot, null)

    // id is base64 formatted as per Relay: <type>:<string>
    // in this case, Spec:/my/abs/path
    const currentSpecAbs = Buffer.from(base64Id, 'base64').toString().split(':')[1]

    return specs.find((x) => x.absolute === currentSpecAbs) ?? null
  }

  private async getDefaultConfigFilePath (projectRoot: string) {
    const cypressConfigFiles = ['cypress.config.js', 'cypress.config.ts']
    const filesInProjectDir = await this.ctx.fs.readdir(projectRoot)

    const foundConfigFiles = cypressConfigFiles.filter((file) => filesInProjectDir.includes(file))

    // if we only found one default file, it is the one
    if (foundConfigFiles.length === 1) {
      return foundConfigFiles[0]
    }

    // if we found more than one, throw a language conflict
    if (foundConfigFiles.length > 1) {
      throw this.ctx._apis.projectApi.error('CONFIG_FILES_LANGUAGE_CONFLICT', projectRoot, ...foundConfigFiles)
    }

    return cypressConfigFiles[0]
  }

  async getConfig (projectRoot: string) {
    // Check first the config files, to be sure there are not to config files
    const configFile = await this.getDefaultConfigFilePath(projectRoot)

    // Check if we have already cached the config
    const config = await this.api.getProjectConfig(projectRoot)

    if (config) {
      return config
    }

    return this.configLoader({
      configFile,
    }).load(projectRoot)
  }

  async getResolvedConfigFields (projectRoot: string): Promise<ResolvedFromConfig[]> {
    const config = await this.getConfig(projectRoot)

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

  private configLoader (options?: SettingsOptions) {
    return this.ctx.loader<string, FullConfig>((projectRoots) => {
      return Promise.all(projectRoots.map((root) => this.ctx._apis.projectApi.getConfig(root, options))) // 12
    })
  }

  async isTestingTypeConfigured (projectRoot: string, testingType: 'e2e' | 'component') {
    const config = await this.api.getProjectConfig(projectRoot)

    if (!config) {
      return true
    }

    if (testingType === 'e2e') {
      return Boolean(Object.keys(config.e2e ?? {}).length)
    }

    if (testingType === 'component') {
      return Boolean(Object.keys(config.component ?? {}).length)
    }

    return false
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
    const project = this.ctx.activeProject

    if (!project) {
      throw Error(`Cannot find glob without activeProject.`)
    }

    const looseComponentGlob = '/**/*.{js,jsx,ts,tsx,.vue}'

    if (type === 'story') {
      return STORYBOOK_GLOB
    }

    const framework = await this.frameworkLoader.load(project.projectRoot)

    return framework?.glob ?? looseComponentGlob
  }

  async getCodeGenCandidates (glob: string): Promise<SpecFile[]> {
    // Storybook can support multiple globs, so show default one while
    // still fetching all stories
    if (glob === STORYBOOK_GLOB) {
      return this.ctx.storybook.getStories()
    }

    const project = this.ctx.activeProject

    if (!project) {
      throw Error(`Cannot find components without activeProject.`)
    }

    const config = await this.ctx.project.getConfig(project.projectRoot)

    const codeGenCandidates = await this.ctx.file.getFilesByGlob(glob)

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
}
