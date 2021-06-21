import { nxs } from 'nexus-decorators'

@nxs.interfaceType({
  resolveType (obj) {
    return obj.constructor.name
  },
})
export abstract class Node {
  @nxs.field.id()
  get id () {
    return `${this.constructor.name}:${this._id}`
  }

  abstract get _id (): string
}

export { Node as RelayNode }
