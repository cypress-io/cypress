import React, { useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react'
import { getFilenameParts } from '../lib/util'
import Test from '../test/test-model'
import Button from '@cypress-design/react-button'
import { IconArrowLeft, IconChevronDownSmall, IconStatusFailedSolid, IconStatusPassedSolid, IconStatusQueuedOutline, IconStatusRunningOutline } from '@cypress-design/react-icon'
import { OpenFileInIDEButton } from '../header/OpenFileInIDEButton'
import { StatsStore } from '../header/stats-store'
import { Duration } from '../duration/duration'
import { RunnablesStore } from '../runnables/runnables-store'
import Controls from '../header/controls'
import { AppState } from '../lib/app-state'
import Attempts from '../attempts/attempts'
import Tooltip from '@cypress/react-tooltip'
import cx from 'classnames'
import { Loading } from '../runnables/runnables'

// this is set up to be stubbed in tests
export const SingleTestActions = {
  handleBackButton: () => {
    const url = new URL(window.location.href)
    const hashParams = new URLSearchParams(url.hash)

    hashParams.delete('studio')

    ;['testId', 'suiteId'].forEach((param) => {
      hashParams.delete(param)
    })

    url.hash = decodeURIComponent(hashParams.toString())
    window.history.replaceState({}, '', url.toString())
    window.location.reload()
  },
}

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
  if (test.state === 'active') {
    return <IconStatusRunningOutline data-cy='running-icon' size='16' fillColor='gray-700' strokeColor='indigo-400' />
  }

  if (test.state === 'failed') {
    return <IconStatusFailedSolid data-cy='failed-icon' size='16' strokeColor='red-400' />
  }

  if (test.state === 'passed') {
    return <IconStatusPassedSolid data-cy='passed-icon' size='16' strokeColor='jade-400' />
  }

  // processing state or default state
  return <IconStatusQueuedOutline data-cy='queued-icon' size='16' strokeColor="gray-700" />
}

interface StudioTestHeaderProps {
  appState: AppState
  spec: Cypress.Cypress['spec']
  runnablesStore: RunnablesStore
  statsStore: StatsStore
}

export const StudioSingleTest = observer(({ appState, spec, runnablesStore, statsStore }: StudioTestHeaderProps) => {
  const tooltipRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { isReady } = runnablesStore

  if (!isReady) {
    return <Loading />
  }

  const [isMounted, setIsMounted] = useState(false)

  const specParts = getFilenameParts(spec.name)
  const relativeSpecPath = spec.relative

  // Single we're in single test mode, the current test is the first test in the runnablesStore._tests
  const currentTest = Object.values(runnablesStore._tests)[0]

  useEffect(() => {
    _scrollIntoView()
    if (!isMounted) {
      setIsMounted(true)
    } else {
      if (currentTest) {
        currentTest.callbackAfterUpdate()
      }
    }
  })

  const _scrollIntoView = () => {
    if (appState.autoScrollingEnabled && (appState.isRunning || appState.studioActive) && currentTest?.state !== 'processing') {
      window.requestAnimationFrame(() => {
        // since this executes async in a RAF the ref might be null
        if (containerRef.current) {
          // Scroll to the bottom of the attempts container to show the latest content
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      })
    }
  }

  const fileDetails = {
    absoluteFile: spec.absolute,
    column: 0,
    line: 0,
    originalFile: relativeSpecPath,
    relativeFile: relativeSpecPath,
  }

  const parentTitles = useMemo(() => currentTest?.parentTitle ? currentTest.parentTitle.split(' > ') : [], [currentTest])

  const testTitle = currentTest ? <span data-cy='studio-single-test-title' className='studio-header__test-title'>{currentTest.title}</span> : null

  return (
    <div className='studio-single-test-container'>
      <header className='studio-header'>
        <div className='studio-header__file-section'>
          <Button data-cy='studio-back-button' size='32' variant='outline-dark' className='studio-header__back-button' onClick={SingleTestActions.handleBackButton}>
            <IconArrowLeft size='16' strokeColor='gray-500' />
          </Button>
          <div className='studio-header__file-content'>
            <span data-cy='studio-single-test-file-name' className='studio-header__file-name'>{specParts[0]}{specParts[1]}</span>
            <OpenFileInIDEButton fileDetails={fileDetails} />
          </div>
        </div>
      </header>
      {currentTest && (
        <>
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
          <div ref={containerRef} className='studio-single-test-attempts' >
            <Attempts test={currentTest} scrollIntoView={() => _scrollIntoView()} />
          </div>
        </>
      )}
    </div>
  )
})
