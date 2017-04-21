import cs from 'classnames'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component, PropTypes } from 'react'
import EQ from 'css-element-queries/src/ElementQueries'

import appState from './lib/app-state'
import events from './lib/events'
import runnablesStore from './runnables/runnables-store'
import scroller from './lib/scroller'
import statsStore from './header/stats-store'

import Header from './header/header'
import Runnables from './runnables/runnables'

@observer
class Reporter extends Component {
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
    EQ.init()
  }
}

Reporter.propTypes = {
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

Reporter.defaultProps = {
  appState,
  events,
  runnablesStore,
  scroller,
  statsStore,
}

export default Reporter
