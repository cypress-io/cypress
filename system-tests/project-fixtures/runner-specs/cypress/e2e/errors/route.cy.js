const sendXhr = (route) => {
  return (win) => {
    const xhr = new win.XMLHttpRequest()

    xhr.open('GET', route)
    xhr.send()

    return xhr
  }
}

const abortXhr = (route) => {
  return (win) => {
    const xhr = sendXhr(route)(win)

    xhr.abort()
  }
}

// TODO(origin): 'strict' testIsolation causes cy.route to fail, appears tob e related to visiting about:blank
describe('cy.route', { defaultCommandTimeout: 0, testIsolation: 'legacy' }, () => {
  it('callback assertion failure', () => {
    cy.server().route(() => {
      expect('actual').to.equal('expected')
    })
  })

  it('callback exception', () => {
    cy.server().route(() => {
      ({}).bar()
    })
  })

  it('command failure', () => {
    cy.server().route(() => {
      cy.get('#does-not-exist')

      return '/foo'
    })
  })

  it('onAbort assertion failure', () => {
    cy.server().route({
      url: '/foo',
      onAbort () {
        expect('actual').to.equal('expected')
      },
    })
    .window().then(abortXhr('/foo'))
  })

  it('onAbort exception', () => {
    cy.server().route({
      url: '/foo',
      onAbort () {
        ({}).bar()
      },
    })
    .window().then(abortXhr('/foo'))
  })

  it('onRequest assertion failure', () => {
    cy.server().route({
      url: '/foo',
      onRequest () {
        expect('actual').to.equal('expected')
      },
    })
    .window().then(sendXhr('/foo'))
  })

  it('onRequest exception', () => {
    cy.server().route({
      url: '/foo',
      onRequest () {
        ({}).bar()
      },
    })
    .window().then(sendXhr('/foo'))
  })

  it('onResponse assertion failure', () => {
    cy.server().route({
      url: '/json-content-type',
      onResponse () {
        expect('actual').to.equal('expected')
      },
    })
    .window().then(sendXhr('/json-content-type'))
    .wait(10000)
  })

  it('onResponse exception', () => {
    cy.server().route({
      url: '/json-content-type',
      onResponse () {
        ({}).bar()
      },
    })
    .window().then(sendXhr('/json-content-type'))
    .wait(10000)
  })
})
