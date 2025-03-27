import { setCtx } from '@packages/data-context'
import _ from 'lodash'

import { makeDataContext } from '../makeDataContext'
import random from '../util/random'
import { telemetry } from '@packages/telemetry'

export = (mode, options) => {
  if (mode === 'smokeTest') {
    return require('./smoke_test').run(options)
  }

  options.isBrowserGivenByCli = options.browser !== undefined

  if (mode === 'run') {
    _.defaults(options, {
      socketId: random.id(10),
      isTextTerminal: true,
      browser: 'electron',
      quiet: false,
      morgan: false,
      report: true,
    })
  }

  const span = telemetry.startSpan({ name: `initialize:mode:${mode}` })
  const ctx = setCtx(makeDataContext({ mode: mode === 'run' ? mode : 'open', modeOptions: options }))

  telemetry.getSpan('cypress')?.setAttribute('name', `cypress:${mode}`)

  const loadingPromise = ctx.initializeMode().then(() => {
    span?.end()
  })

  if (mode === 'run') {
    // run must always be deterministic - if the user doesn't specify
    // a testingType, we default to e2e
    options.testingType = options.testingType || 'e2e'

    return (require('./run') as typeof import('./run')).run(options, loadingPromise)
  }

  if (mode === 'interactive') {
    // Either launchpad or straight to e2e tests
    return (require('./interactive') as typeof import('./interactive')).run(options, loadingPromise)
  }
}
