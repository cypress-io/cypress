type Mode = 'record' | 'smokeTest' | 'run' | 'interactive'

export = (mode: Mode, options) => {
  if (mode === 'record') {
    return require('./record').run(options)
  }

  if (mode === 'smokeTest') {
    return require('./smoke_test').run(options)
  }

  if (mode === 'run') {
    if (options.testingType === 'component') {
      return require('./run-ct').run({
        ...options,
        mode: 'run'
      })
    }

    // run must always be deterministic - if the user doesn't specify
    // a testingType, we default to e2e
    options.testingType = 'e2e'

    return require('./run-e2e').run({
      ...options,
      mode: 'run'
    })
  }

  if (mode === 'interactive') {
    // Change default for `cypress open` to be LAUNCHPAD=1
    if (process.env.LAUNCHPAD === '0') {
      delete process.env.LAUNCHPAD
    } else {
      process.env.LAUNCHPAD = '1'
    }

    if (options.testingType === 'component' && !process.env.LAUNCHPAD) {
      return require('./interactive-ct').run({
        ...options,
        mode: 'interactive'
      })
    }

    // Either launchpad or straight to e2e tests
    return require('./interactive-e2e').run({
      ...options,
      mode: 'interactive'
    })
  }
}
