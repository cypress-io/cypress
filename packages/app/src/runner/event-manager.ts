/* eslint-disable no-dupe-class-members */
import Bluebird from 'bluebird'
import { EventEmitter } from 'events'
import type { MobxRunnerStore } from '../store/mobx-runner-store'
import type MobX from 'mobx'
import type { LocalBusEmitsMap, LocalBusEventMap, DriverToLocalBus, SocketToDriverMap } from './event-manager-types'
import type { RunState, CachedTestState, AutomationElementId, FileDetails, ReporterStartInfo, ReporterRunState } from '@packages/types'

import { logger } from './logger'
import type { SocketShape } from '@packages/socket/browser/client'
import { automation, useRunnerUiStore, useSpecStore } from '../store'
import { useScreenshotStore } from '../store/screenshot-store'
import { EntrySource, useStudioStore } from '../store/studio-store'
import { getAutIframeModel } from '.'
import { handlePausing } from './events/pausing'
import { addTelemetryListeners } from './events/telemetry'
import { telemetry } from '@packages/telemetry/browser/client'
import { addCaptureProtocolListeners } from './events/capture-protocol'
import { getRunnerConfigFromWindow } from './get-runner-config-from-window'
import { usePromptStore } from '../store/prompt-store'
import { useSpecDirtyDataStore } from '../store/spec-dirty-data-store'
import { guardUnsavedStudioChanges } from './studio-unsaved-changes-guard'

export type CypressInCypressMochaEvent = Array<Array<string | Record<string, any>>>

// type is default export of '@packages/driver'
// cannot import because it's not type safe and tsc throw many type errors.
type $Cypress = any

const noop = () => {}

/**
 * Safely JSON-stringify a `consoleProps` object from the driver. The payload
 * contains DOM elements, jQuery collections, functions, and occasional
 * circular references — all of which break a naive `JSON.stringify`. This
 * replaces them with short placeholder strings so the output is always valid
 * JSON and readable in a CLI.
 */
function safeStringifyConsoleProps (value: unknown): string | null {
  try {
    const seen = new WeakSet<object>()

    return JSON.stringify(value, function (_key, v) {
      if (v == null) return v

      if (typeof v === 'function') return '<Function>'

      // jQuery collections carry a `.jquery` version string.
      if (typeof v === 'object' && (v as any).jquery) {
        return `<jQuery length=${(v as any).length ?? 0}>`
      }

      // DOM elements — fall back to `<DOMNode>` in non-browser cases.
      if (typeof v === 'object' && typeof (v as any).nodeType === 'number') {
        const tag = typeof (v as any).tagName === 'string' ? String((v as any).tagName).toLowerCase() : 'node'

        return `<DOMElement tag=${tag}>`
      }

      if (typeof v === 'object') {
        if (seen.has(v as object)) return '<Circular>'

        seen.add(v as object)
      }

      return v
    }) || null
  } catch {
    return null
  }
}

interface A11yNode {
  role: string
  name: string | null
  level: number | null
  value: string | null
  checked: boolean | null
  disabled: boolean | null
  selector: string
  children: A11yNode[]
}

const A11Y_MAX_NODES = 500
const A11Y_MAX_NAME = 200
const NAME_FROM_CONTENT_ROLES = new Set([
  'button', 'link', 'heading', 'listitem', 'option', 'cell',
  'columnheader', 'rowheader', 'tab', 'menuitem', 'treeitem',
])
const CONTROLISH_ROLES = new Set([
  'button', 'textbox', 'checkbox', 'radio', 'combobox',
  'slider', 'spinbutton', 'option', 'link',
])

function implicitRole (el: Element): string | null {
  const tag = el.tagName.toLowerCase()

  switch (tag) {
    case 'a': return el.hasAttribute('href') ? 'link' : null
    case 'button': return 'button'
    case 'input': {
      const type = (el.getAttribute('type') || 'text').toLowerCase()

      if (type === 'checkbox') return 'checkbox'

      if (type === 'radio') return 'radio'

      if (type === 'submit' || type === 'button' || type === 'reset' || type === 'image') return 'button'

      if (type === 'range') return 'slider'

      if (type === 'number') return 'spinbutton'

      return 'textbox'
    }
    case 'textarea': return 'textbox'
    case 'select': return 'combobox'
    case 'option': return 'option'
    case 'img': return el.hasAttribute('alt') ? 'img' : null
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': return 'heading'
    case 'ul': case 'ol': return 'list'
    case 'li': return 'listitem'
    case 'nav': return 'navigation'
    case 'main': return 'main'
    case 'header': return 'banner'
    case 'footer': return 'contentinfo'
    case 'aside': return 'complementary'
    case 'section': return (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) ? 'region' : null
    case 'form': return 'form'
    case 'table': return 'table'
    case 'tr': return 'row'
    case 'td': return 'cell'
    case 'th': return 'columnheader'
    case 'dialog': return 'dialog'
    case 'article': return 'article'
    default: return null
  }
}

function truncateName (s: string): string {
  return s.length > A11Y_MAX_NAME ? s.slice(0, A11Y_MAX_NAME) : s
}

function computeName (el: Element, role: string, doc: Document): string | null {
  const ariaLabel = el.getAttribute('aria-label')

  if (ariaLabel && ariaLabel.trim()) return truncateName(ariaLabel.trim())

  const labelledby = el.getAttribute('aria-labelledby')

  if (labelledby) {
    const parts = labelledby.split(/\s+/)
    .map((id) => doc.getElementById(id))
    .filter(Boolean)
    .map((n) => (n!.textContent || '').trim())
    .filter(Boolean)

    if (parts.length) return truncateName(parts.join(' '))
  }

  const tag = el.tagName.toLowerCase()

  if (tag === 'img') {
    const alt = el.getAttribute('alt')

    return alt != null ? truncateName(alt) : null
  }

  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    const labels = (el as HTMLInputElement).labels

    if (labels && labels[0]) {
      const text = (labels[0].textContent || '').trim()

      if (text) return truncateName(text)
    }

    const placeholder = el.getAttribute('placeholder')

    if (placeholder) return truncateName(placeholder)

    return null
  }

  if (NAME_FROM_CONTENT_ROLES.has(role)) {
    const text = (el.textContent || '').trim()

    return text ? truncateName(text) : null
  }

  return null
}

function computeValue (el: Element, role: string): string | null {
  if (role !== 'textbox' && role !== 'combobox' && role !== 'spinbutton' && role !== 'slider') return null

  const v = (el as HTMLInputElement).value

  if (typeof v === 'string' && v) return truncateName(v)

  return null
}

function computeChecked (el: Element, role: string): boolean | null {
  if (role !== 'checkbox' && role !== 'radio') return null

  const input = el as HTMLInputElement

  if (typeof input.checked === 'boolean') return input.checked

  const aria = el.getAttribute('aria-checked')

  if (aria === 'true') return true

  if (aria === 'false') return false

  return null
}

function computeDisabled (el: Element, role: string): boolean | null {
  if (!CONTROLISH_ROLES.has(role)) return null

  if ((el as HTMLInputElement).disabled) return true

  if (el.getAttribute('aria-disabled') === 'true') return true

  return false
}

const TESTID_ATTRS = ['data-testid', 'data-cy', 'data-test', 'data-test-id']
const USEFUL_ATTRS = ['name', 'aria-label', 'placeholder', 'title', 'type', 'role', 'for', 'href']
const MAX_ATTR_VALUE_LEN = 80
const MAX_CLASSES_TO_TRY = 5
const MAX_ANCESTORS_TO_TRY = 6

// Rejects classes that look framework-generated (CSS modules, styled-components,
// emotion, CSS-in-JS hashes). Hashed classes aren't stable across rebuilds, so
// selectors using them would rot.
const GENERATED_CLASS_RE = /^(css|sc|jsx|emotion|makeStyles|mui|_)-[a-z0-9]/i
const TRAILING_HASH_RE = /[_-][a-z0-9]{5,}$/i
const isStableClass = (c: string): boolean => {
  if (!c || c.length > 40) return false

  if (GENERATED_CLASS_RE.test(c)) return false

  if (TRAILING_HASH_RE.test(c)) return false

  return true
}

const cssEscape = (doc: Document, v: string): string => {
  const css = (doc.defaultView as any)?.CSS || (typeof window !== 'undefined' ? (window as any).CSS : null)

  return css?.escape ? css.escape(v) : v.replace(/(["\\])/g, '\\$1')
}

const escAttr = (v: string): string => v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const isUniqueAndTargets = (doc: Document, sel: string, el: Element): boolean => {
  try {
    const matches = doc.querySelectorAll(sel)

    return matches.length === 1 && matches[0] === el
  } catch {
    return false
  }
}

/**
 * Collect candidate "self" selectors for `el` — selectors that refer to `el`
 * alone (id, test-id, tag+attr, tag+class). Returned ordered shortest-first.
 */
const collectSelfSelectors = (el: Element, doc: Document): string[] => {
  const out: string[] = []
  const tag = el.tagName.toLowerCase()
  const id = el.getAttribute('id')

  if (id) out.push(`#${cssEscape(doc, id)}`)

  for (const attr of TESTID_ATTRS) {
    const v = el.getAttribute(attr)

    if (v && v.length <= MAX_ATTR_VALUE_LEN) out.push(`[${attr}="${escAttr(v)}"]`)
  }

  for (const attr of USEFUL_ATTRS) {
    const v = el.getAttribute(attr)

    if (v && v.trim() && v.length <= MAX_ATTR_VALUE_LEN) out.push(`${tag}[${attr}="${escAttr(v)}"]`)
  }

  const classes = Array.from(el.classList).filter(isStableClass).slice(0, MAX_CLASSES_TO_TRY)

  for (const c of classes) out.push(`${tag}.${cssEscape(doc, c)}`)

  // A handful of class pairs in case no single class is unique.
  for (let i = 0; i < Math.min(classes.length, 3); i++) {
    for (let j = i + 1; j < Math.min(classes.length, 4); j++) {
      out.push(`${tag}.${cssEscape(doc, classes[i])}.${cssEscape(doc, classes[j])}`)
    }
  }

  return out.sort((a, b) => a.length - b.length)
}

/**
 * Returns a short unique anchor selector for `el` (id or test-id only), or
 * null if `el` has no unique anchoring attribute.
 */
const getAnchorSelector = (el: Element, doc: Document): string | null => {
  const id = el.getAttribute('id')

  if (id) {
    const sel = `#${cssEscape(doc, id)}`

    if (isUniqueAndTargets(doc, sel, el)) return sel
  }

  for (const attr of TESTID_ATTRS) {
    const v = el.getAttribute(attr)

    if (v && v.length <= MAX_ATTR_VALUE_LEN) {
      const sel = `[${attr}="${escAttr(v)}"]`

      if (isUniqueAndTargets(doc, sel, el)) return sel
    }
  }

  return null
}

/**
 * Build the shortest tag+nth-of-type path from `from` (exclusive) down to
 * `el` (inclusive). Skips `nth-of-type` at levels where only one child has
 * that tag.
 */
const relativePath = (el: Element, from: Element): string => {
  const path: string[] = []
  let cur: Element | null = el

  while (cur && cur !== from) {
    const parent = cur.parentElement

    if (!parent) break

    const tag = cur.tagName.toLowerCase()
    const sameTag = (Array.from(parent.children) as Element[]).filter((c) => c.tagName === cur!.tagName)
    const idx = sameTag.indexOf(cur)

    path.unshift(sameTag.length > 1 ? `${tag}:nth-of-type(${idx + 1})` : tag)
    cur = parent
  }

  return path.join(' > ')
}

function uniqueSelector (el: Element, doc: Document): string {
  // 1. Self-selectors, shortest-first.
  for (const sel of collectSelfSelectors(el, doc)) {
    if (isUniqueAndTargets(doc, sel, el)) return sel
  }

  // 2. Anchor-relative: find the nearest ancestor with a unique id/test-id
  // and compose `<anchor> <short-relative-path>`. Keeps selectors short.
  let cur = el.parentElement
  let hops = 0

  while (cur && cur !== doc.documentElement && hops < MAX_ANCESTORS_TO_TRY) {
    const anchor = getAnchorSelector(cur, doc)

    if (anchor) {
      const rel = relativePath(el, cur)
      const composed = rel ? `${anchor} > ${rel}` : anchor

      if (isUniqueAndTargets(doc, composed, el)) return composed
    }

    cur = cur.parentElement
    hops++
  }

  // 3. Positional fallback from <html>.
  const full = relativePath(el, doc.documentElement)

  return full ? `html > ${full}` : el.tagName.toLowerCase()
}

/**
 * Walk `doc` and produce a compact accessibility tree. Non-role-bearing
 * elements (plain `<div>`, layout wrappers) are flattened — their interesting
 * descendants bubble up into the nearest role-bearing ancestor's `children`.
 * Walker is bounded at `A11Y_MAX_NODES` nodes; `truncated` is true if hit.
 */
function buildA11ySnapshot (doc: Document): { tree: A11yNode, nodeCount: number, truncated: boolean } {
  let count = 0
  let truncated = false

  const walk = (el: Element): A11yNode[] => {
    if (count >= A11Y_MAX_NODES) {
      truncated = true

      return []
    }

    if (el.getAttribute('aria-hidden') === 'true') return []

    const explicit = el.getAttribute('role')?.trim().split(/\s+/)[0] || null
    const role = explicit === 'presentation' || explicit === 'none'
      ? null
      : explicit || implicitRole(el)

    const children: A11yNode[] = []

    for (const child of Array.from(el.children) as Element[]) {
      for (const c of walk(child)) children.push(c)
    }

    if (!role) return children

    if (count >= A11Y_MAX_NODES) {
      truncated = true

      return children
    }

    count++

    return [{
      role,
      name: computeName(el, role, doc),
      level: role === 'heading' ? (parseInt(el.tagName.slice(1), 10) || null) : null,
      value: computeValue(el, role),
      checked: computeChecked(el, role),
      disabled: computeDisabled(el, role),
      selector: uniqueSelector(el, doc),
      children,
    }]
  }

  const topChildren = walk(doc.documentElement)

  const tree: A11yNode = {
    role: 'document',
    name: (doc.title || '').trim() || null,
    level: null,
    value: null,
    checked: null,
    disabled: null,
    selector: 'html',
    children: topChildren,
  }

  return { tree, nodeCount: count, truncated }
}

let crossOriginOnMessageRef = ({ data, source }: MessageEvent<{
  data: any
  source: Window
}>) => {
  return undefined
}
let crossOriginLogs: {[key: string]: Cypress.Log} = {}
let hasMochaRunEnded: boolean = false

interface AddGlobalListenerOptions {
  element: AutomationElementId
  randomString: string
}

const driverToLocalAndReporterEvents = 'run:start run:end'.split(' ')
const driverToSocketEvents = 'backend:request automation:request mocha recorder:frame dev-server:on-spec-update'.split(' ')
const driverToLocalEvents = 'viewport:changed config stop url:changed page:loading visit:failed visit:blank cypress:in:cypress:runner:event'.split(' ')
const socketToDriverEvents = 'net:stubbing:event request:event script:error cross:origin:cookies dev-server:on-spec-updated'.split(' ')
const localToReporterEvents = 'reporter:log:add reporter:log:state:changed reporter:log:remove'.split(' ')

/**
 * @type {Cypress.Cypress}
 */
let Cypress

export class EventManager {
  reporterBus: EventEmitter = new EventEmitter()
  localBus: EventEmitter = new EventEmitter()
  Cypress?: $Cypress
  selectorPlaygroundModel: any
  cypressInCypressMochaEvents: CypressInCypressMochaEvent[] = []
  // Used for testing the experimentalSingleTabRunMode experiment. Ensures AUT is correctly destroyed between specs.
  ws: SocketShape
  specStore: ReturnType<typeof useSpecStore>
  studioStore: ReturnType<typeof useStudioStore>
  promptStore: ReturnType<typeof usePromptStore>
  specDirtyDataStore: ReturnType<typeof useSpecDirtyDataStore>
  _deferCleanupToUnload = false

  constructor (
    // import '@packages/driver'
    private $CypressDriver: any,
    // import * as MobX
    private Mobx: typeof MobX,
    // selectorPlaygroundModel singleton
    selectorPlaygroundModel: any,
    ws: SocketShape,
  ) {
    this.selectorPlaygroundModel = selectorPlaygroundModel
    this.ws = ws
    this.specStore = useSpecStore()
    this.studioStore = useStudioStore()
    this.promptStore = usePromptStore()
    this.specDirtyDataStore = useSpecDirtyDataStore()
  }

  getCypress () {
    return Cypress
  }

  addGlobalListeners (state: MobxRunnerStore, options: AddGlobalListenerOptions) {
    // Moving away from the runner turns off all websocket listeners. addGlobalListeners adds them back
    // but connect is added when the websocket is created elsewhere so we need to add it back.
    if (!this.ws.hasListeners('connect')) {
      this.ws.on('connect', () => {
        this.ws.emit('runner:connected')
      })
    }

    const rerun = () => {
      if (!this) {
        // if the tests have been reloaded then there is nothing to rerun
        return
      }

      return this.rerunSpec()
    }

    const connectionInfo: AddGlobalListenerOptions = {
      element: options.element,
      randomString: options.randomString,
    }

    const runnerUiStore = useRunnerUiStore()

    this.ws.emit('is:automation:client:connected', connectionInfo, (isConnected: boolean) => {
      const connected = isConnected ? automation.CONNECTED : automation.MISSING

      // legacy MobX integration
      // TODO: UNIFY-1318 - can we delete this, or does the driver depend on this somehow?
      this.Mobx.runInAction(() => {
        state.automation = connected
      })

      this.ws.on('automation:disconnected', () => {
        this.Mobx.runInAction(() => {
          state.automation = automation.DISCONNECTED
        })
      })

      // unified integration
      this.ws.on('automation:disconnected', () => {
        runnerUiStore.setAutomationStatus('DISCONNECTED')
      })

      runnerUiStore.setAutomationStatus(connected)
    })

    this.ws.on('update:telemetry:context', (contextString) => {
      const context = JSON.parse(contextString)

      telemetry.setRootContext(context)
    })

    this.ws.on('automation:push:message', (msg, data: any = {}) => {
      if (!Cypress) return

      switch (msg) {
        case 'change:cookie':
          Cypress.Cookies.log(data.message, data.cookie, data.removed)
          break
        case 'create:download':
          Cypress.downloads.start(data)
          break
        case 'complete:download':
          Cypress.downloads.end(data)
          break
        case 'canceled:download':
          Cypress.downloads.end(data, true)
          break
        default:
          break
      }
    })

    this.ws.on('watched:file:changed', rerun)

    this.ws.on('dev-server:compile:success', ({ specFile }) => {
      if (!specFile || specFile === state?.spec?.absolute) {
        rerun()
      }
    })

    this.ws.on('runner:restart', rerun)

    socketToDriverEvents.forEach((event) => {
      this.ws.on(event, (...args) => {
        if (!Cypress) return

        Cypress.emit(event, ...args)
      })
    })

    localToReporterEvents.forEach((event) => {
      this.localBus.on(event, (...args) => {
        this.reporterBus.emit(event, ...args)
      })
    })

    const logCommand = (testId, logId) => {
      const consoleProps = Cypress.runner.getConsolePropsForLog(testId, logId)

      logger.logFormatted(consoleProps)
    }

    this.reporterBus.on('runner:console:error', ({ err, testId, logId }) => {
      if (!Cypress) return

      if (logId || err) logger.clearLog()

      if (logId) logCommand(testId, logId)

      if (err) logger.logError(err.stack)
    })

    this.reporterBus.on('runner:console:log', (testId, logId) => {
      if (!Cypress) return

      logger.clearLog()
      logCommand(testId, logId)
    })

    this.reporterBus.on('set:user:editor', (editor) => {
      this.ws.emit('set:user:editor', editor)
    })

    this.reporterBus.on('runner:restart', rerun)

    const sendEventIfSnapshotProps = (testId, logId, event) => {
      if (!Cypress) return

      const snapshotProps = Cypress.runner.getSnapshotPropsForLog(testId, logId)

      if (snapshotProps) {
        this.localBus.emit(event, snapshotProps)
      }
    }

    this.reporterBus.on('runner:show:snapshot', (testId, logId) => {
      sendEventIfSnapshotProps(testId, logId, 'show:snapshot')
    })

    this.reporterBus.on('runner:hide:snapshot', this._hideSnapshot.bind(this))

    this.reporterBus.on('runner:pin:snapshot', (testId, logId) => {
      sendEventIfSnapshotProps(testId, logId, 'pin:snapshot')
    })

    this.reporterBus.on('runner:unpin:snapshot', this._unpinSnapshot.bind(this))

    this.reporterBus.on('runner:stop', () => {
      if (!Cypress) return

      Cypress.stop()
    })

    this.reporterBus.on('save:state', (state) => {
      this.saveState(state)
    })

    this.reporterBus.on('testFilter:cloudDebug:dismiss', () => {
      this.emit('testFilter:cloudDebug:dismiss', undefined)
    })

    this.reporterBus.on('clear:all:sessions', () => {
      if (!Cypress) return

      Cypress.backend('clear:sessions', true)
      .then(rerun)
    })

    this.reporterBus.on('external:open', (url) => {
      this.ws.emit('external:open', url)
    })

    this.reporterBus.on('open:login:connect:modal', (args) => {
      this.localBus.emit('open:login:connect:modal', args)
    })

    this.reporterBus.on('get:user:editor', (cb) => {
      this.ws.emit('get:user:editor', cb)
    })

    this.reporterBus.on('open:file:unified', (file: FileDetails) => {
      this.emit('open:file', file)
    })

    this.reporterBus.on('open:file', (url) => {
      this.ws.emit('open:file', url)
    })

    const studioInitTest = ({ testId }: { testId: string }, cb?: () => void) => {
      this.studioStore.setTestId(testId)
      rerun()
    }

    // When Studio is activated via the reporter UI (not the CLI mutation),
    // let the server mirror `studioActiveTestId` so `cypress inspect test`
    // can distinguish Studio mode. The CLI path already sets coreData via
    // the `studioInitTest` mutation before emitting `studio:remote-init:test`,
    // so it's fine for the server to no-op on a repeat notification.
    const studioInitTestFromUi = (payload: { testId: string }) => {
      this.ws.emit('studio:testId:set', { testId: payload.testId })
      studioInitTest(payload)
    }

    this.reporterBus.on('studio:init:test', studioInitTestFromUi)
    this.localBus.on('studio:init:test', studioInitTestFromUi)
    // Server-initiated Studio activation (e.g. from `cypress inspect test open`).
    // Runs the same handler the reporter button uses — behavior matches a click.
    this.ws.on('studio:remote-init:test', studioInitTest)

    const studioInitSuite = ({ suiteId, showUrlPrompt = true, entrySource }: { suiteId: string, showUrlPrompt?: boolean, entrySource?: EntrySource }) => {
      this.studioStore.setSuiteId(suiteId)

      if (entrySource) {
        this.studioStore.setEntrySource(entrySource)
      }

      this.studioStore.setShowUrlPrompt(showUrlPrompt)

      this.ws.emit('studio:init', { sessionId: this.studioStore.sessionId }, ({ canAccessStudioAI, cloudStudioSessionId, error }) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error(error)
        }

        this.studioStore.setCanAccessStudioAI(canAccessStudioAI)
        this.studioStore.setSessionId(cloudStudioSessionId)
        this.studioStore.setActive(true)
      })
    }

    this.reporterBus.on('studio:init:suite', studioInitSuite)
    this.localBus.on('studio:init:suite', studioInitSuite)

    const maybeCleanUpProtocol = () => {
      const needsReload = this.studioStore.needsProtocolCleanup()

      this.studioStore.cancel()

      // only reload the page if Studio has actually been used for recording
      if (needsReload) {
        window.location.reload()
      }
    }

    const executeStudioCancel = () => {
      // Mirror `studioActiveTestId` clearing to the server regardless of whether
      // this cancel was UI- or server-initiated. The `studioCancel` mutation
      // already clears it on the server side, so a duplicate is harmless.
      this.ws.emit('studio:testId:clear')

      this.ws.emit('studio:destroy', ({ error }) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error(error)
        }

        maybeCleanUpProtocol()
      })
    }

    this.reporterBus.on('studio:cancel', () => {
      const blocked = guardUnsavedStudioChanges(this.specDirtyDataStore, () => {
        this.specDirtyDataStore.resetDirtyState()
        executeStudioCancel()
      })

      if (!blocked) {
        executeStudioCancel()
      }
    })

    this.localBus.on('studio:cancel', () => {
      executeStudioCancel()
    })

    // Server-initiated Studio teardown (e.g. from `cypress inspect test close`).
    this.ws.on('studio:remote-cancel', executeStudioCancel)

    // On-demand command log snapshot for `cypress inspect test`. Bridges a
    // request from the server to the reporter's MobX store via `reporterBus`,
    // then replies over a separate `inspect:response` event (rather than a
    // socket ack) because the CDP-backed runner socket doesn't deliver
    // server-initiated ack callbacks — see `packages/socket/lib/client/cdp-browser.ts`.
    this.ws.on('inspect:request-commands', ({ requestId, testId }: { requestId: string, testId: string }) => {
      let settled = false
      const reply = (snapshot: unknown) => {
        if (settled) return

        settled = true
        this.ws.emit('inspect:response', { requestId, snapshot })
      }

      // Defensive timeout — if the reporter bus has no listener (reporter
      // unmounted, never attached), reply with null so the server resolves.
      const timer = setTimeout(() => reply(null), 1500)

      this.reporterBus.emit('request:commands:snapshot', testId, (snapshot: unknown) => {
        clearTimeout(timer)

        // Enrich each command with `snapshotCount` from the driver. The
        // reporter only tracks `hasSnapshot` as a boolean, but the raw
        // snapshots array lives on the driver-side log attrs and we need
        // the length for `cypress inspect command list`.
        if (Array.isArray(snapshot) && Cypress?.runner?.getSnapshotPropsForLog) {
          for (const cmd of snapshot) {
            if (cmd && typeof cmd === 'object' && typeof (cmd as any).id === 'string') {
              try {
                const props = Cypress.runner.getSnapshotPropsForLog(testId, (cmd as any).id)
                const snapshots = props && (props as any).snapshots

                ;(cmd as any).snapshotCount = Array.isArray(snapshots) ? snapshots.length : 0
              } catch {
                (cmd as any).snapshotCount = 0
              }
            }
          }
        }

        reply(snapshot)
      })
    })

    // On-demand read of the currently pinned command for `cypress inspect
    // command`. Combines the reporter's `appState.pinnedSnapshotId` with the
    // driver's `getConsolePropsForLog` so the CLI gets both pin state and
    // rich debug payload in one round-trip.
    this.ws.on('inspect:request-pinned-command', ({ requestId, testId }: { requestId: string, testId: string }) => {
      let settled = false
      const reply = (snapshot: unknown) => {
        if (settled) return

        settled = true
        this.ws.emit('inspect:response', { requestId, snapshot })
      }

      const timer = setTimeout(() => reply(null), 1500)

      this.reporterBus.emit('request:pinned-command-state', (logId: string | null) => {
        clearTimeout(timer)

        if (!logId) {
          return reply(null)
        }

        let consolePropsJson: string | null = null

        try {
          const consoleProps = Cypress?.runner?.getConsolePropsForLog?.(testId, logId)

          if (consoleProps != null) {
            consolePropsJson = safeStringifyConsoleProps(consoleProps)
          }
        } catch {
          consolePropsJson = null
        }

        reply({ logId, consolePropsJson })
      })
    })

    // Read-only sibling of `inspect:request-pinned-command`. Dumps
    // `consoleProps` for each requested logId without touching the reporter's
    // pinned state. Used by `cypress inspect command info <sel...>`.
    this.ws.on('inspect:request-command-console-props', ({ requestId, testId, logIds }: {
      requestId: string
      testId: string
      logIds: string[]
    }) => {
      const results: Array<{ logId: string, consolePropsJson: string | null }> = []

      const safeLogIds = Array.isArray(logIds) ? logIds : []

      for (const logId of safeLogIds) {
        if (typeof logId !== 'string') {
          continue
        }

        let consolePropsJson: string | null = null

        try {
          const consoleProps = Cypress?.runner?.getConsolePropsForLog?.(testId, logId)

          if (consoleProps != null) {
            consolePropsJson = safeStringifyConsoleProps(consoleProps)
          }
        } catch {
          consolePropsJson = null
        }

        results.push({ logId, consolePropsJson })
      }

      this.ws.emit('inspect:response', { requestId, snapshot: results })
    })

    // On-demand read of the AUT iframe for `cypress inspect aut` /
    // `cypress inspect aut dom`. Studio gating happens server-side in the
    // resolver; this handler assumes it's OK to read and returns a tagged
    // payload the resolver maps to the GraphQL union.
    this.ws.on('inspect:request-aut', ({ requestId, kind, args }: {
      requestId: string
      kind: 'root' | 'dom' | 'snapshot'
      args: { selector?: string }
    }) => {
      // eslint-disable-next-line no-console
      console.log('[inspect] ws inspect:request-aut', { requestId, kind, args })
      let settled = false
      const reply = (snapshot: unknown) => {
        if (settled) return

        settled = true
        // eslint-disable-next-line no-console
        console.log('[inspect] inspect:response ←', { requestId, snapshot })
        this.ws.emit('inspect:response', { requestId, snapshot })
      }

      // Safety timeout — matches other inspect handlers. The handler itself
      // is synchronous, so this is belt-and-suspenders in case a cross-origin
      // access hangs inside JQuery/DOM internals.
      const timer = setTimeout(() => reply({ error: 'AUT_UNAVAILABLE' }), 1000)

      try {
        const autIframe = getAutIframeModel()
        const autWindow: any = autIframe?.$iframe?.prop?.('contentWindow') ?? null

        if (!autWindow) {
          clearTimeout(timer)

          return reply({ error: 'AUT_UNAVAILABLE' })
        }

        if (kind === 'root') {
          let url: string | null = null

          try {
            url = autWindow.location?.href ?? null
          } catch {
            // Cross-origin AUT — fall back to the driver's cached last URL.
            url = (Cypress as any)?.state?.('url') ?? null
          }

          if (!url) {
            clearTimeout(timer)

            return reply({ error: 'AUT_UNAVAILABLE' })
          }

          let title: string | null = null

          try {
            title = autWindow.document?.title ?? null
          } catch {
            title = null
          }

          const viewportWidth = Number((Cypress as any)?.config?.('viewportWidth')) || 0
          const viewportHeight = Number((Cypress as any)?.config?.('viewportHeight')) || 0

          clearTimeout(timer)

          return reply({ data: { url, title, viewportWidth, viewportHeight } })
        }

        if (kind === 'dom') {
          const selector = typeof args?.selector === 'string' ? args.selector : ''

          if (!selector) {
            clearTimeout(timer)

            return reply({ error: 'INVALID_SELECTOR', detailMessage: 'selector is required' })
          }

          let doc: Document

          try {
            doc = autWindow.document
            if (!doc) throw new Error('no document')
          } catch (e: any) {
            clearTimeout(timer)

            return reply({ error: 'AUT_UNAVAILABLE', detailMessage: e?.message })
          }

          let nodes: NodeListOf<Element>

          try {
            nodes = doc.querySelectorAll(selector)
          } catch (e: any) {
            clearTimeout(timer)

            return reply({ error: 'INVALID_SELECTOR', detailMessage: e?.message })
          }

          const MAX_MATCHES = 20
          const MAX_OUTER_HTML = 2048
          const MAX_TEXT = 500
          const truncate = (s: string, n: number) => s.length > n ? s.slice(0, n) : s

          const matches = [] as Array<{ tag: string, text: string | null, attrs: Array<{ name: string, value: string }>, outerHTML: string }>

          for (let i = 0; i < Math.min(nodes.length, MAX_MATCHES); i++) {
            const el = nodes[i] as Element
            const rawText = (el.textContent ?? '').trim()
            const attrs: Array<{ name: string, value: string }> = []

            for (const attr of Array.from(el.attributes)) {
              attrs.push({ name: attr.name, value: attr.value })
            }

            matches.push({
              tag: el.tagName.toLowerCase(),
              text: rawText ? truncate(rawText, MAX_TEXT) : null,
              attrs,
              outerHTML: truncate(el.outerHTML, MAX_OUTER_HTML),
            })
          }

          clearTimeout(timer)

          return reply({ data: { selector, count: nodes.length, matches } })
        }

        if (kind === 'snapshot') {
          let doc: Document

          try {
            doc = autWindow.document
            if (!doc) throw new Error('no document')
          } catch (e: any) {
            clearTimeout(timer)

            return reply({ error: 'AUT_UNAVAILABLE', detailMessage: e?.message })
          }

          let url: string | null = null

          try {
            url = autWindow.location?.href ?? null
          } catch {
            url = (Cypress as any)?.state?.('url') ?? null
          }

          if (!url) {
            clearTimeout(timer)

            return reply({ error: 'AUT_UNAVAILABLE' })
          }

          let title: string | null = null

          try {
            title = doc.title ?? null
          } catch {
            title = null
          }

          const viewportWidth = Number((Cypress as any)?.config?.('viewportWidth')) || 0
          const viewportHeight = Number((Cypress as any)?.config?.('viewportHeight')) || 0

          const { tree, nodeCount, truncated } = buildA11ySnapshot(doc)

          clearTimeout(timer)

          return reply({ data: { url, title, viewportWidth, viewportHeight, nodeCount, truncated, tree } })
        }

        clearTimeout(timer)
        reply({ error: 'AUT_UNAVAILABLE', detailMessage: `unknown kind: ${kind}` })
      } catch (e: any) {
        clearTimeout(timer)
        reply({ error: 'AUT_UNAVAILABLE', detailMessage: e?.message })
      }
    })

    // Server-initiated pin / unpin for `cypress inspect command pin|unpin`.
    // Mirrors the browser-side `_toggleColumnPin` path; the reporter handler
    // guards on `appState.isRunning` and emits the same `pin:snapshot` bus
    // event the UI click uses.
    this.ws.on('inspect:remote-pin-command', ({ testId, logId }: { testId: string, logId: string }) => {
      // eslint-disable-next-line no-console
      console.log('[inspect] ws inspect:remote-pin-command → reporterBus', { testId, logId })
      this.reporterBus.emit('inspect:remote-pin-command', testId, logId)
    })

    this.ws.on('inspect:remote-unpin-command', () => {
      // eslint-disable-next-line no-console
      console.log('[inspect] ws inspect:remote-unpin-command → reporterBus')
      this.reporterBus.emit('inspect:remote-unpin-command')
    })

    this.ws.on('aut:destroy:init', () => {
      const autIframe = getAutIframeModel()

      autIframe.destroy()
      this.ws.emit('aut:destroy:complete')
    })

    // @ts-ignore
    const $window = this.$CypressDriver.$(window)

    // This is a test-only event. It's used to
    // trigger a rerun for the driver rerun.cy.js spec.
    $window.on('test:trigger:rerun', rerun)

    // when we actually unload then
    // nuke all of the cookies again
    // so we clear out unload
    // While we must move to pagehide for Chromium, it does not work for our
    // needs in Firefox. Until that is addressed, only Chromium uses the pagehide
    // event as a proxy for AUT unloads.
    const unloadEvent = this.isBrowserFamily('chromium') ? 'pagehide' : 'unload'

    $window.on(unloadEvent, () => {
      if (this._deferCleanupToUnload) {
        this._runFullUnloadCleanup()
        this._deferCleanupToUnload = false
      } else {
        this._clearAllCookies()
      }
    })

    // when our window triggers beforeunload
    // we know we've change the URL and we need
    // to clear our cookies
    // additionally we set unload to true so
    // that Cypress knows not to set any more
    // cookies
    $window.on('beforeunload', () => {
      if (this.specDirtyDataStore.isDirty()) {
        // Used to handle Studio unsaved changes. It defers the cleanup to the unload event
        // so that the test is not rerun if the user cancels the beforeunload dialog.
        this._deferCleanupToUnload = true

        return
      }

      // Clear any stale flag from a previously cancelled beforeunload so the unload
      // handler does not run full cleanup again
      this._deferCleanupToUnload = false
      this._runFullUnloadCleanup()
    })

    this.addPromptListeners()
  }

  start (config) {
    if (config.socketId) {
      this.ws.emit('app:connect', config.socketId)
    }
  }

  async setup (config) {
    this.ws.emit('watch:test:file', config.spec)

    if (config.isTextTerminal || config.experimentalInteractiveRunEvents) {
      await new Promise((resolve, reject) => {
        this.ws.emit('plugins:before:spec', config.spec, (res?: { error: Error }) => {
          // FIXME: handle surfacing the error to the browser instead of hanging with
          // 'Your tests are loading...' message. Fix in https://github.com/cypress-io/cypress/issues/23627
          if (res && res.error) {
            reject(res.error)
          }

          resolve(null)
        })
      })
    }

    Cypress = this.Cypress = this.$CypressDriver.create(config)
    this.localBus.emit('cypress:created', Cypress)

    // expose Cypress globally
    window.Cypress = Cypress

    this.studioStore.setup(config)

    const isDefaultProtocolEnabled = Cypress.config('isDefaultProtocolEnabled')

    const isStudioInScope = this.studioStore.isActive || this.studioStore.isLoading

    if (isStudioInScope && !isDefaultProtocolEnabled) {
      await new Promise<void>((resolve) => {
        this.ws.emit('studio:protocol:enabled', ({ studioProtocolEnabled }) => {
          Cypress.state('isProtocolEnabled', studioProtocolEnabled)

          resolve()
        })
      })
    } else {
      Cypress.state('isProtocolEnabled', isDefaultProtocolEnabled)
    }

    this._addListeners()

    await new Promise((resolve) => {
      this.ws.emit('prompt:reset', resolve)
    })
  }

  isBrowserFamily (family: string) {
    return getRunnerConfigFromWindow()?.browser?.family === family
  }

  initialize ({
    $autIframe,
    $autSnapshotIframes,
    config,
  }: {
    $autIframe: JQuery<HTMLIFrameElement>
    $autSnapshotIframes?: JQuery<HTMLIFrameElement>[]
    config: Record<string, any>
  }) {
    performance.mark('initialize-start')

    const testFilter = this.specStore.testFilter

    const { suiteId, testId } = this.studioStore
    const isStudio = !!(testId || suiteId)

    const waitForStudio = (cb: () => void) => {
      if (testId) {
        this.studioStore.setTestId(testId)
      } else if (suiteId) {
        this.studioStore.setSuiteId(suiteId)
      }

      this.ws.emit('studio:init', { sessionId: this.studioStore.sessionId }, ({ canAccessStudioAI, cloudStudioSessionId, error }) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error(error)
        }

        this.studioStore.setCanAccessStudioAI(canAccessStudioAI)
        this.studioStore.setSessionId(cloudStudioSessionId)

        cb()
      })
    }

    return Cypress.initialize({
      $autIframe,
      $autSnapshotIframes,
      // defining this indicates that the test run should wait for Studio to
      // be initialized before running the test
      waitForStudio: isStudio ? waitForStudio : undefined,
      onSpecReady: () => {
        // get the current runnable states and cached test state
        // in case we reran mid-test due to a visit to a new domain
        this.ws.emit('get:cached:test:state', (runState: RunState = {}, testState: CachedTestState) => {
          if (!Cypress.runner) {
            // the tests have been reloaded
            return
          }

          const hideCommandLog = Cypress.config('hideCommandLog')

          this.studioStore.initialize()

          const runnables = Cypress.runner.normalizeAll(runState.tests, hideCommandLog, testFilter)

          const run = () => {
            performance.mark('initialize-end')
            performance.measure('initialize', 'initialize-start', 'initialize-end')

            this._runDriver(runState, testState)
          }

          if (!hideCommandLog) {
            this.reporterBus.emit('runnables:ready', runnables)
          }

          if (runState?.numLogs) {
            Cypress.runner.setNumLogs(runState.numLogs)
          }

          if (runState.startTime) {
            Cypress.runner.setStartTime(runState.startTime)
          }

          if (config.isTextTerminal && !runState.currentId) {
            // we are in run mode and it's the first load
            // store runnables in backend and maybe send to Cypress Cloud
            return this.ws.emit('set:runnables:and:maybe:record:tests', runnables, run)
          }

          if (runState.currentId) {
            // if we have a currentId it means
            // we need to tell the Cypress to skip
            // ahead to that test
            Cypress.runner.resumeAtTest(runState.currentId, runState.currentRetry, runState.emissions)
          }

          return run()
        })
      },
    })
  }

  _addListeners () {
    addTelemetryListeners(Cypress)

    if (Cypress.state('isProtocolEnabled')) {
      addCaptureProtocolListeners(Cypress)
    }

    Cypress.on('message', (msg, data, cb) => {
      this.ws.emit('client:request', msg, data, cb)
    })

    driverToSocketEvents.forEach((event) => {
      Cypress.on(event, (...args) => {
        return this.ws.emit(event, ...args)
      })
    })

    Cypress.on('collect:run:state', () => {
      if (Cypress.config('hideCommandLog')) {
        // TODO: Need more refactoring to use native Promise here since
        // this goes to events.emitThen = map(Bluebird.map) which expect a Bluebird promise
        return Bluebird.resolve()
      }

      return new Bluebird((resolve) => {
        this.reporterBus.emit('reporter:collect:run:state', (reporterState: ReporterRunState) => {
          resolve({ reporterState })
        })
      })
    })

    Cypress.on('log:added', (log) => {
      // TODO: UNIFY-1318 - Race condition in unified runner - we should not need this null check
      if (!Cypress.runner) {
        return
      }

      const displayProps = Cypress.runner.getDisplayPropsForLog(log)

      this._interceptStudio(displayProps)

      this.reporterBus.emit('reporter:log:add', displayProps)
    })

    Cypress.on('log:changed', (log) => {
      // TODO: UNIFY-1318 - Race condition in unified runner - we should not need this null check
      if (!Cypress.runner) {
        return
      }

      const displayProps = Cypress.runner.getDisplayPropsForLog(log)

      this._interceptStudio(displayProps)

      this.reporterBus.emit('reporter:log:state:changed', displayProps)
    })

    // TODO: MOVE BACK INTO useEventManager. Verify this works
    const screenshotStore = useScreenshotStore()

    const handleBeforeScreenshot = (config, cb) => {
      if (config.appOnly || Cypress.config('hideRunnerUi')) {
        screenshotStore.setScreenshotting(true)
      }

      const beforeThenCb = () => {
        this.localBus.emit('before:screenshot', config)
        cb()
      }

      if (Cypress.config('hideCommandLog')) {
        return beforeThenCb()
      }

      const wait = !config.appOnly && config.waitForCommandSynchronization

      if (!config.appOnly) {
        const { id, isOpen } = config

        this.reporterBus.emit('test:set:state', { id, isOpen }, wait ? beforeThenCb : undefined)
      }

      if (!wait) beforeThenCb()
    }

    Cypress.on('before:screenshot', handleBeforeScreenshot)

    const handleAfterScreenshot = (config) => {
      screenshotStore.setScreenshotting(false)
      this.localBus.emit('after:screenshot', config)
    }

    Cypress.on('after:screenshot', handleAfterScreenshot)

    driverToLocalAndReporterEvents.forEach((event) => {
      Cypress.on(event, (...args) => {
        this.localBus.emit(event, ...args)
        this.reporterBus.emit(event, ...args)
      })
    })

    /**
     * Emit a single discriminated envelope over the `inspect:event` socket
     * channel. Every open-mode inspect signal flows through this one helper:
     * spec lifecycle, per-test results, and (soon) commands, network,
     * console. The server-side dispatcher lives in
     * `packages/data-context/src/actions/RunStateActions.ts#dispatchInspectEvent`.
     */
    const emitInspect = (kind: string, payload: Record<string, unknown>): void => {
      if (Cypress.config('isTextTerminal')) {
        return
      }

      const spec = Cypress.spec

      this.ws.emit('inspect:event', {
        kind,
        specPath: spec?.absolute,
        timestamp: new Date().toISOString(),
        payload,
      })
    }

    Cypress.on('run:start', async () => {
      hasMochaRunEnded = false

      emitInspect('run:start', {})

      if (Cypress.config('experimentalMemoryManagement') && Cypress.isBrowser({ family: 'chromium' })) {
        await Cypress.backend('start:memory:profiling', Cypress.config('spec'))
      }
    })

    Cypress.on('run:end', async () => {
      hasMochaRunEnded = true

      emitInspect('run:end', {})

      if (Cypress.config('experimentalMemoryManagement') && Cypress.isBrowser({ family: 'chromium' })) {
        await Cypress.backend('end:memory:profiling')
      }
    })

    // Per-test outcomes. Retries fire this event multiple times for the same
    // test id; the server overwrites by id so the final attempt wins.
    Cypress.on('test:after:run', (attributes: any) => {
      const state: string | undefined = attributes?.state

      // Mocha sometimes fires this for hooks or partial results; ignore
      // anything without a terminal test state.
      if (state !== 'passed' && state !== 'failed' && state !== 'pending' && state !== 'skipped') {
        return
      }

      emitInspect('test:result', {
        testId: String(attributes.id ?? ''),
        title: String(attributes.title ?? ''),
        titlePath: Array.isArray(attributes._titlePath) ? attributes._titlePath.map(String) : [],
        state,
        duration: typeof attributes.duration === 'number' ? attributes.duration : null,
        currentRetry: typeof attributes.currentRetry === 'number' ? attributes.currentRetry : 0,
        error: attributes.err?.message ? String(attributes.err.message) : null,
      })
    })

    driverToLocalEvents.forEach((event) => {
      Cypress.on(event, (...args: unknown[]) => {
        // special case for asserting the correct mocha events + payload
        // is emitted from cypress/driver when running e2e tests using
        // "cypress in cypress"
        if (event === 'cypress:in:cypress:runner:event') {
          // TODO: we sometimes receive multiple mocha:start events
          // which causes the the mochaEvent snapshots to fail. We should investigate further.
          if (args[0] === 'mocha' && args[1] === 'start') {
            this.cypressInCypressMochaEvents = []
          }

          this.cypressInCypressMochaEvents.push(args as CypressInCypressMochaEvent[])

          if (args[0] === 'mocha' && args[1] === 'end') {
            this.emit('cypress:in:cypress:run:complete', this.cypressInCypressMochaEvents)

            // reset
            this.cypressInCypressMochaEvents = []
          }

          return
        }

        // @ts-ignore
        // TODO: UNIFY-1318 - strongly typed event emitter.
        return this.emit(event, ...args)
      })
    })

    Cypress.on('script:error', (err) => {
      Cypress.stop()
      this.localBus.emit('script:error', err)
    })

    Cypress.on('test:before:run:async', async (...args) => {
      crossOriginLogs = {}
      const [attributes, test] = args

      this.reporterBus.emit('test:before:run:async', attributes)

      this.studioStore.interceptTest(test)

      // if the experimental flag is on and we are in a chromium based browser,
      // check the memory pressure to determine if garbage collection is needed
      if (Cypress.config('experimentalMemoryManagement') && Cypress.isBrowser({ family: 'chromium' })) {
        await Cypress.backend('check:memory:pressure', {
          test: { title: attributes.title, order: attributes.order, currentRetry: attributes.currentRetry },
        })
      }

      Cypress.primaryOriginCommunicator.toAllSpecBridges('test:before:run:async', ...args)
    })

    Cypress.on('test:before:after:run:async', (...args) => {
      Cypress.primaryOriginCommunicator.toAllSpecBridges('test:before:after:run:async', ...args)
    })

    Cypress.on('test:after:run', (attributes) => {
      this.reporterBus.emit('test:after:run', attributes, Cypress.config('isInteractive'))

      if (this.studioStore.isOpen && attributes.state !== 'passed') {
        this.studioStore.testFailed()
      }
    })

    handlePausing(this.getCypress, this.reporterBus)

    Cypress.on('test:before:run', (...args) => {
      Cypress.primaryOriginCommunicator.toAllSpecBridges('test:before:run', ...args)
    })

    // Inform all spec bridges that the primary origin has begun to unload.
    Cypress.on('window:before:unload', () => {
      Cypress.primaryOriginCommunicator.toAllSpecBridges('before:unload', window.origin)
    })

    // Reflect back to the requesting origin the status of the 'duringUserTestExecution' state
    Cypress.primaryOriginCommunicator.on('sync:during:user:test:execution', (_data, { origin, responseEvent }) => {
      Cypress.primaryOriginCommunicator.toSpecBridge(origin, responseEvent, cy.state('duringUserTestExecution'))
    })

    Cypress.primaryOriginCommunicator.on('before:unload', (origin) => {
      // In webkit the before:unload event could come in after the on load event has already happened.
      // To prevent hanging we will only set the state to unstable if we are currently on the same origin as the unload event,
      // otherwise we assume that the load event has already occurred and the event is no longer relevant.
      if (Cypress.state('autLocation')?.origin === origin) {
        // We specifically don't call 'cy.isStable' here because we don't want to inject another load event.
        cy.state('isStable', false)
      }

      // Re-broadcast to any other specBridges.
      Cypress.primaryOriginCommunicator.toAllSpecBridges('before:unload', origin)
    })

    Cypress.primaryOriginCommunicator.on('expect:origin', (origin) => {
      this.localBus.emit('expect:origin', origin)
    })

    Cypress.primaryOriginCommunicator.on('viewport:changed', (viewport, { origin }) => {
      const callback = () => {
        Cypress.primaryOriginCommunicator.toSpecBridge(origin, 'viewport:changed:end')
      }

      Cypress.primaryOriginCommunicator.emit('sync:viewport', viewport)
      this.localBus.emit('viewport:changed', viewport, callback)
    })

    Cypress.primaryOriginCommunicator.on('before:screenshot', (config, { origin }) => {
      const callback = () => {
        Cypress.primaryOriginCommunicator.toSpecBridge(origin, 'before:screenshot:end')
      }

      handleBeforeScreenshot(config, callback)
    })

    Cypress.primaryOriginCommunicator.on('url:changed', ({ url }) => {
      this.localBus.emit('url:changed', url)
    })

    Cypress.primaryOriginCommunicator.on('after:screenshot', handleAfterScreenshot)

    Cypress.primaryOriginCommunicator.on('log:added', (attrs) => {
      // If the mocha run is over and the user enters interactive snapshot mode, do not add cross origin logs to the test runner.
      if (hasMochaRunEnded) return

      // Create a new local log representation of the cross origin log.
      // It will be attached to the current command.
      // We also keep a reference to it to update it in the future.
      crossOriginLogs[attrs.id] = Cypress.log(attrs)
    })

    Cypress.primaryOriginCommunicator.on('log:changed', (attrs) => {
      // Retrieve the referenced log and update it.
      const log = crossOriginLogs[attrs.id]

      // this will trigger a log changed event for the log itself.
      log?.set(attrs)
    })

    // This message comes from the AUT, not the spec bridge. This is called in
    // the event that cookies are set via document.cookie in a cross origin
    // AUT prior to attaching a spec bridge.
    Cypress.primaryOriginCommunicator.on(
      'aut:set:cookie',
      (options: { cookie, url: string, sameSiteContext: string }) => {
        // unlikely there will be errors, but ignore them in any case, since
        // they're not user-actionable
        Cypress.automation('set:cookie', options.cookie).catch(() => {})
        Cypress.backend('cross:origin:set:cookie', options).catch(() => {})
      },
    )

    Cypress.handlePrimaryOriginSocketEvent(Cypress, 'backend:request')

    /**
     * Call an automation request for the requesting spec bridge since we cannot have websockets in the spec bridges.
     * Return it's response.
     */
    Cypress.primaryOriginCommunicator.on('automation:request', async ({ args }, { source, responseEvent }) => {
      const response = await Cypress.automation(...args)

      Cypress.primaryOriginCommunicator.toSource(source, responseEvent, response)
    })

    // The window.top should not change between test reloads, and we only need to bind the message event when Cypress is recreated
    // Forward all message events to the current instance of the multi-origin communicator
    if (!window.top) throw new Error('missing window.top in event-manager')

    /**
     * NOTE: Be sure to remove the cross origin onMessage bus to make sure the communicator doesn't live on inside a closure and cause tied up events.
     *
     * This is applicable when a user navigates away from the runner and into the "specs" menu or otherwise,
     * and the EventManager is recreated. This is the main reason this reference is scoped to the file and NOT the instance.
     *
     * This is also applicable when a user changes their spec file and hot reloads their spec, in which case we need to rebind onMessage
     * with the newly creates Cypress.primaryOriginCommunicator
     */
    try {
      window.top.removeEventListener('message', crossOriginOnMessageRef, false)
      crossOriginOnMessageRef = ({ data, source }) => {
        Cypress?.primaryOriginCommunicator.onMessage({ data, source })

        return undefined
      }

      window.top.addEventListener('message', crossOriginOnMessageRef, false)
    } catch (error) {
      // in cy-in-cy tests, window.top may not be accessible due to cross-origin restrictions
      if (error.name !== 'SecurityError') {
        // re-throw any error that's not a cross-origin error
        throw error
      }
    }
  }

  _runDriver (runState: RunState, testState: CachedTestState) {
    performance.mark('run-s')
    Cypress.run(testState, () => {
      performance.mark('run-e')
      performance.measure('run', 'run-s', 'run-e')
    })

    const hasActiveStudio = !!this.studioStore.testId ||
                           !!this.studioStore.newTestLineNumber

    const studioSingleTestActive = this.studioStore.newTestLineNumber != null || !!this.studioStore.testId

    this.reporterBus.emit('reporter:start', {
      startTime: Cypress.runner.getStartTime(),
      numPassed: runState.passed,
      numFailed: runState.failed,
      numPending: runState.pending,
      autoScrollingEnabled: runState.autoScrollingEnabled,
      isSpecsListOpen: runState.isSpecsListOpen,
      showFetchRequests: runState.showFetchRequests,
      scrollTop: runState.scrollTop,
      studioActive: hasActiveStudio,
      studioSingleTestActive,
      codeEditorLineWrap: runState.codeEditorLineWrap,
    } as ReporterStartInfo)
  }

  stop () {
    this.localBus.removeAllListeners()

    // Grab existing listeners for url change event, we want to preserve them
    const urlChangeListeners = this.ws.listeners('change:to:url')

    this.ws.off()
    urlChangeListeners.forEach((listener) => this.ws.on('change:to:url', listener))
  }

  async teardown (state: MobxRunnerStore, isRerun = false) {
    if (!Cypress) {
      return
    }

    state.setIsLoading(true)

    if (!isRerun) {
      // only clear test state when a new spec is selected
      Cypress.backend('reset:cached:test:state')
    }

    // when we are re-running we first need to stop cypress always
    Cypress.stop()
    // Clean up the primary communicator to prevent possible memory leaks / dangling references before the Cypress instance is destroyed.
    Cypress.primaryOriginCommunicator.removeAllListeners()
    // clean up the cross origin logs in memory to prevent dangling references as the log objects themselves at this point will no longer be needed.
    crossOriginLogs = {}
    this.studioStore.setActive(false)
    this.promptStore.resetState()
    this.specDirtyDataStore.resetDirtyState()
    await new Promise((resolve) => this.ws.emit('prompt:reset', resolve))
  }

  resetReporter () {
    return new Bluebird((resolve) => {
      this.reporterBus.once('reporter:restarted', resolve)
      this.reporterBus.emit('reporter:restart:test:run')
    })
  }

  async rerunSpec () {
    if (!this || !Cypress) {
      // if the tests have been reloaded then there is nothing to rerun
      return
    }

    this.promptStore.resetState()

    await this.resetReporter()

    // this probably isn't 100% necessary since Cypress will fall out of scope
    // but we want to be aggressive here and force GC early and often
    Cypress.removeAllListeners()

    this.localBus.emit('restart')
  }

  _interceptStudio (displayProps) {
    // Only intercept logs when Studio is actually recording a specific test
    // Don't intercept when Studio is just open in "new test" mode
    if (this.studioStore.isActive && this.studioStore.testId) {
      displayProps.hookId = this.studioStore.hookId

      if (displayProps.name === 'visit' && displayProps.state === 'failed') {
        this.studioStore.testFailed()
        this.reporterBus.emit('test:set:state', this.studioStore.testError, noop)
      }
    }

    return displayProps
  }

  emit<K extends Extract<keyof LocalBusEmitsMap, string>>(k: K, v: LocalBusEmitsMap[K]): void
  emit<K extends Extract<keyof DriverToLocalBus, string>>(k: K, v: DriverToLocalBus[K]): void
  emit<K extends Extract<keyof SocketToDriverMap, string>>(k: K, v: SocketToDriverMap[K]): void
  emit (event: string, ...args: any[]) {
    this.localBus.emit(event, ...args)
  }

  on<K extends Extract<keyof LocalBusEventMap, string>>(k: K, f: (v: LocalBusEventMap[K]) => void): void
  on<K extends Extract<keyof DriverToLocalBus, string>>(k: K, f: (v: DriverToLocalBus[K]) => void): void
  on<K extends Extract<keyof SocketToDriverMap, string>>(k: K, f: (v: SocketToDriverMap[K]) => void): void
  on (event: string, listener: (...args: any[]) => void): void
  on (event: string, listener: (...args: any[]) => void) {
    this.localBus.on(event, listener)
  }

  off (event: string, listener: (...args: any[]) => void) {
    this.localBus.off(event, listener)
  }

  removeAllListeners (event: string) {
    this.localBus.removeAllListeners(event)
  }

  notifyRunningSpec (specFile) {
    this.ws.emit('spec:changed', specFile)
  }

  notifyCrossOriginBridgeReady (origin) {
    // Any multi-origin event appends the origin as the third parameter and we do the same here for this short circuit
    Cypress.primaryOriginCommunicator.emit('bridge:ready', undefined, { origin })
  }

  snapshotUnpinned () {
    this._unpinSnapshot()
    this._hideSnapshot()
    this.reporterBus.emit('reporter:snapshot:unpinned')
  }

  _unpinSnapshot () {
    this.localBus.emit('unpin:snapshot')
  }

  _hideSnapshot () {
    this.localBus.emit('hide:snapshot')
  }

  launchBrowser (browser) {
    this.ws.emit('reload:browser', window.location.toString(), browser && browser.name)
  }

  _runFullUnloadCleanup () {
    telemetry.getSpan('cypress:app')?.end()
    this.reporterBus.emit('reporter:restart:test:run')
    this._clearAllCookies()
    this._setUnload()
  }

  // clear all the cypress specific cookies
  // whenever our app starts
  // and additional when we stop running our tests
  _clearAllCookies () {
    if (!Cypress) return

    Cypress.Cookies.clearCypressCookies()
  }

  _setUnload () {
    if (!Cypress) return

    Cypress.Cookies.setCy('unload', true)
  }

  saveState (state) {
    this.localBus.emit('save:app:state', state)
  }

  // useful for testing
  _testingOnlySetCypress (cypress: any) {
    Cypress = cypress
  }

  private addPromptListeners () {
    this.reporterBus.on('prompt:get-code', ({ testId, logId }) => {
      this.promptStore.openGetCodeModal({
        testId,
        logId,
      })
    })

    this.localBus.removeAllListeners('prompt:more-info-needed')
    this.localBus.on('prompt:more-info-needed', ({ testId, logId, onSave, onCancel }) => {
      this.promptStore.openMoreInfoNeededModal({
        testId,
        logId,
        onSave,
        onCancel,
      })
    })
  }
}
