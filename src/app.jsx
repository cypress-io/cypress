import React, { Component } from 'react'

import runner from './lib/runner'

import Header from './header/header'
import Iframes from './iframe/iframes'

const elementId = "__cypress-string"

export default class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      automationEnsured: false,
      automationConnected: null,
    }
  }

  componentWillMount () {
    const str = this.randomString = `${Math.random()}`

    const connectionInfo = {
      element: elementId,
      string: str,
    }

    runner.ensureAutomation(connectionInfo)
    .then((isConnected) => {
      if (isConnected) {
        this.setState({ automationEnsured: true, automationConnected: true })
      } else {
        this.setState({ automationConnected: false })
      }
    })
  }

  render () {
    if (this.state.automationConnected === false) {
      // available browsers are in this.props.config
      return <div>Failed to connect!</div>
    }

    if (!this.state.automationEnsured) {
      return this._automationElement()
    }

    return (
      <div className="container">
        <Header {...this.props} />
        <Iframes {...this.props} />
        {this._automationElement()}
      </div>
    )
  }

  _automationElement () {
    return <div id={elementId}>{this.randomString}</div>
  }
}
