/*
  Events Fired From Navigation:

  | navigation phase  | interactive | complete | beforeunload | load | 1st iframe load |
  |-------------------|-------------|----------|--------------|------|-----------------|
  | loading (M76)     | x           | 1 (sync) | x            | x    | x               |
  | loading (M75)     | 1           | 2        | x            | x    | x               |
  | interactive (M76) | 1           | 3 (sync) | 2 (sync)     | x    | x               |
  | interactive (M75) | 1           | 2        | 3            | x    | x               |
  | complete (M76)    | 1           | 2        | 3 (sync)     | x    | x               |
  | complete (M75)    | 1           | 2        | 3            | x    | x               |
  | load (M76)        | 1           | 2        | 3 (sync)     | 4    | 5               |
  | load (M75)        | 1           | 2        | 5            | 3    | 4               |
  | meta              | 1           | 2        | 5            | 3    | 4               |
*/

const { _ } = Cypress

let navigationEvents

const onNavigationStateChanges = (cb, url) => {
  if (_.isFunction(url)) {
    // reverse the args correctly
    return onNavigationStateChanges(url, cb)
  }

  cy.visit(url || '/fixtures/navigation-events.html', {
    onBeforeLoad (win) {
      const pushAndCall = ({ type }) => {
        const { stack } = new Error()

        // this is a synchronous call if pushAndCall
        // frame is in the stack more than once
        const isSync = _.count(stack, 'pushAndCall') >= 2

        // if readystatechange event then use the actual
        // readyState property, else use the event type
        const eventName = type === 'readystatechange' ? win.document.readyState : type

        // don't push the loading readyState value
        // into navigation events since its the default
        // and would shift all the numbers incorrectly
        // from our nice markdown table above ^^
        if (eventName !== 'loading') {
          navigationEvents.push({
            eventName,
            isSync,
          })
        }

        cb(eventName, win)
      }

      win.document.onreadystatechange = pushAndCall
      win.onbeforeunload = pushAndCall
      win.onload = pushAndCall

      // kickoff the callback with the first readyState value
      // else it will not ever get called
      pushAndCall({ type: 'readystatechange' })
    },
  })
}

const runIf = (boolean, title, fn) => {
  const itOrSkip = boolean ? it : it.skip

  return itOrSkip(title, fn)
}

const chromeBrowserGteVersion76 = Cypress.browser.majorVersion >= 76
const chromeBrowserLteVersion75 = Cypress.browser.majorVersion <= 75

// https://github.com/cypress-io/cypress/issues/4973
describe('e2e/navigation events', () => {
  beforeEach(() => {
    navigationEvents = []
  })

  context('during the loading phase', () => {
    runIf(chromeBrowserGteVersion76, 'M76 fires complete (sync)', () => {
      const expectedEvents = [
        { eventName: 'complete', isSync: true },
      ]

      // 1. initial visit,
      // 2. win.location.href = '...'
      const onBeforeLoad = cy.stub()

      cy.on('window:before:load', onBeforeLoad)

      onNavigationStateChanges((eventName, win) => {
        if (eventName === 'loading') {
          // this should immediately trigger
          // the complete readyState synchronously
          win.location.href = '/timeout?ms=0'

          expect(navigationEvents).to.deep.eq(expectedEvents)
        }
      })

      cy
      .url().should('include', '/timeout?ms=0')
      .then(() => {
        expect(navigationEvents).to.deep.eq(expectedEvents)

        expect(onBeforeLoad).to.be.calledTwice
      })
    })

    runIf(chromeBrowserLteVersion75, 'M75 fires interactive / complete', () => {
      const expectedEvents = [
        { eventName: 'interactive', isSync: false },
        { eventName: 'complete', isSync: false },
      ]

      // 1. initial visit,
      // 2. win.location.href = '...'
      const onBeforeLoad = cy.stub()

      cy.on('window:before:load', onBeforeLoad)

      onNavigationStateChanges((eventName, win) => {
        if (eventName === 'loading') {
          // this should lazily trigger
          // the interactive and complete
          // readyState asynchronously
          win.location.href = '/timeout?ms=0'

          expect(navigationEvents).to.be.empty
        }
      })

      cy
      .url().should('include', '/timeout?ms=0')
      .then(() => {
        expect(navigationEvents).to.deep.eq(expectedEvents)

        expect(onBeforeLoad).to.be.calledTwice
      })
    })
  })

  context('during the interactive phase', () => {
    runIf(chromeBrowserGteVersion76, 'M76 fires interactive / beforeunload (sync) / complete (sync)', () => {
      const expectedEvents = [
        { eventName: 'interactive', isSync: false },
        { eventName: 'beforeunload', isSync: true },
        { eventName: 'complete', isSync: true },
      ]

      onNavigationStateChanges((navigationEvent, win) => {
        if (navigationEvent === 'interactive') {
          // this should immediately trigger
          // the beforeunload + complete readyState
          // synchronously
          win.location.href = '/timeout?ms=0'

          expect(navigationEvents).to.deep.eq(expectedEvents)
        }
      })

      cy
      .url().should('include', '/timeout?ms=0')
      .then(() => {
        expect(navigationEvents).to.deep.eq(expectedEvents)
      })
    })

    runIf(chromeBrowserLteVersion75, 'M75 fires interactive / complete / beforeunload', () => {
      const expectedEvents = [
        { eventName: 'interactive', isSync: false },
        { eventName: 'complete', isSync: false },
        { eventName: 'beforeunload', isSync: false },
      ]

      onNavigationStateChanges((navigationEvent, win) => {
        if (navigationEvent === 'interactive') {
          // this should lazily trigger the
          // interactive, complete, and beforeunload
          // readyState asynchronously
          win.location.href = '/timeout?ms=0'

          expect(navigationEvents).to.deep.eq(_.take(expectedEvents, 1))
        }
      })

      cy
      .url().should('include', '/timeout?ms=0')
      .then(() => {
        expect(navigationEvents).to.deep.eq(expectedEvents)
      })
    })
  })

  context('during the complete phase', () => {
    runIf(chromeBrowserGteVersion76, 'M76 fires interactive / complete / beforeunload (sync)', () => {
      const expectedEvents = [
        { eventName: 'interactive', isSync: false },
        { eventName: 'complete', isSync: false },
        { eventName: 'beforeunload', isSync: true },
      ]

      onNavigationStateChanges((navigationEvent, win) => {
        if (navigationEvent === 'complete') {
          // this should immediately trigger
          // the beforeunload + complete readyState
          // synchronously
          win.location.href = '/timeout?ms=0'

          expect(navigationEvents).to.deep.eq(expectedEvents)
        }
      })

      cy
      .url().should('include', '/timeout?ms=0')
      .then(() => {
        expect(navigationEvents).to.deep.eq(expectedEvents)
      })
    })

    runIf(chromeBrowserLteVersion75, 'M75 fires interactive / complete / beforeunload', () => {
      const expectedEvents = [
        { eventName: 'interactive', isSync: false },
        { eventName: 'complete', isSync: false },
        { eventName: 'beforeunload', isSync: false },
      ]

      onNavigationStateChanges((navigationEvent, win) => {
        if (navigationEvent === 'complete') {
          // this should lazily trigger the
          // interactive, complete, and beforeunload
          // readyState asynchronously
          win.location.href = '/timeout?ms=0'

          expect(navigationEvents).to.deep.eq(_.take(expectedEvents, 2))
        }
      })

      cy
      .url().should('include', '/timeout?ms=0')
      .then(() => {
        expect(navigationEvents).to.deep.eq(expectedEvents)
      })
    })
  })

  context('during the load phase', () => {
    runIf(chromeBrowserGteVersion76, 'M76 fires interactive / complete / load / beforeunload (sync)', () => {
      const expectedEvents = [
        { eventName: 'interactive', isSync: false },
        { eventName: 'complete', isSync: false },
        { eventName: 'load', isSync: false },
        { eventName: 'beforeunload', isSync: true },
      ]

      onNavigationStateChanges((navigationEvent, win) => {
        if (navigationEvent === 'load') {
          // this should immediately trigger
          // the beforeunload event synchronously
          win.location.href = '/timeout?ms=0'

          // no load event yet since its async
          expect(navigationEvents).to.deep.eq(expectedEvents)
        }
      })

      cy
      .url().should('include', '/timeout?ms=0')
      .then(() => {
        expect(navigationEvents).to.deep.eq(expectedEvents)
      })
    })

    runIf(chromeBrowserLteVersion75, 'M75 fires interactive / complete / load / beforeunload', () => {
      const expectedEvents = [
        { eventName: 'interactive', isSync: false },
        { eventName: 'complete', isSync: false },
        { eventName: 'load', isSync: false },
        { eventName: 'beforeunload', isSync: false },
      ]

      onNavigationStateChanges((navigationEvent, win) => {
        if (navigationEvent === 'load') {
          win.location.href = '/timeout?ms=0'

          // no beforeunload event yet since its async
          expect(navigationEvents).to.deep.eq(_.take(expectedEvents, 3))
        }
      })

      cy
      .url().should('include', '/timeout?ms=0')
      .then(() => {
        expect(navigationEvents).to.deep.eq(expectedEvents)
      })
    })
  })

  context('during the meta redirect phase', () => {
    it('fires interactive / complete / load / beforeunload', () => {
      const expectedEvents = [
        { eventName: 'interactive', isSync: false },
        { eventName: 'complete', isSync: false },
        { eventName: 'load', isSync: false },
        { eventName: 'beforeunload', isSync: false },
      ]

      onNavigationStateChanges('/fixtures/meta-redirect.html', (navigationEvent, win) => {
        if (navigationEvent === 'load') {
          // no beforeunload event yet since its async
          expect(navigationEvents).to.deep.eq(expectedEvents.slice(0, 3))
        }
      })

      cy
      .url().should('include', '/fixtures/generic.html')
      .then(() => {
        expect(navigationEvents).to.deep.eq(expectedEvents)
      })
    })
  })
})
