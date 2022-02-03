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

describe('cy.server', { defaultCommandTimeout: 0 }, () => {
  it('onAbort assertion failure', () => {
    cy.server({
      onAbort () {
        expect('actual').to.equal('expected')
      },
    })
    .route('/foo')
    .window().then(abortXhr('/foo'))
  })

  it('onAbort exception', () => {
    cy.server({
      onAbort () {
        ({}).bar()
      },
    })
    .route('/foo')
    .window().then(abortXhr('/foo'))
  })

  it('onRequest assertion failure', () => {
    cy.server({
      onRequest () {
        expect('actual').to.equal('expected')
      },
    })
    .route('/foo')
    .window().then(sendXhr('/foo'))
  })

  it('onRequest exception', () => {
    cy.server({
      onRequest () {
        ({}).bar()
      },
    })
    .route('/foo')
    .window().then(sendXhr('/foo'))
  })

  it('onResponse assertion failure', () => {
    cy.server({
      onResponse () {
        expect('actual').to.equal('expected')
      },
    })
    .route('/json-content-type')
    .window().then(sendXhr('/json-content-type'))
    .wait(10000)
  })

  it('onResponse exception', () => {
    cy.server({
      onResponse () {
        ({}).bar()
      },
    })
    .route('/json-content-type')
    .window().then(sendXhr('/json-content-type'))
    .wait(10000)
  })
})
