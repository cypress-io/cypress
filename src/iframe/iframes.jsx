/* global $ */

import { observer } from 'mobx-react'
import React, { Component } from 'react'

import blankContents from './blank-contents'
import IframeModel from './iframe-model'
import runner from '../lib/runner'

@observer
export default class Iframes extends Component {
  render () {
    const { width, height } = this.props.uiState

    return <div
      ref='container'
      id='aut-size-container'
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  }

  componentWillMount () {
    this.iframeModel = new IframeModel(this.props.uiState)
    this.iframeModel.listen()

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
  }

  componentWillUnmount () {
    this.iframeModel.stopListening()
  }
}
