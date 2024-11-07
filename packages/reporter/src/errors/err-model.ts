/* eslint-disable padding-line-between-statements */
import _ from 'lodash'
import { computed, observable, makeObservable } from 'mobx'

import type { FileDetails } from '@packages/types'

export interface ParsedStackMessageLine {
  message: string
  whitespace: string
}

export interface ParsedStackFileLine extends FileDetails {
  fileUrl: string
  function: string
  whitespace: string
}

export type ParsedStackLine = ParsedStackMessageLine | ParsedStackFileLine

export interface CodeFrame extends FileDetails {
  frame: string
  language?: string | null
}

export interface ErrProps {
  name: string
  message: string
  isRecovered: boolean
  stack: string
  parsedStack: ParsedStackLine[]
  docsUrl: string | string[]
  templateType: string
  codeFrame: CodeFrame
}

export default class Err {
  @observable name = ''
  @observable message = ''
  @observable stack = ''
  @observable.ref parsedStack: ParsedStackLine[] | null = null
  @observable docsUrl = '' as string | string[]
  @observable templateType = ''
  // @ts-ignore
  @observable.ref codeFrame: CodeFrame
  @observable isRecovered: boolean = false

  constructor (props?: Partial<ErrProps>) {
    makeObservable(this)
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
    if (props.parsedStack) this.parsedStack = props.parsedStack
    if (props.templateType) this.templateType = props.templateType
    if (props.codeFrame) this.codeFrame = props.codeFrame
    this.isRecovered = !!props.isRecovered
  }
}
