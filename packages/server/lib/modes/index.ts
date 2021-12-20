import { clearCtx, setCtx } from '@packages/data-context'
import { makeDataContext } from '../makeDataContext'

export = (mode, options) => {
  if (mode === 'record') {
    return require('./record').run(options)
  }

  if (mode === 'smokeTest') {
    return require('./smoke_test').run(options)
  }

  // When we're in testing mode, this is setup automatically as a beforeEach
  clearCtx()

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
    process.env.LAUNCHPAD = '1'

    // Either launchpad or straight to e2e tests
    return require('./interactive-e2e').run(options, loadingPromise)
  }
}
