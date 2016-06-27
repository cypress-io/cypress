import _ from 'lodash'
import { observable } from 'mobx'
import Log from './log-model'

export default class Agent extends Log {
  @observable callCount = 0
  @observable functionName

  constructor (props) {
    super(props)
    this._setProps(props)
  }

  update (props) {
    super.update(props)
    this._setProps(props)
  }

  _setProps (props) {
    this.callCount = props.callCount
    this.functionName = props.functionName
  }

  serialize () {
    return _.extend(super.serialize(), {
      callCount: this.callCount,
      functionName: this.functionName,
    })
  }
}
