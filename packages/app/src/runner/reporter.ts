import { getMobxRunnerStore, MobxRunnerStore, useSpecStore } from '../store'
import { getReporterElement } from './utils'
import { getEventManager } from '.'
import type { EventManager } from './event-manager'
import { useRunnerUiStore } from '../store/runner-ui-store'

let hasInitializeReporter = false
let reactDomRoot: any = null

function setInitializedReporter (val: boolean) {
  hasInitializeReporter = val
}

let reporterFrame: HTMLIFrameElement | null = null

export function unmountReporter () {
  if (reactDomRoot) {
    reactDomRoot.unmount()
    reactDomRoot = null
  }

  if (reporterFrame) {
    reporterFrame.remove()
    reporterFrame = null
  }
}

async function resetReporter () {
  if (hasInitializeReporter) {
    await getEventManager().resetReporter()
  }
}

function setupReporter () {
  const $reporterRoot = getReporterElement()

  if (hasInitializeReporter || !$reporterRoot) return

  renderReporter($reporterRoot, getMobxRunnerStore(), getEventManager())

  hasInitializeReporter = true
}

function renderReporter (
  root: HTMLElement,
  store: MobxRunnerStore,
  eventManager: EventManager,
) {
  const runnerUiStore = useRunnerUiStore()
  const specsStore = useSpecStore()

  const reporter = window.UnifiedRunner.React.createElement(window.UnifiedRunner.Reporter, {
    runMode: 'single' as const,
    runner: eventManager.reporterBus,
    autoScrollingEnabled: runnerUiStore.autoScrollingEnabled,
    isSpecsListOpen: runnerUiStore.isSpecsListOpen,
    showFetchRequests: runnerUiStore.showFetchRequests,
    error: null,
    resetStatsOnSpecChange: true,
    // Studio can only be enabled for e2e testing
    studioEnabled: window.__CYPRESS_TESTING_TYPE__ === 'e2e',
    runnerStore: store,
    testFilter: specsStore.testFilter,
    codeEditorLineWrap: runnerUiStore.codeEditorLineWrap,
  })

  // [FIX-33962] Render the command-log reporter inside a same-origin iframe so its layout lives
  // in a separate document from the AUT iframe's parent document. When a heavy AUT layout (e.g. an
  // element-plus dialog with many fields and an open dropdown popper) is laid out in the SAME
  // document tree as the command log, Chromium can crash the renderer at a threshold (~10 fields).
  // A same-origin iframe isolates the reporter's layout while preserving full JS access — the
  // reporterBus EventEmitter and MobX store are passed by reference and work across same-origin
  // frames. Falls back to inline rendering if the iframe cannot be set up.
  try {
    const doc = root.ownerDocument
    const frame = doc.createElement('iframe')

    frame.id = 'reporter-frame'
    frame.title = 'Cypress Reporter'
    frame.style.cssText = 'width:100%;height:100%;border:0;display:block;background:transparent'
    root.appendChild(frame)

    const idoc = frame.contentDocument

    if (!idoc) throw new Error('reporter iframe contentDocument unavailable')

    // the reporter's styles ship as a single stylesheet (`cypress_runner.css`, added to the parent
    // head by injectBundle); clone that one link so the iframe is styled identically
    const reporterCss = doc.querySelector('link[rel="stylesheet"][href*="cypress_runner.css"]')

    if (reporterCss) idoc.head.appendChild(reporterCss.cloneNode(true))

    // carry over color scheme + theming so the iframe renders identically
    idoc.documentElement.classList.add('force-dark')
    idoc.documentElement.style.colorScheme = 'dark'
    idoc.body.style.margin = '0'
    idoc.body.style.width = '100%'

    reporterFrame = frame
    reactDomRoot = window.UnifiedRunner.ReactDOM.createRoot(idoc.body)
    reactDomRoot.render(reporter)

    return
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[reporter] iframe render failed, falling back to inline', err)
    if (reporterFrame) {
      reporterFrame.remove()
      reporterFrame = null
    }
  }

  reactDomRoot = window.UnifiedRunner.ReactDOM.createRoot(root)

  reactDomRoot.render(reporter)
}

export const UnifiedReporterAPI = {
  setupReporter,
  hasInitializeReporter,
  resetReporter,
  setInitializedReporter,
}
