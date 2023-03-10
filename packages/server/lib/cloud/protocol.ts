import fs from 'fs-extra'
import { NodeVM } from 'vm2'
import Debug from 'debug'
import CDP from 'chrome-remote-interface'
import type { ProtocolManager } from '@packages/types'

interface AppCaptureProtocolInterface {
  setupProtocol (url?: string): Promise<void>
  connectToBrowser (options: any): void
  beforeSpec (spec: any): void
  afterSpec (): void
  beforeTest (test: any): void
}

const debug = Debug('cypress:server:protocol')

const setupProtocol = async (url?: string): Promise<AppCaptureProtocolInterface | undefined> => {
  let script: string | undefined

  // TODO: We will need to remove this option in production
  if (process.env.CYPRESS_LOCAL_PROTOCOL_PATH) {
    script = await fs.readFile(process.env.CYPRESS_LOCAL_PROTOCOL_PATH, 'utf8')
  } else if (url) {
    // TODO: Download the protocol script from the cloud
  }

  if (script) {
    const vm = new NodeVM({
      console: 'inherit',
      sandbox: { Debug, CDP },
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
    debug('setting up protocol')

    this.protocol = await setupProtocol(url)
  }

  connectToBrowser (options) {
    debug('connecting to browser for new spec')
    this.protocol?.connectToBrowser(options)
  }

  beforeSpec (spec) {
    debug('initializing new spec %O', spec.relative)
    this.protocol?.beforeSpec(spec)

    // Initialize DB here
  }

  afterSpec () {
    debug('after spec')
    this.protocol?.afterSpec()
  }

  beforeTest (test) {
    debug('initialize new test %O', test)
    this.protocol?.beforeTest(test)
  }
}

export default ProtocolManagerImpl
