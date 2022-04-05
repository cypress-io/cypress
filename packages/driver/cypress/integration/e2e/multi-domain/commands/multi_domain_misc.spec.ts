// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain misc', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.end()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#button').end().should('be.null')
    })
  })

  it('.exec()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.exec('echo foobar').its('stdout').should('contain', 'foobar')
    })
  })

  it('.focused()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#button').click().focused().should('have.id', 'button')
    })
  })

  it('.wrap()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.wrap({ foo: 'bar' }).should('deep.equal', { foo: 'bar' })
    })
  })

  it('.debug()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#button').debug().should('have.id', 'button')
    })
  })

  it('.pause()', () => {
    cy.origin('http://foobar.com:3500', () => {
      const afterPaused = new Promise<void>((resolve) => {
        cy.once('paused', () => {
          Cypress.emit('resume:all')
          resolve()
        })
      })

      cy.pause().wrap({}).should('deep.eq', {})
      // pause is a noop in run mode, so only wait for it if in open mode
      if (Cypress.config('isInteractive')) {
        cy.wrap(afterPaused)
      }
    })
  })

  it('.task()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.task('return:arg', 'works').should('eq', 'works')
    })
  })
})

it('verifies number of cy commands', () => {
  // @ts-ignore
  // remove 'getAll' command since it's a custom command we add for our own testing and not an actual cy command
  const actualCommands = Cypress._.reject(Object.keys(cy.commandFns), (command) => command === 'getAll')
  const expectedCommands = [
    'check', 'uncheck', 'click', 'dblclick', 'rightclick', 'focus', 'blur', 'hover', 'scrollIntoView', 'scrollTo', 'select',
    'selectFile', 'submit', 'type', 'clear', 'trigger', 'as', 'ng', 'should', 'and', 'clock', 'tick', 'spread', 'each', 'then',
    'invoke', 'its', 'getCookie', 'getCookies', 'setCookie', 'clearCookie', 'clearCookies', 'pause', 'debug', 'exec', 'readFile',
    'writeFile', 'fixture', 'clearLocalStorage', 'url', 'hash', 'location', 'end', 'noop', 'log', 'wrap', 'reload', 'go', 'visit',
    'focused', 'get', 'contains', 'root', 'shadow', 'within', 'request', 'session', 'screenshot', 'task', 'find', 'filter', 'not',
    'children', 'eq', 'closest', 'first', 'last', 'next', 'nextAll', 'nextUntil', 'parent', 'parents', 'parentsUntil', 'prev',
    'prevAll', 'prevUntil', 'siblings', 'wait', 'title', 'window', 'document', 'viewport', 'server', 'route', 'intercept', 'origin',
  ]
  const addedCommands = Cypress._.difference(actualCommands, expectedCommands)
  const removedCommands = Cypress._.difference(expectedCommands, actualCommands)

  if (addedCommands.length && removedCommands.length) {
    throw new Error(`Commands have been added to and removed from Cypress.

      The following command(s) were added: ${addedCommands.join(', ')}
      The following command(s) were removed: ${removedCommands.join(', ')}

      Update this test accordingly.`)
  }

  if (addedCommands.length) {
    throw new Error(`The following command(s) have been added to Cypress: ${addedCommands.join(', ')}. Please add tests for the command(s) in multi-domain and add the command(s) to this test.`)
  }

  if (removedCommands.length) {
    throw new Error(`The following command(s) have been removed from Cypress: ${removedCommands.join(', ')}. Please remove the command(s) from this test.`)
  }
})
