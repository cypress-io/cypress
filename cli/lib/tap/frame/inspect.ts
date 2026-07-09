import type { TapSession } from '../tap-session'
import type { AutFrame } from '../aut-frame'
import { FrameCommandError } from '../aut-frame'

// A full computed style is ~350 properties; this curated set answers the
// "why does it look/behave this way" questions (layout, visibility, box).
const REPORTED_STYLES = [
  'display', 'visibility', 'opacity', 'position', 'top', 'right', 'bottom', 'left',
  'width', 'height', 'margin', 'padding', 'border', 'box-sizing',
  'color', 'background-color', 'font-size', 'font-weight', 'line-height', 'text-align',
  'z-index', 'overflow', 'pointer-events', 'cursor',
]

// Read the element's tag, attributes, curated computed styles, and box rect in
// one isolated-world call on the element itself — avoiding the DOM/CSS node-id
// dance (requestNode needs a fetched document tree and is brittle across
// worlds). The accessibility node still comes from CDP (below).
const ELEMENT_INFO_FN = `function () {
  var computed = getComputedStyle(this)
  var styles = {}
  var props = ${JSON.stringify(REPORTED_STYLES)}
  for (var i = 0; i < props.length; i++) {
    var value = computed.getPropertyValue(props[i])
    if (value) styles[props[i]] = value
  }
  var attributes = {}
  for (var j = 0; j < this.attributes.length; j++) {
    attributes[this.attributes[j].name] = this.attributes[j].value
  }
  var rect = this.getBoundingClientRect()
  return {
    tag: this.tagName.toLowerCase(),
    attributes: attributes,
    styles: styles,
    box: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
  }
}`

const REPORTED_STATES = new Set(['focused', 'disabled', 'required', 'invalid', 'checked', 'expanded', 'selected', 'pressed', 'readonly', 'hidden'])

interface AXValue { value?: unknown }
interface AXNode {
  role?: AXValue
  name?: AXValue
  properties?: Array<{ name: string, value?: AXValue }>
  ignored?: boolean
  backendDOMNodeId?: number
}

export interface FrameInspectResult {
  url?: string
  selector: string
  found: boolean
  tag?: string
  attributes?: Record<string, string>
  ax?: { role?: string, name?: string, states?: string[] }
  box?: { x: number, y: number, width: number, height: number }
  styles?: Record<string, string>
}

interface ElementInfo {
  tag: string
  attributes: Record<string, string>
  styles: Record<string, string>
  box: { x: number, y: number, width: number, height: number }
}

const projectAx = (node: AXNode | undefined): FrameInspectResult['ax'] => {
  if (!node || node.ignored) {
    return undefined
  }

  const ax: NonNullable<FrameInspectResult['ax']> = {}
  const role = node.role?.value

  if (typeof role === 'string') {
    ax.role = role
  }

  const name = node.name?.value

  if (typeof name === 'string' && name.length > 0) {
    ax.name = name
  }

  const states = (node.properties ?? [])
  .filter((property) => REPORTED_STATES.has(property.name) && property.value?.value === true)
  .map((property) => property.name)

  if (states.length) {
    ax.states = states
  }

  return Object.keys(ax).length ? ax : undefined
}

const readAxNode = async (session: TapSession, objectId: string): Promise<FrameInspectResult['ax']> => {
  const { client, sessionId } = session

  try {
    const { node } = await client.DOM.describeNode({ objectId }, sessionId)
    const { nodes } = await client.Accessibility.getPartialAXTree({ backendNodeId: node.backendNodeId, fetchRelatives: false }, sessionId)
    const axNodes = nodes as AXNode[]

    return projectAx(axNodes.find((candidate) => candidate.backendDOMNodeId === node.backendNodeId) ?? axNodes[0])
  } catch {
    return undefined
  }
}

export const extractInspect = async (
  session: TapSession,
  frame: AutFrame,
  selector: string,
): Promise<FrameInspectResult> => {
  const { client, sessionId } = session

  await client.DOM.enable({}, sessionId)
  await client.Accessibility.enable(sessionId)

  const { executionContextId } = await client.Page.createIsolatedWorld({
    frameId: frame.frameId,
    worldName: 'cypress-tap',
  }, sessionId)

  const query = await client.Runtime.callFunctionOn({
    functionDeclaration: 'function (selector) { return document.querySelector(selector) }',
    executionContextId,
    arguments: [{ value: selector }],
  }, sessionId)

  if (query.exceptionDetails) {
    throw new FrameCommandError('INVALID_SELECTOR', `"${selector}" is not a valid CSS selector`)
  }

  const base: FrameInspectResult = { ...(frame.url ? { url: frame.url } : {}), selector, found: false }

  if (!query.result.objectId || query.result.subtype === 'null') {
    return base
  }

  const objectId = query.result.objectId

  const info = await client.Runtime.callFunctionOn({
    functionDeclaration: ELEMENT_INFO_FN,
    objectId,
    returnByValue: true,
  }, sessionId)

  if (info.exceptionDetails) {
    throw new FrameCommandError('FRAME_READ_FAILED', `inspecting the element failed: ${info.exceptionDetails.exception?.description || info.exceptionDetails.text}`)
  }

  const { tag, attributes, styles, box } = info.result.value as ElementInfo
  const ax = await readAxNode(session, objectId)

  return {
    ...base,
    found: true,
    tag,
    attributes,
    ...(ax ? { ax } : {}),
    box,
    styles,
  }
}
