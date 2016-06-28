import { observable } from 'mobx'

export default class Log {
  @observable alias = null
  @observable aliasType = null
  @observable id
  @observable name
  @observable message
  @observable number
  @observable event = false
  @observable type
  @observable state
  @observable referencesAlias = null

  constructor (props) {
    this.id = props.id
    this.alias = props.alias
    this.aliasType = props.aliasType
    this.name = props.name
    this.message = props.message
    this.number = props.number
    this.event = props.event
    this.type = props.type
    this.state = props.state
    this.referencesAlias = props.referencesAlias
  }

  update (props) {
    this.alias = props.alias
    this.aliasType = props.aliasType
    this.name = props.name
    this.message = props.message
    this.number = props.number
    this.event = props.event
    this.type = props.type
    this.state = props.state
    this.referencesAlias = props.referencesAlias
  }

  serialize () {
    return {
      alias: this.alias,
      aliasType: this.aliasType,
      id: this.id,
      name: this.name,
      message: this.message,
      number: this.number,
      event: this.event,
      state: this.state,
      type: this.type,
      referencesAlias: this.referencesAlias,
    }
  }
}
