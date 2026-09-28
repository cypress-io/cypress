import { authCreds } from '../../fixtures/auth_creds'

const run = () => {
  cy.window()
  .then({ timeout: 60000 }, (win) => {
    return new Cypress.Promise((resolve) => {
      const i = win.document.createElement('iframe')

      i.onload = resolve
      // ?foo is necessary for firefox b/c it won't load a nested
      // iframe with an identical url
      i.src = '/basic_auth?foo'

      return win.document.body.appendChild(i)
    })
  })
  .get('iframe').should(($iframe) => {
    expect($iframe.contents().text()).to.include('basic auth worked')
  })
  .window().then({ timeout: 60000 }, (win) => {
    return new Cypress.Promise<Cypress.AUTWindow>(((resolve, reject) => {
      const xhr = new win.XMLHttpRequest()

      xhr.open('GET', '/basic_auth')
      xhr.onload = function () {
        try {
          expect(this.responseText).to.include('basic auth worked')

          return resolve(win)
        } catch (err) {
          return reject(err)
        }
      }

      return xhr.send()
    }))
  })
  .then({ timeout: 60000 }, (win) => {
    return new Cypress.Promise<Cypress.AUTWindow>(((resolve, reject) => {
      // ensure other origins do not have auth headers attached
      const xhr = new win.XMLHttpRequest()

      xhr.open('GET', 'http://localhost:3501/basic_auth')
      xhr.onload = function () {
        try {
          expect(this.status).to.eq(401)

          return resolve(win)
        } catch (err) {
          return reject(err)
        }
      }

      return xhr.send()
    }))
  })
}

// https://github.com/cypress-io/cypress/issues/573
describe('basic auth', () => {
  it('can visit with username/pw in url', () => {
    cy.visit(`http://${authCreds.username}:${authCreds.password}@localhost:3500/basic_auth`)

    run()
  })

  it('can visit with auth options', () => {
    cy.visit('http://localhost:3500/basic_auth', {
      auth: authCreds,
    })

    run()
  })
})
