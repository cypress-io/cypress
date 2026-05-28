import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { observer } from 'mobx-react'
import { RunnablesStore } from '../runnables/runnables-store'
import { Duration } from '../duration/duration'
import Controls from '../header/controls'
import { AppState } from '../lib/app-state'
import Tooltip from '@cypress/react-tooltip'
import cx from 'classnames'
import Attempts from '../attempts/attempts'
import { useScrollIntoView } from '../lib/useScrollIntoView'
import { IconArrowLeft, IconChevronDownSmall, IconStatusFailedSolid, IconStatusPassedSolid, IconStatusQueuedOutline, IconStatusRunningOutline } from '@cypress-design/react-icon'
import Test from '../test/test-model'
import { StatsStore } from '../header/stats-store'
import Button from '@cypress-design/react-button'
import events from '../lib/events'

const getConnectors = (num: number) => {
  let connectors: JSX.Element[] = []

  for (let i = 0; i < num; i++) {
    connectors.push(
      <span key={`connector-${i}`} className='studio-tooltip__breadcrumb-connector' style={{ left: `${(i * 16) + 8}px`, paddingRight: `${i * 8}px` }} />,
    )
  }

  return connectors
}

const getParentTitlesListElements = (parentTitles: string[]) => {
  return parentTitles.map((title, i) => (
    <li key={`${title}-${i}`} className='studio-tooltip__breadcrumb-item' style={{ paddingLeft: `${i * 16}px` }}>
      {getConnectors(i)}
      <IconChevronDownSmall strokeColor='gray-300' />
      <span>{title}</span>
    </li>
  ))
}

const StatusIcon = ({ test }: { test: Test }) => {
  let className = 'state-icon'

  if (test.state === 'active') {
    return <IconStatusRunningOutline className={className} data-cy='running-icon' size='16' fillColor='gray-700' strokeColor='indigo-400' />
  }

  if (test.state === 'failed') {
    return <IconStatusFailedSolid className={className} data-cy='failed-icon' size='16' strokeColor='red-400' />
  }

  if (test.state === 'passed') {
    return <IconStatusPassedSolid className={className} data-cy='passed-icon' size='16' strokeColor='jade-400' />
  }

  // processing state or default state
  return <IconStatusQueuedOutline className={className} data-cy='queued-icon' size='16' strokeColor="gray-700" />
}

interface StudioTestProps {
  appState: AppState
  runnablesStore: RunnablesStore
  statsStore: StatsStore
}

export const StudioTest = observer(({ appState, runnablesStore, statsStore }: StudioTestProps) => {
  // Single we're in single test mode, the current test is the first test in the runnablesStore._tests
  const currentTest = Object.values(runnablesStore._tests)[0]
  const tooltipRef = useRef<HTMLUListElement>(null)
  const testSectionRef = useRef<HTMLDivElement>(null)
  const fixedElementRef = useRef<HTMLDivElement>(null)

  const { containerRef, isMounted, scrollIntoView } = useScrollIntoView({
    appState,
    testState: currentTest?.state,
    isStudioActive: appState.studioActive,
  })

  const handleBackButton = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()

    events.emit('studio:cancel', undefined)
  }, [])

  // Call callbackAfterUpdate when mounted and test changes
  React.useEffect(() => {
    if (isMounted && currentTest) {
      currentTest.callbackAfterUpdate()
    }
  }, [isMounted, currentTest])

  const parentTitles = useMemo(() => currentTest?.parentTitle ? currentTest.parentTitle.split(' > ') : [], [currentTest])

  const testTitle = currentTest ? <span data-cy='studio-single-test-title' className='studio-header__test-title'>{currentTest.title}</span> : null

  const toggleHeaderShadow = (entries) => {
    const [entry] = entries

    testSectionRef.current?.classList.toggle('shadow-active', !entry.isIntersecting)
  }

  useEffect(() => {
    if (!fixedElementRef.current) return

    const observer = new IntersectionObserver(toggleHeaderShadow)

    observer.observe(fixedElementRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    currentTest && (<>
      {/* This empty div acts as an intersection observer target to toggle the header shadow based on scroll position */}
      <div ref={fixedElementRef} />
      <div className='studio-single-test-container'>
        <div className='studio-header__test-section' ref={testSectionRef}>
          <div className='studio-header__test-section-left'>

            <Tooltip placement='bottom' title={<p>All tests</p>} className='cy-tooltip'>
              <div>
                <Button data-cy='studio-back-button' size='32' variant='outline-indigo' className='studio-header__back-button' onClick={handleBackButton}>
                  <IconArrowLeft size='16' strokeColor='indigo-400' />
                </Button>
              </div>
            </Tooltip>

            <div className='studio-header__test-section-left-content'>
              <StatusIcon test={currentTest} />
              {parentTitles.length > 0 ? (
                <Tooltip title={<ul className='studio-tooltip__breadcrumb-list' ref={tooltipRef}>
                  {getParentTitlesListElements(parentTitles)}
                </ul>}
                wrapperClassName='studio-header__test-tooltip-wrapper' className={cx(
                  'studio-tooltip cy-tooltip',
                )}>
                  {testTitle}
                </Tooltip>
              ) : testTitle}
            </div>
          </div>
          <div className='studio-header__test-section-right'>
            <Duration duration={statsStore.duration} />
            <Controls appState={appState} />
          </div>
        </div>
        <div className='studio-single-test-attempts' ref={containerRef}>
          <Attempts isSingleStudioTest test={currentTest} scrollIntoView={scrollIntoView} />
        </div>
      </div>
    </>
    )
  )
})
