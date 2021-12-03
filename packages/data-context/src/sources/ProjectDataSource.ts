import type { CodeGenType, SpecType } from '@packages/graphql/src/gen/nxs.gen'
import { FoundSpec, FrontendFramework, FRONTEND_FRAMEWORKS, ResolvedFromConfig, RESOLVED_FROM, SpecFileWithExtension, STORYBOOK_GLOB } from '@packages/types'
import { scanFSForAvailableDependency } from 'create-cypress-tests'
import path from 'path'
import Debug from 'debug'

const debug = Debug('cypress:data-context:project-data-source')

import type { DataContext } from '..'

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

  getConfig (projectRoot: string) {
    return this.ctx.config.getConfigForProject(projectRoot)
  }

  async findSpecs (projectRoot: string, specType: SpecType, specPatternFromCliArg?: string[]): Promise<FoundSpec[]> {
    let specAbsolutePaths: string[] = []

    if (specPatternFromCliArg) {
      debug('pattern passed via --spec: %s', specPatternFromCliArg)
      specAbsolutePaths = await this.ctx.file.getFilesByGlob(projectRoot, specPatternFromCliArg, { absolute: true })
    } else {
      const testingType = specType === 'component' ? 'component' : 'e2e'
      const config = await this.getConfig(projectRoot)
      const specPattern = config[testingType]?.specPattern

      debug('pattern passed from config : %s', specPattern)

      specAbsolutePaths = await this.ctx.file.getFilesByGlob(projectRoot, specPattern ?? [], { absolute: true })
    }

    debug('found specs %o', specAbsolutePaths)

    const specs = specAbsolutePaths.map<FoundSpec>((absolute) => {
      const relative = path.relative(projectRoot, absolute).replace(/\\/g, '/')
      const parsedFile = path.parse(absolute)
      const fileExtension = path.extname(absolute)

      const specFileExtension = ['.spec', '.test', '-spec', '-test', '.cy']
      .map((ext) => ext + fileExtension)
      .find((ext) => absolute.endsWith(ext)) || fileExtension

      return {
        fileExtension,
        baseName: parsedFile.base,
        fileName: parsedFile.base.replace(specFileExtension, ''),
        specFileExtension,
        specType,
        name: parsedFile.base,
        relative,
        absolute,
      }
    })

    return specs
  }

  async getCurrentSpecByAbsolute (projectRoot: string, absolute: string) {
    // TODO: should cache current specs so we don't need to
    // call findSpecs each time we ask for the current spec.
    const specs = await this.findSpecs(projectRoot,
      this.ctx.appData.currentTestingType === 'component' ? 'component' : 'integration')

    return specs.find((x) => x.absolute === absolute)
  }

  async getCurrentSpecById (projectRoot: string, base64Id: string) {
    // TODO: should cache current specs so we don't need to
    // call findSpecs each time we ask for the current spec.
    const specs = await this.findSpecs(
      projectRoot, this.ctx.appData.currentTestingType === 'component' ? 'component' : 'integration',
    )

    // id is base64 formatted as per Relay: <type>:<string>
    // in this case, Spec:/my/abs/path
    const currentSpecAbs = Buffer.from(base64Id, 'base64').toString().split(':')[1]

    return specs.find((x) => x.absolute === currentSpecAbs) ?? null
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

  async isTestingTypeConfigured (projectRoot: string, testingType: 'e2e' | 'component') {
    try {
      const config = await this.getConfig(projectRoot)

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

    if (!project) {
      throw Error(`Cannot find components without currentProject.`)
    }

    const config = await this.ctx.project.getConfig(project.projectRoot)

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
}
