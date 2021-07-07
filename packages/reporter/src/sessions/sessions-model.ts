import { observable } from 'mobx'
import Instrument, { InstrumentProps } from '../instruments/instrument-model'

export interface SessionProps extends InstrumentProps {
  name: string
  testId: string
  testCurrentRetry: number
  sessionInfo: {id: string, data: Record<string, {cookies: number, localStorage: number}>}
}

export default class Session extends Instrument {
  @observable name: string
  @observable data: SessionProps['sessionInfo']['data']

  constructor (props: SessionProps) {
    super(props)
    const { id, data } = props.sessionInfo

    this.name = id
    this.data = { ...data }
  }
}
