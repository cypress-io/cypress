import { computed, observable } from 'mobx'

export default class Err {
  @observable name = ''
  @observable message = ''
  @observable stack = ''
  @observable sourceMappedStack = ''
  @observable.ref parsedStack = []
  @observable mdMessage = ''
  @observable docsUrl = ''
  @observable templateType = ''
  @observable.ref codeFrames = []

  constructor (props) {
    this.update(props)
  }

  @computed get displayMessage () {
    if (!this.name && !this.mdMessage) return ''

    return `${this.name}: ${this.mdMessage}`
  }

  @computed get isCommandErr () {
    return /(AssertionError|CypressError)/.test(this.name)
  }

  update (props) {
    if (!props) return

    this.name = props.name
    this.message = props.message
    this.mdMessage = props.mdMessage || props.message
    this.stack = props.stack
    this.sourceMappedStack = props.sourceMappedStack
    this.parsedStack = props.parsedStack
    this.docsUrl = props.docsUrl
    this.templateType = props.templateType
    this.codeFrames = props.codeFrames
  }
}
