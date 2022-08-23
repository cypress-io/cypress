top.count = top.count || 0

const expectCurrentSessionData = (obj) => {
  cy.then(() => {
    return Cypress.session.getCurrentSessionData()
    .then((result) => {
      console.log(obj)
      console.log(result)
      // expect(result.cookies.map((v) => ({ domain: v.domain, name: v.name }))).to.deep.members(obj.cookies || [])
      expect(result.localStorage).deep.members(obj.localStorage || [])
      expect(result.sessionStorage).deep.members(obj.sessionStorage || [])
    })
  })
}

describe('persist saved sessions between spec reruns', () => {
  it('sets session', () => {
    cy.wait(25000)
    cy.session('persist_session', () => {
      cy.setCookie('cookieName', 'cookieValue')
    })

    cy.session('persist_global_session', () => {
      cy.visit('https://localhost:4466/cross_origin_iframe/cookies')
      cy.setCookie('cookieName', 'cookieValue')
    }, {
      cacheAcrossSpecs: true,
    })

    // cy.visit('https://localhost:4466/form')
    // cy.contains('form')

    // expectCurrentSessionData({
    //   cookies: [{
    //     domain: 'localhost',
    //     name: 'cookieName',
    //   },
    //   {
    //     domain: '127.0.0.1',
    //     name: '/set-localStorage/cookies',
    //   },
    //   {
    //     domain: 'localhost',
    //     name: '/cross_origin_iframe/cookies',
    //   },
    //   {
    //     domain: 'localhost',
    //     name: '/form',
    //   }],
    //   localStorage: [
    //     { origin: 'https://127.0.0.1:44665', value: { name: 'cookies' } },
    //   ],
    // })

    if (!top.count) {
      cy.wait(4000)

      return cy.wrap(null).should(() => {
        expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('created')
        expect(cy.$$('.commands-container li.command:nth-child(2)', top.document).text()).contain('created')
        top.count++

        // this simulates interactive/open mode
        // so that the run does not complete until after reload
        Cypress.config().isTextTerminal = false
        Cypress.config().isInteractive = true

        // this simulates user clicking the stop and reload button
        // in the browser reporter gui
        cy.$$('button.stop', top.document)[0].click()
        cy.$$('button.restart', top.document)[0].click()
      })
    }

    cy.$$('.runnable-active', top.document)[0].click()

    cy.wrap(null).should(() => {
      expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('restored')
      expect(cy.$$('.commands-container li.command:nth-child(2)', top.document).text()).contain('restored')
    })
  })
})
