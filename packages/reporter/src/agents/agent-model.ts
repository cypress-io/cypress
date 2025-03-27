import { observable, makeObservable } from 'mobx'
import Instrument, { InstrumentProps } from '../instruments/instrument-model'

export interface AgentProps extends InstrumentProps {
  callCount: number
  functionName: string
}

export default class Agent extends Instrument {
  @observable callCount: number = 0
  @observable functionName: string

  constructor (props: AgentProps) {
    super(props)

    makeObservable(this)

    this.callCount = props.callCount
    this.functionName = props.functionName
  }

  update (props: AgentProps) {
    super.update(props)

    this.callCount = props.callCount
    this.functionName = props.functionName
  }
}
