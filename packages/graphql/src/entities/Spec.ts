import { nxs, NxsResult } from 'nexus-decorators'
import { SpecTypeEnum } from '../constants/specConstants'
import type { SpecContract } from '../contracts/SpecContract'
import { gitInfoLoader } from '@packages/server/lib/graphql/loaders/git'
import { GitInfo } from './GitInfo'

@nxs.objectType({
  description: 'A spec file associated with a project and testing type via the testFiles glob',
})
export class Spec implements SpecContract {
  constructor (private _config: SpecContract) {}


  @nxs.field.nonNull.string()
  get id (): NxsResult<'Spec', 'id'> {
    return `spec:${this._config.absolute}`
  }

  @nxs.field.nonNull.type(() => SpecTypeEnum)
  get specType (): NxsResult<'Spec', 'specType'> {
    return this._config.specType
  }

  @nxs.field.nonNull.string()
  get absolute (): NxsResult<'Spec', 'absolute'> {
    return this._config.absolute
  }

  @nxs.field.nonNull.string()
  get relative (): NxsResult<'Spec', 'relative'> {
    return this._config.relative
  }

  @nxs.field.nonNull.string()
  get name (): NxsResult<'Spec', 'name'> {
    return this._config.name
  }

  @nxs.field.type(() => GitInfo)
  async gitInfo (): Promise<NxsResult<'Spec', 'gitInfo'>> {
    return gitInfoLoader.load(this._config.absolute)
  }
}
