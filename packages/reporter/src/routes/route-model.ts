import { observable } from 'mobx'
import Instrument from '../instruments/instrument-model'

interface RouteProps {
  isStubbed: boolean
  method: string
  numResponses: number
  url: string
}

export default class Route extends Instrument {
  @observable isStubbed: boolean
  @observable method: string
  @observable numResponses: number = 0
  @observable url: string

  constructor (props: RouteProps) {
    super(props)

    this.isStubbed = props.isStubbed
    this.method = props.method
    this.numResponses = props.numResponses
    this.url = props.url
  }

  update (props: RouteProps) {
    super.update(props)

    this.isStubbed = props.isStubbed
    this.method = props.method
    this.numResponses = props.numResponses
    this.url = props.url
  }
}
