// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain misc', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('verifies number of cy commands', () => {
    // @ts-ignore
    expect(Object.keys(cy.commandFns)).to.eql(
      [
        'check',
        'uncheck',
        'click',
        'dblclick',
        'rightclick',
        'focus',
        'blur',
        'hover',
        'scrollIntoView',
        'scrollTo',
        'select',
        'selectFile',
        'submit',
        'type',
        'clear',
        'trigger',
        'as',
        'ng',
        'should',
        'and',
        'clock',
        'tick',
        'spread',
        'each',
        'then',
        'invoke',
        'its',
        'getCookie',
        'getCookies',
        'setCookie',
        'clearCookie',
        'clearCookies',
        'pause',
        'debug',
        'exec',
        'readFile',
        'writeFile',
        'fixture',
        'clearLocalStorage',
        'url',
        'hash',
        'location',
        'end',
        'noop',
        'log',
        'wrap',
        'reload',
        'go',
        'visit',
        'focused',
        'get',
        'root',
        'contains',
        'within',
        'shadow',
        'request',
        'session',
        'screenshot',
        'task',
        'find',
        'filter',
        'not',
        'children',
        'eq',
        'closest',
        'first',
        'last',
        'next',
        'nextAll',
        'nextUntil',
        'parent',
        'parents',
        'parentsUntil',
        'prev',
        'prevAll',
        'prevUntil',
        'siblings',
        'wait',
        'title',
        'window',
        'document',
        'viewport',
        'server',
        'route',
        'intercept',
        'switchToDomain',
      ],
      'The number of cy commands has changed. Please ensure any newly added commands are also tested in multi-domain.',
    )
  })

  it('.end()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#button').end().should('be.null')
    })
  })

  // FIXME: CypressError: `cy.exec('echo foobar')` timed out after waiting `undefinedms`.
  // at eval (webpack:///../driver/src/cy/commands/exec.ts?:89:85)
  it.skip('.exec()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.exec('echo foobar').its('stdout').should('contain', 'foobar')
    })
  })

  it('.focused()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#button').click().focused().should('have.id', 'button')
    })
  })

  // FIXME: hanging, nothing in console
  it.skip('.screenshot()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.screenshot('multi-domain-screenshot-command')
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

  // FIXME: CypressError: `cy.task('return:arg')` timed out after waiting `undefinedms`.
  // at eval(webpack:///../driver/src/cy/commands/task.ts?:72:78)
  // From previous event:    at task(webpack:///../driver/src/cy/commands/task.ts?:71:15)
  it.skip('.task()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.task('return:arg', 'works').should('eq', 'works')
    })
  })
})
