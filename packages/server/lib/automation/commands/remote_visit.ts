import type { RemoteVisitBeforeLoad, RemoteVisitCallbacks, RemoteVisitResult } from '@packages/types'

const RESULT_KEY = 'Symbol.for(\'cypress:remote:visit\')'

export const SERIALIZE_ERROR = `(err) => ({
  name: err && err.name,
  message: err && err.message !== undefined ? String(err.message) : String(err),
  stack: err && err.stack,
})`

// Runs onBeforeLoad in the AUT's main world before the app's own scripts. It is registered
// for every frame, so it checks the frame's name, and leaves its result for onLoadExpression.
export const beforeLoadScript = ({ frameName, token, args, onBeforeLoad }: RemoteVisitBeforeLoad) => {
  return `(() => {
    if (window.name !== ${JSON.stringify(frameName)}) return
    let error
    try {
      (${onBeforeLoad})(window, ${JSON.stringify(args)})
    } catch (err) {
      error = (${SERIALIZE_ERROR})(err)
    }
    Object.defineProperty(window, ${RESULT_KEY}, { value: { token: ${JSON.stringify(token)}, error }, configurable: true })
  })()`
}

export const onLoadExpression = ({ token, args, onLoad }: RemoteVisitCallbacks) => {
  return `(() => {
    const before = window[${RESULT_KEY}]
    delete window[${RESULT_KEY}]
    const beforeLoadRan = !!before && before.token === ${JSON.stringify(token)}
    if (beforeLoadRan && before.error) {
      return JSON.stringify({ beforeLoadRan, error: { phase: 'onBeforeLoad', ...before.error } })
    }
    ${onLoad ? `try {
      (${onLoad})(window, ${JSON.stringify(args)})
    } catch (err) {
      return JSON.stringify({ beforeLoadRan, error: { phase: 'onLoad', ...(${SERIALIZE_ERROR})(err) } })
    }` : ''}
    return JSON.stringify({ beforeLoadRan })
  })()`
}

export interface RemoteVisitTransport {
  // registers a script to run in every new document, and returns a function that unregisters it
  addPreloadScript: (source: string) => Promise<() => Promise<unknown>>
  // evaluates an expression in the AUT's main world and returns its string result
  evaluateInAut: (expression: string) => Promise<string>
}

export class RemoteVisit {
  private removePreloadScript: (() => Promise<unknown>) | undefined

  constructor (private transport: RemoteVisitTransport) {}

  async beforeLoad (data: RemoteVisitBeforeLoad) {
    // a visit that failed before its load never collected its script
    await this.clear()
    this.removePreloadScript = await this.transport.addPreloadScript(beforeLoadScript(data))
  }

  async onLoad (data: RemoteVisitCallbacks): Promise<RemoteVisitResult> {
    await this.clear()

    return JSON.parse(await this.transport.evaluateInAut(onLoadExpression(data)))
  }

  private async clear () {
    const remove = this.removePreloadScript

    this.removePreloadScript = undefined
    await remove?.().catch(() => {})
  }
}
