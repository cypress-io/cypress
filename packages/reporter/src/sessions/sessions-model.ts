import { observable } from 'mobx'
import Instrument, { InstrumentProps } from '../instruments/instrument-model'

export interface SessionProps extends InstrumentProps {
  name: string
  testId: string
  testCurrentRetry: number
  sessionInfo: {name: string, data: Record<string, {cookies: number, localStorage: number}>}
}

export default class Session extends Instrument {
  @observable name: string
  @observable data: SessionProps['sessionInfo']['data']

  constructor (props: SessionProps) {
    super(props)
    const { name, data } = props.sessionInfo

    this.name = name
    this.data = { ...data }
  }
}
