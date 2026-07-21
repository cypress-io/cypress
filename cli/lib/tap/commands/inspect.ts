import type { TapSession } from '../tap-session'
import type { AutFrame } from '../aut-frame'
import { FrameCommandError, withResolvedAutFrame } from '../aut-frame'
import { collectTrueStates, querySelectorObjectId } from '../frame-cdp'
import type { AXValue } from '../frame-cdp'
import { readElementInfo } from '../frame-scripts'
import type { ElementInfo } from '../frame-scripts'
import type { TapCliCommand } from '../types'

const INSPECT_USAGE = `Usage: cypress tap inspect <selector> [options]

Inspects one element of the app-under-test: its tag, attributes, curated
computed styles, box model, and accessibility node.

Arguments:
  selector          a CSS selector identifying the element to inspect

Options:
  --instance <pid>  target a specific running Cypress instance by its pid`

// A full computed style is ~350 properties; this curated set answers the
// "why does it look/behave this way" questions (layout, visibility, box).
const REPORTED_STYLES = [
  'display', 'visibility', 'opacity', 'position', 'top', 'right', 'bottom', 'left',
  'width', 'height', 'margin', 'padding', 'border', 'box-sizing',
  'color', 'background-color', 'font-size', 'font-weight', 'line-height', 'text-align',
  'z-index', 'overflow', 'pointer-events', 'cursor',
]

const REPORTED_STATES = new Set(['focused', 'disabled', 'required', 'invalid', 'checked', 'expanded', 'selected', 'pressed', 'readonly', 'hidden'])

interface AXNode {
  role?: AXValue
  name?: AXValue
  properties?: Array<{ name: string, value?: AXValue }>
  ignored?: boolean
  backendDOMNodeId?: number
}

interface FrameInspectResult {
  url?: string
  selector: string
  found: boolean
  tag?: string
  attributes?: Record<string, string>
  aria?: { role?: string, name?: string, states?: string[] }
  box?: { x: number, y: number, width: number, height: number }
  styles?: Record<string, string>
}

const projectAria = (node: AXNode | undefined): FrameInspectResult['aria'] => {
  if (!node || node.ignored) {
    return undefined
  }

  const aria: NonNullable<FrameInspectResult['aria']> = {}
  const role = node.role?.value

  if (typeof role === 'string') {
    aria.role = role
  }

  const name = node.name?.value

  if (typeof name === 'string' && name.length > 0) {
    aria.name = name
  }

  const states = collectTrueStates(node.properties, REPORTED_STATES)

  if (states.length) {
    aria.states = states
  }

  return Object.keys(aria).length ? aria : undefined
}

const readAriaNode = async (session: TapSession, objectId: string): Promise<FrameInspectResult['aria']> => {
  const { client, sessionId } = session

  try {
    const { node } = await client.DOM.describeNode({ objectId }, sessionId)
    const { nodes } = await client.Accessibility.getPartialAXTree({ backendNodeId: node.backendNodeId, fetchRelatives: false }, sessionId)
    const axNodes = nodes as AXNode[]

    return projectAria(axNodes.find((candidate) => candidate.backendDOMNodeId === node.backendNodeId) ?? axNodes[0])
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

  const base: FrameInspectResult = { ...(frame.url ? { url: frame.url } : {}), selector, found: false }
  const objectId = await querySelectorObjectId(session, frame, selector)

  if (!objectId) {
    return base
  }

  const info = await client.Runtime.callFunctionOn({
    functionDeclaration: readElementInfo.toString(),
    objectId,
    arguments: [{ value: REPORTED_STYLES }],
    returnByValue: true,
  }, sessionId)

  if (info.exceptionDetails) {
    throw new FrameCommandError('FRAME_READ_FAILED', `inspecting the element failed: ${info.exceptionDetails.exception?.description || info.exceptionDetails.text}`)
  }

  const { tag, attributes, styles, box } = info.result.value as ElementInfo
  const aria = await readAriaNode(session, objectId)

  return {
    ...base,
    found: true,
    tag,
    attributes,
    ...(aria ? { aria } : {}),
    box,
    styles,
  }
}

export const inspectCommand: TapCliCommand = {
  name: 'inspect',
  description: 'inspect one element: its tag, attributes, computed styles, box model, and accessibility node',
  usage: INSPECT_USAGE,
  params: [{ name: 'selector', type: 'string', required: true, description: 'a CSS selector identifying the element to inspect' }],
  handler: (options, args) => withResolvedAutFrame(options, (session, frame) => {
    return extractInspect(session, frame, args.selector)
  }),
}
