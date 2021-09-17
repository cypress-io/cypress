import Debug from 'debug'
import { nxs, NxsResult } from 'nexus-decorators'
import { SpecTypeEnum } from '../constants/specConstants'
import type { NexusGenArgTypes } from '../gen'
import { Project } from './Project'
import { ResolvedConfig } from './ResolvedConfig'
import { Spec } from './Spec'

const debug = Debug('cypress:graphql:local-project')

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class LocalProject extends Project {
  _ctPluginsInitialized: boolean = false
  _e2ePluginsInitialized: boolean = false

  @nxs.field.nonNull.boolean({
    description: 'Whether the user configured this project to use Component Testing',
  })
  get isFirstTimeCT (): NxsResult<'LocalProject', 'isFirstTimeCT'> {
    return this.ctx.actions.isFirstTime(this.projectRoot, 'component')
  }

  @nxs.field.nonNull.list.nonNull.type(() => Spec, {
    args: {
      filterBy: SpecTypeEnum,
    },
  })
  async specs ({ filterBy }: NexusGenArgTypes['LocalProject']['specs']): Promise<NxsResult<'LocalProject', 'specs'>> {
    const config = this.resolvedConfig()
    const specs = await this.ctx.actions.getSpecs({
      projectRoot: this.projectRoot,
      fixturesFolder: config?.fixturesFolder?.value ?? false,
      supportFile: config?.supportFile?.value ?? false,
      testFiles: config?.testFiles?.value ?? [],
      ignoreTestFiles: config?.ignoreTestFiles?.value as string[] ?? [],
      componentFolder: config?.componentFolder?.value ?? false,
      integrationFolder: config?.integrationFolder?.value ?? '',
    })

    debug('found specs %o, filtering by %s', specs, filterBy)

    const gitinfo = await this.ctx.actions.getGitInfo(specs.map((x) => x.absolute))

    if (!filterBy) {
      return specs.map((spec) => new Spec(spec, gitinfo.get(spec.absolute)))
    }

    if (filterBy === 'component') {
      return specs.reduce<Spec[]>((acc, spec) => {
        if (spec.specType === 'component') {
          return acc.concat(new Spec(spec, gitinfo.get(spec.absolute)))
        }

        return acc
      }, [])
    }

    return specs.reduce<Spec[]>((acc, spec) => {
      if (spec.specType === 'integration') {
        return acc.concat(new Spec(spec, gitinfo.get(spec.absolute)))
      }

      return acc
    }, [])
  }

  @nxs.field.nonNull.boolean({
    description: 'Whether the user configured this project to use e2e Testing',
  })
  get isFirstTimeE2E (): NxsResult<'LocalProject', 'isFirstTimeE2E'> {
    return this.ctx.actions.isFirstTime(this.projectRoot, 'e2e')
  }

  @nxs.field.type(() => ResolvedConfig)
  resolvedConfig (): NxsResult<'LocalProject', 'resolvedConfig'> {
    const cfg = this.ctx.actions.resolveOpenProjectConfig()

    if (!cfg) {
      throw Error('openProject.getConfig is null. Have you initialized the current project?')
    }

    return new ResolvedConfig(cfg.resolved)
  }

  setE2EPluginsInitialized (init: boolean): void {
    this._e2ePluginsInitialized = init
  }

  get e2ePluginsInitialized (): boolean {
    return this._e2ePluginsInitialized
  }

  setCtPluginsInitialized (init: boolean): void {
    this._ctPluginsInitialized = init
  }

  get ctPluginsInitialized (): boolean {
    return this._ctPluginsInitialized
  }
}
