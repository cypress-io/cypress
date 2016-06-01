/* global $ */

import React, { Component } from 'react'

import blankContents from './blank-contents'
import Cypress from '../lib/cypress'
import runner from '../lib/runner'

export default class Iframes extends Component {
  constructor (props) {
    super(props)

    // TODO: move this to UI State
    this.state = {
      width: 1000,
      height: 660,
    }
  }

  render () {
    const { width, height } = this.state

    return <div
      ref='container'
      id='aut-size-container'
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  }

  componentWillMount () {
    runner.start()
  }

  // jQuery is a better fit for managing these iframes, since they need to get
  // wiped out and reset on re-runs
  componentDidMount () {
    const name = 'foobar' //App.config.get('projectName')
    const specSrc = '/__cypress/aut/test.html' // should come from URL hash

    const $container = $(this.refs.container)

    const $autIframe = $('<iframe>', {
      id: `Your App: '${name}'`,
      class: 'iframe-aut',
    })
    .appendTo($container)

    $autIframe.contents().find('body').append(blankContents)

    const $specIframe = $('<iframe />', {
      id: `Your Spec: '${specSrc}'`,
      class: 'iframe-spec',
    }).appendTo($container)

    $specIframe.prop('src', specSrc).one('load', () => {
      // make a reference between the iframes
      // @contentWindow.remote = view.$remote[0].contentWindow

      runner.run($specIframe[0].contentWindow, $autIframe)
      // view.$el.show()
      // view.calcWidth()
    })

    // TODO: should go elsewhere and update UI state
    Cypress.on('viewport', (viewport) => {
      this.setState({
        width: viewport.viewportWidth,
        height: viewport.viewportHeight,
      })
    })
  }
}
