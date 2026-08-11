import type { TapSession } from '../tap-session'
import type { AutFrame } from '../aut/frame'
import { withResolvedAutFrame } from '../aut/frame'
import { TapError } from '@packages/cypress-instances'
import { parseIndex } from '../utils'
import { collectTrueStates, querySelectorObjectId } from '../aut/cdp'
import type { AXValue } from '../aut/cdp'
import { isRendererUnresponsive } from '../cdp-timeout'
import { withAmbiguous } from '../aut/single-match'
import type { FrameAmbiguousResult } from '../aut/single-match'
import { readElementInfo } from '../aut/scripts'
import type { ElementInfo } from '../aut/scripts'
import { defineNativeCommand } from './definition'

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

/** What `cypress tap inspect` returns for the element a selector matches. */
export interface FrameInspectResult {
  /** The CSS selector that was inspected. */
  selector: string
  /** Whether an element matched. */
  found: boolean
  /** The matched element's tag name. */
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
  } catch (err) {
    if (isRendererUnresponsive(err)) {
      throw err
    }

    return undefined
  }
}

export const extractInspect = (
  session: TapSession,
  frame: AutFrame,
  selector: string,
  at?: number,
): Promise<FrameInspectResult | FrameAmbiguousResult> => withAmbiguous(session, frame, selector, at, async (): Promise<FrameInspectResult> => {
  const { client, sessionId } = session

  await client.DOM.enable({}, sessionId)
  await client.Accessibility.enable(sessionId)

  const base: FrameInspectResult = { selector, found: false }
  const objectId = await querySelectorObjectId(session, frame, selector, at ?? 0)

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
    throw new TapError('FRAME_READ_FAILED', { message: `inspecting the element failed: ${info.exceptionDetails.exception?.description || info.exceptionDetails.text}` })
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
})

export const inspectCommand = defineNativeCommand('inspect', (options, _args, commandOptions) => {
  const at = parseIndex(commandOptions.at)

  return withResolvedAutFrame(options, (session, frame) => {
    return extractInspect(session, frame, commandOptions.selector, at)
  }, 'inspect')
})
