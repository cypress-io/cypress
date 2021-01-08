import { observer } from 'mobx-react'
import React, { Component } from 'react'
import { Dialog } from '@reach/dialog'
import VisuallyHidden from '@reach/visually-hidden'

import eventManager from '../lib/event-manager'
import studioRecorder from './studio-recorder'

@observer
class StudioInitModal extends Component {
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
              Generate Cypress commands by interacting with your site on the right. Then, save these commands directly to your test file.
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
class StudioSaveModal extends Component {
  constructor (props) {
    super(props)

    this.state = { name: '' }
  }

  render () {
    return (
      <Dialog
        className='studio-modal studio-save-modal'
        aria-label='Start Studio'
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
                <input id='testName' type='text' value={this.state.name} onChange={this._onInputChange} required />
              </div>
              <div className='center'>
                <button className='btn-main' type='submit' disabled={!this.state.name}>
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

  _onInputChange = (e) => {
    this.setState({ name: e.target.value })
  }

  _save = (e) => {
    e.preventDefault()

    if (!this.state.name) return

    studioRecorder.save(this.state.name)
  }
}

const StudioModals = () => (
  <>
    <StudioInitModal />
    <StudioSaveModal />
  </>
)

export default StudioModals
