const run = (options) => {
  options.browser = options.browser || 'chrome'

  // if we're in run mode with component
  // testing then just pass this through
  // without waiting on electron to be ready
  return require('./run').ready(options)
}

module.exports = {
  run
}
