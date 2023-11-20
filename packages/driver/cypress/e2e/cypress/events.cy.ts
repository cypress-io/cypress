describe('src/cypress', () => {
  describe('events', () => {
    it('fail event', (done) => {
      cy.on('fail', (err, runnable) => {
        expect(err.message).to.equal('foo')
        expect(runnable).to.equal(Cypress.state('runnable'))

        done()
      })

      throw new Error('foo')
    })

    it('viewport:changed event', () => {
      let called = false

      cy.on('viewport:changed', (viewport) => {
        expect(viewport).to.deep.equal({ viewportWidth: 100, viewportHeight: 100 })
        called = true
      })

      cy.viewport(100, 100).then(() => {
        expect(called).to.be.true
      })
    })

    it('scrolled event', (done) => {
      cy.viewport(100, 100)
      Cypress.$('<button>button</button>')
      .attr('id', 'button')
      .css({
        position: 'absolute',
        left: '0px',
        top: '50px',
      })
      .appendTo(cy.$$('body'))

      cy.on('scrolled', ($el, type) => {
        expect($el[0]).to.eq(Cypress.$('#button')[0])
        expect(type).to.eq('element')

        done()
      })

      cy.get('#button').trigger('mousedown')
    })

    context('command events', () => {
      it('command:enqueued event', () => {
        let called = false

        const handler = (command) => {
          expect(command.name).to.eq('log')
          called = true
          cy.off('command:enqueued', handler)
        }

        cy.on('command:enqueued', handler)

        cy.log('foo').then(() => {
          expect(called).to.be.true
        })
      })

      it('command:start event', () => {
        let called = false

        const handler = (command) => {
          expect(command.attributes.name).to.eq('log')
          called = true
          cy.off('command:start', handler)
        }

        cy.on('command:start', handler)

        cy.log('foo').then(() => {
          expect(called).to.be.true
        })
      })

      it('command:end event', () => {
        let called = false

        const handler = (command) => {
          expect(command.attributes.name).to.eq('log')
          called = true
          cy.off('command:end', handler)
        }

        cy.on('command:end', handler)

        cy.log('foo').then(() => {
          expect(called).to.be.true
        })
      })

      it('command:retry event', (done) => {
        const handler = (options) => {
          expect(options._retries).to.equal(1)
          expect(options.error.message).to.equal('Expected to find element: `#foo`, but never found it.')
          done()
        }

        cy.on('command:retry', handler)

        cy.get('#foo')
      })
    })

    context('log events', () => {
      it('log:added event', () => {
        const attrs: any[] = []
        const logs: any[] = []

        const handler = (attr, log) => {
          attrs.push(attr)
          logs.push(log)
        }

        cy.on('log:added', handler)

        Cypress.log({ name: 'log', message: `foo` })

        cy.log('foo').then(() => {
          expect(attrs[0].name).to.eq('log')
          expect(logs[0].attributes.name).to.eq('log')
        })
      })

      it('log:changed event', (done) => {
        const handler = (attr, log) => {
          cy.off('log:changed', handler)
          expect(attr.name).to.eq('bar')
          expect(log.attributes.name).to.eq('bar')
          done()
        }

        const log = Cypress.log({ message: `foo` })

        cy.on('log:changed', handler)

        log?.set('name', 'bar')
      })
    })

    // these tests need to be run together since they are testing lifecycle events
    context('lifecycle (test:before/after:run) events', () => {
      let afterRunnable
      let beforeRunnable
      let beforeAsyncRunnable
      let expectedAfterRunnable

      const beforeHandler = (test, runnable) => {
        expect(test.title).to.eq('test 2')

        beforeRunnable = runnable
        Cypress.off('test:before:run', beforeHandler)
      }

      const beforeAsyncHandler = (test, runnable) => {
        expect(test.title).to.eq('test 2')

        beforeAsyncRunnable = runnable
        Cypress.off('test:before:run:async', beforeAsyncHandler)
      }

      const afterHandler = (test, runnable) => {
        expect(test.title).to.eq('test 1')

        afterRunnable = runnable
        Cypress.off('test:after:run', afterHandler)
      }

      before(() => {
        Cypress.on('test:before:run', beforeHandler)
        Cypress.on('test:before:run:async', beforeAsyncHandler)
        Cypress.on('test:after:run', afterHandler)
      })

      after(() => {
        Cypress.off('test:before:run', beforeHandler)
        Cypress.off('test:before:run:async', beforeAsyncHandler)
        Cypress.off('test:after:run', afterHandler)
      })

      it('test 1', () => {
        // this is the runnable that we expect to be passed to the test:after:run event
        // and it will be verified in the next test since we need to wait for the test to finish
        expectedAfterRunnable = Cypress.state('runnable')
      })

      it('test 2', () => {
        // the before runnables should be from this test
        const runnable = Cypress.state('runnable')

        // use === to avoid the circular references
        expect(beforeAsyncRunnable === runnable).to.be.true
        expect(beforeRunnable === runnable).to.be.true

        // the after runnable should be from the previous test
        expect(afterRunnable).to.deep.equal(expectedAfterRunnable)
      })
    })
  })
})
