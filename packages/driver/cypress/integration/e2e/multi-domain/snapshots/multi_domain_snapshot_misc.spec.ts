import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain snapshot misc', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  // NOTE: there is no log for .end()
  it.skip('.end()', () => undefined)

  it('.exec()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('exec', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('exec')
        expect(consoleProps['Shell Used']).to.be.undefined
        expect(consoleProps.Yielded).to.have.property('code').that.equals(0)
        expect(consoleProps.Yielded).to.have.property('stderr').that.equals('')
        expect(consoleProps.Yielded).to.have.property('stdout').that.equals('foobar')

        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.exec('echo foobar')
    })
  })

  it('.focused()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('focused', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('focused')
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('BUTTON')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('button')
        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#button').click().focused()
    })
  })

  it('.wrap()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('wrap', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('wrap')
        expect(consoleProps.Yielded[0]).to.equal('foo')
        expect(consoleProps.Yielded[1]).to.equal('bar')
        expect(consoleProps.Yielded[2]).to.equal('baz')

        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
      const arr = ['foo', 'bar', 'baz']

      cy.wrap(arr).spread((foo, bar, baz) => {
        expect(foo).to.equal('foo')
        expect(bar).to.equal('bar')
        expect(baz).to.equal('baz')
      })
    })
  })

  it('.debug()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('debug', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('debug')
        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('BUTTON')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('button')
        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#button').debug()
    })
  })

  it('.pause()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('pause', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('pause')
        expect(consoleProps.Yielded).to.be.undefined
        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
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

  it('.task()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('task', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('task')
        expect(consoleProps.Yielded).to.equal('works')
        expect(consoleProps.arg).to.equal('works')
        expect(consoleProps.task).to.equal('return:arg')
        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.task('return:arg', 'works')
    })
  })
})
