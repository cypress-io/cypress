/* global $ */

import Promise from 'bluebird'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import AutIframe from './aut-iframe'
import IframeModel from './iframe-model'
import logger from '../lib/logger'
import runner from '../lib/runner'
import windowUtil from '../lib/window-util'

@observer
export default class Iframes extends Component {
  render () {
    const { width, height, scale, marginLeft, headerHeight } = this.props.state

    return (
      <div
        className='iframes-container'
        style={{ top: headerHeight }}
      >
        <div
          ref='container'
          className='size-container'
          style={{
            marginLeft,
            height,
            transform: `scale(${scale})`,
            width,
          }}
        />
      </div>
    )
  }

  componentDidMount () {
    this.autIframe = new AutIframe(this.props.config)

    runner.on('visit:failed', this.autIframe.showVisitFailure)

    // TODO: need to take headless mode into account
    // may need to not display reporter if more than 200 tests
    runner.on('restart', this._run.bind(this))

    runner.start(this.props.config)

    this.iframeModel = new IframeModel(this.props.state, {
      detachBody: this.autIframe.detachBody,
      removeHeadStyles: this.autIframe.removeHeadStyles,
      setBody: this.autIframe.setBody,
      highlightEl: this.autIframe.highlightEl,
    })
    this.iframeModel.listen()
    this._run()

  }

  _run () {
    const specPath = windowUtil.specPath()
    this.props.runner.notifyRunningSpec(specPath)
    logger.clearLog()

    this._loadIframes(specPath)
    .then(([specWindow, $autIframe]) => {
      runner.run(specPath, specWindow, $autIframe)
    })
  }

  // jQuery is a better fit for managing these iframes, since they need to get
  // wiped out and reset on re-runs and the snapshots are from dom we don't control
  _loadIframes (specPath) {
    return new Promise((resolve) => {
      // TODO: config should have "iframeUrl": "/__cypress/iframes"
      const specSrc = `/${this.props.config.namespace}/iframes/${specPath}`

      const $container = $(this.refs.container).empty()
      const $autIframe = this.autIframe.create(this.props.config).appendTo($container)
      this.autIframe.showBlankContents()

      const $specIframe = $('<iframe />', {
        id: `Your Spec: '${specSrc}'`,
        class: 'spec-iframe',
      }).appendTo($container)

      $specIframe.prop('src', specSrc).one('load', () => {
        resolve([$specIframe[0].contentWindow, $autIframe])
      })
    })
  }

  componentWillUnmount () {
    this.props.runner.notifyRunningSpec(null)
    runner.stop()
  }
}
