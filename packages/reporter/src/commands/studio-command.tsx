import { observer } from 'mobx-react'
import React, { Component, MouseEvent } from 'react'

import events, { Events } from '../lib/events'
import StudioCommandModel from '../studio/studio-command-model'

interface StudioCommandProps {
  events: Events
  model: StudioCommandModel
  index: number
}

@observer
class StudioCommand extends Component<StudioCommandProps> {
  static defaultProps = {
    events,
  }

  remove = (e: MouseEvent) => {
    e.preventDefault()

    const { events, index } = this.props

    events.emit('studio:remove:command', index)
  }

  render () {
    const { model, index } = this.props

    return (
      <li className='studio-command-group'>
        <div className='command command-name-get command-state-passed command-type-parent'>
          <div className='command-wrapper'>
            <div className='command-wrapper-text'>
              <span className='command-number'>
                {index + 1}
              </span>
              <span className='command-method'>
                get
              </span>
              <span className='command-message'>
                <span className='command-message-text'>
                  {model.selector}
                </span>
              </span>
              <span className='command-controls' onClick={this.remove}>
                <i className='far fa-times-circle' />
              </span>
            </div>
          </div>
        </div>
        <div className='command command-name-get command-state-passed command-type-child'>
          <div className='command-wrapper'>
            <div className='command-wrapper-text'>
              <span className='command-number' />
              <span className='command-method'>
                {model.command}
              </span>
              <span className='command-message'>
                <span className='command-message-text'>
                  {!!model.value && `"${model.value}"`}
                </span>
              </span>
            </div>
          </div>
        </div>
      </li>)
  }
}

export default StudioCommand
