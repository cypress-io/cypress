const run = (options) => {
  // if we're in run mode with component
  // testing then just pass this through
  // without waiting on electron to be ready
  return require('./run').run(options)
}

module.exports = {
  run
}
