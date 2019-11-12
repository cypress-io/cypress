import { computed, observable } from 'mobx'

export interface ErrProps {
  name?: string
  message?: string
  stack?: string
}

export default class Err {
  @observable name: string = ''
  @observable message: string = ''
  @observable stack: string = ''

  constructor (props?: ErrProps) {
    this.update(props)
  }

  @computed get displayMessage () {
    if (!this.name && !this.message) return ''

    return `${this.name}: ${this.message}`
  }

  @computed get isCommandErr () {
    return /(AssertionError|CypressError)/.test(this.name)
  }

  update (props?: ErrProps | null) {
    if (!props) return

    this.name = props.name || ''
    this.message = props.message || ''
    this.stack = props.stack || ''
  }
}
