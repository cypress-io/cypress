import { observable } from 'mobx'
import Command from './command-model'

export default class Route extends Command {
  @observable method
  @observable numResponses = 0
  @observable response
  @observable status

  constructor (props) {
    super(props)

    this.method = props.method
    this.numResponses = props.numResponses
    this.response = props.response
    this.status = props.status
  }
}
