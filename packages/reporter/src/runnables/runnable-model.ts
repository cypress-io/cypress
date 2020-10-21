import { observable } from 'mobx'

import { HookProps } from '../hooks/hook-model'

export class RunnableModel {
  @observable id: string
  @observable shouldRender: boolean = false
  @observable title?: string
  @observable level: number
  @observable hooks: HookProps[] = []

  constructor (props: RunnableModel, level: number) {
    this.id = props.id
    this.title = props.title
    this.level = level
    this.hooks = props.hooks
  }
}
