import React, { Component } from 'react'
import { observer } from 'mobx-react'
import TimerStore from './duration-timer-store'

@observer
export default class TimerDisplay extends Component {
  constructor (...props) {
    super(...props)

    this.timerStore = new TimerStore(this.props.startTime)
  }

  componentDidMount () {
    this.timerStore.startTimer()
  }

  componentWillUnmount () {
    this.timerStore.resetTimer()
  }

  render () {
    return (
      <span className='env-duration'>
        <i className='fas fa-hourglass-half'></i>
        {this.timerStore.mainDisplay}
      </span>
    )
  }
}
