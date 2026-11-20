// Shared between the driver and the agent the server injects into the AUT frame.
// Everything here crosses the automation protocol, so it must stay JSON-serializable.

export type QueryStep =
  | { type: 'get', selector: string, includeShadowDom?: boolean }
  // a jQuery traversal such as find, eq, closest or nextAll, run like the legacy driver's
  | { type: 'traversal', method: string, args: (string | number)[], includeShadowDom?: boolean }
  | { type: 'contains', selector: string }
  // the shadow roots of the elements before it
  | { type: 'shadow' }
  // the focused element, or nothing
  | { type: 'focused' }
  // the AUT's document, which .its() and .invoke() read directly rather than through jQuery
  | { type: 'document' }
  // cy.getByRole's matches within the elements before it, or the body; a RegExp name crosses as its parts
  | { type: 'role', role: string, name?: string | number | { source: string, flags: string }, hidden?: boolean, native?: boolean, includeShadowDom?: boolean }
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
  focusable: boolean
  empty: boolean
  // why the element isn't visible, for a failed visibility assertion's message
  hiddenReason?: string
  // only what a retrying assertion asked for in RemoteReads
  styles?: Record<string, string>
  descendants?: Record<string, boolean>
}

export interface AgentError {
  name: string
  message: string
  retry?: boolean
  type?: string
  timedOut?: boolean
}

// computed styles and descendant selectors a snapshot can't answer without reading the AUT
export interface RemoteReads {
  styles: string[]
  descendants: string[]
}

export interface ResolveArgs {
  steps: QueryStep[]
  reads?: RemoteReads
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
  // the mouse action to perform; a plain click when unset
  event?: 'click' | 'dblclick' | 'rightclick'
}

export interface TypeArgs extends ClickArgs {
  chars: string
  options: TypeOptions
  // cy.clear, which only acts on text-like elements
  clear?: boolean
}

export interface ElementArgs extends ResolveArgs {
  index: number
}

export interface TriggerArgs extends ClickArgs {
  eventName: string
  eventOptions: Record<string, unknown>
}

export interface SelectArgs extends ClickArgs {
  values: (string | number)[]
}

export interface SelectFileArgs extends ClickArgs {
  action: 'select' | 'drag-drop'
  // contents cross as base64
  files: { contents: string, fileName?: string, mimeType?: string, lastModified?: number }[]
}

// cy.scrollTo / cy.scrollIntoView options the driver has already validated, passed to jquery.scrollTo
export interface ScrollOptions {
  axis: string
  duration?: number | string
  easing?: string
  offset?: object
  ensureScrollable?: boolean
}

export interface ScrollIntoViewArgs extends ElementArgs {
  scroll: ScrollOptions
}

export interface ScrollToArgs extends ResolveArgs {
  // scrolls the window instead of the elements the steps find
  window: boolean
  x: number | string
  y: number | string
  timeout: number
  scroll: ScrollOptions
}

// a RegExp crosses as its parts, like a tab's URL
export interface ClearLocalStorageArgs extends ResolveArgs {
  keys: string | { source: string, flags: string } | null
}

// what cy.screenshot does to the AUT's document around a capture
export interface ScreenshotPrepareArgs extends ResolveArgs {
  // blackouts are scoped to the subject element, or to the whole document when there's none
  element: boolean
  index: number
  blackout: string[]
  disableAnimations: boolean
}

export interface ScreenshotCleanupArgs extends ResolveArgs {
  disableAnimations: boolean
}

export interface ScreenshotScrollArgs extends ResolveArgs {
  y: number
}

// the parts of an element's positioning cy.screenshot reads, relative to the AUT's viewport and window
export interface ScreenshotElementPosition {
  width: number
  height: number
  fromElViewport: { top: number, left: number, bottom: number }
  fromElWindow: { top: number }
}

// .its() / .invoke() run against the jQuery object a remote subject's steps find
export interface EvaluateArgs extends ResolveArgs {
  kind: 'its' | 'invoke'
  path: string
  // invoke's arguments, as values that survive JSON
  args: unknown[]
}

export interface EvaluateResult {
  // JSON, with undefined, functions and elements tagged as in stub_values
  value: unknown
  // whether the path exists, which the legacy errors tell apart from a null value
  has: boolean
  // for invoke, the friendly type of a path that isn't a function
  notFunction?: string
}

export interface ActionResult {
  coords: { x: number, y: number }
}

export type AgentMethods = {
  resolve: (args: ResolveArgs) => ResolveResult
  click: (args: ClickArgs) => ActionResult
  type: (args: TypeArgs) => ActionResult
  clearLocalStorage: (args: ClearLocalStorageArgs) => null
  focus: (args: ElementArgs) => null
  blur: (args: ElementArgs) => null
  submit: (args: ElementArgs) => null
  trigger: (args: TriggerArgs) => ActionResult
  select: (args: SelectArgs) => ActionResult
  selectFile: (args: SelectFileArgs) => ActionResult
  scrollIntoView: (args: ScrollIntoViewArgs) => null
  scrollTo: (args: ScrollToArgs) => null
  screenshotPrepare: (args: ScreenshotPrepareArgs) => null
  screenshotCleanup: (args: ScreenshotCleanupArgs) => null
  screenshotOverrideScroll: (args: ResolveArgs) => { documentHeight: number }
  screenshotResetScroll: (args: ResolveArgs) => null
  screenshotScrollTo: (args: ScreenshotScrollArgs) => null
  screenshotElementPosition: (args: ElementArgs) => ScreenshotElementPosition
  evaluate: (args: EvaluateArgs) => EvaluateResult
}

export type AgentResponse<T> = ({ ok: true, value: T } | { ok: false, error: AgentError }) & { navigating?: boolean }

export const AGENT_GLOBAL = '__cypressAgent'

// the Symbol.for() key the cy.clock bundle keeps its controls under in the AUT's main world
export const REMOTE_CLOCK_GLOBAL = 'cypress:remote:clock'
