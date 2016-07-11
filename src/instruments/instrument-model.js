import { asReference, observable } from 'mobx'

export default class Log {
  @observable alias = null
  @observable aliasType = null
  @observable displayName
  @observable id
  @observable name
  @observable message
  @observable type
  @observable state
  @observable referencesAlias = asReference(null)

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
    this.referencesAlias = props.referencesAlias
  }
}
