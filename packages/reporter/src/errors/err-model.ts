/* eslint-disable padding-line-between-statements */
import _ from 'lodash'
import { computed, observable, makeObservable } from 'mobx'

import { FileDetails } from '@packages/ui-components'

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
  stack: string
  sourceMappedStack: string
  parsedStack: ParsedStackLine[]
  docsUrl: string | string[]
  templateType: string
  codeFrame: CodeFrame
}

export default class Err {
  name = '';
  message = '';
  stack = '';
  sourceMappedStack = '';
  parsedStack: ParsedStackLine[] = [];
  docsUrl = '' as string | string[];
  templateType = '';
  // @ts-ignore
  codeFrame: CodeFrame;

  constructor (props?: Partial<ErrProps>) {
    makeObservable(this, {
      name: observable,
      message: observable,
      stack: observable,
      sourceMappedStack: observable,
      parsedStack: observable.ref,
      docsUrl: observable,
      templateType: observable,
      codeFrame: observable.ref,
      displayMessage: computed,
      isCommandErr: computed,
    })

    this.update(props)
  }

  get displayMessage () {
    return _.compact([this.name, this.message]).join(': ')
  }

  get isCommandErr () {
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
