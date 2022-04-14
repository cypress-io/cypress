import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Tooltip from '@cypress/react-tooltip'
import cs from 'classnames'

import { StudioInstructionsModal } from './studio-modals'

@observer
class Studio extends Component {
  state = {
    modalOpen: false,
    copySuccess: false,
  }

  render () {
    const { model, hasUrl } = this.props
    const { modalOpen, copySuccess } = this.state

    return (
      <div className='header-popup studio'>
        <StudioInstructionsModal open={modalOpen} close={this._closeModal} />
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
            title={copySuccess ? 'Commands Copied!' : 'Copy Commands to Clipboard'}
            className='cy-tooltip'
            visible={model.isLoading || model.isEmpty ? false : null}
            updateCue={copySuccess}
          >
            <button
              className={cs('header-button button-studio button-studio-copy', {
                'button-success': copySuccess,
              })}
              disabled={model.isLoading || model.isEmpty}
              onClick={this._copy}
              onMouseLeave={this._endCopySuccess}
            >
              <i className={copySuccess ? 'fas fa-check' : 'fas fa-copy'} />
            </button>
          </Tooltip>
          <Tooltip
            title='Save Commands'
            className='cy-tooltip'
            visible={model.isLoading || model.isEmpty ? false : null}
          >
            <button
              className='header-button button-studio button-studio-save'
              disabled={model.isLoading || model.isEmpty}
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

  _closeModal = () => {
    this.setState({ modalOpen: false })
  }

  _close = () => {
    this.props.eventManager.emit('studio:cancel')
  }

  _restart = () => {
    this.props.model.reset()
    this.props.eventManager.emit('restart')
  }

  _copy = () => {
    if (this.state.copySuccess) return

    this.props.eventManager.emit('studio:copy:to:clipboard', () => {
      this.setState({ copySuccess: true })
    })
  }

  _save = () => {
    this.props.model.startSave()
  }

  _endCopySuccess = () => {
    if (this.state.copySuccess) {
      this.setState({ copySuccess: false })
    }
  }
}

export { Studio }
