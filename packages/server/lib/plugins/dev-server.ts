import { EventEmitter } from 'events'
import debug from 'debug'
import * as plugins from '../plugins'
import type { FullConfig, SpecWithRelativeRoot, PluginIpcHandler } from '@packages/types'

const debugFn = debug('cypress:ct:dev-server')

const baseEmitter = new EventEmitter()

export interface SpecsChangedOptions {
  neededForJustInTimeCompile?: boolean
}

type UpdateSpecs = (specs: SpecWithRelativeRoot[], options?: SpecsChangedOptions) => void | Promise<void>

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

/** Tells this process's own dev server, in its plugins child, which specs to compile. */
export const emitSpecsChanged: UpdateSpecs = (specs, options) => {
  baseEmitter.emit('dev-server:specs:changed', { specs, options })
}

let specUpdates: UpdateSpecs = emitSpecsChanged

/** With `--workers`, one dev server serves every worker, so the coordinator decides which specs it compiles. */
export const routeSpecUpdates = (route: UpdateSpecs) => {
  specUpdates = route
}

// for simpler stubbing from unit tests
interface DevServerAPI {
  emitter: EventEmitter
  start: (options: { specs: Cypress.Spec[], config: FullConfig }) => Promise<Cypress.ResolvedDevServerConfig>
  updateSpecs: UpdateSpecs
  close: () => void
}

const API: DevServerAPI = {
  emitter: baseEmitter,

  start ({ specs, config }: { specs: Cypress.Spec[], config: FullConfig }) {
    return plugins.execute('dev-server:start', { specs, config })
  },

  updateSpecs (specs: SpecWithRelativeRoot[], options?: SpecsChangedOptions) {
    return specUpdates(specs, options)
  },

  close () {
    debugFn('close dev-server')
    baseEmitter.removeAllListeners()
  },
}

export default API
