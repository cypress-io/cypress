import { observer } from 'mobx-react'
import React, { Component, PropTypes } from 'react'

import automation from '../lib/automation'
import runner from '../lib/runner'
import State from '../lib/state'
import windowUtil from '../lib/window-util'

import App from './app'
import AutomationDisconnected from './automation-disconnected'
import NoAutomation from './no-automation'
import NoSpec from './no-spec'

const automationElementId = '__cypress-string'

@observer
class Container extends Component {
  componentWillMount () {
    this.randomString = `${Math.random()}`

    runner.init(this.props.state, {
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
        return windowUtil.hasSpecFile() ? this._app() : this._noSpec()
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
      <App {...this.props} runner={runner.reporterBus}>
        {this._automationElement()}
      </App>
    )
  }

  _noSpec () {
    return (
      <NoSpec onHashChange={this._checkSpecFile}>
        {this._automationElement()}
      </NoSpec>
    )
  }

  _checkSpecFile = () => {
    if (windowUtil.hasSpecFile()) {
      this.forceUpdate()
    }
  }

  _noAutomation () {
    return <NoAutomation
      browsers={this.props.config.browsers}
      onLaunchBrowser={(browser) => runner.launchBrowser(browser)}
    />
  }

  _automationDisconnected () {
    return <AutomationDisconnected onReload={runner.launchBrowser} />
  }
}

Container.propTypes = {
  config: PropTypes.object.isRequired,
  state: PropTypes.instanceOf(State),
}

export default Container
