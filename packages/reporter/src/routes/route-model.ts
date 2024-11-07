import { observable, makeObservable } from 'mobx'
import Instrument, { InstrumentProps } from '../instruments/instrument-model'

export interface RouteProps extends InstrumentProps {
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

    makeObservable(this)

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
