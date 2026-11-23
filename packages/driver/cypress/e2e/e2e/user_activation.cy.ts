import { getAutInput } from '../../support/utils'

declare global {
  interface Window {
    // set by fixtures/user-activation.html
    observedEvents: string[]
    isFirstPage?: boolean
  }
}

// https://github.com/cypress-io/cypress/issues/34993
describe('user activation', { browser: '!webkit' }, () => {
  const expectActivation = (win: Window, hasBeenActive: boolean) => {
    expect(win.navigator.userActivation.hasBeenActive, 'navigator.userActivation.hasBeenActive').to.equal(hasBeenActive)
  }

  it('activates the AUT by the time cy.visit() resolves', () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => expectActivation(win, true))
  })

  it('activates the AUT before window:load handlers run', () => {
    cy.visit('/fixtures/user-activation.html', {
      onLoad: (win) => expectActivation(win, true),
    })
  })

  it('does not fire input or focus events in the AUT', () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => {
      expectActivation(win, true)
      expect(win.observedEvents).to.deep.equal([])
      expect(win.document.activeElement).to.equal(win.document.body)
    })
  })

  it('activates the AUT after cy.reload()', () => {
    cy.visit('/fixtures/user-activation.html')
    cy.reload()
    cy.window().then((win) => expectActivation(win, true))
  })

  it('activates a document the AUT navigates to', () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => {
      // marks this document, so the check below is sure to run on the one the AUT navigates to
      win.isFirstPage = true
    })

    cy.get('#next-page').click()
    cy.location('search').should('equal', '?page=2')
    cy.window().then((win) => {
      expect(win.isFirstPage).to.be.undefined
      expectActivation(win, true)
    })
  })

  it('activates a cross-origin AUT after a cy.origin() navigation', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://www.foobar.com:3500', () => {
      cy.window().then((win) => {
        expect(win.navigator.userActivation.hasBeenActive, 'navigator.userActivation.hasBeenActive').to.be.true
      })
    })
  })

  it('lets activation-gated APIs work', { browser: { family: 'chromium' } }, () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => {
      expect(win.navigator.vibrate(1), 'navigator.vibrate()').to.be.true
    })
  })

  // https://github.com/cypress-io/cypress/issues/1213
  // https://github.com/cypress-io/cypress/issues/8618
  // Firefox only gets the transient activation a page load gives, which the
  // beforeEach below uses up.
  describe('transient activation', { browser: { family: 'chromium' } }, () => {
    // runs `handler` from the element's own event listener, where an application calls
    // the APIs that need transient activation, and collects what it returns or resolves to
    const handle = <T>(selector: string, eventName: string, handler: (win: Window) => T | Promise<T>) => {
      const results: T[] = []

      cy.window().then((win) => {
        win.document.querySelector(selector)!.addEventListener(eventName, async () => {
          results.push(await handler(win))
        })
      })

      return results
    }

    const settle = (promise: Promise<unknown>) => promise.then(() => 'resolved', (err) => `${err.name}: ${err.message}`)

    beforeEach(() => {
      cy.visit('/fixtures/user-activation.html')

      // uses up the transient activation the page load gave, so only the command
      // under test can give it
      cy.window().then((win) => {
        getAutInput(win.document, '#date').showPicker()
        expect(win.navigator.userActivation.isActive, 'navigator.userActivation.isActive').to.be.false
      })
    })

    it('gives a click handler transient activation', () => {
      const isActive = handle('#button', 'click', (win) => win.navigator.userActivation.isActive)

      cy.get('#button').click()
      cy.wrap(isActive).should('deep.equal', [true])
    })

    it('gives a keydown handler transient activation', () => {
      const isActive = handle('#text', 'keydown', (win) => win.navigator.userActivation.isActive)

      cy.get('#text').type('a')
      cy.wrap(isActive).should('deep.equal', [true])
    })

    it('gives a keydown handler transient activation when typing into the body', () => {
      const isActive = handle('body', 'keydown', (win) => win.navigator.userActivation.isActive)

      // typing into the body skips the actionability check that renews activation for other elements
      cy.get('body').type('f')
      cy.wrap(isActive).should('deep.equal', [true])
    })

    it('renews transient activation a keydown handler used up before the next key', () => {
      const shown = handle('#text', 'keydown', (win) => {
        getAutInput(win.document, '#date').showPicker()

        return win.navigator.userActivation.isActive
      })

      cy.get('#text').type('ab')
      cy.wrap(shown).should('deep.equal', [false, false])
    })

    it('keeps transient activation through a .type() that outlasts it', () => {
      const isActive = handle('#text', 'keydown', (win) => win.navigator.userActivation.isActive)

      // takes longer than the few seconds one activation lasts
      cy.get('#text').type('a'.repeat(300), { delay: 20 })
      cy.wrap(isActive).should('have.length', 300).and('not.include', false)
    })

    it('renews transient activation an earlier click used up', () => {
      const shown = handle('#button', 'click', (win) => {
        getAutInput(win.document, '#date').showPicker()

        return win.navigator.userActivation.isActive
      })

      cy.get('#button').click()
      cy.get('#button').click()

      // showPicker() uses up transient activation, and throws without it
      cy.wrap(shown).should('deep.equal', [false, false])
    })

    it('gives a click a fresh transient activation for a handler that awaits something', () => {
      const isActive = handle('#button', 'click', async (win) => {
        // stands in for an app that awaits a request before calling an API that needs activation
        await new Promise((resolve) => setTimeout(resolve, 3000))

        return win.navigator.userActivation.isActive
      })

      // an earlier click activated the page, but too long ago to last through the handler
      cy.get('#text').click()
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(3000)

      cy.get('#button').click()
      cy.wrap(isActive, { timeout: 5000 }).should('deep.equal', [true])
    })

    it('lets a click handler call HTMLInputElement.showPicker()', () => {
      const errors = handle('#date', 'click', (win) => {
        try {
          getAutInput(win.document, '#date').showPicker()
        } catch (err) {
          return err.message
        }

        return null
      })

      cy.get('#date').click()
      cy.wrap(errors).should('deep.equal', [null])
    })

    it('lets a click handler enter fullscreen', { browser: { family: 'chromium' } }, () => {
      const requests = handle('#button', 'click', (win) => settle(win.document.documentElement.requestFullscreen()))

      cy.get('#button').click()
      cy.wrap(requests).its(0).should('equal', 'resolved')
      cy.document().then((doc) => doc.exitFullscreen())
    })

    it('lets a click handler write to the clipboard', { browser: { family: 'chromium' } }, () => {
      const writes = handle('#button', 'click', (win) => settle(win.navigator.clipboard.writeText('Jordan Avery')))

      cy.get('#button').click()
      cy.wrap(writes).its(0).should('equal', 'resolved')
    })

    // https://github.com/cypress-io/cypress/issues/2851
    it('lets a click handler copy and cut with document.execCommand()', { browser: { family: 'chromium' } }, () => {
      const results = handle('#button', 'click', (win) => {
        const text = getAutInput(win.document, '#text')

        text.select()
        const copied = win.document.execCommand('copy')

        text.setSelectionRange(0, 7)
        const cut = win.document.execCommand('cut')

        return { copied, cut, value: text.value }
      })

      // not an action command, so only the click gives the page activation
      cy.get('#text').invoke('val', 'Jordan Avery')
      cy.get('#button').click()
      cy.wrap(results).should('deep.equal', [{ copied: true, cut: true, value: 'Avery' }])
    })

    it('lets a click handler lock the pointer', { browser: ['chrome', 'chrome-for-testing', 'edge'] }, () => {
      const locks = handle('#button', 'click', (win) => settle(Promise.resolve(win.document.body.requestPointerLock())))

      cy.get('#button').click()
      cy.wrap(locks).its(0).should('equal', 'resolved')
      cy.document().then((doc) => doc.exitPointerLock())
    })

    it('lets a click handler open Picture-in-Picture', { browser: { family: 'chromium' } }, () => {
      let video: HTMLVideoElement

      cy.document().then((doc) => {
        const canvas = doc.createElement('canvas')

        video = doc.createElement('video')

        canvas.getContext('2d')!.fillRect(0, 0, 10, 10)
        video.id = 'video'
        video.muted = true
        video.srcObject = canvas.captureStream()
        doc.body.append(video)

        return video.play()
      })

      const requests = handle('#button', 'click', () => settle(video.requestPictureInPicture()))

      cy.document().then((doc) => expect(doc.pictureInPictureElement, 'pictureInPictureElement').to.be.null)
      cy.get('#button').click()
      cy.wrap(requests).its(0).should('equal', 'resolved')
      // the AUT's own document holds the element, as it would for a real user
      cy.document().its('pictureInPictureElement').should('have.id', 'video')
      cy.document().then((doc) => doc.exitPictureInPicture())
    })

    it('gives a click handler in a cross-origin AUT transient activation', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()

      cy.origin('http://www.foobar.com:3500', () => {
        const isActive: boolean[] = []

        // Lets the transient activation from the page load run out, so only the click
        // can give it. showPicker(), which would use it up sooner, throws in a
        // cross-origin frame.
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(5500)
        cy.window().then((win) => {
          win.document.body.addEventListener('click', () => isActive.push(win.navigator.userActivation.isActive))
        })

        cy.get('body').click()
        cy.wrap(isActive).should('deep.equal', [true])
      })
    })
  })

  describe('beforeunload dialogs', () => {
    const beforeUnloadLogs: Cypress.Log[] = []

    beforeEach(() => {
      beforeUnloadLogs.length = 0

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'beforeunload') {
          beforeUnloadLogs.push(log)
        }
      })
    })

    it('accepts and logs a beforeunload dialog on cy.reload()', () => {
      cy.visit('/fixtures/user-activation.html?beforeunload')
      cy.reload()
      cy.window().then((win) => expectActivation(win, true))
      cy.wrap(beforeUnloadLogs).should('have.length', 1).then(([log]) => {
        expect(log.get('message')).to.equal('accepted the "Leave site?" dialog')
        expect(log.get('event')).to.be.true
        expect(log.get('state')).to.equal('passed')
      })
    })

    it('accepts a beforeunload dialog when the AUT navigates', () => {
      cy.visit('/fixtures/user-activation.html?beforeunload')
      cy.get('#next-page').click()
      cy.location('search').should('equal', '?page=2')
      cy.wrap(beforeUnloadLogs).should('have.length', 1)
    })

    // the next test's navigation to about:blank opens this page's dialog, so if
    // Cypress didn't answer it, the next test would time out
    it('leaves a page with a beforeunload handler for the next test', () => {
      cy.visit('/fixtures/user-activation.html?beforeunload')
    })

    it('starts after the previous page asked to confirm leaving', () => {
      cy.visit('/fixtures/user-activation.html')
      cy.window().then((win) => expectActivation(win, true))
    })
  })
})
