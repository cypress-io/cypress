// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain misc', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('verifies number of cy commands', () => {
    // @ts-ignore
    expect(Object.keys(cy.commandFns)).to.deep.equal(
      [
        'check', 'uncheck', 'click', 'dblclick', 'rightclick', 'focus', 'blur', 'hover', 'scrollIntoView', 'scrollTo', 'select',
        'selectFile', 'submit', 'type', 'clear', 'trigger', 'as', 'ng', 'should', 'and', 'clock', 'tick', 'spread', 'each', 'then',
        'invoke', 'its', 'getCookie', 'getCookies', 'setCookie', 'clearCookie', 'clearCookies', 'pause', 'debug', 'exec', 'readFile',
        'writeFile', 'fixture', 'clearLocalStorage', 'url', 'hash', 'location', 'end', 'noop', 'log', 'wrap', 'reload', 'go', 'visit',
        'focused', 'get', 'root', 'contains', 'shadow', 'within', 'request', 'session', 'screenshot', 'task', 'find', 'filter', 'not',
        'children', 'eq', 'closest', 'first', 'last', 'next', 'nextAll', 'nextUntil', 'parent', 'parents', 'parentsUntil', 'prev',
        'prevAll', 'prevUntil', 'siblings', 'wait', 'title', 'window', 'document', 'viewport', 'server', 'route', 'intercept', 'switchToDomain',
      ],
      'The number of cy commands has changed. Please ensure any newly added commands are also tested in multi-domain.',
    )
  })

  it('.end()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#button').end().should('be.null')
    })
  })

  it('.exec()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.exec('echo foobar').its('stdout').should('contain', 'foobar')
    })
  })

  it('.focused()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#button').click().focused().should('have.id', 'button')
    })
  })

  it('.wrap()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.wrap({ foo: 'bar' }).should('deep.equal', { foo: 'bar' })
    })
  })

  it('.debug()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#button').debug().should('have.id', 'button')
    })
  })

  it('.log()', (done) => {
    cy.switchToDomain('foobar.com', done, () => {
      Cypress.once('log:added', () => {
        done()
      })

      cy.log('test log in multi-domain')
    })
  })

  it('.pause()', (done) => {
    cy.switchToDomain('foobar.com', done, () => {
      Cypress.once('paused', () => {
        Cypress.emit('resume:all')
        done()
      })

      cy.pause()
    })
  })

  it('.task()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.task('return:arg', 'works').should('eq', 'works')
    })
  })
})
