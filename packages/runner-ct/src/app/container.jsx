import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

import automation from '../lib/automation'
import eventManager from '../lib/event-manager'
import State from '../lib/state'
import util from '../lib/util'

import RunnerCt from './RunnerCt'
import AutomationDisconnected from '../errors/automation-disconnected'
import NoAutomation from '../errors/no-automation'

const automationElementId = '__cypress-string'

@observer
class Container extends Component {
  constructor (...args) {
    super(...args)

    this.randomString = `${Math.random()}`
  }

  componentDidMount () {
    this.props.eventManager.addGlobalListeners(this.props.state, {
      element: automationElementId,
      string: this.randomString,
    })
  }

  render () {
    switch (this.props.state.automation) {
      case automation.CONNECTING:
        return this._automationElement()
      case automation.MISSING:
        return this._noAutomation()
      case automation.DISCONNECTED:
        return this._automationDisconnected()
      case automation.CONNECTED:
      default:
        return this._app()
    }
  }

  _automationElement () {
    return (
      <div id={automationElementId} style={{ display: 'none' }}>
        {this.randomString}
      </div>
    )
  }

  _app () {
    return (
      <RunnerCt {...this.props}>
        {this._automationElement()}
      </RunnerCt>
    )
  }

  _checkSpecFile = () => {
    if (this.props.util.hasSpecFile()) {
      this.forceUpdate()
    }
  }

  _noAutomation () {
    return (
      <NoAutomation
        browsers={this.props.config.browsers}
        onLaunchBrowser={(browser) => this.props.eventManager.launchBrowser(browser)}
      />
    )
  }

  _automationDisconnected () {
    return <AutomationDisconnected onReload={this.props.eventManager.launchBrowser} />
  }
}

Container.defaultProps = {
  eventManager,
  util,
}

Container.propTypes = {
  config: PropTypes.object.isRequired,
  state: PropTypes.instanceOf(State),
}

export { automationElementId }

export default Container
