export = (mode, options) => {
  if (mode === 'record') {
    return require('./record').run(options)
  }

  if (mode === 'smokeTest') {
    return require('./smoke_test').run(options)
  }

  if (mode === 'run') {
    if (options.testingType === 'component') {
      return require('./run-ct').run(options)
    }

    // run must always be deterministic - if the user doesn't specify
    // a testingType, we default to e2e
    options.testingType = 'e2e'

    return require('./run-e2e').run(options)
  }

  if (mode === 'interactive') {
    if (options.testingType === 'component' && !process.env.LAUNCHPAD) {
      return require('./interactive-ct').run(options)
    }

    // Either launchpad or straight to e2e tests
    return require('./interactive-e2e').run(options)
  }
}
