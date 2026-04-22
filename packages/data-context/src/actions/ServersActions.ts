import util from 'util'
import crypto from 'crypto'
import fs from 'fs'
import Debug from 'debug'

import type { AddressInfo } from 'net'
import type { Server } from 'http'
import type { SocketIONamespace, SocketIOServer, CDPSocketServer } from '@packages/socket'
import type { DataContext } from '..'
import { descriptorFilePath, runningDir } from '../util/app-data-paths'

const pkg = require('@packages/root')

const debug = Debug('cypress:data-context:actions:ServersActions')

// Module-level guard so exit handlers register at most once per process,
// even if multiple DataContexts are constructed over the lifetime of the process.
let exitHandlersRegistered = false

export class ServersActions {
  constructor (private ctx: DataContext) {}

  setAppServerPort (port: number | undefined) {
    this.ctx.update((d) => {
      d.servers.appServerPort = port ?? null
    })
  }

  setAppSocketServer ({ socketIo, cdpIo }: { socketIo?: SocketIOServer, cdpIo?: CDPSocketServer } = { socketIo: undefined, cdpIo: undefined }) {
    this.ctx.update((d) => {
      d.servers.appSocketServer?.disconnectSockets(true)
      d.servers.appSocketNamespace?.disconnectSockets(true)
      d.servers.cdpSocketServer?.disconnectSockets(true)
      d.servers.cdpSocketNamespace?.disconnectSockets(true)
      d.servers.appSocketServer = socketIo
      d.servers.appSocketNamespace = socketIo?.of('/data-context')
      d.servers.cdpSocketServer = cdpIo
      d.servers.cdpSocketNamespace = cdpIo?.of('/data-context')
    })
  }

  setGqlServer (srv: Server) {
    this.ctx.update((d) => {
      d.servers.gqlServer = srv
      d.servers.gqlServerPort = (srv.address() as AddressInfo).port
    })
  }

  setGqlSocketServer (socketServer: SocketIONamespace | undefined) {
    this.ctx.update((d) => {
      d.servers.gqlSocketServer?.disconnectSockets(true)
      d.servers.gqlSocketServer = socketServer
    })
  }

  /**
   * Write a per-instance descriptor file used by `cypress inspect` to discover
   * running `cypress open` instances on the local machine.
   *
   * File lives at `{runningDir()}/{pid}.json` with mode 0o600, parent dir 0o700.
   * Stores `{ token, descriptorPath }` on `coreData.servers.inspect` so the
   * GraphQL middleware can authenticate inspect requests.
   *
   * Failures here are intentionally non-fatal — the caller should log and move on.
   */
  writeInstanceDescriptor () {
    const token = crypto.randomBytes(32).toString('hex')
    const dir = runningDir()
    const pid = process.pid
    const filePath = descriptorFilePath(pid)
    const projectRoot = this.ctx.coreData.currentProject

    // Sync fs is intentional: must complete before returning so the file is
    // observable to the caller (and usable by process.on('exit') cleanup).
    // eslint-disable-next-line no-restricted-syntax
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
    // Ensure the directory mode is 0o700 even if it pre-existed with different perms.
    try {
      // eslint-disable-next-line no-restricted-syntax
      fs.chmodSync(dir, 0o700)
    } catch (err) {
      debug('failed to chmod running dir %s: %o', dir, err)
    }

    const descriptor = {
      pid,
      port: this.ctx.coreData.servers.gqlServerPort ?? null,
      token,
      projectRoot: projectRoot ?? null,
      projectHash: projectRoot
        ? crypto.createHash('md5').update(projectRoot).digest('hex')
        : null,
      cypressVersion: pkg.version,
      startedAt: new Date().toISOString(),
    }

    // eslint-disable-next-line no-restricted-syntax
    fs.writeFileSync(filePath, JSON.stringify(descriptor, null, 2), { mode: 0o600 })
    // Explicitly chmod to guarantee 0o600 even when the file pre-existed or
    // the process umask interfered with the `writeFileSync` mode option.
    try {
      // eslint-disable-next-line no-restricted-syntax
      fs.chmodSync(filePath, 0o600)
    } catch (err) {
      debug('failed to chmod descriptor file %s: %o', filePath, err)
    }

    this.ctx.update((d) => {
      d.servers.inspect = { token, descriptorPath: filePath }
    })

    this._registerExitHandlers()

    debug('wrote instance descriptor at %s', filePath)
  }

  /**
   * Remove the per-instance descriptor file and clear `coreData.servers.inspect`.
   * Silently tolerates a missing file so repeat calls (e.g. from multiple exit
   * signals) are safe.
   */
  removeInstanceDescriptor () {
    const descriptorPath = this.ctx.coreData.servers.inspect?.descriptorPath
      || descriptorFilePath(process.pid)

    try {
      // Sync unlink is required so we can call this from process.on('exit').
      // eslint-disable-next-line no-restricted-syntax
      fs.unlinkSync(descriptorPath)
    } catch (err: any) {
      if (err && err.code !== 'ENOENT') {
        debug('failed to remove instance descriptor %s: %o', descriptorPath, err)
      }
    }

    this.ctx.update((d) => {
      d.servers.inspect = undefined
    })
  }

  private _registerExitHandlers () {
    if (exitHandlersRegistered) {
      return
    }

    exitHandlersRegistered = true

    const cleanup = () => {
      try {
        this.removeInstanceDescriptor()
      } catch (err) {
        debug('exit-handler cleanup failed: %o', err)
      }
    }

    process.on('exit', cleanup)
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
  }

  async destroyGqlServer () {
    this.removeInstanceDescriptor()

    const destroy = this.ctx.coreData.servers.gqlServer?.destroy

    if (!destroy) {
      return
    }

    return util.promisify(destroy)()
  }
}

// Exported for tests only. Allows unit tests to reset the module-level guard
// between cases so each test can observe a fresh registration.
export function _resetExitHandlersRegisteredForTests () {
  exitHandlersRegistered = false
}
