import { AppOptionsData } from '../entities'

export class DataContext {
  constructor (readonly options: AppOptionsData) {}

  projectBase () {
    return
  }

  get unwrapNodeId () {
    return DataContext.unwrapNodeId
  }

  /**
 * Takes a node id from the
 * @param id
 * @param possibleType
 */
  static unwrapNodeId (id: string, possibleType: string | string[]) {
    const [typeName, ...rest] = id.split(':')
    const _id = rest.join(':')

    const possibleTypeArr = Array.isArray(possibleType) ? possibleType : [possibleType]

    if (possibleTypeArr.includes(typeName)) {
      return _id
    }

    throw new Error(`Invalid node id, expected ${possibleType}, saw ${typeName}`)
  }
}
