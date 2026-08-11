/**
 * Node-side harness for `cypress/e2e/tap-aut.cy.ts`: drives the real `cypress tap`
 * AUT-frame extractors over a real CDP connection to the cypress-in-cypress browser.
 *
 * The tap CDP layer lives in `cli/`, which is Node-only and outside this package's
 * TypeScript program, so it is reached with `require` — the same way
 * `frontend-shared/cypress/e2e/e2ePluginSetup.ts` reaches for the CLI's open command.
 * A static import would pull all of `cli/lib/tap` into `vue-tsc`'s graph.
 */
const { resolveLiveInstance } = require('../../../../cli/lib/cypress-instances')
const CRI = require('chrome-remote-interface')
const { withTapSession } = require('../../../../cli/lib/tap/tap-session')
const { resolveAutFrame, findAutFrame } = require('../../../../cli/lib/tap/aut/frame')
const { extractDom } = require('../../../../cli/lib/tap/commands/dom')
const { extractAria } = require('../../../../cli/lib/tap/commands/aria')
const { extractInspect } = require('../../../../cli/lib/tap/commands/inspect')
const Fixtures = require('@tooling/system-tests')

// The inner Cypress the spec opens. Its scaffolded root is what identifies its
// instance record among any others the developer happens to have open.
const FIXTURE_PROJECT = 'tap-retries'

// Generous next to the CLI's own default: an accessibility tree fetch on a page the
// outer Cypress is also driving can take a while under a loaded CI container.
const CDP_TIMEOUT_MS = 20000

interface AutFrame {
  frameId: string
}

interface FrameNode {
  frame: { id: string, name?: string, url?: string }
  childFrames?: FrameNode[]
}

interface TapSession {
  call (method: string, args?: unknown[]): Promise<unknown>
  readonly client: any
  readonly sessionId: string
}

/** Mirrors `CyTaskResult`: a typed failure is data to assert on, not a task rejection. */
export type TapAutOutcome =
  { result: unknown, error?: never } |
  { result?: never, error: { code: string, message: string } }

export interface TapAutInstance {
  reason: string
  candidateCount: number
  projectRoot: string
  serverPort: number
  testingType: string | null
  browserName: string | null
  hasBrowser: boolean
}

export interface TapAutFrame {
  id: string
  name: string
  url: string
  depth: number
  /**
   * null for the top frame. The app names every AUT frame identically regardless of
   * project (`runner/index.ts` hardcodes 'Test Project'), so parentage is the only way
   * to tell the inner project's frames from the outer's.
   */
  parentId: string | null
}

export interface TapAutFrameTree {
  /** The outer AUT frame — in cypress-in-cypress that is the inner Cypress app. */
  innerAppFrameId: string
  /** The app under test, resolved beneath the inner Cypress app. */
  autFrameId: string
  frames: TapAutFrame[]
}

export type TapAutReadArgs =
  { command: 'dom', selector?: string, maxChars: number, at?: number } |
  { command: 'aria', selector?: string, maxNodes: number, at?: number } |
  { command: 'inspect', selector: string, at?: number }

const findNode = (node: FrameNode, frameId: string): FrameNode | undefined => {
  if (node.frame.id === frameId) {
    return node
  }

  for (const child of node.childFrames ?? []) {
    const found = findNode(child, frameId)

    if (found) {
      return found
    }
  }

  return undefined
}

const flattenTree = (node: FrameNode, depth = 0, parentId: string | null = null): TapAutFrame[] => {
  const self: TapAutFrame = {
    id: node.frame.id,
    name: node.frame.name ?? '',
    url: node.frame.url ?? '',
    depth,
    parentId,
  }

  return [self, ...(node.childFrames ?? []).flatMap((child) => flattenTree(child, depth + 1, node.frame.id))]
}

/**
 * The session `withTapSession` opens is bound to the outer runner page, which owns
 * the only page target — so its binding is the *outer* app's. Raw CDP is still
 * correct for any frame in that target, so `client` and `sessionId` pass through and
 * only `call` is fenced off, making the limitation explicit instead of silently
 * answering for the wrong app.
 */
const scopedToAut = (session: TapSession): TapSession => {
  return {
    call () {
      throw new Error('the tap binding is not reachable from cypress-in-cypress: the outer runner page owns the only page target, so `call` would answer for the outer app')
    },
    client: session.client,
    // A getter, because withTapSession re-attaches on a lost session.
    get sessionId () {
      return session.sessionId
    },
  }
}

interface FrameContext {
  innerAppFrameId: string
  frameTree: FrameNode
}

/**
 * The live record, with a CDP endpoint that is usable under cypress-in-cypress.
 *
 * `resolveInstance` cannot be used here: it requires `cdpBrowserWsUrl`, and that is the
 * one field cypress-in-cypress corrupts. The outer and inner Cypress share the
 * `cypress-instances` module singleton, so (a) the outer's browser client is created
 * before any record exists, and its `setCdpBrowserWsUrl` is dropped, and (b) every
 * client wires `onCriConnectionClosed` to a callback that nulls the *shared* url — so
 * the outer run-mode client's lifecycle wipes what the inner one set. The browser is
 * alive regardless (the outer run pins its DevTools port), so read the endpoint from
 * the browser itself and leave the rest of discovery real.
 */
const resolveReadyInstance = async () => {
  const { instance } = await resolveLiveInstance({ cwd: Fixtures.projectPath(FIXTURE_PROJECT) })

  if (instance.cdpBrowserWsUrl) {
    return instance
  }

  const port = Number(process.env.CYPRESS_REMOTE_DEBUGGING_PORT)

  if (!port) {
    throw new Error('CYPRESS_REMOTE_DEBUGGING_PORT is not set — run these tests through the `cypress:run:e2e` / `cypress:open` scripts in packages/app, which pin it')
  }

  const { webSocketDebuggerUrl } = await CRI.Version({ host: '127.0.0.1', port })

  return { ...instance, cdpBrowserWsUrl: webSocketDebuggerUrl }
}

const withAutFrame = async <T> (read: (session: TapSession, frame: AutFrame, context: FrameContext) => Promise<T>): Promise<T> => {
  const instance = await resolveReadyInstance()

  return withTapSession(instance, async (session: TapSession) => {
    // resolveAutFrame walks from the top of the runner page's frame tree and returns
    // the shallowest `Your project:` frame. Nested, that is the inner Cypress app —
    // the app under test is the `Your project:` frame beneath it, which is also the
    // frame that has to be picked over the snapshot double-buffers and spec bridge.
    const innerApp: AutFrame = await resolveAutFrame(session.client, session.sessionId)
    const { frameTree } = await session.client.Page.getFrameTree(session.sessionId)
    const appNode = findNode(frameTree as FrameNode, innerApp.frameId)
    const aut = (appNode?.childFrames ?? []).map((child) => findAutFrame(child)).find(Boolean)

    if (!aut) {
      throw new Error(`no app-under-test frame beneath the inner Cypress app frame (${innerApp.frameId}) — if the frames below are missing the AUT, Chrome put it in its own process and it needs a per-target attach. Frame tree: ${JSON.stringify(flattenTree(frameTree as FrameNode), null, 2)}`)
    }

    return read(scopedToAut(session), { frameId: aut.id }, {
      innerAppFrameId: innerApp.frameId,
      frameTree: frameTree as FrameNode,
    })
  }, CDP_TIMEOUT_MS)
}

const asOutcome = async (read: () => Promise<unknown>): Promise<TapAutOutcome> => {
  try {
    return { result: await read() }
  } catch (err: any) {
    // The tap layer's own typed failures are the answer for some of these reads.
    // Anything else is a harness fault and has to fail the task loudly.
    if (err?.name === 'FrameCommandError' || err?.name === 'CypressInstanceError') {
      return { error: { code: err.code, message: err.message } }
    }

    throw err
  }
}

/**
 * Discovery only: proves the inner open-mode instance wrote a record and answers its
 * liveness probe. `hasBrowser` is reported rather than required — see
 * `resolveReadyInstance` for why cypress-in-cypress cannot be trusted on that field.
 */
export async function tapAutResolveInstance (): Promise<TapAutOutcome> {
  return asOutcome(async () => {
    const selection = await resolveLiveInstance({ cwd: Fixtures.projectPath(FIXTURE_PROJECT) })
    const { projectRoot, serverPort, testingType, browserName, cdpBrowserWsUrl } = selection.instance

    const instance: TapAutInstance = {
      reason: selection.reason,
      candidateCount: selection.candidateCount,
      projectRoot,
      serverPort,
      testingType,
      browserName,
      hasBrowser: Boolean(cdpBrowserWsUrl),
    }

    return instance
  })
}

export async function tapAutFrameTree (): Promise<TapAutOutcome> {
  return asOutcome(async () => {
    return withAutFrame(async (_session, frame, context) => {
      const tree: TapAutFrameTree = {
        innerAppFrameId: context.innerAppFrameId,
        autFrameId: frame.frameId,
        frames: flattenTree(context.frameTree),
      }

      return tree
    })
  })
}

export async function tapAutRead (args: TapAutReadArgs): Promise<TapAutOutcome> {
  return asOutcome(async () => {
    return withAutFrame((session, frame) => {
      if (args.command === 'dom') {
        return extractDom(session, frame, args.selector, args.maxChars, args.at)
      }

      if (args.command === 'aria') {
        return extractAria(session, frame, args.selector, args.maxNodes, args.at)
      }

      return extractInspect(session, frame, args.selector, args.at)
    })
  })
}
