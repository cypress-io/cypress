import { action } from 'mobx'
import { observer } from 'mobx-react'
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

import Header from './header/header'
import Runnables from './runnables/runnables'

export interface ReporterProps {
  appState: AppState
  autoScrollingEnabled?: boolean
  runnablesStore: RunnablesStore
  runner: Runner
  scroller: Scroller
  statsStore: StatsStore
  events: Events
  error?: RunnablesErrorModel
  spec: Cypress.Cypress['spec']
}

@observer
class Reporter extends Component<ReporterProps> {
  static propTypes = {
    autoScrollingEnabled: PropTypes.bool,
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
    appState,
    events,
    runnablesStore,
    scroller,
    statsStore,
  }

  render () {
    const { appState, runnablesStore, spec, scroller, error, events, statsStore } = this.props

    return (
      <div className='reporter'>
        <Header appState={appState} statsStore={statsStore} />
        <Runnables
          appState={appState}
          error={error}
          runnablesStore={runnablesStore}
          scroller={scroller}
          spec={spec}
        />
        <ForcedGcWarning
          appState={appState}
          events={events}/>
      </div>
    )
  }

  // this hoof will only trigger if we switch spec file at runtime
  // it never happens in normal e2e but can happen in component-testing mode
  componentDidUpdate (newProps: ReporterProps) {
    if (this.props.spec.relative !== newProps.spec.relative) {
      action('reporter:stats:reset', () => {
        this.props.statsStore.reset()
      })()
    }
  }

  componentDidMount () {
    const { appState, autoScrollingEnabled, runnablesStore, runner, scroller, statsStore } = this.props

    action('set:scrolling', () => {
      appState.setAutoScrolling(autoScrollingEnabled)
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
  }

  componentWillUnmount () {
    shortcuts.stop()
  }
}

declare global {
  interface Window {
    Cypress: any
    state: AppState
    render: ((props: Partial<ReporterProps>) => void)
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
