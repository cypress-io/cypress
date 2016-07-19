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

  update (props = {}) {
    if (!props) return

    if (props.name) this.name = props.name
    if (props.message) this.message = props.message
    if (props.stack) this.stack = props.stack
  }
}
