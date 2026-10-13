const { assertLogLength } = require('../../../support/utils')

const { Promise } = Cypress

describe('src/cy/commands/navigation', () => {
  // TODO(webkit): fix+unskip for webkit release
  context('#url:changed', { browser: '!webkit' }, () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'new url') {
          this.lastLog = log
          this.logs.push(log)
        }
      })

      return null
    })

    describe('page navigation', () => {
      it('emits url:changed event on initial visit', () => {
        const emit = cy.spy(Cypress, 'emit').log(false).withArgs('url:changed')

        cy
        .visit('/fixtures/generic.html')
        .then(() => {
          expect(emit).to.be.calledOnce
          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/generic.html',
          )
        })
      })

      it('emits url:changed on 2nd visit to different page', () => {
        const emit = cy.spy(Cypress, 'emit').log(false).withArgs('url:changed')

        cy
        .visit('/fixtures/generic.html')
        .visit('/fixtures/jquery.html')
        .then(() => {
          expect(emit).to.be.calledTwice

          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/generic.html',
          )

          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/jquery.html',
          )
        })
      })

      it('does not emit url:changed twice on visit to the same page', () => {
        const emit = cy.spy(Cypress, 'emit').log(false).withArgs('url:changed')

        cy
        .visit('/fixtures/generic.html')
        .visit('/fixtures/generic.html')
        .then(() => {
          expect(emit).to.be.calledOnce
          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/generic.html',
          )
        })
      })

      it('does not log url:changed event on visit', () => {
        cy
        .visit('/fixtures/generic.html')
        .then(function () {
          expect(this.lastLog).not.to.exist
        })
      })

      it('emits url:changed event on page navigation', () => {
        const emit = cy.spy(Cypress, 'emit').log(false).withArgs('url:changed')

        cy
        .visit('/fixtures/generic.html')
        .get('#dimensions').click()
        .then(() => {
          expect(emit).to.be.calledTwice

          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/generic.html',
          )

          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/dimensions.html',
          )
        })
      })

      it('logs url:changed event on page navigation', () => {
        cy
        .visit('/fixtures/generic.html')
        .get('#dimensions').click()
        .then(function () {
          assertLogLength(this.logs, 1)

          expect(this.logs[0].get('message')).to.eq(
            'http://localhost:3500/fixtures/dimensions.html',
          )

          expect(this.logs[0].invoke('consoleProps')).to.deep.eq({
            name: 'new url',
            type: 'event',
            props: {
              'New Url': 'http://localhost:3500/fixtures/dimensions.html',
              'Url Updated By': 'page navigation event (before:load)',
            },
          })
        })
      })
    })

    describe('hashchange events', () => {
      it('emits url:changed event', () => {
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy
        .visit('/fixtures/generic.html')
        .get('#hashchange').click()
        .then(() => {
          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/generic.html#hashchange',
          )
        })
      })

      it('emits url:changed event as navigation events occur', () => {
        const emit = cy.spy(Cypress, 'emit').log(false).withArgs('url:changed')

        cy
        .visit('/fixtures/generic.html')
        .get('#hashchange').click()
        .window().then((win) => {
          return new Promise((resolve) => {
            cy.once('navigation:changed', resolve)

            win.history.back()
          }).then(() => {
            return new Promise((resolve) => {
              cy.once('navigation:changed', resolve)

              win.history.forward()
            })
          }).then(() => {
            expect(emit.callCount).to.eq(4)

            expect(emit.getCall(0)).to.be.calledWith(
              'url:changed',
              'http://localhost:3500/fixtures/generic.html',
            )

            expect(emit.getCall(1)).to.be.calledWith(
              'url:changed',
              'http://localhost:3500/fixtures/generic.html#hashchange',
            )

            expect(emit.getCall(2)).to.be.calledWith(
              'url:changed',
              'http://localhost:3500/fixtures/generic.html',
            )

            expect(emit.getCall(3)).to.be.calledWith(
              'url:changed',
              'http://localhost:3500/fixtures/generic.html#hashchange',
            )
          })
        })
      })

      describe('filters page load events when going back with window navigation when testIsolation=true', () => {
        // https://github.com/cypress-io/cypress/issues/19230
        it('when going back with window navigation', () => {
          const emit = cy.spy(Cypress, 'emit').log(false).withArgs('navigation:changed')

          cy
          .visit('/fixtures/generic.html')
          .get('#hashchange').click()
          .window().then((win) => {
            return new Promise((resolve) => {
              cy.once('navigation:changed', resolve)

              win.history.back()
            }).then(() => {
              return new Promise((resolve) => {
                cy.once('navigation:changed', resolve)

                win.history.forward()
              })
            })
          })

          cy.get('#dimensions').click()
          .window().then((win) => {
            return new Promise((resolve) => {
              cy.on('navigation:changed', (event) => {
                if (event.includes('(load)')) {
                  resolve()
                }
              })

              win.history.back()
            })
            .then(() => {
              return new Promise((resolve) => {
                cy.on('navigation:changed', resolve)
                win.history.back()
              })
            })
            .then(() => {
              expect(emit.getCall(0)).to.be.calledWith(
                'navigation:changed',
                'page navigation event (before:load)',
              )

              expect(emit.getCall(1)).to.be.calledWith(
                'navigation:changed',
                'page navigation event (load)',
              )

              expect(emit.getCall(2)).to.be.calledWith(
                'navigation:changed',
                'hashchange',
              )

              expect(emit.getCall(3)).to.be.calledWithMatch(
                'navigation:changed',
                'hashchange',
              )

              expect(emit.getCall(4)).to.be.calledWithMatch(
                'navigation:changed',
                'hashchange',
              )

              expect(emit.getCall(5)).to.be.calledWithMatch(
                'navigation:changed',
                'page navigation event (before:load)',
              )

              expect(emit.getCall(6)).to.be.calledWith(
                'navigation:changed',
                'page navigation event (load)',
              )

              expect(emit.getCall(7)).to.be.calledWith(
                'navigation:changed',
                'page navigation event (before:load)',
              )

              expect(emit.getCall(8)).to.be.calledWith(
                'navigation:changed',
                'page navigation event (load)',
              )

              expect(emit.getCall(9)).to.be.calledWith(
                'navigation:changed',
                'hashchange',
              )

              expect(emit.callCount).to.eq(10)
            })
          })
        })
      })

      it('logs url changed event', () => {
        cy
        .visit('/fixtures/generic.html')
        .window().then((win) => {
          let ohc = null

          win.onhashchange = (event) => {
            ohc = event
          }

          cy
          .get('#hashchange').click()
          .then(function () {
            const { lastLog } = this

            expect(lastLog.get('message')).to.eq('http://localhost:3500/fixtures/generic.html#hashchange')
            expect(lastLog.get('type')).to.eq('parent')
            expect(lastLog.get('event')).to.be.true

            expect(lastLog.invoke('consoleProps')).to.deep.eq({
              name: 'new url',
              type: 'event',
              props: {
                'New Url': 'http://localhost:3500/fixtures/generic.html#hashchange',
                'Url Updated By': 'hashchange',
                'Args': ohc,
              },
            })
          })
        })
      })

      it('logs url:changed event as navigation events occur', () => {
        cy
        .visit('/fixtures/generic.html')
        .get('#hashchange').click()
        .window().then((win) => {
          return new Promise((resolve) => {
            cy.once('navigation:changed', resolve)

            win.history.back()
          }).then(() => {
            return new Promise((resolve) => {
              cy.once('navigation:changed', resolve)

              win.history.forward()
            })
          })
        }).then(function () {
          assertLogLength(this.logs, 3)

          expect(this.logs[0].get('message')).to.eq(
            'http://localhost:3500/fixtures/generic.html#hashchange',
          )

          expect(this.logs[1].get('message')).to.eq(
            'http://localhost:3500/fixtures/generic.html',
          )

          expect(this.logs[2].get('message')).to.eq(
            'http://localhost:3500/fixtures/generic.html#hashchange',
          )
        })
      })
    })

    describe('history.pushState', () => {
      it('emits url:changed event', (done) => {
        let times = 1

        const listener = (url) => {
          if (times === 1) {
            expect(url).to.eq('http://localhost:3500/fixtures/generic.html')
          }

          if (times === 2) {
            expect(url).to.eq('http://localhost:3500/fixtures/pushState.html')
            Cypress.removeListener('url:changed', listener)
            done()
          }

          times++
        }

        Cypress.on('url:changed', listener)

        cy
        .visit('/fixtures/generic.html')
        .window().then((win) => {
          win.history.pushState({ foo: 'bar' }, null, 'pushState.html')
        })
      })

      it('logs url changed event', () => {
        cy
        .visit('/fixtures/generic.html')
        .window().then(function (win) {
          win.history.pushState({ foo: 'bar' }, null, 'pushState.html')

          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('http://localhost:3500/fixtures/pushState.html')
          expect(lastLog.get('type')).to.eq('parent')
          expect(lastLog.get('event')).to.be.true
          expect(lastLog.invoke('consoleProps')).to.deep.eq({
            name: 'new url',
            type: 'event',
            props: {
              'New Url': 'http://localhost:3500/fixtures/pushState.html',
              'Url Updated By': 'pushState',
              'Args': [
                { foo: 'bar' },
                null,
                'pushState.html',
              ],
            },
          })
        })
      })
    })

    describe('history.replaceState', () => {
      it('emits url:changed event', (done) => {
        let times = 1

        const listener = (url) => {
          if (times === 1) {
            expect(url).to.eq('http://localhost:3500/fixtures/generic.html')
          }

          if (times === 2) {
            expect(url).to.eq('http://localhost:3500/fixtures/replaceState.html')
            Cypress.removeListener('url:changed', listener)
            done()
          }

          times++
        }

        Cypress.on('url:changed', listener)

        cy
        .visit('/fixtures/generic.html')
        .window().then((win) => {
          win.history.replaceState({ foo: 'bar' }, null, 'replaceState.html')
        })
      })

      it('logs url changed event', () => {
        cy
        .visit('/fixtures/generic.html')
        .window().then(function (win) {
          win.history.replaceState({ foo: 'bar' }, null, 'replaceState.html')

          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('http://localhost:3500/fixtures/replaceState.html')
          expect(lastLog.get('type')).to.eq('parent')
          expect(lastLog.get('event')).to.be.true
          expect(lastLog.invoke('consoleProps')).to.deep.eq({
            name: 'new url',
            type: 'event',
            props: {
              'New Url': 'http://localhost:3500/fixtures/replaceState.html',
              'Url Updated By': 'replaceState',
              'Args': [
                { foo: 'bar' },
                null,
                'replaceState.html',
              ],
            },
          })
        })
      })
    })
  })
})
