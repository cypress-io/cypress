const spawn = require('./spawn')

const start = (options = {}) => {
  const args = ['--mode=info']

  return spawn.start(args, {
    dev: options.dev,
  })
}

module.exports = {
  start,
}
