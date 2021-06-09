import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'
import cs from 'classnames'
import { eventManager } from '@packages/runner-shared'

import { StudioInstructionsModal } from './studio-modals'

class Studio extends Component {
  constructor (props) {
    super(props)

    this.state = { modalOpen: false }
  }

  render () {
    const { model, hasUrl } = this.props

    return (
      <div className='header-popup studio'>
        {/* eslint-disable react/jsx-no-bind */}
        <StudioInstructionsModal open={this.state.modalOpen} close={() => this.setState({ modalOpen: false })} />
        <div className='text-block'>
          <span className={cs('icon', { 'is-active': model.isActive && !model.isFailed && hasUrl })}>
            <i className='fas' />
          </span>
          {' '}
          <span className='title'>Studio</span>
          {' '}
          <span className='beta'>Beta</span>
        </div>
        <div className='text-block'>
          <a href='#' className={cs('available-commands', { 'link-disabled': model.isLoading })} onClick={this._showModal}>Available Commands</a>
        </div>
        <div className='text-block'>
          <a href={!model.isLoading ? 'https://on.cypress.io/studio-beta' : undefined} target='_blank' className={cs('give-feedback', { 'link-disabled': model.isLoading })} rel="noreferrer">Give Feedback</a>
        </div>
        <div className='studio-controls'>
          <Tooltip
            title='Close Studio'
            className='cy-tooltip'
            visible={model.isLoading ? false : null}
          >
            <button
              className='header-button button-studio button-studio-close'
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
              className='header-button button-studio button-studio-restart'
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
              className='header-button button-studio button-studio-save'
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

  _showModal = (e) => {
    e.preventDefault()

    if (this.props.model.isLoading) return

    this.setState({ modalOpen: true })
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

export { Studio }
