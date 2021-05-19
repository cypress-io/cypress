const run = (options) => {
  // TODO: make sure if we need to run this in electron by default to match e2e behavior?
  options.browser = options.browser || 'electron'
  options.runAllSpecsInSameBrowserSession = true

  require('../plugins/dev-server').emitter.on('dev-server:compile:error', (error) => {
    options.onError(
      new Error(`Dev-server compilation failed. We can not run tests if dev-server can not compile and emit assets, please make sure that all syntax errors resolved before running cypress. \n\n ${error}`),
    )

    // because in run mode we decided to build all the bundle and avoid lazy compilation
    // if we get compilation error (e.g. from webpack) it means that no assets were emitted
    // and we can not run any tests, even if the error belongs to the different module
    // that's why the only way to avoid this is to close the process
    require('../open_project').closeBrowser().then(() => {
      process.exit(1)
    })
  })

  // if we're in run mode with component
  // testing then just pass this through
  // without waiting on electron to be ready
  return require('./run').ready(options)
}

module.exports = {
  run,
}
