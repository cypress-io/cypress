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
  id: number
  specs: SpecWithRelativeRoot[]
  options?: SpecsChangedOptions
}

// resolves each spec update once the plugins child has handed it to the dev server
const delivered = new Map<number, () => void>()
let nextSpecsChangedId = 0

// a plugins child that exits before replying leaves the run to the config process exit handling
const DELIVERY_TIMEOUT_MS = 10_000

interface CompileSuccessData {
  specFile?: string
}

plugins.registerHandler((ipc: PluginIpcHandler) => {
  baseEmitter.on('dev-server:specs:changed', (specsAndOptions: SpecsChangedData) => {
    ipc.send('dev-server:specs:changed', specsAndOptions)
  })

  ipc.on('dev-server:specs:delivered', ({ id }: { id: number }) => {
    delivered.get(id)?.()
  })

  ipc.on('dev-server:compile:success', ({ specFile }: CompileSuccessData = {}) => {
    baseEmitter.emit('dev-server:compile:success', { specFile })
  })
})

/**
 * Tells this process's own dev server, in its plugins child, which specs to compile. Resolves once
 * the dev server has the new list, so a spec loaded afterwards waits for the build that includes it.
 */
export const emitSpecsChanged: UpdateSpecs = (specs, options) => {
  if (!baseEmitter.listenerCount('dev-server:specs:changed')) return Promise.resolve()

  const id = nextSpecsChangedId++

  return new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer)
      delivered.delete(id)
      resolve()
    }
    const timer = setTimeout(() => {
      debugFn('the plugins child did not confirm spec update %d', id)
      done()
    }, DELIVERY_TIMEOUT_MS).unref()

    delivered.set(id, done)
    const data: SpecsChangedData = { id, specs, options }

    baseEmitter.emit('dev-server:specs:changed', data)
  })
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
    delivered.forEach((done) => done())
    baseEmitter.removeAllListeners()
  },
}

export default API
