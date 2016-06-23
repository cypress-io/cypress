import { observable } from 'mobx'

export default class Command {
  @observable alias = null
  @observable aliasType = null
  @observable id
  @observable name
  @observable message
  @observable number
  @observable event = false
  @observable type
  @observable indent = 0
  @observable state
  @observable referencesAlias = null

  constructor (props) {
    this.alias = props.alias
    this.aliasType = props.aliasType
    this.id = props.id
    this.name = props.name
    this.message = props.message
    this.number = props.number
    this.event = props.event
    this.type = props.type
    this.indent = props.indent
    this.state = props.state
    this.referencesAlias = props.referencesAlias
  }
}
