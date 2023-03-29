import fs from 'fs-extra'
import { NodeVM } from 'vm2'
import Debug from 'debug'
import type { ProtocolManager, AppCaptureProtocolInterface } from '@packages/types'
import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import { SqliteDialect, Kysely } from 'kysely'

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
        Kysely,
        SqliteDialect,
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
    debug('connecting to browser for new spec')

    await this.protocol?.connectToBrowser(cdpClient)
  }

  async addRunnables (runnables) {
    await this.protocol?.addRunnables(runnables)
  }

  beforeSpec (spec: { instanceId: string }) {
    const cypressProtocolDirectory = path.join(os.tmpdir(), 'cypress', 'protocol')
    const dbPath = path.join(cypressProtocolDirectory, `${spec.instanceId}.db`)

    debug('connecting to database at %s', dbPath)

    const db = Database(dbPath, {
      nativeBinding: path.join(require.resolve('better-sqlite3/build/Release/better_sqlite3.node')),
      verbose: debugVerbose,
    })

    this.protocol?.beforeSpec(db)
  }

  async afterSpec () {
    debug('after spec')

    await this.protocol?.afterSpec()
  }

  async beforeTest (test) {
    debug('before test %O', test)

    await this.protocol?.beforeTest(test)
  }

  async afterTest (test) {
    debug('after test %O', test)

    await this.protocol?.afterTest(test)
  }
}

export default ProtocolManagerImpl
