import { REPORTER_FRAME_NAME } from '@packages/types'
import { getMobxRunnerStore, MobxRunnerStore, useSpecStore } from '../store'
import { getReporterElement, REPORTER_ID } from './utils'
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

  // Render the reporter inside a same-origin iframe so its layout lives in a
  // separate document from the AUT iframe's parent document. When an AUT reflow
  // (e.g. a ResizeObserver loop) and the live reporter tree share one document,
  // Chromium can crash the renderer process.
  const doc = root.ownerDocument
  const frame = doc.createElement('iframe')

  frame.id = 'reporter-frame'
  frame.title = REPORTER_FRAME_NAME
  frame.name = REPORTER_FRAME_NAME
  // hidden until the cloned stylesheets load so the reporter is never shown
  // (or interacted with) unstyled
  frame.style.cssText = 'width:100%;height:100%;border:0;display:block;background:transparent;visibility:hidden'
  root.appendChild(frame)
  reporterFrame = frame

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
      // cloneNode copies the raw href attribute, so a relative href (e.g.
      // Vite's `./assets/*.css`) would resolve against the iframe's
      // about:blank base and silently fail to load — leaving the reporter
      // without the app's stylesheet. Assign the resolved absolute URL.
      (clone as HTMLLinkElement).href = (node as HTMLLinkElement).href
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
  // the reporter's width at Tailwind's breakpoints
  const styleOverrides = idoc.createElement('style')

  styleOverrides.textContent = '.reporter .container { max-width: none; }'
  idoc.head.appendChild(styleOverrides)

  idoc.documentElement.className = doc.documentElement.className
  idoc.documentElement.classList.add('force-dark')
  idoc.documentElement.style.colorScheme = 'dark'
  idoc.documentElement.style.height = '100%'
  idoc.body.style.margin = '0'
  idoc.body.style.width = '100%'
  idoc.body.style.height = '100%'

  // Mount into a dedicated container rather than <body>: React warns that
  // creating a root on document.body leads to reconciliation issues because
  // other code mutates body's children, which manifests as unstable reporter
  // rendering. Mirror the inline layout by reusing the reporter root id.
  const mountElement = idoc.createElement('div')

  mountElement.id = REPORTER_ID
  mountElement.style.height = '100%'
  idoc.body.appendChild(mountElement)

  // reporter code that binds document-level listeners or portals DOM nodes
  // (keyboard shortcuts, tooltips, popovers) must target the iframe document
  window.UnifiedRunner.setReporterDocument(idoc)

  // mount synchronously so the reporter's event listeners are registered
  // before any driver events or resetReporter round-trips can fire; the
  // frame is only revealed once its stylesheets have loaded, with a timeout
  // so a stylesheet that never resolves cannot leave the reporter hidden
  reactDomRoot = window.UnifiedRunner.ReactDOM.createRoot(mountElement)
  reactDomRoot.render(reporter)

  const revealTimeout = new Promise<void>((resolve) => setTimeout(resolve, 2000))

  Promise.race([Promise.all(pendingStylesheets), revealTimeout]).then(() => {
    frame.style.visibility = ''
  })
}

export const UnifiedReporterAPI = {
  setupReporter,
  hasInitializeReporter,
  resetReporter,
  setInitializedReporter,
}
