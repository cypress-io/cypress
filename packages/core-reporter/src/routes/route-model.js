import { observable } from 'mobx'
import Instrument from '../instruments/instrument-model'

export default class Route extends Instrument {
  @observable isStubbed
  @observable method
  @observable numResponses = 0
  @observable url

  constructor (props) {
    super(props)

    this.isStubbed = props.isStubbed
    this.method = props.method
    this.numResponses = props.numResponses
    this.url = props.url
  }

  update (props) {
    super.update(props)

    this.isStubbed = props.isStubbed
    this.method = props.method
    this.numResponses = props.numResponses
    this.url = props.url
  }
}
