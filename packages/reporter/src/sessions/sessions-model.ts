import { observable, makeObservable } from 'mobx'
import Instrument, { InstrumentProps } from '../instruments/instrument-model'
import { determineTagType } from './utils'
import type { SessionStatus } from './utils'

export interface SessionProps extends InstrumentProps {
  name: string
  testId: string
  testCurrentRetry: number
  sessionInfo: {
    id: string
    isGlobalSession: boolean
    status: SessionStatus
  }
}

export default class Session extends Instrument {
  name: string
  status: string
  isGlobalSession: boolean = false
  tagType: string

  constructor (props: SessionProps) {
    super(props)

    makeObservable(this, {
      status: observable,
      isGlobalSession: observable,
      tagType: observable,
    })

    const { state, sessionInfo: { isGlobalSession, id, status } } = props

    this.isGlobalSession = isGlobalSession
    this.name = id
    this.status = status
    this.tagType = determineTagType(state)
  }

  update (props: Partial<SessionProps>) {
    const { state, sessionInfo } = props

    this.status = sessionInfo?.status || ''
    this.tagType = determineTagType(state || '')
  }
}
