import { computed, observable } from 'mobx'

export interface ErrProps {
  name?: string
  message?: string
  mdMessage?: string
  stack?: string
  docsUrl?: string
}

export default class Err {
  @observable name = ''
  @observable message = ''
  @observable stack = ''
  @observable mdMessage = ''
  @observable docsUrl = ''

  constructor (props?: ErrProps) {
    this.update(props)
  }

  @computed get displayMessage () {
    if (!this.name && !this.mdMessage) return ''

    return `${this.name}: ${this.mdMessage}`
  }

  @computed get isCommandErr () {
    return /(AssertionError|CypressError)/.test(this.name)
  }

  update (props?: ErrProps) {
    if (!props) return

    if (props.name) this.name = props.name

    if (props.message) this.message = props.message

    // @ts-ignore
    if (props.mdMessage || props.message) this.mdMessage = props.mdMessage || props.message

    if (props.stack) this.stack = props.stack

    if (props.docsUrl) this.docsUrl = props.docsUrl
  }
}
