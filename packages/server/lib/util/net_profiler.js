const fs = require('fs')
const debug = require('debug')('net-profiler')

function getCaller (level = 5) {
  try {
    return new Error().stack.split('\n')[level].slice(7)
  } catch (e) {
    return 'unknown'
  }
}

function getLogPath (logPath) {
  if (!logPath) {
    const os = require('os')
    const dirName = fs.mkdtempSync(`${os.tmpdir()}/net-profiler-`)

    logPath = `${dirName}/timeline.txt`
  }

  return logPath
}

function Connection (host, port, type = 'connection', toHost, toPort) {
  this.type = type
  this.host = host || 'localhost'
  this.port = port
  this.toHost = toHost || 'localhost'
  this.toPort = toPort
}

Connection.prototype.beginning = function () {
  switch (this.type) {
    case 'server':
      return `O server began listening on ${this.host}:${this.port} at ${getCaller()}`
    case 'client':
      return `C client connected from ${this.host}:${this.port} to server on ${this.toHost}:${this.toPort}`
    default:
      return `X connection opened to ${this.host}:${this.port} by ${getCaller()}`
  }
}

Connection.prototype.ending = function () {
  switch (this.type) {
    case 'server':
      return 'O server closed'
    case 'client':
      return 'C client disconnected'
    default:
      return 'X connection closed'
  }
}

/**
 * Tracks all incoming and outgoing network connections and logs a timeline of network traffic to a file.
 *
 * @param options.net the `net` object to stub, default: nodejs net object
 * @param options.tickMs the number of milliseconds between ticks in the profile, default: 1000
 * @param options.tickWhenNoneActive should ticks be recorded when no connections are active, default: false
 * @param options.logPath path to the file to append to, default: new file in your temp directory
 */
function NetProfiler (options = {}) {
  if (!(this instanceof NetProfiler)) return new NetProfiler(options)

  if (!options.net) {
    options.net = require('net')
  }

  this.net = options.net
  this.proxies = {}
  this.activeConnections = []
  this.startTs = new Date() / 1000
  this.tickMs = options.tickMs || 1000
  this.tickWhenNoneActive = options.tickWhenNoneActive || false

  this.logPath = getLogPath(options.logPath)
  debug('logging to ', this.logPath)

  this.startProfiling()
}

NetProfiler.prototype.install = function () {
  const net = this.net
  const self = this

  function netSocketPrototypeConnectApply (target, thisArg, args) {
    const client = target.bind(thisArg)(...args)

    let options = self.net._normalizeArgs(args)[0]

    if (Array.isArray(options)) {
      options = options[0]
    }

    options.host = options.host || 'localhost'

    const connection = new Connection(options.host, options.port)

    client.on('close', () => {
      self.removeActiveConnection(connection)
    })

    self.addActiveConnection(connection)

    return client
  }

  function netServerPrototypeListenApply (target, thisArg, args) {
    const server = thisArg

    server.on('listening', () => {
      const { host, port } = server.address()

      const connection = new Connection(host, port, 'server')

      self.addActiveConnection(connection)
      server.on('close', () => {
        self.removeActiveConnection(connection)
      })

      server.on('connection', (client) => {
        const clientConn = new Connection(client.remoteAddress, client.remotePort, 'client', host, port)

        self.addActiveConnection(clientConn)
        client.on('close', () => {
          self.removeActiveConnection(clientConn)
        })
      })
    })

    const listener = target.bind(thisArg)(...args)

    return listener
  }

  this.proxies['net.Socket.prototype.connect'] = Proxy.revocable(net.Socket.prototype.connect, {
    apply: netSocketPrototypeConnectApply,
  })

  this.proxies['net.Server.prototype.listen'] = Proxy.revocable(net.Server.prototype.listen, {
    apply: netServerPrototypeListenApply,
  })

  net.Socket.prototype.connect = this.proxies['net.Socket.prototype.connect'].proxy
  net.Server.prototype.listen = this.proxies['net.Server.prototype.listen'].proxy
}

NetProfiler.prototype.uninstall = function () {
  const net = this.net

  net.Socket.prototype.connect = this.proxies['net.Socket.prototype.connect'].proxy['[[Target]]']
  net.Server.prototype.listen = this.proxies['net.Server.prototype.listen'].proxy['[[Target]]']

  this.proxies.forEach((proxy) => {
    proxy.revoke()
  })
}

NetProfiler.prototype.startProfiling = function () {
  this.install()
  debug('profiling started')
  this.logStream = fs.openSync(this.logPath, 'a')
  this.writeTimeline('Profiling started!')
  this.startTimer()
}

NetProfiler.prototype.startTimer = function () {
  if (!this.tickMs) {
    return
  }

  this.timer = setInterval(() => {
    const tick = this.tickWhenNoneActive || this.activeConnections.find((x) => {
      return !!x
    })

    if (tick) {
      this.writeTimeline()
    }
  }, this.tickMs)
}

NetProfiler.prototype.stopTimer = function () {
  clearInterval(this.timer)
}

NetProfiler.prototype.stopProfiling = function () {
  this.writeTimeline('Profiling stopped!')
  this.stopTimer()
  fs.closeSync(this.logStream)
  debug('profiling ended')
  this.uninstall()
}

NetProfiler.prototype.addActiveConnection = function (connection) {
  let index = this.activeConnections.findIndex((x) => {
    return typeof x === 'undefined'
  })

  if (index === -1) {
    index = this.activeConnections.length
    this.activeConnections.push(connection)
  } else {
    this.activeConnections[index] = connection
  }

  this.writeTimeline(index, connection.beginning())
}

NetProfiler.prototype.removeActiveConnection = function (connection) {
  let index = this.activeConnections.findIndex((x) => {
    return x === connection
  })

  this.writeTimeline(index, connection.ending())
  this.activeConnections[index] = undefined
}

NetProfiler.prototype.getTimestamp = function () {
  let elapsed = (new Date() / 1000 - this.startTs).toString()
  const parts = elapsed.split('.', 2)

  if (!parts[1]) {
    parts[1] = '000'
  }

  while (parts[1].length < 3) {
    parts[1] += '0'
  }

  elapsed = `${parts[0]}.${parts[1] ? parts[1].slice(0, 3) : '000'}`

  while (elapsed.length < 11) {
    elapsed = ` ${elapsed}`
  }

  return elapsed
}

NetProfiler.prototype.writeTimeline = function (index, message) {
  if (!message) {
    message = index || ''
    index = this.activeConnections.length
  }

  let row = `   ${this.activeConnections.map((conn, i) => {
    if (conn) {
      return ['|', '1', 'l', ':'][i % 4]
    }

    return ' '
  }).join('   ')}`

  if (message) {
    const column = 3 + index * 4

    row = `${row.substring(0, column - 2)}[ ${message} ]${row.substring(2 + column + message.length)}`
  }

  row = `${this.getTimestamp()}${row.replace(/\s+$/, '')}\n`

  fs.writeSync(this.logStream, row)
}

module.exports = NetProfiler
