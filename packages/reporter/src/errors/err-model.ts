/* eslint-disable padding-line-between-statements */
import _ from 'lodash'
import { computed, observable } from 'mobx'

export interface FileDetails {
  absoluteFile: string
  column: number
  line: number
  originalFile: string
  relativeFile: string
}

interface ParsedStackMessageLine {
  message: string
  whitespace: string
}

interface ParsedStackFileLine extends FileDetails {
  fileUrl: string
  function: string
  whitespace: string
}

type ParsedStackLine = ParsedStackMessageLine & ParsedStackFileLine

export interface CodeFrame extends FileDetails {
  frame: string
  language: string
}

export interface ErrProps {
  name: string
  message: string
  stack: string
  sourceMappedStack: string
  parsedStack: ParsedStackLine[]
  docsUrl: string | string[]
  templateType: string
  codeFrame: CodeFrame
}

export default class Err {
  @observable name = ''
  @observable message = ''
  @observable stack = ''
  @observable sourceMappedStack = ''
  @observable.ref parsedStack = [] as ParsedStackLine[]
  @observable docsUrl = '' as string | string[]
  @observable templateType = ''
  // @ts-ignore
  @observable.ref codeFrame: CodeFrame

  constructor (props?: Partial<ErrProps>) {
    this.update(props)
  }

  @computed get displayMessage () {
    return _.compact([this.name, this.message]).join(': ')
  }

  @computed get isCommandErr () {
    return /(AssertionError|CypressError)/.test(this.name)
  }

  update (props?: Partial<ErrProps>) {
    if (!props) return

    if (props.name) this.name = props.name
    if (props.message) this.message = props.message
    if (props.stack) this.stack = props.stack
    if (props.docsUrl) this.docsUrl = props.docsUrl
    if (props.sourceMappedStack) this.sourceMappedStack = props.sourceMappedStack
    if (props.parsedStack) this.parsedStack = props.parsedStack
    if (props.templateType) this.templateType = props.templateType
    if (props.codeFrame) this.codeFrame = props.codeFrame
  }
}
