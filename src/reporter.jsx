import { observer } from 'mobx-react'
import React, { Component, PropTypes } from 'react'

import events from './lib/events'
import runnablesStore from './runnables/runnables-store'
import statsStore from './header/stats-store'

import Header from './header/header'
import Runnables from './runnables/runnables'

@observer
class Reporter extends Component {
  componentWillMount () {
    this.props.events.init(this.props.runnablesStore, this.props.statsStore)
    this.props.events.listen(this.props.runner)
  }

  render () {
    return (
      <div className='reporter'>
        <Header statsStore={this.props.statsStore} />
        <Runnables runnablesStore={this.props.runnablesStore} specPath={this.props.specPath} />
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
  events,
  runnablesStore,
  statsStore,
}

export default Reporter
