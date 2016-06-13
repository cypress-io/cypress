import { observer } from 'mobx-react'
import React, { Component } from 'react'

import automation from '../lib/automation'
import runner from '../lib/runner'

import Header from '../header/header'
import Iframes from '../iframe/iframes'
import Message from '../message/message'
import NoAutomation from './no-automation'
import AutomationDisconnected from './automation-disconnected'

const automationElementId = '__cypress-string'

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
    return <div id={automationElementId} className='automation-string'>{this.randomString}</div>
  }

  _app () {
    // for some reason the height: 100% div is needed
    // or the header disappears randomly
    return (
      <div className='container'>
        <div style={{ height: '100%' }}>
          <Header {...this.props} />
          <Iframes {...this.props} />
          <Message {...this.props} />
          {this._automationElement()}
        </div>
      </div>
    )
  }

  _noAutomation () {
    return (
      <NoAutomation
        browsers={this.props.config.browsers}
        onLaunchBrowser={(browser) => runner.launchBrowser(browser)}
      />
    )
  }

  _automationDisconnected () {
    return <AutomationDisconnected onReload={runner.launchBrowser} />
  }
}
