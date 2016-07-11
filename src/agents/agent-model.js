import { observable } from 'mobx'
import Instrument from '../instruments/instrument-model'

export default class Agent extends Instrument {
  @observable callCount = 0
  @observable functionName

  constructor (props) {
    super(props)

    this.callCount = props.callCount
    this.functionName = props.functionName
  }

  update (props) {
    super.update(props)

    this.callCount = props.callCount
    this.functionName = props.functionName
  }
}
