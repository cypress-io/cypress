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
    const { width, height, scale, marginLeft } = this.props.uiState

    return <div
      ref='container'
      className='size-container'
      style={{
        marginLeft,
        height,
        transform: `scale(${scale})`,
        width,
      }}
    />
  }

  componentDidMount () {
    const specFile = this.specFile = windowUtil.specFile()
    // TODO: need to take headless mode into account
    runner.start(this.props.config, specFile)
    runner.on('restart', this._run.bind(this))

    this.iframeModel = new IframeModel(this.props.uiState)
    this.iframeModel.listen()
    this._run()
    windowUtil.monitorWindowResize(this.props.uiState)
  }

  _run () {
    this._loadIframes(this.specFile).then(([specWindow, $autIframe]) => {
      runner.run(specWindow, $autIframe)
    })
  }

  // jQuery is a better fit for managing these iframes, since they need to get
  // wiped out and reset on re-runs
  _loadIframes (specFile) {
    return new Promise((resolve) => {
      const name = this.props.config.projectName
      // this path should come from the config
      const specSrc = `/__cypress/iframes/${specFile}`

      const $container = $(this.refs.container).empty()

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
