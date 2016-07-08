import _ from 'lodash'
import { asStructure, observable } from 'mobx'
import Log from '../instruments/log-model'

export default class Command extends Log {
  @observable renderProps = asStructure({})
  // @observable errorMessage = null
  @observable event = false
  @observable isLongRunning = false
  @observable number
  @observable numElements
  @observable visible = true

  constructor (props) {
    super(props)

    // this.errorMessage = props.error
    this.event = props.event
    this.number = props.number
    this.numElements = props.numElements
    this.renderProps = props.renderProps
    this.visible = props.visible
  }

  update (props) {
    super.update(props)

    // this.errorMessage = props.error
    this.event = props.event
    this.numElements = props.numElements
    this.renderProps = props.renderProps
    this.visible = props.visible
  }

  serialize () {
    return _.extend(super.serialize(), {
      // error: this.errorMessage,
      event: this.event,
      number: this.number,
      numElements: this.numElements,
      visible: this.visible,
    })
  }
}
