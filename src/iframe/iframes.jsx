/* global $ */

import Promise from 'bluebird'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import autIframe from './aut-iframe'
import IframeModel from './iframe-model'
import logger from '../lib/logger'
import runner from '../lib/runner'
import windowUtil from '../lib/window-util'

@observer
export default class Iframes extends Component {
  render () {
    const { width, height, scale, marginLeft } = this.props.state

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
    const specPath = windowUtil.specPath()
    // TODO: need to take headless mode into account
    runner.start(this.props.config, specPath)
    runner.on('restart', this._run.bind(this, specPath))

    this.iframeModel = new IframeModel(this.props.state, {
      detachBody: autIframe.detachBody.bind(autIframe),
      setBody: autIframe.setBody.bind(autIframe),
      highlightEl: autIframe.highlightEl.bind(autIframe),
    })
    this.iframeModel.listen()
    this._run(specPath)
    windowUtil.monitorWindowResize(this.props.state)
  }

  _run (specPath) {
    logger.clearLog()
    this._loadIframes(specPath)
    .then(([specWindow, $autIframe]) => {
      runner.run(specWindow, $autIframe)
    })
  }

  // jQuery is a better fit for managing these iframes, since they need to get
  // wiped out and reset on re-runs and the snapshots are from dom we don't control
  _loadIframes (specPath) {
    return new Promise((resolve) => {
      // TODO: this path should come from the config
      const specSrc = `/__cypress/iframes/${specPath}`

      const $container = $(this.refs.container).empty()
      const $autIframe = autIframe.create(this.props.config).appendTo($container)
      autIframe.showBlankContents()

      const $specIframe = $('<iframe />', {
        id: `Your Spec: '${specSrc}'`,
        class: 'spec-iframe',
      }).appendTo($container)

      $specIframe.prop('src', specSrc).one('load', () => {
        // TODO: is this necessary?
        // make a reference between the iframes
        // @contentWindow.remote = view.$remote[0].contentWindow

        resolve([$specIframe[0].contentWindow, $autIframe])
      })
    })
  }

  componentWillUnmount () {
    runner.stop()
  }
}
