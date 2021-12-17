/* global Cypress, JSX */
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

interface BaseReporterProps {
  appState?: AppState
  className?: string
  runnablesStore?: RunnablesStore
  runner: Runner
  scroller?: Scroller
  statsStore?: StatsStore
  autoScrollingEnabled?: boolean
  isSpecsListOpen?: boolean
  events?: Events
  error?: RunnablesErrorModel
  resetStatsOnSpecChange?: boolean
  renderReporterHeader?: (props: ReporterHeaderProps) => JSX.Element
  spec: Cypress.Cypress['spec']
  experimentalStudioEnabled: boolean
  /** Used for component testing front-end */
  specRunId?: string | null
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
      experimentalStudioEnabled,
      renderReporterHeader = (props: ReporterHeaderProps) => <Header {...props}/>,
    } = this.props

    return (
      <div className={cs(className, 'reporter', {
        'experimental-studio-enabled': experimentalStudioEnabled,
        'studio-active': appState.studioActive,
      })}>
        {renderReporterHeader({ appState, statsStore })}
        {appState?.isPreferencesMenuOpen ? (
          <TestingPreferences appState={appState} />
        ) : (
          <Runnables
            appState={appState}
            error={error}
            runnablesStore={runnablesStore}
            scroller={scroller}
            spec={this.props.spec}
          />
        )}
      </div>
    )
  }

  // this hook will only trigger if we switch spec file at runtime
  // it never happens in normal e2e but can happen in component-testing mode
  componentDidUpdate (newProps: BaseReporterProps) {
    this.props.runnablesStore.setRunningSpec(this.props.spec.relative)
    if (
      this.props.resetStatsOnSpecChange &&
      this.props.specRunId !== newProps.specRunId
    ) {
      runInAction('reporter:stats:reset', () => {
        this.props.statsStore.reset()
      })
    }
  }

  componentDidMount () {
    const { spec, appState, runnablesStore, runner, scroller, statsStore, autoScrollingEnabled, isSpecsListOpen } = this.props

    action('set:scrolling', () => {
      appState.setAutoScrolling(autoScrollingEnabled)
    })()

    action('set:specs:list', () => {
      appState.setSpecsList(isSpecsListOpen ?? true)
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
    this.props.runnablesStore.setRunningSpec(spec.relative)
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
  }
}

// NOTE: this is for testing Cypress-in-Cypress
if (window.Cypress) {
  window.state = appState
  window.render = (props) => {
    // @ts-ignore
    render(<Reporter {...props as Required<ReporterProps>} />, document.getElementById('app'))
  }
}

export { Reporter }
