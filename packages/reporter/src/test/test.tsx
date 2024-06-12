import { observer } from 'mobx-react'
import React, { Component, createRef, RefObject, MouseEvent } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'
import cs from 'classnames'

import events, { Events } from '../lib/events'
import appState, { AppState } from '../lib/app-state'
import Collapsible from '../collapsible/collapsible'
import { indent } from '../lib/util'
import runnablesStore, { RunnablesStore } from '../runnables/runnables-store'
import TestModel from './test-model'

import scroller, { Scroller } from '../lib/scroller'
import Attempts from '../attempts/attempts'
import StateIcon from '../lib/state-icon'
import { LaunchStudioIcon } from '../components/LaunchStudioIcon'

import CheckIcon from '@packages/frontend-shared/src/assets/icons/checkmark_x16.svg'
import ClipboardIcon from '@packages/frontend-shared/src/assets/icons/general-clipboard_x16.svg'
import WarningIcon from '@packages/frontend-shared/src/assets/icons/warning_x16.svg'

interface StudioControlsProps {
  events: Events
  model: TestModel
  canSaveStudioLogs: boolean
}

interface StudioControlsState {
  copySuccess: boolean
}

@observer
class StudioControls extends Component<StudioControlsProps, StudioControlsState> {
  static defaultProps = {
    events,
  }

  state = {
    copySuccess: false,
  }

  _cancel = (e: MouseEvent) => {
    e.preventDefault()

    this.props.events.emit('studio:cancel')
  }

  _save = (e: MouseEvent) => {
    e.preventDefault()

    this.props.events.emit('studio:save')
  }

  _copy = (e: MouseEvent) => {
    e.preventDefault()

    this.props.events.emit('studio:copy:to:clipboard', () => {
      this.setState({ copySuccess: true })
    })
  }

  _endCopySuccess = () => {
    if (this.state.copySuccess) {
      this.setState({ copySuccess: false })
    }
  }

  render () {
    const { canSaveStudioLogs } = this.props
    const { copySuccess } = this.state

    return (
      <div className='studio-controls'>
        <a className='studio-cancel' onClick={this._cancel}>Cancel</a>
        <Tooltip
          title={copySuccess ? 'Commands Copied!' : 'Copy Commands to Clipboard'}
          className='cy-tooltip'
          wrapperClassName='studio-copy-wrapper'
          visible={!canSaveStudioLogs ? false : null}
          updateCue={copySuccess}
        >
          <button
            className={cs('studio-copy', {
              'studio-copy-success': copySuccess,
            })}
            disabled={!canSaveStudioLogs}
            onClick={this._copy}
            onMouseLeave={this._endCopySuccess}
          >
            {copySuccess ? (
              <CheckIcon />
            ) : (
              <ClipboardIcon />
            )}
          </button>
        </Tooltip>
        <button className='studio-save' disabled={!canSaveStudioLogs} onClick={this._save}>Save Commands</button>
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
  studioEnabled: boolean
  canSaveStudioLogs: boolean
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
    const { state } = model

    if (appState.autoScrollingEnabled && (appState.isRunning || appState.studioActive) && state !== 'processing') {
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

    return (
      <Collapsible
        containerRef={this.containerRef}
        header={this._header()}
        headerClass='runnable-wrapper'
        headerStyle={{ paddingLeft: indent(model.level) }}
        contentClass='runnable-instruments'
        isOpen={model.isOpen}
        hideExpander
      >
        {this._contents()}
      </Collapsible>
    )
  }

  _header () {
    const { appState, model } = this.props

    return (<>
      <StateIcon aria-hidden className="runnable-state-icon" state={model.state} isStudio={appState.studioActive} />
      <span className='runnable-title'>
        <span>{model.title}</span>
        <span className='visually-hidden'>{model.state}</span>
      </span>
      {this._controls()}
    </>)
  }

  _controls () {
    let controls: Array<JSX.Element> = []

    if (this.props.model.state === 'failed') {
      controls.push(
        <Tooltip key={`test-failed-${this.props.model}`} placement='top' title='One or more commands failed' className='cy-tooltip'>
          <span>
            <WarningIcon className="runnable-controls-status" />
          </span>
        </Tooltip>,
      )
    }

    if (this.props.studioEnabled && !appState.studioActive) {
      controls.push(
        <LaunchStudioIcon
          key={`studio-command-${this.props.model}`}
          title='Add Commands to Test'
          onClick={this._launchStudio}
        />,
      )
    }

    if (controls.length === 0) {
      return null
    }

    return (
      <span className='runnable-controls'>
        {controls}
      </span>
    )
  }

  _contents () {
    const { appState, model } = this.props

    return (
      <div style={{ paddingLeft: indent(model.level) }}>
        <Attempts studioActive={appState.studioActive} test={model} scrollIntoView={() => this._scrollIntoView()} />
        {appState.studioActive && <StudioControls model={model} canSaveStudioLogs={this.props.canSaveStudioLogs}/>}
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
