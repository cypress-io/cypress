import { setCtx } from '@packages/data-context'
import _ from 'lodash'

import { makeDataContext } from '../makeDataContext'
import random from '../util/random'

export = (mode, options) => {
  if (mode === 'record') {
    return require('./record').run(options)
  }

  if (mode === 'smokeTest') {
    return require('./smoke_test').run(options)
  }

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

  const ctx = setCtx(makeDataContext({ mode: mode === 'run' ? mode : 'open', modeOptions: options }))
  const loadingPromise = ctx.initializeMode()

  if (mode === 'run') {
    if (options.testingType === 'component') {
      return require('./run-ct').run(options, loadingPromise)
    }

    // run must always be deterministic - if the user doesn't specify
    // a testingType, we default to e2e
    options.testingType = 'e2e'

    return require('./run-e2e').run(options, loadingPromise)
  }

  if (mode === 'interactive') {
    // Either launchpad or straight to e2e tests
    return require('./interactive').run(options, loadingPromise)
  }
}
