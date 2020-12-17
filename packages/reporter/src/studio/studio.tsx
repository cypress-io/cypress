import { observer } from 'mobx-react'
import React, { Component, MouseEvent } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import events, { Events } from '../lib/events'
import appState, { AppState } from '../lib/app-state'
import runnablesStore, { RunnablesStore } from '../runnables/runnables-store'
import TestModel from '../test/test-model'

import scroller, { Scroller } from '../lib/scroller'
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
}

@observer
class StudioControls extends Component<StudioControlsProps> {
  static defaultProps = {
    events,
  }

  cancel = (e: MouseEvent) => {
    e.preventDefault()

    this.props.events.emit('studio:cancel')
  }

  save = (e: MouseEvent) => {
    e.preventDefault()

    const { events, model } = this.props

    events.emit('studio:save', model.invocationDetails)
  }

  render () {
    const { studioIsNotEmpty } = this.props.model

    return (
      <div className='studio-controls'>
        <button className='studio-cancel' onClick={this.cancel}>Cancel</button>
        <button className='studio-run' disabled={!studioIsNotEmpty}>Run Test</button>
        <button className='studio-save' disabled={!studioIsNotEmpty} onClick={this.save}>Save Test</button>
      </div>
    )
  }
}

interface StudioProps {
  events: Events
  appState: AppState
  runnablesStore: RunnablesStore
  scroller: Scroller
  model: TestModel
}

@observer
class Studio extends Component<StudioProps> {
  static defaultProps = {
    events,
    appState,
    runnablesStore,
    scroller,
  }

  render () {
    const { model } = this.props

    return (
      <div className='wrap'>
        <div className='runnables'>
          <div className={`studio runnable runnable-${model.state}`}>
            <StudioHeader model={model} />
            <div className='runnable-instruments'>
              <Attempts test={model} scrollIntoView={() => {}} />
              <StudioControls model={model} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Studio
