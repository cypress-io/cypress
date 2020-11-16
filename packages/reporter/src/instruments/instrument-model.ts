import { observable } from 'mobx'

export interface AliasObject {
  name: string
  cardinal?: number
  ordinal?: string
}

export type Alias = string | Array<string> | null | AliasObject | Array<AliasObject>

export interface InstrumentProps {
  id: number
  alias?: Alias
  aliasType?: string | null
  displayName?: string
  name?: string
  message?: string
  type?: string
  testCurrentRetry: number
  state?: string | null
  referencesAlias?: Alias
  instrument?: 'agent' | 'command' | 'route'
  testId: string
}

export default class Log {
  @observable.ref alias?: Alias = null
  @observable aliasType?: string | null = null
  @observable displayName?: string
  @observable id?: number
  @observable name?: string
  @observable message?: string
  @observable type?: string
  @observable state?: string | null
  @observable.ref referencesAlias?: Alias = null

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
