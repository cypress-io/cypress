import { computed, observable } from 'mobx'

export default class Err {
  @observable name = ''
  @observable message = ''
  @observable stack = ''

  constructor (props) {
    this.update(props)
  }

  @computed get displayMessage () {
    if (!this.name && !this.message) return ''

    return `${this.name}: ${this.message}`
  }

  @computed get isCommandErr () {
    return /(AssertionError|CypressError)/.test(this.name)
  }

  update (props) {
    if (!props) return

    this.name = props.name
    this.message = props.message
    this.stack = props.stack
  }
}
