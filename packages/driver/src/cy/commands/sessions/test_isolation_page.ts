// Commands that cannot reach the app frame's window or document. Any other
// command, including every custom command, may have changed what the next
// test would see, so it marks the page as touched.
const COMMANDS_THAT_LEAVE_THE_APP_FRAME_ALONE = new Set([
  'request',
  'task',
  'fixture',
  'wrap',
  'log',
  'then',
  'wait',
  'should',
  'and',
  'as',
  'intercept',
  'getCookie',
  'getCookies',
  'getAllCookies',
  'setCookie',
  'clearCookie',
  'clearCookies',
  'clearAllCookies',
])

/**
 * Tracks whether the test-isolation blank page in the app frame is exactly as
 * the runner wrote it, so the navigation to about:blank between tests can be
 * skipped when it would recreate an identical page.
 *
 * Navigating creates a fresh document and window, which is what discards DOM,
 * globals, listeners and timers from the previous test. Skipping it is only
 * safe while nothing could have touched the page: the same document is still
 * loaded, nothing mutated it, and only commands on the allowlist above ran.
 */
export class TestIsolationPage {
  private document: Document | undefined
  private observer: MutationObserver | undefined
  private touched = true

  constructor (Cypress: Cypress.Cypress, private cy: Cypress.Cypress['cy']) {
    Cypress.on('command:enqueued', ({ name }) => {
      if (!COMMANDS_THAT_LEAVE_THE_APP_FRAME_ALONE.has(name)) {
        this.touched = true
      }
    })
  }

  /**
   * Call once the app frame has navigated to about:blank for test isolation.
   */
  async recordBlankPage () {
    this.forget()

    // The runner writes the blank page from its own `load` listener on the app
    // frame, which can run after the one that resolved our navigation. All
    // listeners for one event run within a single task, so the page is written
    // by the time the next task starts. A message channel queues that task
    // without the throttling some browsers apply to timers in hidden windows.
    await new Promise<void>((resolve) => {
      const { port1, port2 } = new MessageChannel()

      port1.onmessage = () => {
        port1.close()
        resolve()
      }

      port2.postMessage(null)
    })

    const doc = this.currentDocument()

    if (!doc || doc.location.href !== 'about:blank' || !doc.body?.childElementCount) {
      return
    }

    // Anything Cypress itself renders into the blank page, such as a native
    // view of API responses, also counts as a mutation here and forces a full
    // reset. A feature like that has to render outside this document or
    // record the page again once it has rendered.
    this.observer = new MutationObserver(() => {
      this.touched = true
    })

    this.observer.observe(doc, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    })

    this.document = doc
    this.touched = false
  }

  isUntouched () {
    if (!this.document || !this.observer || this.touched) {
      return false
    }

    // Mutation records are delivered asynchronously, so collect any pending ones now.
    if (this.observer.takeRecords().length) {
      this.touched = true

      return false
    }

    return this.currentDocument() === this.document && this.cy.state('document') === this.document
  }

  forget () {
    this.observer?.disconnect()
    this.observer = undefined
    this.document = undefined
    this.touched = true
  }

  private currentDocument (): Document | undefined {
    try {
      return this.cy.state('$autIframe')?.[0]?.contentDocument ?? undefined
    } catch {
      return undefined
    }
  }
}
