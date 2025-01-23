import { observable, makeObservable } from 'mobx'
import type { HookProps } from '../hooks/hook-model'

export interface RunnableProps {
  id: string
  title?: string
  hooks: Array<HookProps>
}

export default class Runnable {
  @observable id: string
  @observable title?: string
  @observable level: number
  @observable hooks: Array<HookProps> = []

  constructor (props: RunnableProps, level: number) {
    makeObservable(this)
    this.id = props.id
    this.title = props.title
    this.level = level
    this.hooks = props.hooks
  }
}
