// additional tests that confirm types are done correctly
// these tests are in addition to type checking cypress-example-kitchensink
// (https://github.com/cypress-io/cypress-example-kitchensink)
// and should not repeat them

// extra code that is not in the kitchensink that type checks edge cases
cy.wrap('foo').then(subject => {
  subject // $ExpectType string
  return cy.wrap(subject)
}).then(subject => {
  subject // $ExpectType string
})

const result = Cypress.minimatch('/users/1/comments', '/users/*/comments', {
  matchBase: true,
})
result // $ExpectType boolean

Cypress.minimatch('/users/1/comments', '/users/*/comments') // $ExpectType boolean

cy.visit('https://www.acme.com/', {
  auth: {
    username: 'wile',
    password: 'coyote'
  }
})

Cypress.spec.name // $ExpectType string
Cypress.spec.relative // $ExpectType string
Cypress.spec.absolute // $ExpectType string

Cypress.browser // $ExpectType Browser

// stubbing window.alert type on "Cypress" should
// work with plain function or with a Sinon stub
Cypress.on('window:alert', () => { })
Cypress.on('window:alert', cy.spy())
Cypress.on('window:alert', cy.stub())
// same for a single test
cy.on('window:alert', () => { })
cy.on('window:alert', cy.spy())
cy.on('window:alert', cy.stub())

// sinon-chai example
const stub = cy.stub()
expect(stub).to.not.have.been.called
stub()
expect(stub).to.have.been.calledOnce
cy.wrap(stub).should('have.been.calledOnce')
cy.wrap(stub).should('be.calledOnce')

namespace EventInterfaceTests {
  // window:confirm stubbing
  Cypress.on('window:confirm', () => { })
  Cypress.on('window:confirm', cy.spy())
  Cypress.on('window:confirm', cy.stub())
  cy.on('window:confirm', () => { })
  cy.on('window:confirm', cy.spy())
  cy.on('window:confirm', cy.stub())

  Cypress.removeListener('fail', () => {})
  Cypress.removeAllListeners('fail')
  cy.removeListener('fail', () => {})
  cy.removeAllListeners('fail')
}

// specifying HTTP method directly in the options object
cy.request({
  url: "http://localhost:3000/myressource",
  method: "POST",
  body: {}
}).then((resp) => {
  resp // $ExpectType Response<any>
  resp.redirectedToUrl // $ExpectType string | undefined
  resp.redirects // $ExpectType string[] | undefined
  resp.headers // $ExpectType { [key: string]: string | string[]; }
})

// specify query parameters
// https://github.com/cypress-io/cypress/issues/2305
cy.request({
  url: "http://localhost:3000/myressource",
  qs: {
    param: 'someValue'
  }
})

// Users can specify body type.
// https://github.com/cypress-io/cypress/issues/9109
interface ResBody {
  x: number
  y: string
}

cy.request<ResBody>('http://goooooogle.com', {})
.then((resp) => {
  resp // $ExpectType Response<ResBody>
})

cy.request<ResBody>('post', 'http://goooooogle.com', {})
.then((resp) => {
  resp // $ExpectType Response<ResBody>
})

cy.request<ResBody>({
  url: 'http://goooooogle.com',
  body: {}
}).then((resp) => {
  resp // $ExpectType Response<ResBody>
})

// if you want a separate variable, you need specify its type
// otherwise TSC does not cast string "POST" as HttpMethod
// https://github.com/cypress-io/cypress/issues/2093
const opts: Partial<Cypress.RequestOptions> = {
  url: "http://localhost:3000/myressource",
  method: "POST",
  body: {}
}
cy.request(opts)

// you can cast just the "method" property
const opts2 = {
  url: "http://localhost:3000/myressource",
  method: "POST" as Cypress.HttpMethod,
  body: {}
}
cy.request(opts2)

const obj = {
  foo: () => { }
}
cy.spy(obj, 'foo').as('my-spy')

// use path-based access for nested structures
cy.wrap({
  foo: {
    bar: 1
  }
}).its('foo.bar')

cy.wrap({
  foo: {
    quux: () => 2
  }
}).invoke('foo.quux')

// different clearLocalStorage signatures
cy.clearLocalStorage()
cy.clearLocalStorage('todos')
cy.clearLocalStorage('todos', { log: false })
cy.clearLocalStorage({ log: false })

namespace BlobTests {
  Cypress.Blob.imgSrcToDataURL('/some/path', undefined, 'anonymous')
    .then((dateUrl) => {
      dateUrl // $ExpectType string
  })
}

namespace BufferTests {
  const buffer = Cypress.Buffer.from('sometext')
  Cypress.Buffer.isBuffer(buffer)
  buffer.length
}

cy.window().then(window => {
  window // $ExpectType AUTWindow

  window.eval('1')
})

const a = 1
// $ExpectError
a.should("be.visible")
