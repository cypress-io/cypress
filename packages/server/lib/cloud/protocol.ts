import fs from 'fs-extra'
import { NodeVM } from 'vm2'
import Debug from 'debug'
import CDP from 'chrome-remote-interface'
import type { ProtocolManager } from '@packages/types'

const debug = Debug('cypress:server:protocol')

const setupProtocol = async () => {
  let script: string

  // TODO: We will need to remove this option in production
  if (process.env.CYPRESS_LOCAL_PROTOCOL_PATH) {
    script = await fs.readFile(process.env.CYPRESS_LOCAL_PROTOCOL_PATH, 'utf8')
  } else {
    // TODO: Download the protocol script from the cloud
    script = ''
  }

  const vm = new NodeVM({
    console: 'inherit',
    sandbox: { Debug, CDP },
  })

  const { Capture } = vm.run(script)

  return new Capture()
}

class ProtocolManagerImpl implements ProtocolManager {
  private protocol: any

  async setupProtocol () {
    debug('setting up protocol')

    this.protocol = await setupProtocol()
  }

  connectToBrowser (options) {
    debug('connecting to browser for new spec')
    this.protocol.connectToBrowser(options)
  }

  beforeSpec (spec) {
    debug('initializing new spec %O', spec.relative)
    this.protocol.beforeSpec(spec)

    // Initialize DB here
  }

  afterSpec () {
    debug('after spec')
    this.protocol.afterSpec()
  }

  beforeTest (attr, test) {
    debug('initialize new test %O', test.title)
    this.protocol.beforeTest(attr, test)
  }
}

export default ProtocolManagerImpl
