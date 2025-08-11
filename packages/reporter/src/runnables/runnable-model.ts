import { observable, makeObservable } from 'mobx'
import type { HookProps } from '../hooks/hook-model'

export interface RunnableProps {
  id: string
  title?: string
  hooks: Array<HookProps>
  parentTitle?: string
}

export default class Runnable {
  id: string
  title?: string
  level: number
  hooks: Array<HookProps> = []
  parentTitle?: string

  constructor (props: RunnableProps, level: number) {
    makeObservable(this, {
      id: observable,
      title: observable,
      level: observable,
      hooks: observable,
      parentTitle: observable,
    })

    this.id = props.id
    this.title = props.title
    this.level = level
    this.hooks = props.hooks
    this.parentTitle = props.parentTitle
  }
}
