/* eslint-disable no-undef */
let count = 0
const { action } = Cypress

Cypress.action = function (str) {
  if (str === 'app:window:before:load') {
    count += 1
  }

  return action.apply(this, arguments)
}

const ensureWeCanTalkToTheIframe = function ($iframe) {
  const h1 = $iframe.contents().find('h1')

  expect(h1.length).to.eq(1)

  expect($iframe.get(0).contentWindow.foo).to.eq('bar')

  // onBeforeLoad should only be called once
  // on the initial visit and not for the iframe
  //
  // the reason this number is still 1 instead of 2
  // is that when we visit back to <root> cypress will
  // reload this spec thus nuking the state
  expect(count).to.eq(1)
}

describe('iframes', () => {
  it('can snapshot iframes which arent loaded', () => {
    // snapshotting after the click should insert
    // an iframe which isnt yet loaded so when we
    // snapshot the h1 we ensure it doesnt fail
    cy.visit('http://www.foo.com:1616/insert_iframe')
    cy.get('button').click()
    cy.get('iframe')
  })

  it('can access nested iframes over http server', () => {
    cy.visit('http://localhost:1616')
    cy.get('iframe').then(ensureWeCanTalkToTheIframe)
  })

  it('can access iframes over file server', () => {
    cy.visit('/outer.html')
    cy.get('iframe').then(ensureWeCanTalkToTheIframe)
  })

  it('does not throw on cross origin iframes', () => {
    cy.visit('http://www.foo.com:1616/cross')
    cy.get('iframe')
  })

  it('continues to inject even on 5xx responses', () => {
    cy.visit('http://localhost:1616/500')
    cy.get('iframe').then(ensureWeCanTalkToTheIframe)
  })

  it('injects on file server 4xx errors', () => {
    cy.visit('/outer_404.html')
    cy.get('iframe').then(($iframe) => {
      const br = $iframe.contents().find('br')

      expect(br.length).to.eq(4)

      expect(count).to.eq(1)
    })

    cy.get('a').click()
    cy.get('body').then(($body) => {
      expect($body).to.contain('Cypress errored trying to serve this file')
      expect($body).to.contain('page/does-not-exist')

      expect($body).to.contain('The file was not found.')
    })
  })

  it('does not inject into xhrs', () => {
    cy.visit('http://localhost:1616/')
    cy.window().then((win) => {
      return new Cypress.Promise((resolve) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('GET', '/iframe')
        xhr.onload = () => {
          return resolve(xhr.responseText)
        }

        return xhr.send()
      })
    }).then((response) => {
      expect(response).not.to.include('document.domain')
    })
  })
})
