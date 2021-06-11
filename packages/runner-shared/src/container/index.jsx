import { observer } from 'mobx-react'
import React, { Component } from 'react'

import {
  AutomationDisconnected,
  NoAutomation,
  eventManager,
  automation,
} from '@packages/runner-shared'

export const automationElementId = '__cypress-string'

@observer
export class Container extends Component {
  constructor (...args) {
    super(...args)

    this.randomString = `${Math.random()}`

    this._onLaunchBrowser = this._onLaunchBrowser.bind(this)
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
        return this.props.hasSpecFile() ? this._app() : this._noSpec()
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
    const { App, ...rest } = this.props

    return (
      <App {...rest}>
        {this._automationElement()}
      </App>
    )
  }

  _checkSpecFile = () => {
    if (this.props.hasSpecFile()) {
      this.forceUpdate()
    }
  }

  _noAutomation () {
    return (
      <NoAutomation
        browsers={this.props.config.browsers}
        onLaunchBrowser={this._onLaunchBrowser}
      />
    )
  }

  _onLaunchBrowser (browser) {
    this.props.eventManager.launchBrowser(browser)
  }

  _automationDisconnected () {
    return <AutomationDisconnected onReload={this.props.eventManager.launchBrowser} />
  }

  _noSpec () {
    const { NoSpec } = this.props

    return (
      <NoSpec config={this.props.config} onHashChange={this._checkSpecFile}>
        {this._automationElement()}
      </NoSpec>
    )
  }
}

Container.defaultProps = {
  eventManager,
}
