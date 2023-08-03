import fs from 'fs-extra'
import Debug from 'debug'
import type { ProtocolManagerShape, AppCaptureProtocolInterface, CDPClient, ProtocolError, CaptureArtifact } from '@packages/types'
import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import { createGzip } from 'zlib'
import fetch from 'cross-fetch'
import Module from 'module'
import env from '../util/env'

const routes = require('./routes')
const pkg = require('@packages/root')
const { agent } = require('@packages/network')
const debug = Debug('cypress:server:protocol')
const debugVerbose = Debug('cypress-verbose:server:protocol')

const CAPTURE_ERRORS = !process.env.CYPRESS_LOCAL_PROTOCOL_PATH
const DELETE_DB = !process.env.CYPRESS_LOCAL_PROTOCOL_PATH

// Timeout for upload
const TWO_MINUTES = 120000

const DB_SIZE_LIMIT = 5000000000

const dbSizeLimit = () => {
  return env.get('CYPRESS_INTERNAL_SYSTEM_TESTS') === '1' ?
    200 : DB_SIZE_LIMIT
}

/**
 * requireScript, does just that, requires the passed in script as if it was a module.
 * @param script - string
 * @returns exports
 */
const requireScript = (script: string) => {
  const mod = new Module('id', module)

  mod.filename = ''
  // _compile is a private method
  // @ts-expect-error
  mod._compile(script, mod.filename)

  module.children.splice(module.children.indexOf(mod), 1)

  return mod.exports
}

export class ProtocolManager implements ProtocolManagerShape {
  private _runId?: string
  private _instanceId?: string
  private _db?: Database.Database
  private _dbPath?: string
  private _errors: ProtocolError[] = []
  private _protocol: AppCaptureProtocolInterface | undefined

  get protocolEnabled (): boolean {
    return !!this._protocol
  }

  async setupProtocol (script: string, runId: string) {
    debug('setting up protocol via script')
    try {
      this._runId = runId
      if (script) {
        const cypressProtocolDirectory = path.join(os.tmpdir(), 'cypress', 'protocol')

        await fs.ensureDir(cypressProtocolDirectory)

        const { AppCaptureProtocol } = requireScript(script)

        this._protocol = new AppCaptureProtocol()
      }
    } catch (error) {
      debug(error)
      if (CAPTURE_ERRORS) {
        this._errors.push({
          error,
          args: [script],
          captureMethod: 'setupProtocol',
        })
      } else {
        throw error
      }
    }
  }

  async connectToBrowser (cdpClient: CDPClient) {
    // Wrap the cdp client listeners so that we can be notified of any errors that may occur
    const newCdpClient: CDPClient = {
      ...cdpClient,
      on: (event, listener) => {
        cdpClient.on(event, async (message) => {
          try {
            await listener(message)
          } catch (error) {
            if (CAPTURE_ERRORS) {
              this._errors.push({ captureMethod: 'cdpClient.on', error, args: [event, message] })
            } else {
              debug('error in cdpClient.on %O', { error, event, message })
              throw error
            }
          }
        })
      },
    }

    await this.invokeAsync('connectToBrowser', newCdpClient)
  }

  addRunnables (runnables) {
    this.invokeSync('addRunnables', runnables)
  }

  beforeSpec (spec: { instanceId: string }) {
    if (!this._protocol) {
      return
    }

    try {
      this._beforeSpec(spec)
    } catch (error) {
      if (CAPTURE_ERRORS) {
        this._errors.push({ captureMethod: 'beforeSpec', error, args: [spec] })
      } else {
        throw error
      }
    }
  }

  private _beforeSpec (spec: { instanceId: string }) {
    this._instanceId = spec.instanceId

    const cypressProtocolDirectory = path.join(os.tmpdir(), 'cypress', 'protocol')
    const dbPath = path.join(cypressProtocolDirectory, `${spec.instanceId}.db`)

    debug('connecting to database at %s', dbPath)

    const db = Database(dbPath, {
      nativeBinding: path.join(require.resolve('better-sqlite3/build/Release/better_sqlite3.node')),
      verbose: debugVerbose,
    })

    this._db = db
    this._dbPath = dbPath
    this.invokeSync('beforeSpec', db)
  }

  async afterSpec () {
    await this.invokeAsync('afterSpec')
  }

  async beforeTest (test: Record<string, any>) {
    await this.invokeAsync('beforeTest', test)
  }

  async afterTest (test: Record<string, any>) {
    await this.invokeAsync('afterTest', test)
  }

  commandLogAdded (log: any) {
    this.invokeSync('commandLogAdded', log)
  }

  commandLogChanged (log: any): void {
    this.invokeSync('commandLogChanged', log)
  }

  viewportChanged (input: any): void {
    this.invokeSync('viewportChanged', input)
  }

  urlChanged (input: any): void {
    this.invokeSync('urlChanged', input)
  }

  pageLoading (input: any): void {
    this.invokeSync('pageLoading', input)
  }

  resetTest (testId: string): void {
    this.invokeSync('resetTest', testId)
  }

  canUpload (): boolean {
    return !!this._protocol && !!this._dbPath && !!this._db
  }

  hasErrors (): boolean {
    return !!this._errors.length
  }

  async getZippedDb (): Promise<Buffer | void> {
    const dbPath = this._dbPath

    debug('reading db from', dbPath)
    if (!dbPath) {
      return
    }

    return new Promise((resolve, reject) => {
      const gzip = createGzip()
      const buffers: Buffer[] = []

      gzip.on('data', (args) => {
        buffers.push(args)
      })

      gzip.on('end', () => {
        resolve(Buffer.concat(buffers))
      })

      gzip.on('error', reject)

      fs.createReadStream(dbPath).pipe(gzip, { end: true })
    })
  }

  async uploadCaptureArtifact ({ uploadUrl, payload, fileSize }: CaptureArtifact, timeout) {
    const dbPath = this._dbPath

    if (!this._protocol || !dbPath || !this._db) {
      if (this._errors.length) {
        await this.sendErrors()
      }

      return
    }

    debug(`uploading %s to %s`, dbPath, uploadUrl, fileSize)

    try {
      if (fileSize > dbSizeLimit()) {
        throw new Error(`Spec recording too large: db is ${fileSize} bytes, limit is ${dbSizeLimit()} bytes`)
      }

      const controller = new AbortController()

      setTimeout(() => {
        controller.abort()
      }, timeout ?? TWO_MINUTES)

      const res = await fetch(uploadUrl, {
        // @ts-expect-error - this is supported
        agent,
        method: 'PUT',
        body: payload,
        headers: {
          'Content-Encoding': 'gzip',
          'Content-Type': 'binary/octet-stream',
          'Content-Length': `${fileSize}`,
        },
        signal: controller.signal,
      })

      if (!res.ok) {
        return {
          fileSize,
          success: true,
        }
      }

      const errorMessage = await res.text()

      debug(`error response text: %s`, errorMessage)

      throw new Error(errorMessage)
    } catch (e) {
      if (CAPTURE_ERRORS) {
        this._errors.push({
          error: e,
          captureMethod: 'uploadCaptureArtifact',
        })
      }

      throw e
    } finally {
      await Promise.all([
        this.sendErrors(),
        DELETE_DB ? fs.unlink(dbPath).catch((e) => {
          debug(`Error unlinking db %o`, e)
        }) : Promise.resolve(),
      ])

      // Reset errors after they have been sent
      this._errors = []
    }
  }

  async sendErrors (protocolErrors: ProtocolError[] = this._errors) {
    if (protocolErrors.length === 0) {
      return
    }

    try {
      const body = JSON.stringify({
        runId: this._runId,
        instanceId: this._instanceId,
        errors: protocolErrors.map((e) => {
          return {
            name: e.error.name ?? `Unknown name`,
            stack: e.error.stack ?? `Unknown stack`,
            message: e.error.message ?? `Unknown message`,
            captureMethod: e.captureMethod,
            args: e.args ? this.stringify(e.args) : undefined,
          }
        }),
      })

      await fetch(routes.apiRoutes.captureProtocolErrors() as string, {
        // @ts-expect-error - this is supported
        agent,
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          'x-cypress-version': pkg.version,
          'x-os-name': os.platform(),
          'x-arch': os.arch(),
        },
      })
    } catch (e) {
      debug(`Error calling ProtocolManager.sendErrors: %o, original errors %o`, e, protocolErrors)
    }
  }

  /**
   * Abstracts invoking a synchronous method on the AppCaptureProtocol instance, so we can handle
   * errors in a uniform way
   */
  private invokeSync<K extends ProtocolSyncMethods> (method: K, ...args: Parameters<AppCaptureProtocolInterface[K]>) {
    if (!this._protocol) {
      return
    }

    try {
      // @ts-expect-error - TS not associating the method & args properly, even though we know it's correct
      this._protocol[method].apply(this._protocol, args)
    } catch (error) {
      if (CAPTURE_ERRORS) {
        this._errors.push({ captureMethod: method, error, args })
      } else {
        throw error
      }
    }
  }

  /**
   * Abstracts invoking a synchronous method on the AppCaptureProtocol instance, so we can handle
   * errors in a uniform way
   */
  private async invokeAsync <K extends ProtocolAsyncMethods> (method: K, ...args: Parameters<AppCaptureProtocolInterface[K]>) {
    if (!this._protocol) {
      return
    }

    try {
      // @ts-expect-error - TS not associating the method & args properly, even though we know it's correct
      await this._protocol[method].apply(this._protocol, args)
    } catch (error) {
      if (CAPTURE_ERRORS) {
        this._errors.push({ captureMethod: method, error, args })
      } else {
        throw error
      }
    }
  }

  private stringify (val: any) {
    try {
      return JSON.stringify(val)
    } catch (e) {
      return `Unserializable ${typeof val}`
    }
  }
}

// Helper types for invokeSync / invokeAsync
type ProtocolSyncMethods = {
  [K in keyof AppCaptureProtocolInterface]: ReturnType<AppCaptureProtocolInterface[K]> extends void ? K : never
}[keyof AppCaptureProtocolInterface]

type ProtocolAsyncMethods = {
  [K in keyof AppCaptureProtocolInterface]: ReturnType<AppCaptureProtocolInterface[K]> extends Promise<any> ? K : never
}[keyof AppCaptureProtocolInterface]

export default ProtocolManager
