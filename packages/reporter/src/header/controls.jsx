import cs from 'classnames'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'

import events from '../lib/events'

const ifThen = (condition, component) => (
  condition ? component : null
)
@observer
class Controls extends Component {
  emit = (event) => () => events.emit(event)

  toggleAutoScrolling = () => {
    this.props.appState.toggleAutoScrolling()
    events.emit('save:state')
  }

  _handleKeyDown = (e) => {
    switch (e.key) {
      case ('R'): {
        this.emit('restart')
        break
      }
      case ('S'): {
        if (this.props.appState.isRunning) {
          this.emit('stop')
        }
        break
      }
      default: {
        break
      }
    }
  }

  componentDidMount () {
    document.addEventListener('onkeydown', this._handleKeyDown)
  }

  render () {
    const { appState, events } = this.props
    return (
      <div className='controls'>
        {ifThen(appState.isPaused, (
          <span className='paused-label'>
            <label>Paused</label>
          </span>
        ))}
        {ifThen(appState.isPaused, (
          <Tooltip placement='bottom' title='Resume'>
            <button className='play' onClick={this.emit('resume')}>
              <i className='fa fa-play'></i>
            </button>
          </Tooltip>
        ))}
        {ifThen(!appState.isPaused, (
          <Tooltip placement='bottom' title={`${appState.autoScrollingEnabled ? 'Disable' : 'Enable'} Auto-scrolling`}>
            <button
              className={cs('toggle-auto-scrolling', { 'auto-scrolling-enabled': appState.autoScrollingEnabled })}
              onClick={action('toggle:auto:scrolling', this.toggleAutoScrolling)}
            >
              <i className='fa'></i>
              <i className='fa fa-arrows-v'></i>
            </button>
          </Tooltip>
        ))}
        {ifThen(appState.isRunning && !appState.isPaused, (
          <Tooltip placement='bottom' title='Stop Running'>
            <button className='stop' onClick={this.emit('stop')}>
              <i className='fa fa-stop'></i>
            </button>
          </Tooltip>
        ))}
        {ifThen(!appState.isRunning, (
          <Tooltip placement='bottom' title='Run all tests'>
            <button className='restart' onClick={this.emit('restart')}>
              <i className='fa fa-repeat'></i>
            </button>
          </Tooltip>
        ))}
        {ifThen(!!appState.nextCommandName, (
          <Tooltip placement='bottom' title={`Next: '${appState.nextCommandName}'`}>
            <button className='next' onClick={this.emit('next')}>
              <i className='fa fa-step-forward'></i>
            </button>
          </Tooltip>
        ))}
      </div>
    )
  }
}

Controls.defaultProps = {
  events,
}

export default Controls
