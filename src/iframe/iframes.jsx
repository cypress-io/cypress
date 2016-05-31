import React, { Component } from 'react'

import runner from '../lib/runner'

import AutIframe from './aut-iframe'
import SpecIframe from './spec-iframe'

export default class Iframes extends Component {
  componentWillMount () {
    runner.start()
  }

  render () {
    return (
      <div id='aut-size-container'>
        <AutIframe ref='autIframe' />
        <SpecIframe onLoaded={this.specIframeLoaded.bind(this)} />
      </div>
    )
  }

  specIframeLoaded (specContentWindow) {
    runner.run(specContentWindow, this.refs.autIframe.getIframe())
  }
}
