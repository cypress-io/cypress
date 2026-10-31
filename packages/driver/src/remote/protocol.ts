// Shared between the driver and the agent the server injects into the AUT frame.
// Everything here crosses the automation protocol, so it must stay JSON-serializable.

export type QueryStep =
  | { type: 'get', selector: string }
  | { type: 'find', selector: string }
  | { type: 'eq', index: number }
  | { type: 'contains', selector: string }
  // enters the document of the iframe the steps before it found
  | { type: 'frame', selector: string }
  // starts the steps in another tab instead of the AUT
  | { type: 'tab', url?: TabUrl }

// A RegExp doesn't survive JSON, so its parts are sent instead
export type TabUrl = string | { source: string, flags: string }

// The steps that find one iframe, run in the frame that contains it
export interface FrameOwner {
  steps: QueryStep[]
  selector: string
}

export interface AgentContext {
  browser: Cypress.Browser
  config: {
    visibilityStrategy: Cypress.Config['visibilityStrategy']
    scrollBehavior: Cypress.Config['scrollBehavior']
  }
}

export interface RemoteElementProps {
  node: string
  tagName: string
  id: string
  classes: string[]
  text: string
  html: string
  value: string | number | string[] | undefined
  attributes: Record<string, string>
  visible: boolean
  checked: boolean
  selected: boolean
  disabled: boolean
  focused: boolean
  empty: boolean
}

export interface AgentError {
  name: string
  message: string
  retry?: boolean
  type?: string
  timedOut?: boolean
}

export interface ResolveArgs {
  steps: QueryStep[]
}

export interface ResolveResult {
  elements: RemoteElementProps[]
}

export interface ActionOptions {
  force?: boolean
  position?: string
  x?: number
  y?: number
  scrollBehavior?: Cypress.scrollBehaviorOptions
  waitForAnimations?: boolean
  animationDistanceThreshold?: number
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
}

export interface TypeOptions extends ActionOptions {
  delay?: number
  release?: boolean
  parseSpecialCharSequences?: boolean
}

export interface ClickArgs extends ResolveArgs {
  index: number
  timeout: number
  options: ActionOptions
}

export interface TypeArgs extends ClickArgs {
  chars: string
  options: TypeOptions
}

export interface ActionResult {
  coords: { x: number, y: number }
}

export type AgentMethods = {
  resolve: (args: ResolveArgs) => ResolveResult
  click: (args: ClickArgs) => ActionResult
  type: (args: TypeArgs) => ActionResult
}

export type AgentResponse<T> = { ok: true, value: T } | { ok: false, error: AgentError }

export const AGENT_GLOBAL = '__cypressAgent'

// the Symbol.for() key the cy.clock bundle keeps its controls under in the AUT's main world
export const REMOTE_CLOCK_GLOBAL = 'cypress:remote:clock'
