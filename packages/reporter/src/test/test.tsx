import { observer } from 'mobx-react'
import React, { Component, createRef, RefObject, MouseEvent } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import events, { Events } from '../lib/events'
import appState, { AppState } from '../lib/app-state'
import Collapsible from '../collapsible/collapsible'
import { indent } from '../lib/util'
import runnablesStore, { RunnablesStore } from '../runnables/runnables-store'
import TestModel from './test-model'

import scroller, { Scroller } from '../lib/scroller'
import Attempts from '../attempts/attempts'

interface StudioControlsProps {
  events: Events
  model: TestModel
}

@observer
class StudioControls extends Component<StudioControlsProps> {
  static defaultProps = {
    events,
  }

  _cancel = (e: MouseEvent) => {
    e.preventDefault()

    this.props.events.emit('studio:cancel')
  }

  _save = (e: MouseEvent) => {
    e.preventDefault()

    this.props.events.emit('studio:save')
  }

  render () {
    const { studioIsNotEmpty } = this.props.model

    return (
      <div className='studio-controls'>
        <button className='studio-cancel' onClick={this._cancel}>Cancel</button>
        <button className='studio-save' disabled={!studioIsNotEmpty} onClick={this._save}>Save Commands</button>
      </div>
    )
  }
}

interface TestProps {
  events: Events
  appState: AppState
  runnablesStore: RunnablesStore
  scroller: Scroller
  model: TestModel
}

@observer
class Test extends Component<TestProps> {
  static defaultProps = {
    events,
    appState,
    runnablesStore,
    scroller,
  }

  containerRef: RefObject<HTMLDivElement>

  constructor (props: TestProps) {
    super(props)

    this.containerRef = createRef<HTMLDivElement>()
  }

  componentDidMount () {
    this._scrollIntoView()
  }

  componentDidUpdate () {
    this._scrollIntoView()
    this.props.model.callbackAfterUpdate()
  }

  _scrollIntoView () {
    const { appState, model, scroller } = this.props
    const { state, shouldRender } = model

    if (appState.autoScrollingEnabled && (appState.isRunning || appState.studioActive) && shouldRender && state !== 'processing') {
      window.requestAnimationFrame(() => {
        // since this executes async in a RAF the ref might be null
        if (this.containerRef.current) {
          scroller.scrollIntoView(this.containerRef.current as HTMLElement)
        }
      })
    }
  }

  render () {
    const { model } = this.props

    if (!model.shouldRender) return null

    return (
      <Collapsible
        containerRef={this.containerRef}
        header={this._header()}
        headerClass='runnable-wrapper'
        headerStyle={{ paddingLeft: indent(model.level) }}
        contentClass='runnable-instruments'
        isOpen={model.isOpen}
      >
        {this._contents()}
      </Collapsible>
    )
  }

  _header () {
    const { model } = this.props

    return (<>
      <i aria-hidden='true' className='runnable-state fas' />
      <span className='runnable-title'>
        <span>{model.title}</span>
        <span className='visually-hidden'>{model.state}</span>
      </span>
      <span className='runnable-controls'>
        <Tooltip placement='top' title='One or more commands failed' className='cy-tooltip'>
          <i className='fas fa-exclamation-triangle runnable-controls-status' />
        </Tooltip>
        <Tooltip placement='right' title='Add Commands to Test' className='cy-tooltip'>
          <a onClick={this._launchStudio} className='runnable-controls-studio'>
            <i className='fas fa-magic' />
          </a>
        </Tooltip>
      </span>
    </>)
  }

  _contents () {
    const { appState, model } = this.props

    return (
      <div style={{ paddingLeft: indent(model.level) }}>
        <Attempts test={model} scrollIntoView={() => this._scrollIntoView()} />
        { appState.studioActive && <StudioControls model={model} /> }
      </div>
    )
  }

  _launchStudio = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const { model, events } = this.props

    events.emit('studio:init:test', model.id)
  }
}

export default Test
