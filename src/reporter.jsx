import { observer } from 'mobx-react'
import React, { Component, PropTypes } from 'react'

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
    const { appState, runnablesStore, runner, scroller, statsStore } = this.props
    this.props.events.init({
      appState,
      runnablesStore,
      scroller,
      statsStore,
    })
    this.props.events.listen(runner)
  }

  render () {
    return (
      <div className='reporter'>
        <Header appState={this.props.appState} statsStore={this.props.statsStore} />
        <Runnables
          appState={this.props.appState}
          runnablesStore={this.props.runnablesStore}
          scroller={this.props.scroller}
          specPath={this.props.specPath}
        />
      </div>
    )
  }
}

Reporter.propTypes = {
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
