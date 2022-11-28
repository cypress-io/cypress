/* global JSX */
import { action, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import cs from 'classnames'
import React, { Component } from 'react'
import { render } from 'react-dom'
// @ts-ignore
import EQ from 'css-element-queries/src/ElementQueries'

import { RunnablesErrorModel } from './runnables/runnable-error'
import appState, { AppState } from './lib/app-state'
import events, { Runner, Events } from './lib/events'
import runnablesStore, { RunnablesStore } from './runnables/runnables-store'
import scroller, { Scroller } from './lib/scroller'
import statsStore, { StatsStore } from './header/stats-store'
import shortcuts from './lib/shortcuts'

import Header, { ReporterHeaderProps } from './header/header'
import Runnables from './runnables/runnables'
import TestingPreferences from './preferences/testing-preferences'
import type { MobxRunnerStore } from '@packages/app/src/store/mobx-runner-store'

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
  runMode: 'single'
}

@observer
class Reporter extends Component<SingleReporterProps> {
  static defaultProps: Partial<SingleReporterProps> = {
    runMode: 'single',
    appState,
    events,
    runnablesStore,
    scroller,
    statsStore,
  }

  render () {
    const {
      appState,
      className,
      runnablesStore,
      scroller,
      error,
      statsStore,
      studioEnabled,
      renderReporterHeader = (props: ReporterHeaderProps) => <Header {...props}/>,
    } = this.props

    return (
      <div className={cs(className, 'reporter', {
        'studio-active': appState.studioActive,
      })}>
        {renderReporterHeader({ appState, statsStore })}
        {appState?.isPreferencesMenuOpen ? (
          <TestingPreferences appState={appState} />
        ) : (
          this.props.runnerStore.spec && <Runnables
            appState={appState}
            error={error}
            runnablesStore={runnablesStore}
            scroller={scroller}
            spec={this.props.runnerStore.spec}
            statsStore={this.props.statsStore}
            studioEnabled={studioEnabled}
            canSaveStudioLogs={this.props.runnerStore.canSaveStudioLogs}
          />
        )}
      </div>
    )
  }

  // this hook will only trigger if we switch spec file at runtime
  // it never happens in normal e2e but can happen in component-testing mode
  componentDidUpdate (newProps: BaseReporterProps) {
    if (!this.props.runnerStore.spec) {
      throw Error(`Expected runnerStore.spec not to be null.`)
    }

    this.props.runnablesStore.setRunningSpec(this.props.runnerStore.spec.relative)
    if (
      this.props.resetStatsOnSpecChange &&
      this.props.runnerStore.specRunId !== newProps.runnerStore.specRunId
    ) {
      runInAction('reporter:stats:reset', () => {
        this.props.statsStore.reset()
      })
    }
  }

  componentDidMount () {
    const { appState, runnablesStore, runner, scroller, statsStore, autoScrollingEnabled, isSpecsListOpen, runnerStore } = this.props

    if (!runnerStore.spec) {
      throw Error(`Expected runnerStore.spec not to be null.`)
    }

    action('set:scrolling', () => {
      appState.setAutoScrolling(autoScrollingEnabled)
    })()

    action('set:specs:list', () => {
      appState.setSpecsList(isSpecsListOpen ?? false)
    })()

    this.props.events.init({
      appState,
      runnablesStore,
      scroller,
      statsStore,
    })

    this.props.events.listen(runner)

    shortcuts.start()
    EQ.init()
    this.props.runnablesStore.setRunningSpec(runnerStore.spec.relative)
  }

  componentWillUnmount () {
    shortcuts.stop()
  }
}

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
  window.state = appState
  window.render = (props) => {
    // @ts-ignore
    render(<Reporter {...props as Required<BaseReporterProps>} />, document.getElementById('app'))
  }
}

export { Reporter }
