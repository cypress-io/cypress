module.exports = (mode, options) => {
  const { testingType } = options

  switch (mode) {
    case 'record':
      return require('./record').run(options)
    case 'run':
      switch (testingType) {
        case 'e2e':
          return require('./run-e2e').run(options)
        case 'component':
          return require('./run-ct').run(options)
      }
    case 'interactive':
      switch (testingType) {
        case 'e2e':
          return require('./interactive-e2e').run(options)
        case 'component':
          return require('./interactive-ct').run(options)
      }
    case 'smokeTest':
      return require('./smoke_test').run(options)
    default:
      break
  }
}
