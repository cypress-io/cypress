import type { CodeGenType, SpecType, TestingTypeState } from '@packages/graphql/src/gen/nxs.gen'
import { FrontendFramework, FRONTEND_FRAMEWORKS, ResolvedFromConfig, RESOLVED_FROM, SpecFileWithExtension, STORYBOOK_GLOB } from '@packages/types'
import { scanFSForAvailableDependency } from 'create-cypress-tests'
import path from 'path'

import type { DataContext } from '..'
import type { Maybe } from '../data/coreDataShape'
import assert from 'assert'
import _ from 'lodash'

export class CurrentProjectDataSource {
  constructor (private ctx: DataContext) {}

  private get currentProject () {
    assert(this.ctx.currentProject, `Expected currentProject to exist`)

    return this.ctx.currentProject
  }

  get data () {
    return this.currentProject
  }

  get projectRoot () {
    return this.currentProject.projectRoot
  }

  get currentTestingType () {
    return this.currentProject.currentTestingType ?? null
  }

  get currentBrowser () {
    return this.currentProject.currentBrowser ?? null
  }

  get isLoadingPlugins () {
    return this.configFileExists && !this.currentProject.pluginLoad.settled
  }

  get isLoadingConfig () {
    return this.configFileExists && !this.currentProject.config.settled
  }

  get configFilePath (): string | null {
    return this.ctx.currentProject?.configFile ?? null
  }

  get configFileExists () {
    return this.ctx.currentProject?.configFiles.length ?? 0 > 0
  }

  private get api () {
    return this.ctx._apis.projectApi
  }

  projectId () {
    const config = this.loadedConfig()

    return config?.projectId ?? null
  }

  get projectTitle () {
    return path.basename(this.projectRoot)
  }

  loadedConfig () {
    if (this.currentProject.pluginLoad.state === 'LOADED') {
      return this.currentProject.pluginLoad.value
    }

    if (this.currentProject.config.state === 'LOADED') {
      return this.currentProject.config.value
    }

    return null
  }

  async findSpecs (specType: Maybe<SpecType> = null) {
    const config = this.loadedConfig()

    if (!this.currentProject || !config) {
      return null
    }

    const specs = await this.api.findSpecs({
      projectRoot: this.currentProject.projectRoot,
      fixturesFolder: config.fixturesFolder ?? false,
      supportFile: config.supportFile ?? false,
      testFiles: (config.testFiles as string[]) ?? [],
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
    const config = this.loadedConfig()

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

    return Object.entries(config).map(([key, value]) => {
      if (key === 'env' && value) {
        return mapEnvResolvedConfigToObj(value)
      }

      return { ...value, field: key }
    }) as ResolvedFromConfig[]
  }

  get e2eSetupState (): TestingTypeState | null {
    if (!this.currentProject.configFiles.length) {
      return 'NEW'
    }

    if (!this.currentProject.config.value) {
      return null
    }

    if (this.currentProject.config.value.e2e?.testFiles) {
      return 'NEEDS_CHANGES'
    }

    if (_.has(this.currentProject.config.value, 'e2e')) {
      return 'READY'
    }

    return 'NEW'
  }

  get componentSetupState (): TestingTypeState | null {
    if (!this.currentProject.configFiles.length) {
      return 'NEW'
    }

    if (!this.currentProject.config.value) {
      return null
    }

    if (this.currentProject.config.value.component?.testFiles) {
      return 'NEEDS_CHANGES'
    }

    if (_.has(this.currentProject.config.value, 'component')) {
      return 'READY'
    }

    return 'NEW'
  }

  get needsCypressJsonMigration (): boolean {
    return Boolean(
      this.currentProject.configFiles.length === 1 &&
      this.currentProject.configFiles[0]?.endsWith('.json'),
    )
  }

  async getProjectPreferences () {
    const preferences = await this.api.getProjectPreferencesFromCache()

    return preferences[this.projectTitle] ?? null
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
    const looseComponentGlob = '/**/*.{js,jsx,ts,tsx,.vue}'

    if (type === 'story') {
      return STORYBOOK_GLOB
    }

    const framework = await this.frameworkLoader.load(this.currentProject.projectRoot)

    return framework?.glob ?? looseComponentGlob
  }

  async getCodeGenCandidates (glob: string): Promise<SpecFileWithExtension[]> {
    // Storybook can support multiple globs, so show default one while
    // still fetching all stories
    if (glob === STORYBOOK_GLOB) {
      return this.ctx.storybook.getStories()
    }

    const project = this.currentProject

    if (!project || !project.config) {
      throw Error(`Cannot find components without currentProject.`)
    }

    const config = this.ctx.loadedVal(project.config)
    const codeGenCandidates = await this.ctx.file.getFilesByGlob(this.projectRoot || process.cwd(), glob)

    return codeGenCandidates.map(
      (file) => {
        return this.ctx.file.normalizeFileToFileParts({
          absolute: file,
          projectRoot: project.projectRoot,
          searchFolder: project.projectRoot ?? config?.componentFolder,
        })
      },
    )
  }
}
