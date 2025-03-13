import { observable, makeObservable } from 'mobx'
import type { Instrument, TestState } from '@packages/types'

export interface AliasObject {
  name: string
  cardinal?: number
  ordinal?: string
}

export type Alias = string | Array<string> | null | AliasObject | Array<AliasObject>

export interface InstrumentProps {
  id: number
  alias?: Alias
  aliasType?: 'agent' | 'dom' | 'primitive' | 'route'
  displayName?: string
  name?: string
  message?: string
  // parent / child / system - command log type
  type?: 'parent' | 'child' | 'system'
  testCurrentRetry?: number
  state: TestState
  referencesAlias?: Alias
  instrument?: Instrument
  testId: string
}

export default class Log {
  alias?: Alias
  aliasType?: string
  displayName?: string
  id?: number
  name?: string
  message?: string
  type?: string
  state: string
  referencesAlias?: Alias
  testId: string

  constructor (props: InstrumentProps) {
    makeObservable(this, {
      alias: observable.ref,
      aliasType: observable,
      displayName: observable,
      id: observable,
      name: observable,
      message: observable,
      type: observable,
      state: observable,
      referencesAlias: observable.ref,
    })

    this.id = props.id
    this.alias = props.alias
    this.aliasType = props.aliasType
    this.displayName = props.displayName
    this.name = props.name
    this.message = props.message
    this.type = props.type
    this.state = props.state
    this.referencesAlias = props.referencesAlias
    this.testId = props.testId
  }

  update (props: InstrumentProps) {
    this.alias = props.alias
    this.aliasType = props.aliasType
    this.displayName = props.displayName
    this.name = props.name
    this.message = props.message
    this.type = props.type
    this.state = props.state
    this.referencesAlias = props.referencesAlias
  }
}
