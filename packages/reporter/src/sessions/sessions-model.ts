import { observable } from 'mobx'
import Instrument, { InstrumentProps } from '../instruments/instrument-model'

export interface SessionProps extends InstrumentProps {
  name: string
  testId: string
  testCurrentRetry: number
  status: string
  isGlobalSession: boolean
}

export default class Session extends Instrument {
  @observable name: string
  @observable status: string
  @observable isGlobalSession: boolean

  constructor (props: SessionProps) {
    super(props)
    const { name, status, isGlobalSession } = props

    this.name = name
    this.status = status
    this.isGlobalSession = isGlobalSession
  }

  update (props: Partial<SessionProps>) {
    const { status, state } = props

    this.status = status || ''
    this.state = state || ''
  }
}
