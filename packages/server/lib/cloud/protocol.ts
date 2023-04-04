import fs from 'fs-extra'
import { NodeVM } from 'vm2'
import Debug from 'debug'
import type { ProtocolManagerShape, AppCaptureProtocolInterface } from '@packages/types'
import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'

const debug = Debug('cypress:server:protocol')
const debugVerbose = Debug('cypress-verbose:server:protocol')

const setupProtocol = async (script?: string): Promise<AppCaptureProtocolInterface | undefined> => {
  if (script) {
    const cypressProtocolDirectory = path.join(os.tmpdir(), 'cypress', 'protocol')

    // TODO(protocol): Handle any errors here appropriately. Likely, we will want to handle all errors in the initialization process similarly (e.g. downloading, file permissions, etc.)
    await fs.ensureDir(cypressProtocolDirectory)
    const vm = new NodeVM({
      console: 'inherit',
      sandbox: {
        Debug,
      },
    })

    const { AppCaptureProtocol } = vm.run(script)

    return new AppCaptureProtocol()
  }

  return
}

export class ProtocolManager implements ProtocolManagerShape {
  private _protocol: AppCaptureProtocolInterface | undefined

  get protocolEnabled (): boolean {
    return !!this._protocol
  }

  async setupProtocol (script: string) {
    debug('setting up protocol via script')

    this._protocol = await setupProtocol(script)
  }

  async connectToBrowser (cdpClient) {
    if (!this._protocol) {
      return
    }

    debug('connecting to browser for new spec')

    await this._protocol.connectToBrowser(cdpClient)
  }

  addRunnables (runnables) {
    if (!this._protocol) {
      return
    }

    this._protocol.addRunnables(runnables)
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

    this._protocol.beforeSpec(db)
  }

  afterSpec () {
    if (!this._protocol) {
      return
    }

    debug('after spec')

    this._protocol.afterSpec()
  }

  beforeTest (test) {
    if (!this._protocol) {
      return
    }

    debug('before test %O', test)

    this._protocol.beforeTest(test)
  }

  afterTest (test) {
    if (!this._protocol) {
      return
    }

    debug('after test %O', test)

    this._protocol.afterTest(test)
  }
}

export default ProtocolManager
