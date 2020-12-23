import { runInAction, configure } from 'mobx'
import * as React from 'react'
import { render } from 'react-dom'
import { utils as driverUtils } from '@packages/driver'
import { state } from './lib/state'
import defaultEvents from '@packages/reporter/src/lib/events'

const Container = React.lazy(() => import(/* webpackChunkName: "ctChunk-RunnerContainer" */ './app/container'))

// to support async/await
import 'regenerator-runtime/runtime'

configure({ enforceActions: 'always' })

const Runner = {
  emit (evt, ...args) {
    defaultEvents.emit(evt, ...args)
  },

  start (el, base64Config) {
    runInAction('started', () => {
      const config = JSON.parse(driverUtils.decodeBase64Unicode(base64Config))

      window.__cypressConfig = config
      const NO_COMMAND_LOG = config.env && config.env.NO_COMMAND_LOG
      const configState = config.state || {}

      if (NO_COMMAND_LOG) {
        configState.reporterWidth = 0
      }

      Runner.state = state
      Runner.configureMobx = configure

      state.updateDimensions(config.viewportWidth, config.viewportHeight)

      render((
        <React.Suspense fallback={null}>
          <Container config={config} state={state} />
        </React.Suspense>
      ), el)
    })
  },
}

window.Runner = Runner
