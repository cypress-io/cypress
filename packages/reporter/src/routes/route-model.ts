import { observable, makeObservable } from 'mobx'
import Instrument, { InstrumentProps } from '../instruments/instrument-model'

export interface RouteProps extends InstrumentProps {
  isStubbed: boolean
  method: string
  numResponses: number
  url: string
}

export default class Route extends Instrument {
  isStubbed: boolean;
  method: string;
  numResponses: number = 0;
  url: string;

  constructor (props: RouteProps) {
    super(props)

    makeObservable(this, {
      isStubbed: observable,
      method: observable,
      numResponses: observable,
      url: observable,
    })

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
