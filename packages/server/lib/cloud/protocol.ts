import fs from 'fs-extra'
import { NodeVM } from 'vm2'
import Debug from 'debug'
import type { ProtocolManagerShape, AppCaptureProtocolInterface, CDPClient, ProtocolError } from '@packages/types'
import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import { createGzip } from 'zlib'
import fetch from 'cross-fetch'

const routes = require('./routes')
const pkg = require('@packages/root')
const { agent } = require('@packages/network')
const debug = Debug('cypress:server:protocol')
const debugVerbose = Debug('cypress-verbose:server:protocol')

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
        const vm = new NodeVM({
          console: 'inherit',
          sandbox: {
            Debug,
          },
        })

        const { AppCaptureProtocol } = vm.run(script)

        this._protocol = new AppCaptureProtocol()
      }
    } catch (error) {
      this._errors.push({
        error,
        args: [script],
        captureMethod: 'setupProtocol',
      })
    }
  }

  async connectToBrowser (cdpClient: CDPClient) {
    await this.invokeAsync('connectToBrowser', cdpClient)
  }

  addRunnables (runnables) {
    this.invokeSync('addRunnables', runnables)
  }

  beforeSpec (spec: { instanceId: string }) {
    if (!this._protocol) {
      return
    }

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

  beforeTest (test: Record<string, any>) {
    this.invokeSync('beforeTest', test)
  }

  afterTest (test: Record<string, any>) {
    this.invokeSync('afterTest', test)
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

  async uploadCaptureArtifact (uploadUrl: string): Promise<{ uploadSize: number } | void> {
    const dbPath = this._dbPath

    if (!this._protocol || !dbPath || !this._db) {
      return
    }

    debug(`uploading %s to %s`, dbPath, uploadUrl)

    try {
      let zippedFileSize = 0
      const gzip = createGzip()

      gzip.on('data', (args) => {
        zippedFileSize += args.length
      })

      const res = await fetch(uploadUrl, {
        agent,
        method: 'PUT',
        // @ts-ignore - this is supported
        body: fs.createReadStream(dbPath).pipe(gzip),
        headers: {
          'Content-Encoding': 'gzip',
          'Content-Type': 'binary/octet-stream',
        },
      })

      if (res.ok) {
        return {
          uploadSize: zippedFileSize,
        }
      }

      debug(`error response text: %s`, await res.text())
    } catch (e) {
      return this.sendErrors([{
        error: e,
        captureMethod: 'uploadCaptureArtifact',
      }])
    } finally {
      fs.unlink(dbPath).catch((e) => {
        debug(`Error unlinking db %o`, e)
      })
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

      await fetch(routes.apiRoutes.captureProtocolErrors as string, {
        // @ts-ignore - this is supported
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
      debug(`Error calling ProtocolManager.sendErrors: %o`, e)
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
      // @ts-ignore - TS not associating the method & args properly, even though we know it's correct
      this._protocol[method].apply(this._protocol, args)
    } catch (error) {
      this._errors.push({ captureMethod: method, error, args })
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
      // @ts-ignore - TS not associating the method & args properly, even though we know it's correct
      await this._protocol[method].apply(this._protocol, args)
    } catch (error) {
      this._errors.push({ captureMethod: method, error, args })
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
