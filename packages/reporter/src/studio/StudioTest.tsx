import React, { useMemo, useRef } from 'react'
import { observer } from 'mobx-react'
import { RunnablesStore } from '../runnables/runnables-store'
import { Duration } from '../duration/duration'
import Controls from '../header/controls'
import { AppState } from '../lib/app-state'
import Tooltip from '@cypress/react-tooltip'
import cx from 'classnames'
import Attempts from '../attempts/attempts'
import { useScrollIntoView } from '../lib/useScrollIntoView'
import { IconChevronDownSmall, IconStatusFailedSolid, IconStatusPassedSolid, IconStatusQueuedOutline, IconStatusRunningOutline } from '@cypress-design/react-icon'
import Test from '../test/test-model'
import { StatsStore } from '../header/stats-store'

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

  const { containerRef, isMounted, scrollIntoView } = useScrollIntoView({
    appState,
    testState: currentTest?.state,
    isStudioActive: appState.studioActive,
  })

  // Call callbackAfterUpdate when mounted and test changes
  React.useEffect(() => {
    if (isMounted && currentTest) {
      currentTest.callbackAfterUpdate()
    }
  }, [isMounted, currentTest])

  const parentTitles = useMemo(() => currentTest?.parentTitle ? currentTest.parentTitle.split(' > ') : [], [currentTest])

  const testTitle = currentTest ? <span data-cy='studio-single-test-title' className='studio-header__test-title'>{currentTest.title}</span> : null

  return (
    currentTest && (
      <div className='studio-single-test-container' >
        <div className='studio-header__test-section'>
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
          <Duration duration={statsStore.duration} />
          <Controls appState={appState} displayPreferencesButton={false} />
        </div>
        <div className='studio-single-test-attempts' ref={containerRef}>
          <Attempts test={currentTest} scrollIntoView={scrollIntoView} />
        </div>
      </div>
    )
  )
})
