import cs from 'classnames'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { render } from 'react-dom'
// @ts-ignore
import EQ from 'css-element-queries/src/ElementQueries'

import { Error } from './errors/an-error'
import appState, { AppState } from './lib/app-state'
import events, { Runner, Events } from './lib/events'
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
  error?: Error
  specPath: string
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
    specPath: PropTypes.string.isRequired,
  }

  static defaultProps = {
    appState,
    events,
    runnablesStore,
    scroller,
    statsStore,
  }

  componentWillMount () {
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
  }

  render () {
    const { appState } = this.props

    return (
      <div className={cs('reporter', { 'is-running': appState.isRunning })}>
        <Header appState={appState} statsStore={this.props.statsStore} />
        <Runnables
          appState={appState}
          error={this.props.error}
          runnablesStore={this.props.runnablesStore}
          scroller={this.props.scroller}
          specPath={this.props.specPath}
        />
      </div>
    )
  }

  componentDidMount () {
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
    render: ((props: ReporterProps) => void)
  }
}

if (window.Cypress) {
  window.state = appState
  window.render = (props) => {
    render(<Reporter {...props} />, document.getElementById('app'))
  }
}

export { Reporter }
