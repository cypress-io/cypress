import { observable } from 'mobx'
import Instrument, { InstrumentProps } from '../instruments/instrument-model'

export interface SessionProps extends InstrumentProps {
  name: string
  testId: string
  testCurrentRetry: number
  status: string
  renderProps: {
    status: string
  }
  sessionInfo: {
    id: string
    isGlobalSession: boolean
  }
}

export default class Session extends Instrument {
  @observable name: string
  @observable status: string
  @observable isGlobalSession: boolean = false

  constructor (props: SessionProps) {
    super(props)
    const { renderProps, sessionInfo } = props

    this.isGlobalSession = sessionInfo.isGlobalSession
    this.name = sessionInfo.id
    this.status = renderProps.status
  }

  update (props: Partial<SessionProps>) {
    const { renderProps, state } = props

    this.status = renderProps?.status || ''
    this.state = state || ''
  }
}
