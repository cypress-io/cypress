import base64url from 'base64url'
import Database from 'better-sqlite3'
import fetch from 'cross-fetch'
import crypto from 'crypto'
import Debug from 'debug'
import fs from 'fs-extra'
import Module from 'module'
import os from 'os'
import path from 'path'

import { agent } from '@packages/network'
import pkg from '@packages/root'

import env from '../util/env'
import type { Readable } from 'stream'
import type { ProtocolManagerShape, AppCaptureProtocolInterface, CDPClient, ProtocolError, CaptureArtifact, ProtocolErrorReport, ProtocolCaptureMethod, ProtocolManagerOptions, ResponseStreamOptions, ResponseEndedWithEmptyBodyOptions, ResponseStreamTimedOutOptions } from '@packages/types'

const routes = require('./routes')

const debug = Debug('cypress:server:protocol')
const debugVerbose = Debug('cypress-verbose:server:protocol')

const CAPTURE_ERRORS = !process.env.CYPRESS_LOCAL_PROTOCOL_PATH
const DELETE_DB = !process.env.CYPRESS_LOCAL_PROTOCOL_PATH

// Timeout for upload
const TWO_MINUTES = 120000
const RETRY_DELAYS = [500, 1000, 2000, 4000, 8000, 16000, 32000]
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

class CypressRetryableError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'CypressRetryableError'
  }
}

export class ProtocolManager implements ProtocolManagerShape {
  private _runId?: string
  private _instanceId?: string
  private _db?: Database.Database
  private _archivePath?: string
  private _errors: ProtocolError[] = []
  private _protocol: AppCaptureProtocolInterface | undefined
  private _runnableId: string | undefined
  private _captureHash: string | undefined

  get protocolEnabled (): boolean {
    return !!this._protocol
  }

  get networkEnableOptions () {
    return this.protocolEnabled ? {
      maxTotalBufferSize: 0,
      maxResourceBufferSize: 0,
      maxPostDataSize: 64 * 1024,
    } : undefined
  }

  async setupProtocol (script: string, options: ProtocolManagerOptions) {
    this._captureHash = base64url.fromBase64(crypto.createHash('SHA256').update(script).digest('base64'))

    debug('setting up protocol via script')

    try {
      this._runId = options.runId
      if (script) {
        const cypressProtocolDirectory = path.join(os.tmpdir(), 'cypress', 'protocol')

        await fs.ensureDir(cypressProtocolDirectory)

        const { AppCaptureProtocol } = requireScript(script)

        this._protocol = new AppCaptureProtocol(options)
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
              this._errors.push({ captureMethod: 'cdpClient.on', fatal: false, error, args: [event, message] })
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

    // Reset the errors here so that we are tracking on them per-spec
    this._errors = []

    try {
      this._beforeSpec(spec)
    } catch (error) {
      // Clear out protocol since we will not have a valid state when spec has failed
      this._protocol = undefined

      if (CAPTURE_ERRORS) {
        this._errors.push({ captureMethod: 'beforeSpec', fatal: true, error, args: [spec], runnableId: this._runnableId })
      } else {
        throw error
      }
    }
  }

  private _beforeSpec (spec: { instanceId: string }) {
    this._instanceId = spec.instanceId
    const cypressProtocolDirectory = path.join(os.tmpdir(), 'cypress', 'protocol')
    const archivePath = path.join(cypressProtocolDirectory, `${spec.instanceId}.tar`)
    const dbPath = path.join(cypressProtocolDirectory, `${spec.instanceId}.db`)

    debug('connecting to database at %s', dbPath)

    const db = Database(dbPath, {
      nativeBinding: path.join(require.resolve('better-sqlite3/build/Release/better_sqlite3.node')),
      verbose: debugVerbose,
    })

    this._db = db
    this._archivePath = archivePath
    this.invokeSync('beforeSpec', { isEssential: true }, { workingDirectory: cypressProtocolDirectory, archivePath, dbPath, db })
  }

  async afterSpec () {
    await this.invokeAsync('afterSpec', { isEssential: true })
  }

  async beforeTest (test: { id: string } & Record<string, any>) {
    if (!test.id) {
      debug('protocolManager beforeTest was invoked with test without id %O', test)
    }

    this._runnableId = test.id
    await this.invokeAsync('beforeTest', { isEssential: true }, test)
  }

  async preAfterTest (test: Record<string, any>, options: Record<string, any>): Promise<void> {
    await this.invokeAsync('preAfterTest', { isEssential: false }, test, options)
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

  responseEndedWithEmptyBody (options: ResponseEndedWithEmptyBodyOptions): void {
    this.invokeSync('responseEndedWithEmptyBody', { isEssential: false }, options)
  }

  responseStreamReceived (options: ResponseStreamOptions): Readable | undefined {
    return this.invokeSync('responseStreamReceived', { isEssential: false }, options)
  }

  responseStreamTimedOut (options: ResponseStreamTimedOutOptions): void {
    this.invokeSync('responseStreamTimedOut', { isEssential: false }, options)
  }

  canUpload (): boolean {
    return !!this._protocol && !!this._archivePath && !!this._db
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

  async getArchiveInfo (): Promise<{ stream: Readable, fileSize: number } | void> {
    const archivePath = this._archivePath

    debug('reading archive from', archivePath)
    if (!archivePath) {
      return
    }

    return {
      stream: fs.createReadStream(archivePath),
      fileSize: (await fs.stat(archivePath)).size,
    }
  }

  async uploadCaptureArtifact ({ uploadUrl, payload, fileSize }: CaptureArtifact, timeout) {
    const archivePath = this._archivePath

    if (!this._protocol || !archivePath || !this._db) {
      return
    }

    debug(`uploading %s to %s with a file size of %s`, archivePath, uploadUrl, fileSize)

    const retryRequest = async (retryCount: number, errors: Error[]) => {
      try {
        if (fileSize > dbSizeLimit()) {
          throw new Error(`Spec recording too large: db is ${fileSize} bytes, limit is ${dbSizeLimit()} bytes`)
        }

        const controller = new AbortController()

        setTimeout(() => {
          controller.abort()
        }, timeout ?? TWO_MINUTES)

        const res = await fetch(uploadUrl, {
          agent,
          method: 'PUT',
          // @ts-expect-error - this is supported
          body: payload,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-tar',
            'Content-Length': `${fileSize}`,
          },
          signal: controller.signal,
        })

        if (res.ok) {
          return {
            fileSize,
            success: true,
            specAccess: this._protocol?.getDbMetadata(),
          }
        }

        const errorMessage = await res.json().catch(() => res.statusText)

        debug(`error response: %O`, errorMessage)

        if (res.status >= 500 && res.status < 600) {
          throw new CypressRetryableError(errorMessage)
        }

        throw new Error(errorMessage)
      } catch (e) {
        // Only retry errors that are network related (e.g. connection reset or timeouts)
        if (['FetchError', 'AbortError', 'CypressRetryableError'].includes(e.name)) {
          if (retryCount < RETRY_DELAYS.length) {
            debug(`retrying upload %o`, { retryCount })
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[retryCount]))

            return await retryRequest(retryCount + 1, [...errors, e])
          }
        }

        const totalErrors = [...errors, e]

        throw new AggregateError(totalErrors, e.message)
      }
    }

    try {
      return await retryRequest(0, [])
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
        DELETE_DB ? fs.unlink(archivePath).catch((e) => {
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
  private invokeSync<K extends ProtocolSyncMethods> (method: K, { isEssential }: { isEssential: boolean }, ...args: Parameters<AppCaptureProtocolInterface[K]>): any | void {
    if (!this._protocol) {
      return
    }

    try {
      // @ts-expect-error - TS not associating the method & args properly, even though we know it's correct
      return this._protocol[method].apply(this._protocol, args)
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
      return await this._protocol[method].apply(this._protocol, args)
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
  [K in keyof AppCaptureProtocolInterface]: ReturnType<AppCaptureProtocolInterface[K]> extends Promise<any> ? never : K
}[keyof AppCaptureProtocolInterface]

type ProtocolAsyncMethods = {
  [K in keyof AppCaptureProtocolInterface]: ReturnType<AppCaptureProtocolInterface[K]> extends Promise<any> ? K : never
}[keyof AppCaptureProtocolInterface]

export default ProtocolManager
