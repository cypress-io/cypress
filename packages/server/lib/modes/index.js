module.exports = (mode, options) => {
  if (mode === 'record') {
    return require('./record').run(options)
  }

  if (mode === 'smokeTest') {
    return require('./smoke_test').run(options)
  }

  if (mode === 'run' && options.testingType === 'e2e') {
    return require('./run-e2e').run(options)
  }

  if (mode === 'run' && options.testingType === 'component') {
    return require('./run-ct').run(options)
  }

  if (mode === 'interactive' && options.testingType === 'e2e') {
    return require('./interactive-e2e').run(options)
  }

  if (mode === 'interactive' && options.testingType === 'component') {
    return require('./interactive-ct').run(options)
  }
}
