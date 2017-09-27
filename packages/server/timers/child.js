const log = require('debug')('cypress:server:timers')

process.on('message', (obj = {}) => {
  const { id, ms } = obj

  log('child received timer id %d', id)

  setTimeout(() => {
    try {
      log('child sending timer id %d', id)

      // process.send could throw if
      // parent process has already exited
      process.send({
        id,
        ms,
      })
    } catch (err) {
      // eslint-disable no-empty
    }
  }, ms)
})
