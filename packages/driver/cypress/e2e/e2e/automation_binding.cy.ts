import { encode } from '@packages/socket/browser/utils'

const namespace = '/__socket/default'
const bindingName = `cypressSendToServer-${namespace}`

const getBinding = (win: Window): ((payload: string) => void) | undefined => Reflect.get(win, bindingName)

const savePacket = (sessionId: string): Cypress.Chainable<string> => {
  return cy.wrap(encode(['backend:request', 'automation-binding-spec', ['save:session', { id: sessionId }]], namespace)).then(JSON.stringify)
}

const expectSessionSaved = (sessionId: string, saved: boolean) => {
  cy.wrap(null).then(() => {
    return Cypress.backend('get:session', sessionId).then(() => true, () => false)
  }).should('eq', saved)
}

// skip Firefox since it talks to the server over socket.io rather than an automation binding
describe('automation binding', { browser: '!firefox' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/generic.html')
  })

  it('accepts calls from the runner\'s top window', () => {
    const sessionId = `top-${Date.now()}`

    savePacket(sessionId).then((packet) => {
      getBinding(window.top!)!(packet)
    })

    expectSessionSaved(sessionId, true)
  })

  it('ignores calls from the AUT frame', () => {
    const sessionId = `aut-${Date.now()}`

    savePacket(sessionId).then((packet) => {
      cy.window().then((win) => {
        expect(getBinding(win)).to.be.a('function')

        getBinding(win)!(packet)
      })
    })

    expectSessionSaved(sessionId, false)
  })

  it('ignores calls from a cross-origin iframe', () => {
    const sessionId = `cross-origin-${Date.now()}`

    savePacket(sessionId).then((packet) => {
      return cy.document().then((doc) => {
        const iframe = doc.createElement('iframe')
        const params = new URLSearchParams({ bindingName, packet })

        iframe.src = `http://www.foobar.com:3500/fixtures/automation-binding-caller.html?${params}`

        return new Promise<{ hasBinding: boolean }>((resolve) => {
          doc.defaultView!.addEventListener('message', (event) => {
            if (event.source === iframe.contentWindow) resolve(event.data)
          })

          doc.body.appendChild(iframe)
        })
      })
    }).its('hasBinding').should('be.true')

    expectSessionSaved(sessionId, false)
  })
})
