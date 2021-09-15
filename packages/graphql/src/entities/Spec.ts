import { nxs, NxsResult } from 'nexus-decorators'
import { SpecTypeEnum } from '../constants/specConstants'
import type { SpecContract } from '../contracts/SpecContract'

@nxs.objectType({
  description: 'A spec file associated with a project and testing type via the testFiles glob',
})
export class Spec implements SpecContract {
  constructor (private _config: SpecContract) {}

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
}
