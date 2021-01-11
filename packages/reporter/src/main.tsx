/* global Cypress, JSX */
import { action, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import cs from 'classnames'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { render } from 'react-dom'
// @ts-ignore
import EQ from 'css-element-queries/src/ElementQueries'

import { RunnablesErrorModel } from './runnables/runnable-error'
import appState, { AppState } from './lib/app-state'
import events, { Runner, Events } from './lib/events'
import ForcedGcWarning from './lib/forced-gc-warning'
import runnablesStore, { RunnablesStore } from './runnables/runnables-store'
import scroller, { Scroller } from './lib/scroller'
import statsStore, { StatsStore } from './header/stats-store'
import shortcuts from './lib/shortcuts'

import Header, { ReporterHeaderProps } from './header/header'
import Runnables from './runnables/runnables'

<<<<<<< HEAD
type ReporterProps = {
=======
interface BaseReporterProps {
>>>>>>> develop
  appState: AppState
  runnablesStore: RunnablesStore
  runner: Runner
  scroller: Scroller
  statsStore: StatsStore
  events: Events
  error?: RunnablesErrorModel
  resetStatsOnSpecChange?: boolean
  renderReporterHeader?: (props: ReporterHeaderProps) => JSX.Element;
  spec: Cypress.Cypress['spec']
<<<<<<< HEAD
} & ({
  runMode: 'single',
} | {
  runMode: 'multi',
  allSpecs: Array<Cypress.Cypress['spec']>
})
=======
  /** Used for component testing front-end */
  specRunId?: string | null
}

export interface SingleReporterProps extends BaseReporterProps{
  runMode: 'single',
}

export interface MultiReporterProps extends BaseReporterProps{
  runMode: 'multi',
  allSpecs: Array<Cypress.Cypress['spec']>
}
>>>>>>> develop

@observer
class Reporter extends Component<SingleReporterProps | MultiReporterProps> {
  static propTypes = {
    error: PropTypes.shape({
      title: PropTypes.string.isRequired,
      link: PropTypes.string,
      callout: PropTypes.string,
      message: PropTypes.string.isRequired,
    }),
    runner: PropTypes.shape({
      emit: PropTypes.func.isRequired,
      on: PropTypes.func.isRequired,
    }).isRequired,
    spec: PropTypes.shape({
      name: PropTypes.string.isRequired,
      relative: PropTypes.string.isRequired,
      absolute: PropTypes.string.isRequired,
    }),
  }

  static defaultProps = {
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
      runMode,
      runnablesStore,
      scroller,
      error,
      events,
      statsStore,
<<<<<<< HEAD
      renderReporterHeader = (props) => <Header {...props}/>,
=======
      renderReporterHeader = (props: ReporterHeaderProps) => <Header {...props}/>,
>>>>>>> develop
    } = this.props

    return (
      <div className={cs('reporter', { multiSpecs: runMode === 'multi' })}>
        {renderReporterHeader({ appState, statsStore })}
        {this.props.runMode === 'single' ? (
          <Runnables
            appState={appState}
            error={error}
            runnablesStore={runnablesStore}
            scroller={scroller}
            spec={this.props.spec}
          />
        ) : this.props.allSpecs.map((spec) => (
          <Runnables
            key={spec.relative}
            appState={appState}
            error={error}
            runnablesStore={runnablesStore}
            scroller={scroller}
            spec={spec}
          />
        ))}

        <ForcedGcWarning
          appState={appState}
          events={events}/>
      </div>
    )
  }

  // this hook will only trigger if we switch spec file at runtime
  // it never happens in normal e2e but can happen in component-testing mode
<<<<<<< HEAD
  componentDidUpdate (newProps: ReporterProps) {
=======
  componentDidUpdate (newProps: BaseReporterProps) {
>>>>>>> develop
    this.props.runnablesStore.setRunningSpec(this.props.spec.relative)

    if (
      this.props.resetStatsOnSpecChange &&
<<<<<<< HEAD
      this.props.spec.relative !== newProps.spec.relative
=======
      this.props.specRunId !== newProps.specRunId
>>>>>>> develop
    ) {
      runInAction('reporter:stats:reset', () => {
        this.props.statsStore.reset()
      })
    }
  }

  componentDidMount () {
<<<<<<< HEAD
    const { spec, appState, runnablesStore, runner, scroller, statsStore } = this.props
=======
    const { spec, appState, autoScrollingEnabled, runnablesStore, runner, scroller, statsStore } = this.props
>>>>>>> develop

    action('set:scrolling', () => {
      appState.setAutoScrolling(appState.autoScrollingEnabled)
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
