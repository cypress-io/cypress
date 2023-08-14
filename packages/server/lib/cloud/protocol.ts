import base64url from 'base64url'
import Database from 'better-sqlite3'
import fetch from 'cross-fetch'
import crypto from 'crypto'
import Debug from 'debug'
import fs from 'fs-extra'
import Module from 'module'
import os from 'os'
import path from 'path'
import { createGzip } from 'zlib'

import { agent } from '@packages/network'
import pkg from '@packages/root'

import env from '../util/env'

import type { ProtocolManagerShape, AppCaptureProtocolInterface, CDPClient, ProtocolError, CaptureArtifact, ProtocolErrorReport, ProtocolCaptureMethod } from '@packages/types'

const routes = require('./routes')

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
  private _runnableId: string | undefined
  private _captureHash: string | undefined

  get protocolEnabled (): boolean {
    return !!this._protocol
  }

  async setupProtocol (script: string, runId: string) {
    this._captureHash = base64url.fromBase64(crypto.createHash('SHA256').update(script).digest('base64'))

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
      if (CAPTURE_ERRORS) {
        this._errors.push({
          error,
          args: [script],
          captureMethod: 'setupProtocol',
          fatal: true,
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
              this._errors.push({ captureMethod: 'cdpClient.on', fatal: true, error, args: [event, message] })
            } else {
              debug('error in cdpClient.on %O', { error, event, message })
              throw error
            }
          }
        })
      },
    }

    await this.invokeAsync('connectToBrowser', { isEssential: true }, newCdpClient)
  }

  addRunnables (runnables) {
    this.invokeSync('addRunnables', { isEssential: true }, runnables)
  }

  beforeSpec (spec: { instanceId: string }) {
    if (!this._protocol) {
      return
    }

    try {
      this._beforeSpec(spec)
    } catch (error) {
      if (CAPTURE_ERRORS) {
        this._errors.push({ captureMethod: 'beforeSpec', error, args: [spec], runnableId: this._runnableId })
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
    this.invokeSync('beforeSpec', { isEssential: true }, db)
  }

  async afterSpec () {
    await this.invokeAsync('afterSpec', { isEssential: true })
  }

  async beforeTest (test: { id: string } & Record<string, any>) {
    this._runnableId = test.id
    await this.invokeAsync('beforeTest', { isEssential: true }, test)
  }

  async afterTest (test: Record<string, any>) {
    await this.invokeAsync('afterTest', { isEssential: true }, test)
    this._runnableId = undefined
  }

  commandLogAdded (log: any) {
    this.invokeSync('commandLogAdded', { isEssential: false }, log)
  }

  commandLogChanged (log: any): void {
    this.invokeSync('commandLogChanged', { isEssential: false }, log)
  }

  viewportChanged (input: any): void {
    this.invokeSync('viewportChanged', { isEssential: false }, input)
  }

  urlChanged (input: any): void {
    this.invokeSync('urlChanged', { isEssential: false }, input)
  }

  pageLoading (input: any): void {
    this.invokeSync('pageLoading', { isEssential: false }, input)
  }

  resetTest (testId: string): void {
    this.invokeSync('resetTest', { isEssential: false }, testId)
  }

  canUpload (): boolean {
    return !!this._protocol && !!this._dbPath && !!this._db
  }

  hasErrors (): boolean {
    return !!this._errors.length
  }

  addFatalError (captureMethod: ProtocolCaptureMethod, error: Error, args: any) {
    this._errors.push({
      fatal: true,
      error,
      captureMethod,
      runnableId: this._runnableId || undefined,
      args,
    })
  }

  hasFatalError (): boolean {
    debug(this._errors)

    return !!this._errors.filter((e) => e.fatal).length
  }

  getFatalError (): ProtocolError | undefined {
    return this._errors.find((e) => e.fatal)
  }

  getNonFatalErrors (): ProtocolError[] {
    return this._errors.filter((e) => !e.fatal)
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

      gzip.on('error', (error) => {
        this._errors.push({
          fatal: true,
          error,
          captureMethod: 'getZippedDb',
          args: [dbPath],
        })

        reject(error)
      })

      fs.createReadStream(dbPath).pipe(gzip, { end: true })
    })
  }

  async uploadCaptureArtifact ({ uploadUrl, payload, fileSize }: CaptureArtifact, timeout) {
    const dbPath = this._dbPath

    if (!this._protocol || !dbPath || !this._db) {
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

      if (res.ok) {
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
          fatal: true,
        })
      }

      throw e
    } finally {
      await (
        DELETE_DB ? fs.unlink(dbPath).catch((e) => {
          debug(`Error unlinking db %o`, e)
        }) : Promise.resolve()
      )
    }
  }

  async reportNonFatalErrors (context?: {
    osName: string
    projectSlug: string
    specName: string
  }) {
    const errors = this._errors.filter(({ fatal }) => !fatal)

    if (errors.length === 0) {
      return
    }

    try {
      const payload: ProtocolErrorReport = {
        runId: this._runId,
        instanceId: this._instanceId,
        captureHash: this._captureHash,
        errors: errors.map((e) => {
          return {
            name: e.error.name ?? `Unknown name`,
            stack: e.error.stack ?? `Unknown stack`,
            message: e.error.message ?? `Unknown message`,
            captureMethod: e.captureMethod,
            args: e.args ? this.stringify(e.args) : undefined,
            runnableId: e.runnableId,
          }
        }),
        context,
      }

      const body = JSON.stringify(payload)

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
      debug(`Error calling ProtocolManager.sendErrors: %o, original errors %o`, e, errors)
    }

    this._errors = []
  }

  /**
   * Abstracts invoking a synchronous method on the AppCaptureProtocol instance, so we can handle
   * errors in a uniform way
   */
  private invokeSync<K extends ProtocolSyncMethods> (method: K, { isEssential }: { isEssential: boolean }, ...args: Parameters<AppCaptureProtocolInterface[K]>) {
    if (!this._protocol) {
      return
    }

    try {
      // @ts-expect-error - TS not associating the method & args properly, even though we know it's correct
      this._protocol[method].apply(this._protocol, args)
    } catch (error) {
      if (CAPTURE_ERRORS) {
        this._errors.push({ captureMethod: method, fatal: isEssential, error, args, runnableId: this._runnableId })
      } else {
        throw error
      }
    }
  }

  /**
   * Abstracts invoking a synchronous method on the AppCaptureProtocol instance, so we can handle
   * errors in a uniform way
   */
  private async invokeAsync <K extends ProtocolAsyncMethods> (method: K, { isEssential }: { isEssential: boolean }, ...args: Parameters<AppCaptureProtocolInterface[K]>) {
    if (!this._protocol) {
      return
    }

    try {
      // @ts-expect-error - TS not associating the method & args properly, even though we know it's correct
      await this._protocol[method].apply(this._protocol, args)
    } catch (error) {
      if (CAPTURE_ERRORS) {
        this._errors.push({ captureMethod: method, fatal: isEssential, error, args, runnableId: this._runnableId })
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
