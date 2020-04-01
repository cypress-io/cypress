const $ = Cypress.$.bind(Cypress)
const {
  _,
} = Cypress

describe('src/cy/commands/angular', () => {
  before(() => {
    cy
    .visit('/fixtures/angular.html')
  })

  describe('#ng', () => {
    context('find by binding', () => {
      it('finds color.name binding elements', () => {
        const spans = cy.$$('.colors span.name')

        cy.ng('binding', 'color.name').then(($spans) => $spans.each((i, span) => expect(span).to.eq(spans[i])))
      })

      describe('errors', () => {
        beforeEach(() => {
          Cypress.config('defaultCommandTimeout', 50)

          this.angular = cy.state('window').angular
        })

        afterEach(() => {
          cy.state('window').angular = this.angular
        })

        it('throws when cannot find angular', (done) => {
          delete cy.state('window').angular

          cy.on('fail', (err) => {
            expect(err.message).to.include('Angular global (`window.angular`) was not found in your window. You cannot use `cy.ng()` methods without angular.')

            done()
          })

          cy.ng('binding', 'phone')
        })

        it('throws when binding cannot be found', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('Could not find element for binding: \'not-found\'.')

            done()
          })

          cy.ng('binding', 'not-found')
        })

        it('cancels additional finds when aborted', (done) => {
          cy.timeout(1000)
          cy.stub(Cypress.runner, 'stop')

          let retry = _.after(2, () => {
            Cypress.stop()
          })

          cy.on('command:retry', retry)

          cy.on('fail', (err) => done(err))

          cy.on('stop', () => {
            retry = cy.spy(cy, 'retry')

            return _.delay(() => {
              expect(retry.callCount).to.eq(0)

              done()
            }
            , 100)
          })

          cy.ng('binding', 'not-found')
        })
      })
    })

    context('find by repeater', () => {
      const ngPrefixes = { 'phone in phones': 'ng-', 'phone2 in phones': 'ng_', 'phone3 in phones': 'data-ng-', 'phone4 in phones': 'x-ng-' }

      _.each(ngPrefixes, (prefix, attr) => {
        it(`finds by ${prefix}repeat`, () => {
        // make sure we find this element
          const li = cy.$$(`[${prefix}repeat*='${attr}']`)

          expect(li).to.exist

          // and make sure they are the same DOM element
          cy.ng('repeater', attr).then(($li) => expect($li.get(0)).to.eq(li.get(0)))
        })
      })

      it('favors earlier items in the array when duplicates are found', () => {
        const li = cy.$$('[ng-repeat*=\'foo in foos\']')

        cy.ng('repeater', 'foo in foos').then(($li) => expect($li.get(0)).to.eq(li.get(0)))
      })

      it('waits to find a missing input', () => {
        const missingLi = $('<li />', { 'data-ng-repeat': 'li in lis' })

        // wait until we're ALMOST about to time out before
        // appending the missingInput
        cy.on('command:retry', _.after(2, () => {
          cy.$$('body').append(missingLi)
        }))

        cy.ng('repeater', 'li in lis').then(($li) => expect($li).to.match(missingLi))
      })

      describe('errors', () => {
        beforeEach(() => {
          Cypress.config('defaultCommandTimeout', 50)

          this.angular = cy.state('window').angular
        })

        afterEach(() => {
          cy.state('window').angular = this.angular
        })

        it('throws when repeater cannot be found', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('Could not find element for repeater: \'not-found\'.  Searched [ng-repeat*=\'not-found\'], [ng_repeat*=\'not-found\'], [data-ng-repeat*=\'not-found\'], [x-ng-repeat*=\'not-found\'].')

            done()
          })

          cy.ng('repeater', 'not-found')
        })

        it('cancels additional finds when aborted', (done) => {
          cy.timeout(1000)
          cy.stub(Cypress.runner, 'stop')

          let retry = _.after(2, () => {
            Cypress.stop()
          })

          cy.on('command:retry', retry)

          cy.on('fail', (err) => done(err))

          cy.on('stop', () => {
            retry = cy.spy(cy, 'retry')

            return _.delay(() => {
              expect(retry.callCount).to.eq(0)

              done()
            }
            , 100)
          })

          cy.ng('repeater', 'not-found')
        })

        it('throws when cannot find angular', (done) => {
          delete cy.state('window').angular

          cy.on('fail', (err) => {
            expect(err.message).to.include('Angular global (`window.angular`) was not found in your window. You cannot use `cy.ng()` methods without angular.')

            done()
          })

          cy.ng('repeater', 'phone in phones')
        })
      })

      describe('log', () => {
        beforeEach(() => {
          this.logs = []

          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'assert') {
              this.lastLog = log

              return this.logs.push(log)
            }
          })

          return null
        })

        it('does not incorrectly merge 2nd assertion into 1st', () => {
          cy
          .ng('repeater', 'foo in foos').should('have.length', 2)
          .url().should('include', ':')
          .then(() => {
            expect(this.logs.length).to.eq(2)
            expect(this.logs[0].get('state')).to.eq('passed')

            expect(this.logs[1].get('state')).to.eq('passed')
          })
        })
      })
    })

    context('find by model', () => {
      const ngPrefixes = { query: 'ng-', query2: 'ng_', query3: 'data-ng-', query4: 'x-ng-' }

      _.each(ngPrefixes, (prefix, attr) => {
        it(`finds element by ${prefix}model`, () => {
        // make sure we find this element
          const input = cy.$$(`[${prefix}model=${attr}]`)

          expect(input).to.exist

          // and make sure they are the same DOM element
          cy.ng('model', attr).then(($input) => expect($input.get(0)).to.eq(input.get(0)))
        })
      })

      it('favors earlier items in the array when duplicates are found', () => {
        const input = cy.$$('[ng-model=foo]')

        cy.ng('model', 'foo').then(($input) => expect($input.get(0)).to.eq(input.get(0)))
      })

      it('waits to find a missing input', () => {
        const missingInput = $('<input />', { 'data-ng-model': 'missing-input' })

        // wait until we're ALMOST about to time out before
        // appending the missingInput
        cy.on('command:retry', _.after(2, () => cy.$$('body').append(missingInput)))

        cy.ng('model', 'missing-input').then(($input) => expect($input).to.match(missingInput))
      })

      it('cancels other retries when one resolves', () => {
        const retry = cy.spy(cy, 'retry')

        const missingInput = $('<input />', { 'data-ng-model': 'missing-input' })

        cy.on('command:retry', _.after(6, _.once(() => {
          cy.$$('body').append(missingInput)
        })))

        // we want to make sure that the ng promises do not continue
        // to retry after the first one resolves
        cy.ng('model', 'missing-input')
        .then(() => retry.resetHistory()).wait(100)
        .then(() => expect(retry.callCount).to.eq(0))
      })

      describe('errors', () => {
        beforeEach(() => {
          Cypress.config('defaultCommandTimeout', 50)

          this.angular = cy.state('window').angular
        })

        afterEach(() => {
          cy.state('window').angular = this.angular
        })

        it('throws when model cannot be found', (done) => {
          cy.ng('model', 'not-found')

          cy.on('fail', (err) => {
            expect(err.message).to.include('Could not find element for model: \'not-found\'.  Searched [ng-model=\'not-found\'], [ng_model=\'not-found\'], [data-ng-model=\'not-found\'], [x-ng-model=\'not-found\'].')

            done()
          })
        })

        it('cancels additional finds when aborted', (done) => {
          cy.timeout(1000)
          cy.stub(Cypress.runner, 'stop')

          let retry = _.after(2, () => {
            Cypress.stop()
          })

          cy.on('command:retry', retry)

          cy.on('fail', (err) => done(err))

          cy.on('stop', () => {
            retry = cy.spy(cy, 'retry')

            return _.delay(() => {
              expect(retry.callCount).to.eq(0)

              done()
            }
            , 100)
          })

          cy.ng('model', 'not-found')
        })

        it('throws when cannot find angular', (done) => {
          delete cy.state('window').angular

          cy.on('fail', (err) => {
            expect(err.message).to.include('Angular global (`window.angular`) was not found in your window. You cannot use `cy.ng()` methods without angular.')

            done()
          })

          cy.ng('model', 'query')
        })
      })
    })
  })
})
