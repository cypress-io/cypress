import '../cwd'

import { EventEmitter } from 'events'
import debug from 'debug'
import * as plugins from '../plugins'
import type { FullConfig, SpecWithRelativeRoot, PluginIpcHandler } from '@packages/types'

const debugFn = debug('cypress:ct:dev-server')

const baseEmitter = new EventEmitter()

interface SpecsChangedOptions {
  neededForJustInTimeCompile?: boolean
}

interface SpecsChangedData {
  specs: SpecWithRelativeRoot[]
  options?: SpecsChangedOptions
}

interface CompileSuccessData {
  specFile?: string
}

plugins.registerHandler((ipc: PluginIpcHandler) => {
  baseEmitter.on('dev-server:specs:changed', (specsAndOptions: SpecsChangedData) => {
    ipc.send('dev-server:specs:changed', specsAndOptions)
  })

  ipc.on('dev-server:compile:success', ({ specFile }: CompileSuccessData = {}) => {
    baseEmitter.emit('dev-server:compile:success', { specFile })
  })
})

// for simpler stubbing from unit tests
interface DevServerAPI {
  emitter: EventEmitter
  start: (options: { specs: Cypress.Spec[], config: FullConfig }) => Promise<Cypress.ResolvedDevServerConfig>
  updateSpecs: (specs: SpecWithRelativeRoot[], options?: SpecsChangedOptions) => void
  close: () => void
}

const API: DevServerAPI = {
  emitter: baseEmitter,

  start ({ specs, config }: { specs: Cypress.Spec[], config: FullConfig }) {
    return plugins.execute('dev-server:start', { specs, config })
  },

  updateSpecs (specs: SpecWithRelativeRoot[], options?: SpecsChangedOptions) {
    baseEmitter.emit('dev-server:specs:changed', { specs, options })
  },

  close () {
    debugFn('close dev-server')
    baseEmitter.removeAllListeners()
  },
}

export default API
