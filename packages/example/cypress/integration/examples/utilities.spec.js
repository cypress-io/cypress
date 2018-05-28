/// <reference types="Cypress" />

context('Utilities', () => {
  beforeEach(() => {
    cy.visit('https://example.cypress.io/utilities')
  })

  it('Cypress._ - call a lodash method', () => {
    // https://on.cypress.io/_
    cy.request('https://jsonplaceholder.typicode.com/users')
      .then((response) => {
        let ids = Cypress._.chain(response.body).map('id').take(3).value()

        expect(ids).to.deep.eq([1, 2, 3])
      })
  })

  it('Cypress.$ - call a jQuery method', () => {
    // https://on.cypress.io/$
    let $li = Cypress.$('.utility-jquery li:first')

    cy.wrap($li)
      .should('not.have.class', 'active')
      .click()
      .should('have.class', 'active')
  })

  it('Cypress.Blob - blob utilities and base64 string conversion', () => {
    // https://on.cypress.io/blob
    cy.get('.utility-blob').then(($div) =>
    // https://github.com/nolanlawson/blob-util#imgSrcToDataURL
    // get the dataUrl string for the javascript-logo
      Cypress.Blob.imgSrcToDataURL('https://example.cypress.io/assets/img/javascript-logo.png', undefined, 'anonymous')
      .then((dataUrl) => {
        // create an <img> element and set its src to the dataUrl
        let img = Cypress.$('<img />', { src: dataUrl })
        // need to explicitly return cy here since we are initially returning
        // the Cypress.Blob.imgSrcToDataURL promise to our test
        // append the image
        $div.append(img)

        cy.get('.utility-blob img').click()
          .should('have.attr', 'src', dataUrl)
      }))
  })

  it('Cypress.minimatch - test out glob patterns against strings', () => {
    // https://on.cypress.io/minimatch
    Cypress.minimatch('/users/1/comments', '/users/*/comments', {
      matchBase: true,
    })
  })


  it('Cypress.moment() - format or parse dates using a moment method', () => {
    // https://on.cypress.io/moment
    let time = Cypress.moment().utc('2014-04-25T19:38:53.196Z').format('h:mm A')

    cy.get('.utility-moment').contains('3:38 PM')
      .should('have.class', 'badge')
  })


  it('Cypress.Promise - instantiate a bluebird promise', () => {
    // https://on.cypress.io/promise
    let waited = false

    function waitOneSecond () {
      // return a promise that resolves after 1 second
      return new Cypress.Promise((resolve, reject) => {
        setTimeout(() => {
          // set waited to true
          waited = true

          // resolve with 'foo' string
          resolve('foo')
        }, 1000)
      })
    }

    cy.then(() =>
    // return a promise to cy.then() that
    // is awaited until it resolves
      waitOneSecond().then((str) => {
        expect(str).to.eq('foo')
        expect(waited).to.be.true
      }))
  })
})
