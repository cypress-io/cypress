const run = (options) => {
  // TODO: make sure if we need to run this in electron by default to match e2e behavior?
  options.runAllSpecsInSameBrowserSession = true

  // if we're in run mode with component
  // testing then just pass this through
  // without waiting on electron to be ready
  return require('./run').ready(options)
}

module.exports = {
  run,
}
