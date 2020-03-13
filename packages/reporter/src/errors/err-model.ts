/* eslint-disable padding-line-between-statements */
import { computed, observable } from 'mobx'

export interface ErrProps {
  name?: string
  message?: string
  mdMessage?: string
  stack?: string
  sourceMappedStack?: string
  parsedStack?: object[]
  docsUrl?: string
  templateType?: string
  codeFrame?: object
}

export default class Err {
  @observable name = ''
  @observable message = ''
  @observable stack = ''
  @observable sourceMappedStack = ''
  @observable.ref parsedStack = []
  @observable mdMessage = ''
  @observable docsUrl = ''
  @observable templateType = ''
  // @ts-ignore
  @observable.ref codeFrame: object

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
    if (props.sourceMappedStack) this.sourceMappedStack = props.sourceMappedStack
    // @ts-ignore
    if (props.parsedStack) this.parsedStack = props.parsedStack
    if (props.templateType) this.templateType = props.templateType
    if (props.codeFrame) this.codeFrame = props.codeFrame
  }
}
