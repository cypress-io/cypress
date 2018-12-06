import { observable } from 'mobx'

export default class Log {
  @observable.ref alias = null
  @observable aliasType = null
  @observable displayName
  @observable id
  @observable name
  @observable message
  @observable type
  @observable state
  @observable.ref referencesAlias = null
  @observable.ref aliasCount = null

  constructor (props) {
    this.id = props.id
    this.alias = props.alias
    this.aliasType = props.aliasType
    this.displayName = props.displayName
    this.name = props.name
    this.message = props.message
    this.type = props.type
    this.state = props.state
    this.referencesAlias = props.referencesAlias
    this.aliasCount = props.aliasCount
  }

  update (props) {
    this.alias = props.alias
    this.aliasType = props.aliasType
    this.displayName = props.displayName
    this.name = props.name
    this.message = props.message
    this.type = props.type
    this.state = props.state
    this.referencesAlias = props.referencesAlias
    this.aliasCount = props.aliasCount
  }
}
