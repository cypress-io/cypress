import { observer } from 'mobx-react'
import React, { MouseEvent, useCallback } from 'react'
import { IconCypressStudio } from '@cypress-design/react-icon'

import events, { Events } from '../lib/events'
import appState, { AppState } from '../lib/app-state'
import Collapsible from '../collapsible/collapsible'
import TestModel from './test-model'
import Attempts from '../attempts/attempts'
import StateIcon from '../lib/state-icon'
import { LaunchStudioIcon } from '../components/LaunchStudioIcon'
import { useScrollIntoView } from '../lib/useScrollIntoView'

interface TestProps {
  events?: Events
  appState?: AppState
  model: TestModel
  studioEnabled: boolean
  spec?: Cypress.Cypress['spec']
}

const Test: React.FC<TestProps> = observer(({ model, events: eventsProps = events, appState: appStateProps = appState, studioEnabled, spec }) => {
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

    // Check if we're running all specs by looking at the spec relative path
    const isRunningAllSpecs = spec?.relative === '__all'

    if (studioEnabled && !appStateProps.studioActive && model.state !== 'pending' && !isRunningAllSpecs) {
      controls.push(
        <LaunchStudioIcon
          key={`studio-command-${model}`}
          content={
            <div className='flex items-center py-[8px] px-[8px]'>
              <div><IconCypressStudio strokeColor="gray-500" className="mr-[10px]" /></div>
              <div className='text-sm text-gray-700'>Edit in Studio</div>
            </div>
          }
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
