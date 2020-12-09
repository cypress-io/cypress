import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'

import eventManager from '../lib/event-manager'

class Studio extends Component {
  render () {
    const { model } = this.props

    return (
      <div className='header-popup studio'>
        <div className='studio-title'>
          <span className='icon'><i className='fas fa-magic' /></span>{' '}
          <span className='title'>CYPRESS STUDIO</span>{' '}
          <span className='beta'>BETA</span>
        </div>
        <div className='available-commands' onClick={this.showAvailableCommands}>
          <a href='#'>AVAILABLE COMMANDS</a>
        </div>
        <div className='studio-controls'>
          <Tooltip
            title='Close Studio'
            className='cy-tooltip'
            visible={model.isLoading ? false : null}
          >
            <button
              className='header-button button-studio'
              disabled={model.isLoading}
              onClick={this._close}
            >
              <i className='fas fa-times' />
            </button>
          </Tooltip>
          <Tooltip
            title='Restart'
            className='cy-tooltip'
            visible={model.isLoading ? false : null}
          >
            <button
              className='header-button button-studio'
              disabled={model.isLoading}
              onClick={this._restart}
            >
              <i className='fas fa-undo' />
            </button>
          </Tooltip>
          <Tooltip
            title='Save Test'
            className='cy-tooltip'
            visible={model.isLoading ? false : null}
          >
            <button
              className='header-button button-studio'
              disabled={model.isLoading}
            >
              <i className='fas fa-save' />
            </button>
          </Tooltip>
        </div>
      </div>
    )
  }

  showAvailableCommands = (e) => {
    e.preventDefault()
  }

  _restart = () => {
    this.props.model.reset()
    eventManager.emit('restart')
  }

  _close = () => {
    eventManager.emit('studio:cancel')
  }
}

export default Studio
