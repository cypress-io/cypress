import { observable } from 'mobx'
import Command from './command-model'

export default class Agent extends Command {
  @observable callCount = 0
  @observable functionName

  constructor (props) {
    super(props)

    this.callCount = props.callCount
    this.functionName = props.functionName
  }
}
