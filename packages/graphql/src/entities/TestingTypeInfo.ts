import { nxs, NxsResult } from 'nexus-decorators'
import { TestingTypeEnum, TestingType as _TestingType, TestingTypeNames, TestingTypeDescriptions } from '../constants'

@nxs.objectType()
export class TestingTypeInfo {
  constructor (private _id: _TestingType) {}

  @nxs.field.nonNull.type(() => TestingTypeEnum)
  get id (): NxsResult<'TestingTypeInfo', 'id'> {
    return this._id
  }

  @nxs.field.string()
  get title (): NxsResult<'TestingTypeInfo', 'title'> {
    return TestingTypeNames[this.id]
  }

  @nxs.field.string()
  get description (): NxsResult<'TestingTypeInfo', 'description'> {
    return TestingTypeDescriptions[this.id]
  }
}
