import { observable } from 'mobx'

export default class Runnable {
  @observable id
  @observable shouldRender = false
  @observable title
  @observable level

  constructor (props, level) {
    this.id = props.id
    this.title = props.title
    this.level = level
  }
}
