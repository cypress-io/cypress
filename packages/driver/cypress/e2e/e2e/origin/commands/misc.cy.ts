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
    // ensures the 'paused' event makes it to the event-manager in the primary.
    // if we get cross-origin cy-in-cy test working, we could potentially make
    // this even more end-to-end: test out the reporter UI and click the
    // resume buttons instead of sending the resume:all event
    Cypress.primaryOriginCommunicator.once('paused', ({ nextCommandName, origin }) => {
      expect(nextCommandName).to.equal('wrap')
      expect(origin).to.equal('http://www.foobar.com:3500')

      Cypress.primaryOriginCommunicator.toSpecBridge(origin, 'resume:all')
    })

    cy.origin('http://www.foobar.com:3500', () => {
      const afterPaused = new Promise<void>((resolve) => {
        // event is sent from the event listener in the primary above,
        // ensuring that the pause sequence has come full circle
        cy.once('resume:all', () => {
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

        expect(consoleProps.name).to.equal('exec')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props['Shell Used']).to.be.undefined
        expect(consoleProps.props.Yielded).to.have.property('code').that.equals(0)
        expect(consoleProps.props.Yielded).to.have.property('stderr').that.equals('')
        expect(consoleProps.props.Yielded).to.have.property('stdout').that.equals('foobar')
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

        expect(consoleProps.name).to.equal('focused')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(1)
        expect(consoleProps.props.Yielded).to.have.property('tagName').that.equals('BUTTON')
        expect(consoleProps.props.Yielded).to.have.property('id').that.equals('button')
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

        expect(consoleProps.name).to.equal('wrap')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Yielded[0]).to.equal('foo')
        expect(consoleProps.props.Yielded[1]).to.equal('bar')
        expect(consoleProps.props.Yielded[2]).to.equal('baz')
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

        expect(consoleProps.name).to.equal('debug')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Yielded).to.have.property('tagName').that.equals('BUTTON')
        expect(consoleProps.props.Yielded).to.have.property('id').that.equals('button')
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

        expect(consoleProps.name).to.equal('pause')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Yielded).to.be.undefined
      })
    })

    it('.task()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.task('return:arg', 'works')
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('task', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('task')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Yielded).to.equal('works')
        expect(consoleProps.props.arg).to.equal('works')
        expect(consoleProps.props.task).to.equal('return:arg')
      })
    })
  })
})

it('verifies number of cy commands', () => {
  // remove custom commands we added for our own testing
  const customCommands = ['getAll', 'shouldWithTimeout', 'originLoadUtils', 'runSupportFileCustomPrivilegedCommands']
  // @ts-ignore
  const actualCommands = Cypress._.pullAll([...Object.keys(cy.commandFns), ...Object.keys(cy.queryFns)], customCommands)
  const expectedCommands = [
    'check', 'uncheck', 'click', 'dblclick', 'rightclick', 'focus', 'blur', 'hover', 'scrollIntoView', 'scrollTo', 'select',
    'selectFile', 'submit', 'type', 'clear', 'trigger', 'should', 'and', 'clock', 'tick', 'spread', 'each', 'then',
    'invoke', 'its', 'getCookie', 'getCookies', 'setCookie', 'clearCookie', 'clearCookies', 'pause', 'debug', 'exec', 'readFile',
    'writeFile', 'fixture', 'clearLocalStorage', 'url', 'hash', 'location', 'end', 'noop', 'log', 'wrap', 'reload', 'go', 'visit',
    'focused', 'get', 'contains', 'shadow', 'within', 'request', 'session', 'screenshot', 'task', 'find', 'filter', 'not',
    'children', 'eq', 'closest', 'first', 'last', 'next', 'nextAll', 'nextUntil', 'parent', 'parents', 'parentsUntil', 'prev',
    'prevAll', 'prevUntil', 'siblings', 'wait', 'title', 'window', 'document', 'viewport', 'server', 'route', 'intercept', 'origin',
    'mount', 'as', 'root', 'getAllLocalStorage', 'clearAllLocalStorage', 'getAllSessionStorage', 'clearAllSessionStorage',
    'getAllCookies', 'clearAllCookies',
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
