import { asStructure, observable } from 'mobx'

import Err from '../lib/err-model'
import Log from '../instruments/log-model'

export default class Command extends Log {
  @observable renderProps = asStructure({})
  @observable err = new Err({})
  @observable event = false
  @observable isLongRunning = false
  @observable number
  @observable numElements
  @observable visible = true

  constructor (props) {
    super(props)

    this.err.update(props.err)
    this.event = props.event
    this.number = props.number
    this.numElements = props.numElements
    this.renderProps = props.renderProps
    this.visible = props.visible
  }

  update (props) {
    super.update(props)

    this.err.update(props.err)
    this.event = props.event
    this.numElements = props.numElements
    this.renderProps = props.renderProps
    this.visible = props.visible
  }
}
