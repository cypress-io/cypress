/* global $ */

import Promise from 'bluebird'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import blankContents from './blank-contents'
import IframeModel from './iframe-model'
import runner from '../lib/runner'
import windowUtil from '../lib/window-util'

@observer
export default class Iframes extends Component {
  render () {
    const { width, height, scale } = this.props.uiState

    return <div
      ref='container'
      className='size-container'
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scale})`,
      }}
    />
  }

  componentWillMount () {
    runner.start(this.props.config)

    this.iframeModel = new IframeModel(this.props.uiState)
    this.iframeModel.listen()
  }

  componentDidMount () {
    this._loadIframes().then(([specWindow, $autIframe]) => {
      runner.run(specWindow, $autIframe)
    })

    windowUtil.monitorWindowResize(this.props.uiState)
  }

  // jQuery is a better fit for managing these iframes, since they need to get
  // wiped out and reset on re-runs
  _loadIframes () {
    return new Promise((resolve) => {
      const name = this.props.config.projectName
      const specSrc = `/__cypress/iframes/${windowUtil.specSrc()}`

      const $container = $(this.refs.container)

      const $autIframe = $('<iframe>', {
        id: `Your App: '${name}'`,
        class: 'aut-iframe',
      }).appendTo($container)

      $autIframe.contents().find('body').append(blankContents)

      const $specIframe = $('<iframe />', {
        id: `Your Spec: '${specSrc}'`,
        class: 'spec-iframe',
      }).appendTo($container)

      $specIframe.prop('src', specSrc).one('load', () => {
        // make a reference between the iframes
        // @contentWindow.remote = view.$remote[0].contentWindow

        resolve([$specIframe[0].contentWindow, $autIframe])
        // view.$el.show()
        // view.calcWidth()
      })
    })
  }

  componentWillUnmount () {
    this.iframeModel.stopListening()
  }
}
