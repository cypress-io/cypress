import { observable } from 'mobx'
import { HookProps } from '../hooks/hook-model'

export interface RunnableProps {
  id: string
  title?: string
  hooks: Array<HookProps>
}

export default class Runnable {
  @observable id: string
  @observable shouldRender: boolean = false
  @observable title?: string
  @observable level: number
  @observable hooks: Array<HookProps> = []

  constructor (props: RunnableProps, level: number) {
    this.id = props.id
    this.title = props.title
    this.level = level
    this.hooks = props.hooks
  }
}
