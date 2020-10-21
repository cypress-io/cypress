import { observable } from 'mobx'

import { InstrumentModel, InstrumentProps, InstrumentCollection } from '../instruments/instrument-model'

export interface RouteProps extends InstrumentProps {
  isStubbed: boolean
  method: string
  numResponses: number
  url: string
}

export class RouteModel extends InstrumentModel {
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
