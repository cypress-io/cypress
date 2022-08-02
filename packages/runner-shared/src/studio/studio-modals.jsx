import { observer } from 'mobx-react'
import React, { Component } from 'react'
import { Dialog } from '@reach/dialog'
import VisuallyHidden from '@reach/visually-hidden'

import './studio-modals.scss'

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
            <i className='fas fa-magic icon' />
            {' '}
            Studio
            {' '}
            <span className='beta'>BETA</span>
          </h1>
          <div className='content center'>
            <div className='text'>
              Generate and save commands directly to your test suite by interacting with your app as an end user would. Right click on an element to add an assertion. Studio will track events that generate the following commands:
            </div>
            <div className='text center-box'>
              <ul>
                <li>
                  <pre>.check()</pre>
                </li>
                <li>
                  <pre>.click()</pre>
                </li>
                <li>
                  <pre>.select()</pre>
                </li>
                <li>
                  <pre>.type()</pre>
                </li>
                <li>
                  <pre>.uncheck()</pre>
                </li>
              </ul>
            </div>
            <div className='text'>
              This feature is currently in Beta and we will be adding more commands and abilities in the future. Your
              {' '}
              <a href='https://on.cypress.io/studio-beta' target='_blank' rel="noreferrer">feedback</a>
              {' '}
              will be highly influential to our team.
            </div>
          </div>
          <div className='controls'>
            <button className='cancel' onClick={this.props.close}>Close</button>
          </div>
        </div>
        <button className='close-button' onClick={this.props.close}>
          <VisuallyHidden>Close</VisuallyHidden>
          <span aria-hidden={true}>
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
        className='studio-modal studio-init-modal'
        aria-label='Start Studio'
        isOpen={this.props.eventManager.studioRecorder.initModalIsOpen}
        onDismiss={this._close}
      >
        <div className='body'>
          <h1 className='title'>
            <i className='fas fa-magic icon' />
            {' '}
            Studio
            {' '}
            <span className='beta'>BETA</span>
          </h1>
          <div className='gif'>
            <img src={require('../static/studio.gif')} alt='Studio' />
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
          <span aria-hidden={true}>
            <i className='fas fa-times' />
          </span>
        </button>
      </Dialog>
    )
  }

  _close = () => {
    this.props.eventManager.studioRecorder.closeInitModal()
    this.props.eventManager.studioRecorder.clearRunnableIds()
  }

  _start = () => this.props.eventManager.emit('studio:start')
}

@observer
export class StudioSaveModal extends Component {
  state = {
    name: '',
  }

  render () {
    const { name } = this.state

    return (
      <Dialog
        className='studio-modal studio-save-modal'
        aria-label='Save New Test'
        isOpen={this.props.eventManager.studioRecorder.saveModalIsOpen}
        onDismiss={this.props.eventManager.studioRecorder.closeSaveModal}
      >
        <div className='body'>
          <h1 className='title'>
            <i className='fas fa-magic icon' />
            {' '}
            Save New Test
          </h1>
          <div className='content'>
            <form onSubmit={this._save}>
              <div className='text'>
                <label className='text-strong' htmlFor='testName'>Test Name</label>
                <input id='testName' type='text' value={name} required={true} onChange={this._onInputChange} />
              </div>
              <div className='center'>
                <button className='btn-main' type='submit' disabled={!name}>
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
        <button className='close-button' onClick={this.props.eventManager.studioRecorder.closeSaveModal}>
          <VisuallyHidden>Close</VisuallyHidden>
          <span aria-hidden={true}>
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

    const { name } = this.state

    if (!name) return

    this.props.eventManager.studioRecorder.save(name)
  }
}

export const StudioModals = (props) => (
  <>
    <StudioInitModal eventManager={props.eventManager} />
    <StudioSaveModal eventManager={props.eventManager} />
  </>
)
