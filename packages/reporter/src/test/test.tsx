import { observer } from 'mobx-react'
import React, { MouseEvent, useEffect, useRef, useState } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'
import cs from 'classnames'

import events, { Events } from '../lib/events'
import appState, { AppState } from '../lib/app-state'
import Collapsible from '../collapsible/collapsible'
import { indent } from '../lib/util'
import TestModel from './test-model'

import scroller, { Scroller } from '../lib/scroller'
import Attempts from '../attempts/attempts'
import StateIcon from '../lib/state-icon'
import { LaunchStudioIcon } from '../components/LaunchStudioIcon'

import CheckIcon from '@packages/frontend-shared/src/assets/icons/checkmark_x16.svg'
import ClipboardIcon from '@packages/frontend-shared/src/assets/icons/general-clipboard_x16.svg'
import WarningIcon from '@packages/frontend-shared/src/assets/icons/warning_x16.svg'

interface StudioControlsProps {
  events?: Events
  canSaveStudioLogs: boolean
}

const StudioControls: React.FC<StudioControlsProps> = observer(({ events: eventsProps = events, canSaveStudioLogs }) => {
  const [copySuccess, setCopySuccess] = useState(false)

  const _cancel = (e: MouseEvent) => {
    e.preventDefault()

    eventsProps.emit('studio:cancel')
  }

  const _save = (e: MouseEvent) => {
    e.preventDefault()

    eventsProps.emit('studio:save')
  }

  const _copy = (e: MouseEvent) => {
    e.preventDefault()

    events.emit('studio:copy:to:clipboard', () => {
      setCopySuccess(true)
    })
  }

  const _endCopySuccess = () => {
    if (copySuccess) {
      setCopySuccess(false)
    }
  }

  return (
    <div className='studio-controls'>
      <a className='studio-cancel' onClick={_cancel}>Cancel</a>
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
          onClick={_copy}
          onMouseLeave={_endCopySuccess}
        >
          {copySuccess ? (
            <CheckIcon />
          ) : (
            <ClipboardIcon />
          )}
        </button>
      </Tooltip>
      <button className='studio-save' disabled={!canSaveStudioLogs} onClick={_save}>Save Commands</button>
    </div>
  )
})

interface TestProps {
  events?: Events
  appState?: AppState
  scroller?: Scroller
  model: TestModel
  studioEnabled: boolean
  canSaveStudioLogs: boolean
}

const Test: React.FC<TestProps> = observer(({ model, events: eventsProps = events, appState: appStateProps = appState, scroller: scrollerProps = scroller, studioEnabled, canSaveStudioLogs }) => {
  const containerRef = useRef(null)

  const mounted = useRef<boolean>()

  useEffect(() => {
    _scrollIntoView()
    if (!mounted.current) {
      mounted.current = true
    } else {
      model.callbackAfterUpdate()
    }
  })

  const _launchStudio = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    eventsProps.emit('studio:init:test', model.id)
  }

  const _scrollIntoView = () => {
    if (appStateProps.autoScrollingEnabled && (appStateProps.isRunning || appStateProps.studioActive) && model.state !== 'processing') {
      window.requestAnimationFrame(() => {
        // since this executes async in a RAF the ref might be null
        if (containerRef.current) {
          scrollerProps.scrollIntoView(containerRef.current as HTMLElement)
        }
      })
    }
  }

  const _header = () => {
    return (<>
      <StateIcon aria-hidden className="runnable-state-icon" state={model.state} isStudio={appStateProps.studioActive} />
      <span className='runnable-title'>
        <span>{model.title}</span>
        <span className='visually-hidden'>{model.state}</span>
      </span>
      {_controls()}
    </>)
  }

  const _controls = () => {
    let controls: Array<JSX.Element> = []

    if (model.state === 'failed') {
      controls.push(
        <Tooltip key={`test-failed-${model}`} placement='top' title='One or more commands failed' className='cy-tooltip'>
          <span>
            <WarningIcon className="runnable-controls-status" />
          </span>
        </Tooltip>,
      )
    }

    if (studioEnabled && !appStateProps.studioActive) {
      controls.push(
        <LaunchStudioIcon
          key={`studio-command-${model}`}
          title='Add Commands to Test'
          onClick={_launchStudio}
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

  const _contents = () => {
    return (
      <div style={{ paddingLeft: indent(model.level) }}>
        <Attempts studioActive={appStateProps.studioActive} test={model} scrollIntoView={() => _scrollIntoView()} />
        {appStateProps.studioActive && <StudioControls canSaveStudioLogs={canSaveStudioLogs}/>}
      </div>
    )
  }

  return (
    <Collapsible
      containerRef={containerRef}
      header={_header()}
      headerClass='runnable-wrapper'
      headerStyle={{ paddingLeft: indent(model.level) }}
      contentClass='runnable-instruments'
      isOpen={model.isOpen}
      hideExpander
    >
      {_contents()}
    </Collapsible>
  )
})

export default Test
