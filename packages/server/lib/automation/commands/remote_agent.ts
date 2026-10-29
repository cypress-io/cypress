import Debug from 'debug'
import type { Protocol } from 'devtools-protocol'
import type { RemoteAgentFrameOwner, RemoteAgentRequest } from '@packages/types'
import { getRunnerRemoteAgentContents } from '@packages/resolve-dist'
import type { SendDebuggerCommand } from '../../browsers/cdp-protocol/cdp_automation'

const debug = Debug('cypress:server:automation:command:remote_agent')

const WORLD_NAME = '__cypress_remote_agent'
const AGENT_GLOBAL = '__cypressAgent'

const isMissingContextError = (err: unknown) => {
  return err instanceof Error && err.message.includes('Cannot find context with specified id')
}

// Owns the agent's isolated world in each AUT frame. The world shares the
// frame's DOM but not its JS globals, so the agent keeps working whatever the
// AUT's origin is and whatever the AUT does to its own globals.
export class CdpRemoteAgent {
  private worlds: Map<string, Protocol.Runtime.ExecutionContextId> = new Map()
  private source: Promise<string> | undefined

  constructor (
    private send: SendDebuggerCommand,
    private contexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>,
    private getSource: () => Promise<Buffer | string> = getRunnerRemoteAgentContents,
  ) {}

  async call (frame: Protocol.Page.Frame, request: RemoteAgentRequest): Promise<unknown> {
    let frameId = frame.id

    for (const owner of request.frames ?? []) {
      const child = await this.inWorld(frameId, (contextId) => this.getOwnedFrameId(contextId, owner))

      if (typeof child !== 'string') {
        return child
      }

      frameId = child
    }

    return this.inWorld(frameId, (contextId) => this.evaluate(contextId, request))
  }

  private async inWorld<T> (frameId: string, fn: (contextId: Protocol.Runtime.ExecutionContextId) => Promise<T>): Promise<T> {
    try {
      return await fn(await this.getWorld(frameId))
    } catch (err) {
      if (!isMissingContextError(err)) {
        throw err
      }

      debug('agent world for frame %s went away, recreating it', frameId)
      this.worlds.delete(frameId)

      return fn(await this.getWorld(frameId))
    }
  }

  // Returns the id of the frame the owner element holds, or an agent error
  // response the driver retries until the iframe exists
  private async getOwnedFrameId (contextId: Protocol.Runtime.ExecutionContextId, owner: RemoteAgentFrameOwner) {
    const notFound = (reason: string) => {
      return {
        ok: false,
        error: { name: 'Error', message: `Expected \`${owner.selector}\` to be an iframe, but ${reason}.`, retry: true },
      }
    }

    const { result, exceptionDetails } = await this.send('Runtime.evaluate', {
      contextId,
      expression: `${AGENT_GLOBAL}.frameOwner(${JSON.stringify(owner.steps)})`,
    })

    if (exceptionDetails) {
      throw new Error(`The remote agent threw while finding \`${owner.selector}\`: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`)
    }

    if (!result.objectId) {
      return notFound(String(result.value))
    }

    try {
      const { node } = await this.send('DOM.describeNode', { objectId: result.objectId })

      return node.frameId ?? notFound('its document is not loaded')
    } finally {
      await this.send('Runtime.releaseObject', { objectId: result.objectId }).catch(() => {})
    }
  }

  private async evaluate (contextId: Protocol.Runtime.ExecutionContextId, { method, context, args }: RemoteAgentRequest) {
    const { result, exceptionDetails } = await this.send('Runtime.evaluate', {
      contextId,
      expression: `${AGENT_GLOBAL}.call(${JSON.stringify(method)}, ${JSON.stringify(context)}, ${JSON.stringify(args)})`,
      awaitPromise: true,
      returnByValue: true,
    })

    if (exceptionDetails) {
      throw new Error(`The remote agent threw while running '${method}': ${exceptionDetails.exception?.description ?? exceptionDetails.text}`)
    }

    return result.value
  }

  private async getWorld (frameId: string) {
    const existing = this.worlds.get(frameId)

    // a navigation destroys the world along with the frame's other contexts
    if (existing !== undefined && this.contexts.has(existing)) {
      return existing
    }

    const { executionContextId } = await this.send('Page.createIsolatedWorld', {
      frameId,
      worldName: WORLD_NAME,
    })

    this.source ??= Promise.resolve(this.getSource()).then(String)

    const { exceptionDetails } = await this.send('Runtime.evaluate', {
      contextId: executionContextId,
      expression: await this.source,
    })

    if (exceptionDetails) {
      throw new Error(`The remote agent failed to load: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`)
    }

    debug('created agent world %d for frame %s', executionContextId, frameId)
    this.worlds.set(frameId, executionContextId)

    return executionContextId
  }
}
