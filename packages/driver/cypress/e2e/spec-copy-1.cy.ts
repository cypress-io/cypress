import cypress from 'cypress'

describe('Some page', function () {
  it('shows something', async function () {
    cy.visit(`http://google.com/`)

    cy.contains('somethingthatodoesNOTexist', { timeout: 200 })
  })

  it('shows something', function () {
    cy.visit(`http://google.com/`)

    cy.contains('somethingthatodoesNOTexist', { timeout: 200 })
  })

  it('shows something', async function (done) {
    cy.visit(`http://google.com/`)

    cy.contains('somethingthatodoesNOTexist', { timeout: 200 })
  })

  it('shows something', async function (done) {
    cy.on('fail', () => {
      expect(true).to.be.true
      done()
    })

    cy.visit(`http://google.com/`)

    cy.contains('somethingthatodoesNOTexist', { timeout: 200 })
  })

  it('It fails on promise but it passes', () => {
    return new Cypress.Promise((resolve, reject) => {
      Promise.reject(new Error('Error from native promise')).catch((err) => {
        reject(err)
        expect(true).to.be.false
      })
    })
  })

  it('It fails on promise but it passes', async () => {
    await new Cypress.Promise((resolve, reject) => {
      Promise.reject(new Error('Error from native promise')).catch((err) => {
        reject(err)
        expect(true).to.be.false
      })
    })
  })

  it('It fails on promise but it passes', () => {
    return new Cypress.Promise((resolve, reject) => {
      Promise.reject(new Error('Error from native promise')).catch((err) => {
        reject(err)
      })
    }).catch((err) => {
      expect(true).to.be.false
    })
  })

  it('It fails on promise but it passes', async () => {
    await new Cypress.Promise((resolve, reject) => {
      Promise.reject(new Error('Error from native promise')).catch((err) => {
        reject(err)
      })
    }).catch((err) => {
      expect(true).to.be.false
    })
  })

  const getBar = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('bar')
      }, 1000)
    })
  }

  // it.only('test', async () => {
  // //   cy.pause().debug()
  // //   const bar = await getBar()

  //   //   cy.contains(bar)
  //   cy.get('div').pause().debug().should('exist')
  // })

  it('test', () => {
    cy.contains('bar')
  })

  it('shows something', function () {
    cy.visit(`http://google.com/`)

    cy.contains('Google')
  })
})

describe.only('testIsolation', { testIsolation: 'on' }, () => {
  it('try it', () => {
    cy.session('login', () => {
      cy.window().then((win) => {
        return win.open('/fixtures/dom.html', '_self')
      })

      cy.contains('Google')
    })
  })
})
