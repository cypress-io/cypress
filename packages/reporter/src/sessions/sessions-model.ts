import { observable } from 'mobx'
import Instrument, { InstrumentProps } from '../instruments/instrument-model'

export interface SessionProps extends InstrumentProps {
  name: string
  testId: string
  testCurrentRetry: number
  sessionInfo: {
    id: string
    isGlobalSession: boolean
    status: 'creating' | 'created' | 'restored' |'restored' | 'recreating' | 'recreated' | 'failed'
  }
}

export default class Session extends Instrument {
  @observable name: string
  @observable status: string
  @observable isGlobalSession: boolean = false

  constructor (props: SessionProps) {
    super(props)
    const { sessionInfo } = props

    this.isGlobalSession = sessionInfo.isGlobalSession
    this.name = sessionInfo.id
    this.status = sessionInfo.status
  }

  update (props: Partial<SessionProps>) {
    const { sessionInfo, state } = props

    this.status = sessionInfo?.status || ''
    this.state = state || ''
  }
}
