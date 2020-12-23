import { observer } from 'mobx-react'
import React, { Component, MouseEvent } from 'react'
import { Dialog } from '@reach/dialog'
import VisuallyHidden from '@reach/visually-hidden'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import events, { Events } from '../lib/events'
import scroller, { Scroller } from '../lib/scroller'
import TestModel from '../test/test-model'
import Attempts from '../attempts/attempts'

const StudioHeader = observer(({ model }: { model: TestModel }) => (
  <div className='runnable-wrapper'>
    <div className='studio-header'>
      <i aria-hidden='true' className='runnable-state fas' />
      <span className='runnable-title'>
        <span>{model.title}</span>
        <span className='visually-hidden'>{model.state}</span>
      </span>
      <span className='runnable-controls'>
        <Tooltip placement='top' title='One or more commands failed' className='cy-tooltip'>
          <i className='fas fa-exclamation-triangle runnable-controls-status' />
        </Tooltip>
      </span>
    </div>
  </div>
))

interface StudioControlsProps {
  events: Events
  model: TestModel
  specPath: string
}

interface StudioControlsState {
  saveModalIsOpen: boolean
}

@observer
class StudioControls extends Component<StudioControlsProps, StudioControlsState> {
  static defaultProps = {
    events,
  }

  constructor (props: StudioControlsProps) {
    super(props)

    this.state = {
      saveModalIsOpen: false,
    }
  }

  render () {
    const { studioIsNotEmpty } = this.props.model

    return (
      <>
        <div className='studio-controls'>
          <button className='studio-cancel' onClick={this._cancel}>Cancel</button>
          <button className='studio-run' disabled={!studioIsNotEmpty}>Run Test</button>
          <button className='studio-save' disabled={!studioIsNotEmpty} onClick={this._saveAndExit}>Save Test</button>
        </div>
        {this._saveModal()}
      </>
    )
  }

  _cancel = (e: MouseEvent) => {
    e.preventDefault()

    this.props.events.emit('studio:cancel:reporter:restart')
  }

  _save = (closeStudio: boolean) => {
    const { events, model } = this.props

    events.emit('studio:save', model.invocationDetails, closeStudio)
  }

  _saveAndContinue = (e: MouseEvent) => {
    e.preventDefault()
    this._save(false)
  }

  _saveAndExit = (e: MouseEvent) => {
    e.preventDefault()
    this._save(true)
  }

  _openSaveModal = (e: MouseEvent) => {
    e.preventDefault()
    this.setState({ saveModalIsOpen: true })
  }

  _closeSaveModal = () => {
    this.setState({ saveModalIsOpen: false })
  }

  _saveModal = () => {
    const { saveModalIsOpen } = this.state
    const { model, specPath } = this.props

    return (
      <Dialog
        className='studio-modal studio-save-modal'
        aria-label='Start Studio'
        isOpen={saveModalIsOpen}
        onDismiss={this._closeSaveModal}
      >
        <div className='body'>
          <h1 className='title'>
            <i className='fas fa-save icon' /> Save Test
          </h1>
          <div className='center'>
            <div className='text'>
              Save <span className='text-strong'>"{ model.title }"</span> to <span className='text-strong'>{ specPath }</span>
            </div>
          </div>
          <div className='studio-controls'>
            <button className='button-outline' onClick={this._saveAndContinue}>
              Save and Continue Adding Commands
            </button>
            <button className='button-solid' onClick={this._saveAndExit}>
              Save and Exit
            </button>
          </div>
        </div>
        <button className='close-button' onClick={this._closeSaveModal}>
          <VisuallyHidden>Close</VisuallyHidden>
          <span aria-hidden>
            <i className='fas fa-times' />
          </span>
        </button>
      </Dialog>
    )
  }
}

interface StudioProps {
  scroller: Scroller
  model: TestModel
  specPath: string
}

@observer
class Studio extends Component<StudioProps> {
  static defaultProps = {
    scroller,
  }

  render () {
    const { model, specPath } = this.props

    return (
      <div className='wrap'>
        <div className='runnables'>
          <div className={`studio runnable runnable-${model.state}`}>
            <StudioHeader model={model} />
            <div className='runnable-instruments'>
              <Attempts test={model} scrollIntoView={() => {}} />
              <StudioControls model={model} specPath={specPath} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Studio
