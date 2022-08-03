import { observable } from 'mobx'
import { TestState } from '../test/test-model'

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
  // agent / route / session - instrument panel log type
  // parent / child / system - command log type
  type?: 'agent' | 'parent' | 'child' | 'system' | 'route' | 'session'
  testCurrentRetry?: number
  state: TestState
  referencesAlias?: Alias
  instrument?: 'agent' | 'command' | 'route'
  testId: string
}

export default class Log {
  @observable.ref alias?: Alias
  @observable aliasType?: string
  @observable displayName?: string
  @observable id?: number
  @observable name?: string
  @observable message?: string
  @observable type?: string
  @observable state: string
  @observable.ref referencesAlias?: Alias

  constructor (props: InstrumentProps) {
    this.id = props.id
    this.alias = props.alias
    this.aliasType = props.aliasType
    this.displayName = props.displayName
    this.name = props.name
    this.message = props.message
    this.type = props.type
    this.state = props.state
    this.referencesAlias = props.referencesAlias
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
