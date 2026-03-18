import _ from 'lodash'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { MouseEvent, useCallback, useEffect, useRef } from 'react'

import events, { Events } from '../lib/events'
import { RunnablesError, RunnablesErrorModel } from './runnable-error'
import Runnable, { shouldShowConnectionDots } from './runnable-and-suite'
import type { RunnablesStore, RunnableArray } from './runnables-store'
import type { StatsStore } from '../header/stats-store'
import type { Scroller, UserScrollCallback } from '../lib/scroller'
import type { AppState } from '../lib/app-state'
import OpenFileInIDE from '../lib/open-file-in-ide'

import OpenIcon from '@packages/frontend-shared/src/assets/icons/technology-code-editor_x16.svg'
import StudioIcon from '@packages/frontend-shared/src/assets/icons/object-magic-wand-dark-mode_x16.svg'
import WarningIcon from '@packages/frontend-shared/src/assets/icons/warning_x16.svg'
import { StudioTest } from '../studio/StudioTest'

const Loading = () => (
  <div className='runnable-loading'>
    <div className='runnable-loading-animation'>
      <div /><div /><div /><div /><div />
    </div>
    <div className='runnable-loading-title'>Your tests are loading...</div>
  </div>
)

interface RunnablesEmptyStateProps {
  spec: Cypress.Cypress['spec']
  eventManager?: Events
  studioEnabled: boolean
}

const RunnablesEmptyState = ({ spec, studioEnabled, eventManager = events }: RunnablesEmptyStateProps) => {
  const _launchStudio = useCallback((e: MouseEvent) => {
    e.preventDefault()

    // root runnable always has r1 as id
    eventManager.emit('studio:init:suite', { suiteId: 'r1', entrySource: 'new-test-root' })
  }, [eventManager])

  const isAllSpecs = spec.absolute === '__all' || spec.relative === '__all'

  return (
    <div className='no-tests'>
      <h2>
        <WarningIcon className="warning-icon" />No tests found.
      </h2>
      <p>Cypress could not detect tests in this file.</p>
      {!isAllSpecs && (
        <>
          <OpenFileInIDE fileDetails={{
            column: 0,
            line: 0,
            originalFile: spec.relative,
            relativeFile: spec.relative,
            absoluteFile: spec.absolute,
          }}>
            <a href="#" onClick={(event) => {
              event.preventDefault()
            }}>
              <h3><OpenIcon />Open file in IDE</h3>
            </a>
          </OpenFileInIDE>
          <p className='text-muted'>Write a test using your preferred text editor.</p>
          {studioEnabled && (
            <>
              <a
                data-cy="studio-create-test"
                className='open-studio'
                onClick={_launchStudio}>
                <h3>
                  <StudioIcon /> Create test with Cypress Studio
                </h3>
              </a>
              <p className='text-muted open-studio-desc'>Use an interactive tool to author a test right here.</p>
            </>
          )}
        </>
      )}
      <hr />
      <p>Need help? Learn how to <a className='help-link' href='https://on.cypress.io/intro' target='_blank'>test your application</a> with Cypress</p>
    </div>
  )
}

interface RunnablesListProps {
  runnables: RunnableArray
  studioEnabled: boolean
  spec: Cypress.Cypress['spec']
}

const RunnablesList: React.FC<RunnablesListProps> = observer(({ runnables, studioEnabled, spec }: RunnablesListProps) => {
  return (
    <div className='wrap'>
      <ul className='runnables'>
        {_.map(runnables, (runnable, index) =>
          (<Runnable
            key={runnable.id}
            model={runnable}
            studioEnabled={studioEnabled}
            shouldShowConnectingDots={shouldShowConnectionDots(runnables, runnable, index)}
            spec={spec}
          />))}
      </ul>
    </div>
  )
})

RunnablesList.displayName = 'RunnablesList'

interface RunnablesContentProps {
  runnablesStore: RunnablesStore
  spec: Cypress.Cypress['spec']
  error?: RunnablesErrorModel
  studioEnabled: boolean
  appState?: AppState
  statsStore: StatsStore
}

const RunnablesContent: React.FC<RunnablesContentProps> = observer(({ runnablesStore, spec, error, studioEnabled, appState, statsStore }: RunnablesContentProps) => {
  const { isReady, runnables, runnablesHistory } = runnablesStore

  if (!isReady) {
    return <Loading />
  }

  // show error if there are no tests, but only if there
  // there isn't an error passed down that supercedes it
  if (!error && !runnablesStore.runnables.length) {
    return <RunnablesEmptyState spec={spec} studioEnabled={studioEnabled} />
  }

  if (error) {
    return <RunnablesError error={error} />
  }

  const specPath = spec.relative

  const isRunning = specPath === runnablesStore.runningSpec

  if (appState?.studioActive && appState?.studioSingleTestActive) {
    return <StudioTest appState={appState} runnablesStore={runnablesStore} statsStore={statsStore} />
  }

  return (
    <RunnablesList
      runnables={isRunning ? runnables : runnablesHistory[specPath]}
      studioEnabled={studioEnabled}
      spec={spec}
    />
  )
})

RunnablesContent.displayName = 'RunnablesContent'

interface RunnablesProps {
  error?: RunnablesErrorModel
  runnablesStore: RunnablesStore
  statsStore: StatsStore
  spec: Cypress.Cypress['spec']
  scroller: Scroller
  appState?: AppState
  studioEnabled: boolean
}

const Runnables: React.FC<RunnablesProps> = observer(({ appState, scroller, error, runnablesStore, spec, studioEnabled, statsStore }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let maybeHandleScroll: UserScrollCallback | undefined = undefined

    if (window.__CYPRESS_MODE__ === 'open') {
      // in open mode, listen for scroll events so that users can pause the command log auto-scroll
      // by manually scrolling the command log
      maybeHandleScroll = action('user:scroll:detected', () => {
        if (appState && appState.isRunning) {
          appState.temporarilySetAutoScrolling(false)
        }
      })
    }

    // we need to always call scroller.setContainer, but the callback can be undefined
    // so we pass maybeHandleScroll. If we don't, Cypress blows up with an error like
    // `A container must be set on the scroller with scroller.setContainer(container)`
    scroller.setContainer(containerRef.current as Element, maybeHandleScroll)
  }, [])

  return (
    <div ref={containerRef} className='container'>
      <RunnablesContent
        appState={appState}
        runnablesStore={runnablesStore}
        studioEnabled={studioEnabled}
        spec={spec}
        error={error}
        statsStore={statsStore}
      />
    </div>
  )
})

Runnables.displayName = 'Runnables'
export default Runnables
