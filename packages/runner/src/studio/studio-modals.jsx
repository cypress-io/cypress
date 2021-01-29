import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import { Dialog } from '@reach/dialog'
import VisuallyHidden from '@reach/visually-hidden'

import eventManager from '../lib/event-manager'
import studioRecorder from './studio-recorder'

@observer
export class StudioInstructionsModal extends Component {
  render () {
    return (
      <Dialog
        className='studio-modal studio-instructions-modal'
        aria-label='Start Studio'
        isOpen={this.props.open}
        onDismiss={this.props.close}
      >
        <div className='body'>
          <h1 className='title'>
            <i className='fas fa-magic icon' /> Studio <span className='beta'>BETA</span>
          </h1>
          <div className='content center'>
            <div className='text'>
              Generate and save commands directly to your test suite by interacting with your app as an end user would. Studio will track events that generate the following commands:
            </div>
            <div className='text center-box'>
              <ul>
                <li><pre>.check()</pre></li>
                <li><pre>.click()</pre></li>
                <li><pre>.select()</pre></li>
                <li><pre>.type()</pre></li>
                <li><pre>.uncheck()</pre></li>
              </ul>
            </div>
            <div className='text'>
              This feature is currently in Beta and we will be adding more commands and abilities in the future. Your <a href='https://on.cypress.io/studio-beta' target='_blank'>feedback</a> will be highly influential to our team.
            </div>
          </div>
          <div className='controls'>
            <button className='cancel' onClick={this.props.close}>Close</button>
          </div>
        </div>
        <button className='close-button' onClick={this.props.close}>
          <VisuallyHidden>Close</VisuallyHidden>
          <span aria-hidden>
            <i className='fas fa-times' />
          </span>
        </button>
      </Dialog>
    )
  }
}

@observer
export class StudioInitModal extends Component {
  render () {
    return (
      <Dialog
        className='studio-modal'
        aria-label='Start Studio'
        isOpen={studioRecorder.initModalIsOpen}
        onDismiss={this._close}
      >
        <div className='body'>
          <h1 className='title'>
            <i className='fas fa-magic icon' /> Studio <span className='beta'>BETA</span>
          </h1>
          <div className='gif'>
            <img src={require('../../static/studio.gif')} alt='Studio' />
          </div>
          <div className='content center'>
            <div className='text'>
              Generate Cypress commands by interacting with your site as an end user would. Then, save these commands directly to your test file.
            </div>
            <button className='btn-main' onClick={this._start}>
              Get Started
            </button>
          </div>
        </div>
        <button className='close-button' onClick={this._close}>
          <VisuallyHidden>Close</VisuallyHidden>
          <span aria-hidden>
            <i className='fas fa-times' />
          </span>
        </button>
      </Dialog>
    )
  }

  _close = () => {
    studioRecorder.closeInitModal()
    studioRecorder.clearRunnableIds()
  }

  _start = () => eventManager.emit('studio:start')
}

@observer
export class StudioSaveModal extends Component {
  @observable name = ''

  render () {
    return (
      <Dialog
        className='studio-modal studio-save-modal'
        aria-label='Save New Test'
        isOpen={studioRecorder.saveModalIsOpen}
        onDismiss={studioRecorder.closeSaveModal}
      >
        <div className='body'>
          <h1 className='title'>
            <i className='fas fa-magic icon' /> Save New Test
          </h1>
          <div className='content'>
            <form onSubmit={this._save}>
              <div className='text'>
                <label className='text-strong' htmlFor='testName'>Test Name</label>
                <input id='testName' type='text' value={this.name} onChange={this._onInputChange} required />
              </div>
              <div className='center'>
                <button className='btn-main' type='submit' disabled={!this.name}>
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
        <button className='close-button' onClick={studioRecorder.closeSaveModal}>
          <VisuallyHidden>Close</VisuallyHidden>
          <span aria-hidden>
            <i className='fas fa-times' />
          </span>
        </button>
      </Dialog>
    )
  }

  @action
  _onInputChange = (e) => {
    this.name = e.target.value
  }

  _save = (e) => {
    e.preventDefault()

    if (!this.name) return

    studioRecorder.save(this.name)
  }
}

const StudioModals = () => (
  <>
    <StudioInitModal />
    <StudioSaveModal />
  </>
)

export default StudioModals
