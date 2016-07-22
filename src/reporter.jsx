import { observer } from 'mobx-react'
import React, { Component, PropTypes } from 'react'

import appState from './lib/app-state'
import events from './lib/events'
import runnablesStore from './runnables/runnables-store'
import statsStore from './header/stats-store'

import Header from './header/header'
import Runnables from './runnables/runnables'

@observer
class Reporter extends Component {
  componentWillMount () {
    const { appState, runnablesStore, runner, statsStore } = this.props
    this.props.events.init({
      appState,
      runnablesStore,
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
  statsStore,
}

export default Reporter
