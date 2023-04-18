import fs from 'fs-extra'
import { NodeVM } from 'vm2'
import Debug from 'debug'
import type { ProtocolManager, AppCaptureProtocolInterface } from '@packages/types'
import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'

const debug = Debug('cypress:server:protocol')
const debugVerbose = Debug('cypress-verbose:server:protocol')

const setupProtocol = async (url?: string): Promise<AppCaptureProtocolInterface | undefined> => {
  let script: string | undefined

  // TODO(protocol): We will need to remove this option in production
  if (process.env.CYPRESS_LOCAL_PROTOCOL_PATH) {
    script = await fs.readFile(process.env.CYPRESS_LOCAL_PROTOCOL_PATH, 'utf8')
  } else if (url) {
    // TODO(protocol): Download the protocol script from the cloud
  }

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

class ProtocolManagerImpl implements ProtocolManager {
  private protocol: AppCaptureProtocolInterface | undefined

  protocolEnabled (): boolean {
    return !!this.protocol
  }

  async setupProtocol (url?: string) {
    debug('setting up protocol via url %s', url)

    this.protocol = await setupProtocol(url)
  }

  async connectToBrowser (cdpClient) {
    if (!this.protocolEnabled()) {
      return
    }

    await this.protocol?.connectToBrowser(cdpClient)
  }

  addRunnables (runnables) {
    if (!this.protocolEnabled()) {
      return
    }

    this.protocol?.addRunnables(runnables)
  }

  beforeSpec (spec: { instanceId: string }) {
    if (!this.protocolEnabled()) {
      return
    }

    const cypressProtocolDirectory = path.join(os.tmpdir(), 'cypress', 'protocol')
    const dbPath = path.join(cypressProtocolDirectory, `${spec.instanceId}.db`)

    debug('connecting to database at %s', dbPath)

    const db = Database(dbPath, {
      nativeBinding: path.join(require.resolve('better-sqlite3/build/Release/better_sqlite3.node')),
      verbose: debugVerbose,
    })

    this.protocol?.beforeSpec(db)
  }

  afterSpec () {
    if (!this.protocolEnabled()) {
      return
    }

    this.protocol?.afterSpec()
  }

  beforeTest (test) {
    if (!this.protocolEnabled()) {
      return
    }

    this.protocol?.beforeTest(test)
  }

  afterTest (test) {
    if (!this.protocolEnabled()) {
      return
    }

    this.protocol?.afterTest(test)
  }

  commandLogAdded (log: any) {
    if (!this.protocolEnabled()) {
      return
    }

    this.protocol?.commandLogAdded(log)
  }

  commandLogChanged (log: any): void {
    if (!this.protocolEnabled()) {
      return
    }

    this.protocol?.commandLogChanged(log)
  }

  viewportChanged (input: any): void {
    if (!this.protocolEnabled()) {
      return
    }

    this.protocol?.viewportChanged(input)
  }

  urlChanged (input: any): void {
    if (!this.protocolEnabled()) {
      return
    }

    this.protocol?.urlChanged(input)
  }
}

export default ProtocolManagerImpl
