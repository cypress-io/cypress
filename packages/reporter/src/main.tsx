/* global JSX */
import { action } from 'mobx'
import { observer } from 'mobx-react'
import cs from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-ignore
import EQ from 'css-element-queries/src/ElementQueries'

import type { RunnablesErrorModel } from './runnables/runnable-error'
import appStateDefault, { AppState } from './lib/app-state'
import events, { Events, Runner } from './lib/events'
import runnablesStore, { RunnablesStore } from './runnables/runnables-store'
import scroller, { Scroller } from './lib/scroller'
import statsStore, { StatsStore } from './header/stats-store'
import shortcuts from './lib/shortcuts'

import Header, { ReporterHeaderProps } from './header/header'
import Runnables from './runnables/runnables'
import TestingPreferences from './preferences/testing-preferences'
import type { MobxRunnerStore } from '@packages/app/src/store/mobx-runner-store'

function usePrevious (value) {
  const ref = useRef()

  useEffect(() => {
    ref.current = value
  }, [])

  return ref.current
}

export interface BaseReporterProps {
  appState: AppState
  className?: string
  runnablesStore: RunnablesStore
  runner: Runner
  scroller: Scroller
  statsStore: StatsStore
  autoScrollingEnabled?: boolean
  isSpecsListOpen?: boolean
  events: Events
  error?: RunnablesErrorModel
  resetStatsOnSpecChange?: boolean
  renderReporterHeader?: (props: ReporterHeaderProps) => JSX.Element
  studioEnabled: boolean
  runnerStore: MobxRunnerStore
}

export interface SingleReporterProps extends BaseReporterProps{
  runMode?: 'single'
}

// In React Class components (now deprecated), we used to use appState as a default prop. Now since defaultProps are not supported in functional components, we can use ES6 default params to accomplish the same thing
const Reporter: React.FC<SingleReporterProps> = observer(({ appState = appStateDefault, runner, className, error, runMode = 'single', studioEnabled, autoScrollingEnabled, isSpecsListOpen, resetStatsOnSpecChange, renderReporterHeader = (props: ReporterHeaderProps) => <Header {...props}/>, runnerStore }) => {
  const previousSpecRunId = usePrevious(runnerStore.specRunId)
  const [isMounted, setIsMounted] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // this registration needs to happen synchronously and not async inside useEffect or else the events will not be registered and the reporter might hang inside cy-in-cy tests
  if (!isInitialized) {
    events.init({
      appState,
      runnablesStore,
      scroller,
      statsStore,
    })

    events.listen(runner)
    setIsInitialized(true)
  }

  useEffect(() => {
    if (!runnerStore.spec) {
      throw Error(`Expected runnerStore.spec not to be null.`)
    }

    action('set:scrolling', () => {
      // set the initial enablement of auto scroll configured inside the user preferences when the app is loaded
      appState.setAutoScrollingUserPref(autoScrollingEnabled)
    })()

    action('set:specs:list', () => {
      appState.setSpecsList(isSpecsListOpen ?? false)
    })()

    shortcuts.start()
    EQ.init()
    runnablesStore.setRunningSpec(runnerStore.spec.relative)
    // we need to know when the test is mounted for our reporter tests. see
    setIsMounted(true)

    return () => shortcuts.stop()
  }, [])

  useEffect(() => {
    if (!runnerStore.spec) {
      throw Error(`Expected runnerStore.spec not to be null.`)
    }

    runnablesStore.setRunningSpec(runnerStore.spec.relative)
    if (
      resetStatsOnSpecChange &&
        runnerStore.specRunId !== previousSpecRunId
    ) {
      statsStore.reset()
    }
  }, [runnerStore.spec, runnerStore.specRunId, resetStatsOnSpecChange, previousSpecRunId])

  return (
    <div className={cs(className, 'reporter', {
      'studio-active': appState.studioActive,
      'mounted': isMounted,
    })}>
      {renderReporterHeader({ appState, statsStore, runnablesStore })}
      {appState?.isPreferencesMenuOpen ? (
        <TestingPreferences appState={appState} />
      ) : (
        runnerStore.spec && <Runnables
          appState={appState}
          error={error}
          runnablesStore={runnablesStore}
          scroller={scroller}
          spec={runnerStore.spec}
          statsStore={statsStore}
          studioEnabled={studioEnabled}
          canSaveStudioLogs={runnerStore.canSaveStudioLogs}
        />
      )}
    </div>
  )
})

declare global {
  interface Window {
    Cypress: any
    state: AppState
    render: ((props: Partial<BaseReporterProps>) => void)
    __CYPRESS_MODE__: 'run' | 'open'
  }
}

// NOTE: this is for testing Cypress-in-Cypress
if (window.Cypress) {
  window.state = appStateDefault
  window.render = (props) => {
    const container: HTMLElement = document.getElementById('app') as HTMLElement
    const root = createRoot(container)

    root.render(<Reporter {...props as Required<BaseReporterProps>} />)
  }
}

export { Reporter }
