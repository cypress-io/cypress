import { observable } from 'mobx'

export interface RunnableProps {
  id: number
  title?: string
}

export default class Runnable {
  @observable id: number
  @observable shouldRender: boolean = false
  @observable title?: string
  @observable level: number

  constructor (props: RunnableProps, level: number) {
    this.id = props.id
    this.title = props.title
    this.level = level
  }
}
