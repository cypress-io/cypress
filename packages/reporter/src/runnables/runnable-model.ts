import { observable, makeObservable } from 'mobx'
import { HookProps } from '../hooks/hook-model'

export interface RunnableProps {
  id: string
  title?: string
  hooks: Array<HookProps>
}

export default class Runnable {
  id: string;
  shouldRender: boolean = false;
  title?: string | undefined;
  level: number;
  hooks: Array<HookProps> = [];

  constructor (props: RunnableProps, level: number) {
    this.id = props.id
    this.title = props.title
    this.level = level
    this.hooks = props.hooks
    makeObservable(this, {
      id: observable,
      shouldRender: observable,
      title: observable,
      level: observable,
      hooks: observable,
    })
  }
}
