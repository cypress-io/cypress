import cs from 'classnames'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import StudioCommandModel from './studio-command-model'

interface Props {
  model: StudioCommandModel
  index: number
}

@observer
class StudioCommand extends Component<Props> {
  render () {
    const { model, index } = this.props

    return (
      <li
        className={cs(
          'command',
          `command-name-${model.command}`,
          `command-state-passed`,
          `command-type-parent`,
        )}
      >
        <div className='command-wrapper'>
          <div className='command-wrapper-text'>
            <span className='command-number'>
              <i className='fas fa-spinner fa-spin' />
              <span>{index}</span>
            </span>
            <span className='command-method'>
              <span>get</span>
            </span>
            <span className='command-message'>
              <span className='command-message-text'>
                {model.selector}
              </span>
            </span>
          </div>
          <div className='command-wrapper-text'>
            <span className='command-number'>
              <i className='fas fa-spinner fa-spin' />
              <span> - </span>
            </span>
            <span className='command-method'>
              <span>{model.command}</span>
            </span>
            <span className='command-message'>
              <span className='command-message-text'>
                {model.value}
              </span>
            </span>
          </div>
        </div>
      </li>
    )
  }
}

export default StudioCommand
