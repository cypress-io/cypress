import { observable } from 'mobx'

type Alias = string | Array<string> | null

export interface LogProps {
  id?: string
  alias: Alias
  aliasType?: string | null
  displayName?: string
  name?: string
  message?: string
  type?: string
  state?: string
  referencesAlias?: Alias
}

export default class Log {
  @observable.ref alias?: Alias = null
  @observable aliasType?: string | null = null
  @observable displayName?: string
  @observable id?: string
  @observable name?: string
  @observable message?: string
  @observable type?: string
  @observable state?: string
  @observable.ref referencesAlias?: Alias = null

  constructor (props: LogProps) {
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

  update (props: LogProps) {
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
