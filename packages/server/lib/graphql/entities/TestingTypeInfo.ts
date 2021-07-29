import { nxs, NxsResult } from 'nexus-decorators'
import { TestingTypeEnum, TestingType as _TestingType, TestingTypeNames, TestingTypeDescriptions } from '../constants'

@nxs.objectType()
export class TestingTypeInfo {
  constructor (private _id: _TestingType) {}

  @nxs.field.nonNull.type(() => TestingTypeEnum)
  get id (): NxsResult<'TestingType', 'id'> {
    return this._id
  }

  @nxs.field.string()
  get title (): NxsResult<'TestingType', 'title'> {
    return TestingTypeNames[this.id]
  }

  @nxs.field.string()
  get description (): NxsResult<'TestingType', 'description'> {
    return TestingTypeDescriptions[this.id]
  }
}
