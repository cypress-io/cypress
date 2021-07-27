import { nxs, NxsResult } from 'nexus-decorators'
import { TestingTypeEnum } from '../constants'

@nxs.objectType()
export class TestingType {
  @nxs.field.type(() => TestingTypeEnum)
  get id (): NxsResult<'TestingType', 'id'> {
    return 'component'
  }

  @nxs.field.string()
  get title (): NxsResult<'TestingType', 'title'> {
    return 'Some Title'
  }

  @nxs.field.string()
  get description (): NxsResult<'TestingType', 'description'> {
    return 'Some Description'
  }
}
