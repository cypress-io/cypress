import { observable } from 'mobx'

import { VirtualNodeModel } from './virtual-node-model'
import { VirtualizableType } from './virtualizable-types'

export interface CollectionProps {
  id: string
  level: number
  // TODO: change this to be a type with the prop 'state'
  parent: any
  type: VirtualizableType
}

export class Collection<T> {
  @observable id: string
  @observable level: number
  @observable virtualType: VirtualizableType
  @observable virtualNode: VirtualNodeModel
  @observable items: T[] = []
  @observable parent: any

  constructor (props: CollectionProps) {
    this.id = props.id
    this.level = props.level
    this.virtualType = props.type
    this.virtualNode = new VirtualNodeModel(props.id, props.type)
    this.parent = props.parent
  }
}
