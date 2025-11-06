import { observer } from 'mobx-react'
import React, { MouseEvent, useCallback, useState } from 'react'
import { IconActionDeleteSmall, IconCypressStudio, IconGeneralSparkleSingleLarge } from '@cypress-design/react-icon'

import events, { Events } from '../lib/events'
import appState, { AppState } from '../lib/app-state'
import Collapsible from '../collapsible/collapsible'
import TestModel from './test-model'
import Attempts from '../attempts/attempts'
import StateIcon from '../lib/state-icon'
import { LaunchStudioIcon } from '../components/LaunchStudioIcon'
import { useScrollIntoView } from '../lib/useScrollIntoView'
import { SelfHealedBadge } from '../lib/selfHealedBadge'
import Button from '@cypress-design/react-button'

interface TestProps {
  events?: Events
  appState?: AppState
  model: TestModel
  studioEnabled: boolean
  spec?: Cypress.Cypress['spec']
  isFirstTest: boolean
}

const Test: React.FC<TestProps> = observer(({ model, events: eventsProps = events, appState: appStateProps = appState, studioEnabled, spec, isFirstTest }) => {
  const { containerRef, isMounted, scrollIntoView } = useScrollIntoView({
    appState: appStateProps,
    testState: model.state,
    isStudioActive: appStateProps.studioActive,
  })

  const [firstTestTooltipVisible, setFirstTestTooltipVisible] = useState(true)

  const _launchStudio = useCallback((e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    eventsProps.emit('studio:init:test', { testId: model.id })
  }, [eventsProps, model.id])

  const _handleDismissStudioTooltip = useCallback((e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setFirstTestTooltipVisible(false)
    appStateProps.setStudioTooltipDismissed(true)
    eventsProps.emit('save:state')
  }, [eventsProps, appStateProps])

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
        {model.isSelfHealed && (
          <SelfHealedBadge source='test' />
        )}
      </span>
      {_controls()}
    </>)
  }

  const _controls = () => {
    let controls: Array<JSX.Element> = []

    // Check if we're running all specs by looking at the spec relative path
    const isRunningAllSpecs = spec?.relative === '__all'

    if (studioEnabled && !appStateProps.studioActive && model.state !== 'pending' && !isRunningAllSpecs) {
      if (appStateProps.isStudioNewTestPageActive && isFirstTest && !appStateProps.studioTooltipDismissed) {
        controls.push(
          <LaunchStudioIcon
            key={`studio-command-${model}`}
            content={ <div
              className='flex items-start flex-col gap-[4px] py-[12px] pl-[16px]'
            >
              <div className='flex items-center justify-between text-white text-[16px] font-medium w-full relative'>
                Edit test in studio
                <Button size='24' variant='link' className='absolute right-0 bottom-[8px]' onClick={_handleDismissStudioTooltip} data-cy="dismiss-studio-tooltip-icon">
                  <IconActionDeleteSmall size='16' strokeColor="gray-500" />
                </Button>
              </div>
              <span className="flex items-center flex-row gap-[8px] text-gray-300 text-[14px] text-left justify-start">
                <IconCypressStudio fillColor="gray-500" />
              Open a test in Studio to make edits
              </span>
              <span className='flex items-center flex-row gap-[8px] text-gray-300 text-[14px] text-left'>
                <IconGeneralSparkleSingleLarge strokeColor="gray-500" fillColor='gray-900' />
                  Refine test with AI recommendations
                <span className='text-gray-300 bg-gray-950 font-medium border border-gray-800 rounded-[4px] px-[4px] text-[12px] font-medium'>Coming soon</span>
              </span>
              <Button size='24' variant='outline-dark' className='px-[8px] mt-[12px] mb-[8px]' onClick={_handleDismissStudioTooltip} data-cy="got-it-dont-show-again-button">
                <span className='text-indigo-300'>
                  Got it, don't show this again.
                </span>
              </Button>
            </div>}
            onClick={(e) => {
              _handleDismissStudioTooltip(e)
              _launchStudio(e)
            }}
            className='launch-studio-tooltip'
            wrapperClassName='edit-in-studio-tooltip'
            visible={firstTestTooltipVisible}
            dataCy="studio-tooltip-guide"
          />,
        )
      } else {
        controls.push(
          <LaunchStudioIcon
            key={`studio-command-${model}`}
            content={ <div className='flex items-center py-[8px] px-[8px]'>
              <div><IconCypressStudio fillColor="gray-500" className="mr-[10px]" /></div>
              <div className='text-sm text-gray-700'>Edit in Studio</div></div>}
            onClick={_launchStudio}
          />,
        )
      }
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
