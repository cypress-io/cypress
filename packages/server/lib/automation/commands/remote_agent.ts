import Debug from 'debug'
import type { Protocol } from 'devtools-protocol'
import type { RemoteAgentFrameOwner, RemoteAgentRequest } from '@packages/types'
import { getRunnerRemoteAgentContents } from '@packages/resolve-dist'
import type { SendDebuggerCommand } from '../../browsers/cdp-protocol/cdp_automation'
import type { Client as WebDriverClient } from 'webdriver'
import type playwright from 'playwright-webkit'
import type { ScriptEvaluateResult, ScriptRemoteValue } from 'webdriver/build/bidi/localTypes'

const debug = Debug('cypress:server:automation:command:remote_agent')

const WORLD_NAME = '__cypress_remote_agent'
const AGENT_GLOBAL = '__cypressAgent'

// An agent error response, which the driver retries until the iframe exists
const frameNotFound = (owner: RemoteAgentFrameOwner, reason: string) => {
  return {
    ok: false,
    error: { name: 'Error', message: `Expected \`${owner.selector}\` to be an iframe, but ${reason}.`, retry: true },
  }
}

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

  private async getOwnedFrameId (contextId: Protocol.Runtime.ExecutionContextId, owner: RemoteAgentFrameOwner) {
    const { result, exceptionDetails } = await this.send('Runtime.evaluate', {
      contextId,
      expression: `${AGENT_GLOBAL}.frameOwner(${JSON.stringify(owner.steps)})`,
    })

    if (exceptionDetails) {
      throw new Error(`The remote agent threw while finding \`${owner.selector}\`: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`)
    }

    if (!result.objectId) {
      return frameNotFound(owner, String(result.value))
    }

    try {
      const { node } = await this.send('DOM.describeNode', { objectId: result.objectId })

      return node.frameId ?? frameNotFound(owner, 'its document is not loaded')
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

type TabMatcher = NonNullable<RemoteAgentRequest['tab']>

const matchesTab = (url: string, matcher: TabMatcher) => {
  if (matcher.url === undefined) {
    return true
  }

  if (typeof matcher.url === 'string') {
    return url.includes(matcher.url)
  }

  return new RegExp(matcher.url.source, matcher.url.flags).test(url)
}

const describeTab = (matcher: TabMatcher) => {
  if (matcher.url === undefined) {
    return 'any tab'
  }

  return typeof matcher.url === 'string' ? `\`${matcher.url}\`` : `/${matcher.url.source}/${matcher.url.flags}`
}

export const tabsNotSupported = (browser: string) => {
  return { ok: false, error: { name: 'Error', message: `\`cy.tab()\` is not supported in ${browser} yet.`, retry: false } }
}

// A tab the app opened, however the browser's protocol drives it
export interface RemoteTab {
  url (): Promise<string>
  bringToFront (): Promise<void>
  call (request: RemoteAgentRequest): Promise<unknown>
}

// Sends each agent call to the AUT or to the tab it names, and returns focus
// to the runner once a call in the AUT follows one that brought a tab forward
export class RemoteTabs {
  private tabInFront = false

  constructor (
    private getTabs: () => RemoteTab[] | Promise<RemoteTab[]>,
    private bringRunnerToFront: () => Promise<void>,
  ) {}

  async call (request: RemoteAgentRequest, callInAut: () => Promise<unknown>): Promise<unknown> {
    const { tab: matcher } = request

    if (!matcher) {
      if (this.tabInFront) {
        this.tabInFront = false
        await this.bringRunnerToFront()
      }

      return callInAut()
    }

    const tab = await this.find(matcher)

    if (!tab) {
      // a missing tab has no elements, which lets `cy.tab(url).should('not.exist')` wait for it to close
      return request.method === 'resolve'
        ? { ok: true, value: { elements: [] } }
        : { ok: false, error: { name: 'Error', message: `Expected to find a tab matching ${describeTab(matcher)}, but never found one.`, retry: true } }
    }

    // a background tab doesn't get focus, which typing and focus events depend on
    if (request.method !== 'resolve') {
      await tab.bringToFront()
      this.tabInFront = true
    }

    return tab.call(request)
  }

  // newest first, so a matcher that fits several tabs picks the one opened last
  private async find (matcher: TabMatcher) {
    const tabs = [...await this.getTabs()].reverse()

    for (const tab of tabs) {
      try {
        if (matchesTab(await tab.url(), matcher)) {
          return tab
        }
      } catch (err) {
        debug('could not read the URL of a tab, skipping it: %o', err)
      }
    }

    return undefined
  }
}

export interface CdpTab {
  targetId: string
  send: SendDebuggerCommand
  on: (event: 'Runtime.executionContextCreated' | 'Runtime.executionContextDestroyed' | 'Runtime.executionContextsCleared', cb: (params: any) => void) => void
}

// Each CDP tab has its own client, so each gets its own agent and execution context tracking
export class CdpRemoteTabs {
  private agents = new Map<string, Promise<CdpRemoteAgent>>()

  constructor (
    private getTabs: () => CdpTab[],
    private getSource: () => Promise<Buffer | string> = getRunnerRemoteAgentContents,
  ) {}

  list (): RemoteTab[] {
    const tabs = this.getTabs()

    for (const targetId of this.agents.keys()) {
      if (!tabs.some((tab) => tab.targetId === targetId)) {
        this.agents.delete(targetId)
      }
    }

    return tabs.map((tab) => {
      const getFrame = async () => (await tab.send('Page.getFrameTree')).frameTree.frame

      return {
        url: async () => (await getFrame()).url,
        bringToFront: async () => {
          await tab.send('Page.bringToFront')
        },
        call: async (request) => (await this.getAgent(tab)).call(await getFrame(), request),
      }
    })
  }

  private getAgent (tab: CdpTab) {
    let agent = this.agents.get(tab.targetId)

    if (!agent) {
      const contexts = new Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>()

      tab.on('Runtime.executionContextCreated', ({ context }) => contexts.set(context.id, context))
      tab.on('Runtime.executionContextDestroyed', ({ executionContextId }) => contexts.delete(executionContextId))
      tab.on('Runtime.executionContextsCleared', () => contexts.clear())

      agent = tab.send('Runtime.enable').then(() => new CdpRemoteAgent(tab.send, contexts, this.getSource))
      agent.catch(() => this.agents.delete(tab.targetId))
      this.agents.set(tab.targetId, agent)
    }

    return agent
  }
}

const AGENT_MISSING = '__cypress_remote_agent_missing__'

// The BiDi counterpart of CdpRemoteAgent. A named sandbox shares the frame's
// DOM but not its JS globals, and lives until the frame navigates, which also
// clears the agent installed in it.
export class BidiRemoteAgent {
  private source: Promise<string> | undefined

  constructor (
    private client: WebDriverClient,
    private getSource: () => Promise<Buffer | string> = getRunnerRemoteAgentContents,
  ) {}

  async call (autContextId: string, request: RemoteAgentRequest): Promise<unknown> {
    let contextId = autContextId

    for (const owner of request.frames ?? []) {
      const child = await this.getOwnedContextId(contextId, owner)

      if (typeof child !== 'string') {
        return child
      }

      contextId = child
    }

    const { method, context, args } = request
    const result = await this.withAgent(contextId, `running '${method}'`, `(async () => JSON.stringify(await window.${AGENT_GLOBAL}.call(${JSON.stringify(method)}, ${JSON.stringify(context)}, ${JSON.stringify(args)})))()`)

    return JSON.parse(String(result.value))
  }

  // BiDi has no DOM.describeNode, but serializes a WindowProxy as the id of its browsing context
  private async getOwnedContextId (contextId: string, owner: RemoteAgentFrameOwner) {
    const result = await this.withAgent(contextId, `finding \`${owner.selector}\``, `(() => {
      const owner = window.${AGENT_GLOBAL}.frameOwner(${JSON.stringify(owner.steps)})

      return typeof owner === 'string' ? owner : (owner.contentWindow ?? 'its document is not loaded')
    })()`)

    if (result.type === 'window') {
      return result.value.context
    }

    return frameNotFound(owner, String(result.type === 'string' ? result.value : result.type))
  }

  // Installs the agent first when the frame has none, so the common case is one round trip
  private async withAgent (contextId: string, action: string, expression: string): Promise<ScriptRemoteValue & { value?: any }> {
    const guarded = `window.${AGENT_GLOBAL} === undefined ? ${JSON.stringify(AGENT_MISSING)} : ${expression}`
    let result = await this.evaluate(contextId, action, guarded)

    if (result.type === 'string' && result.value === AGENT_MISSING) {
      await this.install(contextId)
      result = await this.evaluate(contextId, action, expression)
    }

    return result
  }

  private async install (contextId: string) {
    this.source ??= Promise.resolve(this.getSource()).then(String)

    const result = await this.client.scriptEvaluate({
      expression: await this.source,
      target: { context: contextId, sandbox: WORLD_NAME },
      awaitPromise: false,
    }) as ScriptEvaluateResult

    if (result.type === 'exception') {
      throw new Error(`The remote agent failed to load: ${result.exceptionDetails.text}`)
    }

    debug('installed agent in sandbox for browsing context %s', contextId)
  }

  private async evaluate (contextId: string, action: string, expression: string) {
    const result = await this.client.scriptEvaluate({
      expression,
      target: { context: contextId, sandbox: WORLD_NAME },
      awaitPromise: true,
    }) as ScriptEvaluateResult

    if (result.type === 'exception') {
      throw new Error(`The remote agent threw while ${action}: ${result.exceptionDetails.text}`)
    }

    return result.result
  }
}

type UtilityEvaluateOptions = { world: 'utility', isFunction: false }

interface PlaywrightServerHandle {
  _value?: unknown
  asElement (): PlaywrightServerElementHandle | null
  dispose (): void
}

interface PlaywrightServerElementHandle extends PlaywrightServerHandle {
  _contentFrame (): Promise<PlaywrightServerFrame | null>
}

interface PlaywrightServerFrame {
  _evaluateExpression (expression: string, options: UtilityEvaluateOptions): Promise<unknown>
  _evaluateExpressionHandle (expression: string, options: UtilityEvaluateOptions): Promise<PlaywrightServerHandle>
}

const UTILITY: UtilityEvaluateOptions = { world: 'utility', isFunction: false }

const isServerFrame = (frame: unknown): frame is PlaywrightServerFrame => {
  return typeof frame === 'object' && frame !== null
    && '_evaluateExpression' in frame && typeof frame._evaluateExpression === 'function'
    && '_evaluateExpressionHandle' in frame && typeof frame._evaluateExpressionHandle === 'function'
}

// Only a Playwright client created in-process can reach the server-side object behind it
export const toPlaywrightServerObject = (clientObject: object): unknown => {
  const connection: unknown = Reflect.get(clientObject, '_connection')
  const toImpl: unknown = typeof connection === 'object' && connection !== null ? Reflect.get(connection, 'toImpl') : undefined

  return typeof toImpl === 'function' ? toImpl(clientObject) : undefined
}

// Playwright has no public API for an isolated world, so this reaches the
// server frame for the utility world Playwright keeps in every frame
const toServerFrame = (frame: playwright.Frame): PlaywrightServerFrame => {
  const serverFrame = toPlaywrightServerObject(frame)

  if (!isServerFrame(serverFrame)) {
    throw new Error('The remote agent could not reach Playwright\'s isolated world. In WebKit, `experimentalRemoteDriver` must be enabled in the config file, and playwright-webkit must be 1.59.0 or later.')
  }

  return serverFrame
}

// The WebKit counterpart of CdpRemoteAgent, run in Playwright's utility world.
// The world is recreated on navigation, which also clears the agent installed in it.
export class WebKitRemoteAgent {
  private source: Promise<string> | undefined

  constructor (private getSource: () => Promise<Buffer | string> = getRunnerRemoteAgentContents) {}

  async call (autFrame: playwright.Frame, request: RemoteAgentRequest): Promise<unknown> {
    let frame = toServerFrame(autFrame)

    for (const owner of request.frames ?? []) {
      const child = await this.getOwnedFrame(frame, owner)

      if (!isServerFrame(child)) {
        return child
      }

      frame = child
    }

    const { method, context, args } = request

    return this.withAgent(frame, `running '${method}'`, `window.${AGENT_GLOBAL}.call(${JSON.stringify(method)}, ${JSON.stringify(context)}, ${JSON.stringify(args)})`)
  }

  private async getOwnedFrame (frame: PlaywrightServerFrame, owner: RemoteAgentFrameOwner) {
    await this.withAgent(frame, `finding \`${owner.selector}\``, 'undefined')

    const handle = await frame._evaluateExpressionHandle(`window.${AGENT_GLOBAL}.frameOwner(${JSON.stringify(owner.steps)})`, UTILITY)

    try {
      const element = handle.asElement()

      if (!element) {
        return frameNotFound(owner, String(handle._value))
      }

      return await element._contentFrame() ?? frameNotFound(owner, 'its document is not loaded')
    } finally {
      handle.dispose()
    }
  }

  // Installs the agent first when the frame has none, so the common case is one round trip
  private async withAgent (frame: PlaywrightServerFrame, action: string, expression: string): Promise<unknown> {
    const guarded = `window.${AGENT_GLOBAL} === undefined ? ${JSON.stringify(AGENT_MISSING)} : ${expression}`
    let result = await this.evaluate(frame, action, guarded)

    if (result === AGENT_MISSING) {
      this.source ??= Promise.resolve(this.getSource()).then(String)
      await this.evaluate(frame, 'loading', await this.source)
      debug('installed agent in the utility world of a WebKit frame')
      result = await this.evaluate(frame, action, expression)
    }

    return result
  }

  private async evaluate (frame: PlaywrightServerFrame, action: string, expression: string) {
    try {
      return await frame._evaluateExpression(expression, UTILITY)
    } catch (err) {
      throw new Error(`The remote agent threw while ${action}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}
