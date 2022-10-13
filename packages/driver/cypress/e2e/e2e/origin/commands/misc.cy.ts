import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin misc', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.end()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#button').end().should('be.null')
    })
  })

  it('.exec()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.exec('echo foobar').its('stdout').should('contain', 'foobar')
    })
  })

  it('.focused()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#button').click().focused().should('have.id', 'button')
    })
  })

  it('.wrap()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.wrap({ foo: 'bar' }).should('deep.equal', { foo: 'bar' })
    })
  })

  it('.debug()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#button').debug().should('have.id', 'button')
    })
  })

  it('.pause()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
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
    cy.origin('http://www.foobar.com:3500', () => {
      cy.task('return:arg', 'works').should('eq', 'works')
    })
  })

  context('#consoleProps', () => {
    let logs: Map<string, any>

    beforeEach(() => {
      logs = new Map()

      cy.on('log:changed', (attrs, log) => {
        logs.set(attrs.id, log)
      })
    })

    it('.exec()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.exec('echo foobar')
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('exec', logs, 'foobar.com')

        expect(consoleProps.Command).to.equal('exec')
        expect(consoleProps['Shell Used']).to.be.undefined
        expect(consoleProps.Yielded).to.have.property('code').that.equals(0)
        expect(consoleProps.Yielded).to.have.property('stderr').that.equals('')
        expect(consoleProps.Yielded).to.have.property('stdout').that.equals('foobar')
      })
    })

    it('.focused()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#button').click().focused()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('focused', logs, 'foobar.com')

        expect(consoleProps.Command).to.equal('focused')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('BUTTON')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('button')
      })
    })

    it('.wrap()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const arr = ['foo', 'bar', 'baz']

        cy.wrap(arr).spread((foo, bar, baz) => {
          expect(foo).to.equal('foo')
          expect(bar).to.equal('bar')
          expect(baz).to.equal('baz')
        })
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('wrap', logs, 'foobar.com')

        expect(consoleProps.Command).to.equal('wrap')
        expect(consoleProps.Yielded[0]).to.equal('foo')
        expect(consoleProps.Yielded[1]).to.equal('bar')
        expect(consoleProps.Yielded[2]).to.equal('baz')
      })
    })

    it('.debug()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#button').debug()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('debug', logs, 'foobar.com')

        expect(consoleProps.Command).to.equal('debug')
        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('BUTTON')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('button')
      })
    })

    it('.pause()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
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

      cy.shouldWithTimeout(() => {
        if (Cypress.config('isInteractive')) {
          // if `isInteractive`, the .pause() will NOT show up in the command log in this case. Essentially a no-op.
          return
        }

        const { consoleProps } = findCrossOriginLogs('pause', logs, 'foobar.com')

        expect(consoleProps.Command).to.equal('pause')
        expect(consoleProps.Yielded).to.be.undefined
      })
    })

    it('.task()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.task('return:arg', 'works')
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('task', logs, 'foobar.com')

        expect(consoleProps.Command).to.equal('task')
        expect(consoleProps.Yielded).to.equal('works')
        expect(consoleProps.arg).to.equal('works')
        expect(consoleProps.task).to.equal('return:arg')
      })
    })
  })
})

it('verifies number of cy commands', () => {
  // remove custom commands we added for our own testing
  const customCommands = ['getAll', 'shouldWithTimeout', 'originLoadUtils']
  // @ts-ignore
  const actualCommands = Cypress._.reject(Object.keys(cy.commandFns), (command) => customCommands.includes(command))
  const expectedCommands = [
    'check', 'uncheck', 'click', 'dblclick', 'rightclick', 'focus', 'blur', 'hover', 'scrollIntoView', 'scrollTo', 'select',
    'selectFile', 'submit', 'type', 'clear', 'trigger', 'as', 'ng', 'should', 'and', 'clock', 'tick', 'spread', 'each', 'then',
    'invoke', 'its', 'getCookie', 'getCookies', 'setCookie', 'clearCookie', 'clearCookies', 'pause', 'debug', 'exec', 'readFile',
    'writeFile', 'fixture', 'clearLocalStorage', 'url', 'hash', 'location', 'end', 'noop', 'log', 'wrap', 'reload', 'go', 'visit',
    'focused', 'get', 'contains', 'root', 'shadow', 'within', 'request', 'session', 'screenshot', 'task', 'find', 'filter', 'not',
    'children', 'eq', 'closest', 'first', 'last', 'next', 'nextAll', 'nextUntil', 'parent', 'parents', 'parentsUntil', 'prev',
    'prevAll', 'prevUntil', 'siblings', 'wait', 'title', 'window', 'document', 'viewport', 'server', 'route', 'intercept', 'origin',
    'mount',
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
    throw new Error(`The following command(s) have been added to Cypress: ${addedCommands.join(', ')}. Please add tests for the command(s) in cy.origin and add the command(s) to this test.`)
  }

  if (removedCommands.length) {
    throw new Error(`The following command(s) have been removed from Cypress: ${removedCommands.join(', ')}. Please remove the command(s) from this test.`)
  }
})
