const debug = require('debug')('cypress:server:timers:child')
const net = require('net')

const ipcPath = process.argv.pop()

const sock = net.createConnection({
  path: ipcPath,
}, () => {
  debug('connected to %o', { ipcPath })
})

sock.on('data', (obj = {}) => {
  debug('received %o', obj)
  obj = JSON.parse(obj.toString())

  const { id, ms } = obj

  debug('child received timer id %d', id)

  setTimeout(() => {
    try {
      const outObj = JSON.stringify({
        id,
        ms,
      })

      debug('child sending timer id %d %o', id, outObj)

      // process.send could throw if
      // parent process has already exited
      sock.write(outObj)
    } catch (err) {
      // eslint-disable no-empty
    }
  }, ms)
})
