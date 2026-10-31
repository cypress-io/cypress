import Debug from 'debug'
import type { RemoteStubCall, RemoteStubSpec } from '@packages/types'

const debug = Debug('cypress:server:automation:remote_stubs')

// the global a CDP or Playwright binding reports calls through; BiDi passes a channel instead
export const REMOTE_STUB_BINDING = '__cypressRemoteStubCall'

const REGISTRY_KEY = 'Symbol.for(\'cypress:remote:stubs\')'

// Arguments and return values cross to the spec as JSON. Values JSON can't carry are tagged so the
// driver can revive them: undefined stays undefined and a function becomes a named placeholder.
const SERIALIZE = `(value) => {
  const seen = new Set()
  const walk = (value, depth) => {
    if (value === undefined) return { __cypressRemote: 'undefined' }
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
    if (typeof value === 'number') return Number.isFinite(value) ? value : String(value)
    if (typeof value === 'function') return { __cypressRemote: 'function', name: value.name }
    if (typeof value !== 'object') return String(value)
    try {
      if (value === value.window) return '[Window]'
      if (typeof value.nodeType === 'number' && typeof value.nodeName === 'string') {
        return '<' + value.nodeName.toLowerCase() + (value.id ? '#' + value.id : '') + '>'
      }
      if (typeof value.then === 'function') return '[Promise]'
      if (seen.has(value)) return '[Circular]'
      if (depth > 5) return '[Object]'
      seen.add(value)
      if (Array.isArray(value)) return value.map((item) => walk(item, depth + 1))
      if (value instanceof Error) return { name: value.name, message: value.message }
      const result = {}
      for (const key of Object.keys(value)) result[key] = walk(value[key], depth + 1)
      return result
    } catch (err) {
      return '[Object]'
    }
  }
  return walk(value, 0)
}`

// Installs each stub in the AUT's main world, or updates the behaviors of one already installed.
// `send` reports each call to the spec. A callsFake source is embedded as code rather than evaluated,
// so it runs under the AUT's Content-Security-Policy as any injected protocol script does.
export const installStubsSource = (specs: RemoteStubSpec[]) => {
  const fakes = specs.flatMap((spec) => {
    return spec.behaviors.map((behavior, index) => {
      return behavior.kind === 'callsFake' ? `${JSON.stringify(`${spec.id}/${index}`)}: (${behavior.source}),` : ''
    })
  }).join('\n')

  return `(send) => {
  const registry = window[${REGISTRY_KEY}] || Object.defineProperty(window, ${REGISTRY_KEY}, { value: { stubs: new Map() }, configurable: true })[${REGISTRY_KEY}]
  registry.send = send
  const serialize = ${SERIALIZE}
  const fakes = {
    ${fakes}
  }
  const toError = ({ name, message }) => {
    const err = new Error(message)
    if (name) err.name = name
    return err
  }
  const argsMatch = (expected, actual) => JSON.stringify(expected) === JSON.stringify(serialize(actual.slice(0, expected.length)))
  // like sinon, a behavior for matching arguments wins over the default one
  const findBehavior = (spec, args) => {
    const indexed = spec.behaviors.map((behavior, index) => ({ behavior, index }))
    return indexed.filter(({ behavior }) => behavior.args && argsMatch(behavior.args, args)).pop()
      || indexed.filter(({ behavior }) => !behavior.args).pop()
  }
  for (const spec of ${JSON.stringify(specs)}) {
    const installed = registry.stubs.get(spec.id)
    if (installed) {
      installed.spec = spec
      installed.fakes = fakes
      continue
    }
    let owner = window
    for (const key of spec.path.slice(0, -1)) owner = owner == null ? owner : owner[key]
    if (owner == null) continue
    const method = spec.path[spec.path.length - 1]
    const entry = { spec, fakes, owner, method, original: owner[method] }
    entry.replacement = function (...args) {
      const { spec, fakes, original } = entry
      const found = findBehavior(spec, args)
      const callOriginal = () => typeof original === 'function' ? original.apply(this, args) : undefined
      let returned
      let error
      try {
        if (!found) {
          returned = spec.type === 'spy' ? callOriginal() : undefined
        } else {
          const { behavior, index } = found
          if (behavior.kind === 'returns') returned = behavior.value
          if (behavior.kind === 'resolves') returned = Promise.resolve(behavior.value)
          if (behavior.kind === 'throws') error = toError(behavior.error)
          if (behavior.kind === 'rejects') returned = Promise.reject(toError(behavior.error))
          if (behavior.kind === 'callThrough') returned = callOriginal()
          if (behavior.kind === 'callsFake') returned = fakes[spec.id + '/' + index].apply(this, args)
        }
      } catch (err) {
        error = err
      }
      try {
        registry.send(JSON.stringify({ id: spec.id, args: args.map((arg) => serialize(arg)), returned: serialize(returned) }))
      } catch (err) {}
      if (error) throw error
      return returned
    }
    owner[method] = entry.replacement
    registry.stubs.set(spec.id, entry)
  }
}`
}

export const RESTORE_STUBS_SOURCE = `() => {
  const registry = window[${REGISTRY_KEY}]
  if (!registry) return
  for (const { owner, method, original, replacement } of registry.stubs.values()) {
    if (owner[method] === replacement) owner[method] = original
  }
  registry.stubs.clear()
}`

export interface RemoteStubsTransport {
  // runs `source(send)` in every new AUT document, and returns a function that stops it
  addPreloadScript: (source: string) => Promise<() => Promise<unknown>>
  // runs `source(send)` in the AUT's current document
  callInAut: (source: string) => Promise<unknown>
}

export const parseStubCall = (payload: string): RemoteStubCall => JSON.parse(payload)

// The current test's cy.stub / cy.spy agents on the AUT's window. They're kept in one preload script,
// so they're in place in every document the AUT loads during the test, before its own scripts run.
export class RemoteStubs {
  private specs = new Map<string, RemoteStubSpec>()
  private removePreloadScript: (() => Promise<unknown>) | undefined
  // the driver sends changes without waiting, so they're applied in the order they arrive
  private queue: Promise<unknown> = Promise.resolve()

  constructor (private transport: RemoteStubsTransport) {}

  add (spec: RemoteStubSpec) {
    return this.enqueue(async () => {
      this.specs.set(spec.id, spec)
      await this.apply(spec)
    })
  }

  update ({ id, behaviors }: Pick<RemoteStubSpec, 'id' | 'behaviors'>) {
    return this.enqueue(async () => {
      const spec = this.specs.get(id)

      if (spec) {
        spec.behaviors = behaviors
        await this.apply(spec)
      }
    })
  }

  reset () {
    return this.enqueue(async () => {
      this.specs.clear()
      await this.clearPreloadScript()
      await this.transport.callInAut(RESTORE_STUBS_SOURCE).catch((err) => debug('could not restore stubs: %s', err?.message))
    })
  }

  private enqueue (fn: () => Promise<void>) {
    const next = this.queue.then(fn)

    this.queue = next.catch(() => {})

    return next
  }

  private async apply (changed: RemoteStubSpec) {
    await this.clearPreloadScript()
    this.removePreloadScript = await this.transport.addPreloadScript(installStubsSource([...this.specs.values()]))
    // there may be no document to stub yet, and the preload script covers the next one
    await this.transport.callInAut(installStubsSource([changed])).catch((err) => debug('could not stub the current document: %s', err?.message))
  }

  private async clearPreloadScript () {
    const remove = this.removePreloadScript

    this.removePreloadScript = undefined
    await remove?.().catch(() => {})
  }
}
