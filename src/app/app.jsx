import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Reporter from '@cypress/core-reporter'

import automation from '../lib/automation'
import runner from '../lib/runner'
import windowUtil from '../lib/window-util'

import Header from '../header/header'
import Iframes from '../iframe/iframes'
import Message from '../message/message'
import NoAutomation from './no-automation'
import AutomationDisconnected from './automation-disconnected'

const automationElementId = '__cypress-string'

const InRunner = (props) => (
  <div {...props} className={`runner ${props.className}`}>
    {props.children}
  </div>
)

@observer
export default class App extends Component {
  componentWillMount () {
    this.randomString = `${Math.random()}`

    runner.ensureAutomation({
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
    // for some reason the height: 100% div is needed
    // or the header disappears randomly
    return (
      <div>
        <Reporter runner={runner.reporterBus} specPath={this._specPath()} />
        <InRunner className='container' style={{ height: '100%' }}>
          <Header {...this.props} />
          <Iframes {...this.props} />
          <Message {...this.props} />
          {this._automationElement()}
        </InRunner>
      </div>
    )
  }

  _specPath () {
    return `${this.props.config.integrationFolder}/${windowUtil.specFile()}`
  }

  _noAutomation () {
    return (
      <InRunner className='automation-failure'>
        <NoAutomation
          browsers={this.props.config.browsers}
          onLaunchBrowser={(browser) => runner.launchBrowser(browser)}
        />
      </InRunner>
    )
  }

  _automationDisconnected () {
    return (
      <InRunner className='automation-failure'>
        <AutomationDisconnected onReload={runner.launchBrowser} />
      </InRunner>
    )
  }
}
