import { observable } from 'mobx'

import { VirtualNodeModel } from './virtual-node-model'
import { VirtualizableType } from './virtualizable'

export class Collection<T> {
  @observable id: string
  @observable level: number
  @observable virtualType: VirtualizableType
  @observable virtualNode: VirtualNodeModel
  @observable items: T[] = []

  constructor (id: string, level: number, type: VirtualizableType) {
    this.id = id
    this.level = level
    this.virtualType = type
    this.virtualNode = new VirtualNodeModel(id, type)
  }
}
