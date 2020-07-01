import { observable } from 'mobx'
import { HookDetails } from '../hooks/hook-model'

export interface RunnableProps {
  id: number
  title?: string
  hooks: Array<HookDetails>
}

export default class Runnable {
  @observable id: number
  @observable shouldRender: boolean = false
  @observable title?: string
  @observable level: number
  @observable hooks: Array<HookDetails> = []

  constructor (props: RunnableProps, level: number) {
    this.id = props.id
    this.title = props.title
    this.level = level
    this.hooks = props.hooks
  }
}
