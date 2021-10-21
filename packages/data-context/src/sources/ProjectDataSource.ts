import type { SpecType } from '@packages/graphql/src/gen/nxs.gen'
import type { FullConfig, ResolvedFromConfig, RESOLVED_FROM, SettingsOptions } from '@packages/types'
import path from 'path'

import type { DataContext } from '..'
import type { Maybe } from '../data/coreDataShape'

export class ProjectDataSource {
  constructor (private ctx: DataContext) {}

  private get api () {
    return this.ctx._apis.projectApi
  }

  async projectId (projectRoot: string) {
    const config = await this.api.getProjectConfig(projectRoot)

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

  async getConfig (projectRoot: string) {
    return this.configLoader({
      // configFile: 'cypress.config.ts',
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
      return config.isE2EConfigured
    }

    if (testingType === 'component') {
      return config.isCTConfigured
    }

    return false
  }

  async getProjectPreferences (projectTitle: string) {
    const preferences = await this.api.getProjectPreferencesFromCache()

    return preferences[projectTitle] ?? null
  }
}
