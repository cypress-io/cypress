import fs from 'fs-extra'
import { NodeVM } from 'vm2'
import Debug from 'debug'
import type { ProtocolManagerShape, AppCaptureProtocolInterface, CDPClient } from '@packages/types'
import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import { createGzip } from 'zlib'
import fetch from 'cross-fetch'

const { agent } = require('@packages/network')
const debug = Debug('cypress:server:protocol')
const debugVerbose = Debug('cypress-verbose:server:protocol')

interface ProtocolError {
  method: keyof AppCaptureProtocolInterface | 'setupProtocol'
  error: any
  args: any
}

export class ProtocolManager implements ProtocolManagerShape {
  private _db?: Database.Database
  private _dbPath?: string
  private _errors: ProtocolError[] = []
  private _protocol: AppCaptureProtocolInterface | undefined

  get protocolEnabled (): boolean {
    return !!this._protocol
  }

  async setupProtocol (script: string) {
    debug('setting up protocol via script')

    try {
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
        method: 'setupProtocol',
        error,
        args: [script],
      })
    }
  }

  async connectToBrowser (cdpClient: CDPClient) {
    await this.invokeAsync('connectToBrowser', cdpClient)
  }

  async uploadCaptureArtifact (uploadUrl: string): Promise<void> {
    const dbPath = this._dbPath

    if (!this._protocol || !dbPath || !this._db) {
      return
    }

    debug(`uploading %s to %s`, dbPath, uploadUrl)

    return await fetch(uploadUrl, {
      agent,
      method: 'PUT',
      // @ts-ignore - this is supported
      body: fs.createReadStream(dbPath).pipe(createGzip()),
      headers: {
        'Content-Encoding': 'gzip',
        'Content-Type': 'binary/octet-stream',
      },
    }).then(async (res) => {
      const data = await res.text()

      debug(`response text: %s`, data)

      if (res.ok) {
        return
      }

      throw new Error(data)
    }).finally(() => {
      fs.unlink(dbPath).catch((e) => {
        debug(`Error unlinking db %o`, e)
      })
    })
  }

  addRunnables (runnables) {
    this.invokeSync('addRunnables', runnables)
  }

  beforeSpec (spec: { instanceId: string }) {
    if (!this._protocol) {
      return
    }

    const cypressProtocolDirectory = path.join(os.tmpdir(), 'cypress', 'protocol')
    const dbPath = this._dbPath = path.join(cypressProtocolDirectory, `${spec.instanceId}.db`)

    debug('connecting to database at %s', dbPath)

    const db = this._db = Database(dbPath, {
      nativeBinding: path.join(require.resolve('better-sqlite3/build/Release/better_sqlite3.node')),
      verbose: debugVerbose,
    })

    this.invokeSync('beforeSpec', db)
  }

  afterSpec () {
    this.invokeSync('afterSpec')
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

  /**
   * Abstracts invoking a synchronous method on the AppCaptureProtocol instance, so we can handle
   * errors in a uniform way
   */
  private invokeSync<K extends ProtocolSyncMethods> (method: K, ...args: Parameters<AppCaptureProtocolInterface[K]>) {
    if (!this._protocol) {
      return
    }

    try {
      // @ts-ignore - TS not associating the method & args properly, even though we know what they are
      this._protocol[method].apply(this._protocol, args)
    } catch (error) {
      this._errors.push({ method, error, args })
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
      await this._protocol[method].apply(this._protocol, args)
    } catch (error) {
      this._errors.push({ method, error, args })
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
