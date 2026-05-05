import fs from 'fs'
import debugModule from 'debug'
import net from 'net'
import os from 'os'

const debug = debugModule('net-profiler')

/** Node's `net` module exposes this internal helper; typings omit it. */
type NetModuleWithInternals = typeof net & {
  _normalizeArgs: (args: unknown[]) => unknown[]
}

class Connection {
  type: string
  host: string
  port: number
  toHost: string
  toPort?: number

  constructor (host: string, port: number, type = 'connection', toHost = 'localhost', toPort?: number) {
    this.host = host || 'localhost'
    this.port = port
    this.type = type || 'connection'
    this.toHost = toHost || 'localhost'
    this.toPort = toPort
  }

  private getCaller (level = 5): string {
    try {
      const line = new Error().stack?.split('\n')[level]

      return line ? line.slice(7) : 'unknown'
    } catch {
      return 'unknown'
    }
  }

  beginning (): string {
    switch (this.type) {
      case 'server':
        return `O server began listening on ${this.host}:${this.port} at ${this.getCaller()}`
      case 'client':
        return `C client connected from ${this.host}:${this.port} to server on ${this.toHost}:${this.toPort}`
      default:
        return `X connection opened to ${this.host}:${this.port} by ${this.getCaller()}`
    }
  }

  ending (): string {
    switch (this.type) {
      case 'server':
        return 'O server closed'
      case 'client':
        return 'C client disconnected'
      default:
        return 'X connection closed'
    }
  }
}

export type NetProfilerOptions = Partial<{
  net: typeof net
  tickMs: number
  tickWhenNoneActive: boolean
  logPath: string
}>

type RevocableSocketConnect = {
  proxy: typeof net.Socket.prototype.connect
  revoke: () => void
}
type RevocableServerListen = {
  proxy: typeof net.Server.prototype.listen
  revoke: () => void
}

/**
 * Tracks all incoming and outgoing network connections and logs a timeline of network traffic to a file.
 *
 * @param options.net the `net` object to stub, default: nodejs net object
 * @param options.tickMs the number of milliseconds between ticks in the profile, default: 1000
 * @param options.tickWhenNoneActive should ticks be recorded when no connections are active, default: false
 * @param options.logPath path to the file to append to, default: new file in your temp directory
 */
export class NetProfiler {
  net: typeof net
  activeConnections: (Connection | undefined)[]
  startTs: number
  tickMs: number
  tickWhenNoneActive: boolean
  logPath: string
  logStream!: number
  timer?: NodeJS.Timeout

  private originalSocketConnect!: typeof net.Socket.prototype.connect
  private originalServerListen!: typeof net.Server.prototype.listen
  private socketConnectRevocable?: RevocableSocketConnect
  private serverListenRevocable?: RevocableServerListen

  constructor (options: NetProfilerOptions = {}) {
    this.net = options.net ?? net
    this.activeConnections = []
    this.startTs = Date.now() / 1000
    this.tickMs = options.tickMs ?? 1000
    this.tickWhenNoneActive = options.tickWhenNoneActive ?? false

    this.logPath = this.getLogPath(options.logPath)
    debug('logging to ', this.logPath)

    this.startProfiling()
  }

  private getLogPath (logPath?: string): string {
    if (!logPath) {
      // eslint-disable-next-line no-restricted-syntax -- profiler needs a fixed path before any async work
      const dirName = fs.mkdtempSync(`${os.tmpdir()}/net-profiler-`)

      logPath = `${dirName}/timeline.txt`
    }

    return logPath
  }

  install (): void {
    const netImpl = this.net
    const self = this

    this.originalSocketConnect = netImpl.Socket.prototype.connect
    this.originalServerListen = netImpl.Server.prototype.listen

    const netSocketPrototypeConnectApply: ProxyHandler<typeof net.Socket.prototype.connect>['apply'] = (target, thisArg, args) => {
      const client = Reflect.apply(target, thisArg, args) as net.Socket

      const normalizeArgs = (netImpl as NetModuleWithInternals)._normalizeArgs(args as unknown[])
      let options: Record<string, unknown> = normalizeArgs[0] as Record<string, unknown>

      if (Array.isArray(options)) {
        options = options[0] as Record<string, unknown>
      }

      options.host = options.host || 'localhost'

      const connection = new Connection(String(options.host), Number(options.port))

      client.on('close', () => {
        self.removeActiveConnection(connection)
      })

      self.addActiveConnection(connection)

      return client
    }

    const netServerPrototypeListenApply: ProxyHandler<typeof net.Server.prototype.listen>['apply'] = (target, thisArg, args) => {
      const server = thisArg as net.Server

      server.on('listening', () => {
        const addr = server.address()

        if (!addr || typeof addr === 'string') {
          return
        }

        const { address, port } = addr

        const connection = new Connection(address, port, 'server')

        self.addActiveConnection(connection)
        server.on('close', () => {
          self.removeActiveConnection(connection)
        })

        server.on('connection', (client) => {
          const clientConn = new Connection(
            client.remoteAddress ?? 'localhost',
            client.remotePort ?? 0,
            'client',
            address,
            port,
          )

          self.addActiveConnection(clientConn)
          client.on('close', () => {
            self.removeActiveConnection(clientConn)
          })
        })
      })

      return Reflect.apply(target, thisArg, args)
    }

    this.socketConnectRevocable = Proxy.revocable(this.originalSocketConnect, {
      apply: netSocketPrototypeConnectApply,
    })

    this.serverListenRevocable = Proxy.revocable(this.originalServerListen, {
      apply: netServerPrototypeListenApply,
    })

    netImpl.Socket.prototype.connect = this.socketConnectRevocable.proxy
    netImpl.Server.prototype.listen = this.serverListenRevocable.proxy
  }

  uninstall (): void {
    const netImpl = this.net

    netImpl.Socket.prototype.connect = this.originalSocketConnect
    netImpl.Server.prototype.listen = this.originalServerListen

    this.socketConnectRevocable?.revoke()
    this.serverListenRevocable?.revoke()
    this.socketConnectRevocable = undefined
    this.serverListenRevocable = undefined
  }

  startProfiling (): void {
    this.install()
    debug('profiling started')
    // eslint-disable-next-line no-restricted-syntax -- profiler uses sync IO to keep ordering with socket events
    this.logStream = fs.openSync(this.logPath, 'a')
    this.writeTimeline('Profiling started!')
    this.startTimer()
  }

  startTimer (): void {
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

  stopTimer (): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = undefined
    }
  }

  stopProfiling (): void {
    this.writeTimeline('Profiling stopped!')
    this.stopTimer()
    // eslint-disable-next-line no-restricted-syntax -- profiler uses sync IO to keep ordering with socket events
    fs.closeSync(this.logStream)
    debug('profiling ended')
    this.uninstall()
  }

  addActiveConnection (connection: Connection): void {
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

  removeActiveConnection (connection: Connection): void {
    const index = this.activeConnections.findIndex((x) => {
      return x === connection
    })

    if (index === -1) {
      return
    }

    this.writeTimeline(index, connection.ending())
    this.activeConnections[index] = undefined
  }

  getTimestamp (): string {
    let elapsed = (Date.now() / 1000 - this.startTs).toString()
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

  /** Call shapes: `()`, `('message')`, or `(slotIndex, 'message')` (matches previous JS overload). */
  writeTimeline (index?: number | string, message?: string): void {
    if (!message) {
      message = (typeof index === 'number' ? String(index) : index ?? '') || ''
      index = this.activeConnections.length
    }

    const slotIndex = typeof index === 'number' ? index : this.activeConnections.length

    let row = `   ${this.activeConnections.map((conn, i) => {
      if (conn) {
        return ['|', '1', 'l', ':'][i % 4]
      }

      return ' '
    }).join('   ')}`

    if (message) {
      const column = 3 + slotIndex * 4

      row = `${row.substring(0, column - 2)}[ ${message} ]${row.substring(2 + column + message.length)}`
    }

    row = `${this.getTimestamp()}${row.replace(/\s+$/, '')}\n`

    // eslint-disable-next-line no-restricted-syntax -- profiler uses sync IO to keep ordering with socket events
    fs.writeSync(this.logStream, row)
  }
}
