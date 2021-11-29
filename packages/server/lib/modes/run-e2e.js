const { makeDataContext } = require('../makeDataContext')

const run = (options) => {
  const ctx = makeDataContext({
    mode: 'run',
    options,
  })

  return require('./run').run(options, ctx)
}

module.exports = {
  run,
}
