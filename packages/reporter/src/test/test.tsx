import { observer } from 'mobx-react'
import React, { MouseEvent, useCallback } from 'react'
import events, { Events } from '../lib/events'
import appState, { AppState } from '../lib/app-state'
import Collapsible from '../collapsible/collapsible'
import TestModel from './test-model'

import { Scroller } from '../lib/scroller'
import Attempts from '../attempts/attempts'
import StateIcon from '../lib/state-icon'
import { LaunchStudioIcon } from '../components/LaunchStudioIcon'
import { useScrollIntoView } from '../lib/useScrollIntoView'

interface TestProps {
  events?: Events
  appState?: AppState
  scroller?: Scroller // Keep for backward compatibility but not used internally
  model: TestModel
  studioEnabled: boolean
  canSaveStudioLogs: boolean
}

const Test: React.FC<TestProps> = observer(({ model, events: eventsProps = events, appState: appStateProps = appState, scroller: scrollerProps, studioEnabled, canSaveStudioLogs }) => {
  const { containerRef, isMounted, scrollIntoView } = useScrollIntoView({
    appState: appStateProps,
    testState: model.state,
    isStudioActive: appStateProps.studioActive,
  })

  const _launchStudio = useCallback((e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    eventsProps.emit('studio:init:test', model.id)
  }, [eventsProps, model.id])

  // Call callbackAfterUpdate when mounted and model changes
  React.useEffect(() => {
    if (isMounted) {
      model.callbackAfterUpdate()
    }
  }, [isMounted, model])

  const _header = () => {
    return (<>
      <StateIcon aria-hidden className="runnable-state-icon" state={model.state} />
      <span className='runnable-title'>
        <span>{model.title}</span>
        <span className='visually-hidden'>{model.state}</span>
      </span>
      {_controls()}
    </>)
  }

  const _controls = () => {
    let controls: Array<JSX.Element> = []

    if (studioEnabled && !appStateProps.studioActive && model.state !== 'pending') {
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

  return (
    <Collapsible
      containerRef={containerRef}
      header={_header()}
      headerClass='runnable-wrapper'
      contentClass='runnable-instruments'
      isOpen={model.isOpen}
      onOpenStateChangeRequested={(isOpen: boolean) => model.setIsOpen(isOpen)}
      hideExpander
    >
      <div>
        <Attempts test={model} scrollIntoView={scrollIntoView} />
      </div>
    </Collapsible>
  )
})

Test.displayName = 'Test'
export default Test
