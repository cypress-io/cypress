import { observer } from 'mobx-react'
import React, { Component } from 'react'

import { AutomationDisconnected } from '../automation-disconnected'
import { automation } from '../automation'
import { NoAutomation } from '../no-automation'
import { AutomationElement } from '../automation-element'

@observer
export class Container extends Component {
  constructor (...args) {
    super(...args)

    this.randomString = `${Math.random()}`

    this._onLaunchBrowser = this._onLaunchBrowser.bind(this)
  }

  componentDidMount () {
    this.props.eventManager.addGlobalListeners(this.props.state, {
      randomString: this.randomString,
      element: `${this.props.config.namespace}-string`,
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
        if (this.props.runner === 'e2e') {
          return this.props.hasSpecFile()
            ? this._app()
            : this._noSpec()
        }

        if (this.props.runner === 'component') {
          return this._app()
        }

        throw Error(`runner prop is required and must be 'e2e' or 'component'. You passed: ${this.props.runner}.`)
    }
  }

  _automationElement () {
    return (
      <AutomationElement namespace={this.props.config.namespace} randomString={this.randomString} />
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

  // This two functions, _noSpec anad _checkSpecFile, are only used by the E2E runner.
  // TODO: remove any runner specific code from this file.
  _noSpec () {
    const { NoSpec } = this.props

    return (
      <NoSpec config={this.props.config} eventManager={this.props.eventManager} onHashChange={this._checkSpecFile}>
        {this._automationElement()}
      </NoSpec>
    )
  }

  // This is only used by the E2E runner.
  _checkSpecFile = () => {
    if (this.props.hasSpecFile()) {
      this.forceUpdate()
    }
  }
}
