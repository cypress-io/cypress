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
    window.UnifiedRunner.setReporterDocument(document)
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

  // Render the command log inside a same-origin iframe so its layout lives in a
  // separate document from the AUT iframe's parent document. When a heavy AUT
  // reflow (e.g. a ResizeObserver loop) and the live command-log tree share one
  // document, Chromium can crash the renderer process. Weaker isolation (Shadow
  // DOM, CSS containment) does not prevent the crash — only a separate document
  // does. The reporterBus EventEmitter and MobX store are passed by reference
  // and work across same-origin frames. Falls back to inline rendering if the
  // iframe cannot be set up.
  try {
    const doc = root.ownerDocument
    const frame = doc.createElement('iframe')

    frame.id = 'reporter-frame'
    frame.title = 'Cypress Reporter'
    frame.style.cssText = 'width:100%;height:100%;border:0;display:block;background:transparent'
    root.appendChild(frame)

    const idoc = frame.contentDocument

    if (!idoc) throw new Error('reporter iframe contentDocument unavailable')

    // clone the parent document's stylesheets (the reporter's own styles from
    // `cypress_runner.css` plus app-level resets like the Tailwind preflight)
    // and root classes so the reporter is styled exactly as it is when
    // rendered inline
    const pendingStylesheets: Promise<void>[] = []

    doc.querySelectorAll('head link[rel="stylesheet"], head style').forEach((node) => {
      const clone = node.cloneNode(true) as HTMLElement

      if (clone.tagName === 'LINK') {
        pendingStylesheets.push(new Promise((resolve) => {
          clone.addEventListener('load', () => resolve())
          clone.addEventListener('error', () => resolve())
        }))
      }

      idoc.head.appendChild(clone)
    })

    // Tailwind's responsive `.container` component (cloned along with the
    // app's stylesheets) collides with the reporter's `.container` element;
    // its media queries resolve against the narrow iframe viewport and clamp
    // the command log's width at Tailwind's breakpoints
    const styleOverrides = idoc.createElement('style')

    styleOverrides.textContent = '.reporter .container { max-width: none; }'
    idoc.head.appendChild(styleOverrides)

    idoc.documentElement.className = doc.documentElement.className
    idoc.documentElement.classList.add('force-dark')
    idoc.documentElement.style.colorScheme = 'dark'
    idoc.body.style.margin = '0'
    idoc.body.style.width = '100%'

    // reporter code that binds document-level listeners or portals DOM nodes
    // (keyboard shortcuts, tooltips, popovers) must target the iframe document
    window.UnifiedRunner.setReporterDocument(idoc)

    reporterFrame = frame

    const reactRoot = window.UnifiedRunner.ReactDOM.createRoot(idoc.body)

    reactDomRoot = reactRoot

    // mount only once the stylesheets have loaded so the reporter never lays
    // out (or receives interactions) unstyled
    Promise.all(pendingStylesheets).then(() => {
      // a spec navigation may have unmounted this reporter while styles loaded
      if (reactDomRoot === reactRoot) {
        reactRoot.render(reporter)
      }
    })

    return
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[reporter] iframe render failed, falling back to inline', err)
    if (reporterFrame) {
      reporterFrame.remove()
      reporterFrame = null
    }

    window.UnifiedRunner.setReporterDocument(document)
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
