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
  // `name` is inherited from Instrument (and made observable in its
  // constructor). Do NOT redeclare it as a class field: under
  // useDefineForClassFields a subclass field re-defines the inherited
  // observable and throws "Cannot redefine property: name" when
  // reporter is embedded into test-replay as a submodule.
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
