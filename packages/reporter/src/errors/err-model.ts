/* eslint-disable padding-line-between-statements */
import _ from 'lodash'
import { computed, observable } from 'mobx'

import { FileDetails } from '@packages/ui-components'
import { VirtualizableType } from '../tree/virtualizable'
import { VirtualNodeModel } from './../tree/virtual-node-model'

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

export class ErrModel {
  virtualType = VirtualizableType.Error

  @observable name = ''
  @observable message = ''
  @observable stack = ''
  @observable sourceMappedStack = ''
  @observable.ref parsedStack: ParsedStackLine[] = []
  @observable docsUrl = '' as string | string[]
  @observable templateType = ''
  @observable.ref codeFrame?: CodeFrame
  @observable level: number
  @observable virtualNode: VirtualNodeModel

  constructor (props: Partial<ErrProps> = {}, id: string = 'error', level = 0) {
    this.update(props)

    this.level = level
    this.virtualNode = new VirtualNodeModel(id, this.virtualType)
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
