import type { TapSession } from '../tap-session'
import type { AutFrame } from '../aut-frame'
import { FrameCommandError } from '../aut-frame'

// The accessibility tree of a real app is deep; cap the projection so it stays
// affordable for an LLM. A selector roots it at a subtree for finer reads.
export const DEFAULT_MAX_NODES = 200

// Structural/text roles carry no semantic signal on their own — dropping them
// yields the compact role/name tree DevTools shows, not the raw render tree.
const NOISE_ROLES = new Set(['InlineTextBox', 'StaticText', 'LineBreak', 'generic', 'none', 'GenericContainer', 'paragraph'])

// The boolean states worth reporting when true; the rest are rarely actionable.
const REPORTED_STATES = new Set(['focused', 'disabled', 'required', 'invalid', 'checked', 'expanded', 'selected', 'pressed', 'readonly', 'hidden', 'modal', 'busy'])

interface AXValue { value?: unknown }
interface AXProperty { name: string, value?: AXValue }
interface AXNode {
  nodeId: string
  parentId?: string
  role?: AXValue
  name?: AXValue
  value?: AXValue
  properties?: AXProperty[]
  childIds?: string[]
  ignored?: boolean
  backendDOMNodeId?: number
}

export interface AriaNodeOut {
  depth: number
  role: string
  name?: string
  value?: string
  states?: string[]
}

export interface FrameAriaResult {
  url?: string
  nodes: AriaNodeOut[]
  nodeCount: number
  truncated?: true
}

const projectNode = (node: AXNode, depth: number): AriaNodeOut | undefined => {
  const role = node.role?.value

  if (typeof role !== 'string' || node.ignored || NOISE_ROLES.has(role)) {
    return undefined
  }

  const out: AriaNodeOut = { depth, role }
  const name = node.name?.value

  if (typeof name === 'string' && name.length > 0) {
    out.name = name
  }

  const value = node.value?.value

  if (value !== undefined && value !== null && value !== '') {
    out.value = String(value)
  }

  const states = (node.properties ?? [])
  .filter((property) => REPORTED_STATES.has(property.name) && property.value?.value === true)
  .map((property) => property.name)

  if (states.length) {
    out.states = states
  }

  return out
}

/**
 * Walks the AX forest from `rootId` depth-first. A node that projects to a
 * meaningful role deepens the indent for its descendants; a noise node is
 * skipped but its children keep flowing, so the output is a clean semantic
 * tree rather than the raw render tree. Stops at `maxNodes`.
 */
const projectTree = (byId: Map<string, AXNode>, rootId: string, maxNodes: number): { nodes: AriaNodeOut[], truncated: boolean } => {
  const nodes: AriaNodeOut[] = []
  let truncated = false

  const walk = (id: string, depth: number): void => {
    if (truncated) {
      return
    }

    const node = byId.get(id)

    if (!node) {
      return
    }

    const projected = projectNode(node, depth)

    if (projected) {
      if (nodes.length >= maxNodes) {
        truncated = true

        return
      }

      nodes.push(projected)
    }

    const childDepth = projected ? depth + 1 : depth

    for (const childId of node.childIds ?? []) {
      walk(childId, childDepth)
    }
  }

  walk(rootId, 0)

  return { nodes, truncated }
}

const resolveSelectorBackendNodeId = async (
  session: TapSession,
  frame: AutFrame,
  selector: string,
): Promise<number | undefined> => {
  const { client, sessionId } = session

  const { executionContextId } = await client.Page.createIsolatedWorld({
    frameId: frame.frameId,
    worldName: 'cypress-tap',
  }, sessionId)

  const { result, exceptionDetails } = await client.Runtime.callFunctionOn({
    functionDeclaration: 'function (selector) { return document.querySelector(selector) }',
    executionContextId,
    arguments: [{ value: selector }],
  }, sessionId)

  if (exceptionDetails) {
    throw new FrameCommandError('INVALID_SELECTOR', `"${selector}" is not a valid CSS selector`)
  }

  // querySelector returned null — a real "nothing matched" answer, not an error.
  if (!result.objectId || result.subtype === 'null') {
    return undefined
  }

  const { node } = await client.DOM.describeNode({ objectId: result.objectId }, sessionId)

  return node.backendNodeId
}

export const extractAria = async (
  session: TapSession,
  frame: AutFrame,
  selector: string | undefined,
  maxNodes: number,
): Promise<FrameAriaResult> => {
  const { client, sessionId } = session

  await client.DOM.enable({}, sessionId)
  await client.Accessibility.enable(sessionId)

  const { nodes: axNodes } = await client.Accessibility.getFullAXTree({ frameId: frame.frameId }, sessionId)

  const byId = new Map<string, AXNode>()

  for (const node of axNodes as AXNode[]) {
    byId.set(node.nodeId, node)
  }

  const base: FrameAriaResult = { ...(frame.url ? { url: frame.url } : {}), nodes: [], nodeCount: 0 }

  let rootId: string | undefined

  if (selector !== undefined) {
    const backendNodeId = await resolveSelectorBackendNodeId(session, frame, selector)

    if (backendNodeId === undefined) {
      // Selector matched nothing, or the match is absent from the a11y tree.
      return base
    }

    rootId = (axNodes as AXNode[]).find((node) => node.backendDOMNodeId === backendNodeId)?.nodeId

    if (rootId === undefined) {
      return base
    }
  } else {
    // The frame root is the sole node with no parent (the RootWebArea).
    rootId = (axNodes as AXNode[]).find((node) => node.parentId === undefined)?.nodeId ?? (axNodes as AXNode[])[0]?.nodeId
  }

  if (rootId === undefined) {
    return base
  }

  const { nodes, truncated } = projectTree(byId, rootId, maxNodes)

  return {
    ...base,
    nodes,
    nodeCount: nodes.length,
    ...(truncated ? { truncated: true } : {}),
  }
}
