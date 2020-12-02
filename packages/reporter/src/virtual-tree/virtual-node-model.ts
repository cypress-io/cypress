import { observable } from 'mobx'
import { Node } from 'react-virtualized-tree'

import { VirtualizableType } from './virtualizable-types'

export class VirtualNodeModel implements Node {
  @observable id: string
  @observable name: string
  @observable state = { expanded: true }
  @observable children: Node[] = []

  constructor (id: string, type: VirtualizableType) {
    this.id = id
    this.name = `${type}-${id}`
  }
}
