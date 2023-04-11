import fs from 'fs-extra'
import { NodeVM } from 'vm2'
import Debug from 'debug'
import type { ProtocolManagerShape, AppCaptureProtocolInterface } from '@packages/types'
import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'

const debug = Debug('cypress:server:protocol')
const debugVerbose = Debug('cypress-verbose:server:protocol')

export class ProtocolManager implements ProtocolManagerShape {
  private _errors: Error[] = []
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
    } catch (e) {
      this._errors.push(e)
    }
  }

  async connectToBrowser (cdpClient) {
    if (!this._protocol) {
      return
    }

    debug('connecting to browser for new spec')

    try {
      await this._protocol.connectToBrowser(cdpClient)
    } catch (e) {
      this._errors.push(e)
    }
  }

  addRunnables (runnables) {
    if (!this._protocol) {
      return
    }

    try {
      this._protocol.addRunnables(runnables)
    } catch (e) {
      this._errors.push(e)
    }
  }

  beforeSpec (spec: { instanceId: string }) {
    if (!this._protocol) {
      return
    }

    const cypressProtocolDirectory = path.join(os.tmpdir(), 'cypress', 'protocol')
    const dbPath = path.join(cypressProtocolDirectory, `${spec.instanceId}.db`)

    debug('connecting to database at %s', dbPath)

    const db = Database(dbPath, {
      nativeBinding: path.join(require.resolve('better-sqlite3/build/Release/better_sqlite3.node')),
      verbose: debugVerbose,
    })

    try {
      this._protocol.beforeSpec(db)
    } catch (e) {
      this._errors.push(e)
    }
  }

  afterSpec () {
    if (!this._protocol) {
      return
    }

    debug('after spec')

    try {
      this._protocol.afterSpec()
    } catch (e) {
      this._errors.push(e)
    }
  }

  beforeTest (test) {
    if (!this._protocol) {
      return
    }

    debug('before test %O', test)

    try {
      this._protocol.beforeTest(test)
    } catch (e) {
      this._errors.push(e)
    }
  }

  afterTest (test) {
    if (!this._protocol) {
      return
    }

    debug('after test %O', test)

    try {
      this._protocol.afterTest(test)
    } catch (e) {
      this._errors.push(e)
    }
  }
}

export default ProtocolManager
