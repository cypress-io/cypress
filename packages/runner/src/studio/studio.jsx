import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'
import cs from 'classnames'

import eventManager from '../lib/event-manager'

class Studio extends Component {
  render () {
    const { model } = this.props

    return (
      <div className='header-popup studio'>
        <div className='text-block'>
          <span className={cs('icon', { 'is-active': model.isActive })}>
            <i className='fas' />
          </span>{' '}
          <span className='title'>Studio</span>{' '}
          <span className='beta'>Beta</span>
        </div>
        <div className='text-block'>
          <a href='#' onClick={this.showAvailableCommands}>Available Commands</a>
        </div>
        <div className='text-block'>
          <a href='https://on.cypress.io/studio-beta' target='_blank'>Give Feedback</a>
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
              onClick={this._save}
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

  _close = () => {
    eventManager.emit('studio:cancel')
  }

  _restart = () => {
    this.props.model.reset()
    eventManager.emit('restart')
  }

  _save = () => {
    this.props.model.startSave()
  }
}

export default Studio
