import React, { Component } from 'react'
import { observer } from 'mobx-react'
import timerStore from './duration-timer-store'

@observer
export default class TimerDisplay extends Component {
  componentWillMount () {
    timerStore.startTimer(this.props.startTime)
  }

  componentWillUnmount () {
    timerStore.resetTimer()
  }

  render () {
    return (
      <span>
        <i className='fa fa-hourglass-end'></i>{' '}
        {timerStore.mainDisplay}
      </span>
    )
  }
}
