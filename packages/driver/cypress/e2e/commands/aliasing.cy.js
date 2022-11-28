const { assertLogLength } = require('../../support/utils')
const { _, $ } = Cypress

describe('src/cy/commands/aliasing', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  context('#as', () => {
    it('is special utility command', () => {
      cy.wrap('foo').as('f').then(() => {
        const cmd = cy.queue.find({ name: 'as' })

        expect(cmd.get('type')).to.eq('utility')
      })
    })

    it('does not change the subject', () => {
      const body = cy.$$('body')

      cy.get('body').as('b').then(($body) => {
        expect($body.get(0)).to.eq(body.get(0))
      })
    })

    it('stores the lookup as an alias', () => {
      cy.get('body').as('b').then(() => {
        expect(cy.state('aliases').b).to.exist
      })
    })

    it('stores the lookup as an alias when .then() is an intermediate', () => {
      cy.get('body').then(() => {}).as('body')
      cy.get('@body')
    })

    it('stores the resulting subject as the alias', () => {
      const $body = cy.$$('body')

      cy.get('body').as('b').then(() => {
        expect(cy.state('aliases').b.subject.get(0)).to.eq($body.get(0))
      })
    })

    it('stores subject of chained aliases', () => {
      const li = cy.$$('#list li').eq(0)

      cy.get('#list li').eq(0).as('firstLi').then(($li) => {
        expect($li).to.match(li)
      })
    })

    it('retries primitives and assertions', () => {
      const obj = {}

      cy.on('command:retry', _.after(2, () => {
        obj.foo = 'bar'
      }))

      cy.wrap(obj).as('obj')

      cy.get('@obj').should('deep.eq', { foo: 'bar' })
    })

    it('allows dot in alias names', () => {
      cy.get('body').as('body.foo').then(() => {
        expect(cy.state('aliases')['body.foo']).to.exist

        cy.get('@body.foo').should('exist')
      })
    })

    it('recognizes dot and non dot with same alias names', () => {
      cy.get('body').as('body').then(() => {
        expect(cy.state('aliases')['body']).to.exist

        cy.get('@body').should('exist')
      })

      cy.contains('foo').as('body.foo').then(() => {
        expect(cy.state('aliases')['body.foo']).to.exist
        cy.get('@body.foo').should('exist')

        cy.get('@body.foo').then((bodyFoo) => {
          cy.get('@body').should('not.equal', bodyFoo)
        })
      })
    })

    context('DOM subjects', () => {
      it('assigns the remote jquery instance', () => {
        const obj = {}

        const jquery = () => {
          return obj
        }

        cy.state('jQuery', jquery)

        cy.get('input:first').as('input').then(function () {
          expect(this.input).to.eq(obj)
        })
      })

      it('retries previous commands invoked inside custom commands', () => {
        Cypress.Commands.add('get2', (selector) => cy.get(selector))

        cy.get2('body').children('div').as('divs')
        cy.visit('/fixtures/dom.html')

        cy.get('@divs')
      })
    })

    context('#assign', () => {
      beforeEach(() => {
        return cy.noop('foo').as('foo')
      })

      afterEach(function () {
        if (!this.foo) {
          this.test.error(new Error('this.foo not defined'))
        }
      })

      it('assigns subject to runnable ctx', () => {
        cy
        .noop({}).as('baz').then(function (obj) {
          expect(this.baz).to.eq(obj)
        })
      })

      it('assigns subject with dot to runnable ctx', () => {
        cy.noop({}).as('bar.baz').then(function (obj) {
          expect(this['bar.baz']).to.eq(obj)
        })
      })

      describe('nested hooks', () => {
        afterEach(function () {
          if (!this.bar) {
            this.test.error(new Error('this.bar not defined'))
          }

          if (!this.foo) {
            this.test.error(new Error('this.foo not defined'))
          }
        })

        it('assigns bar', () => {
          cy.noop('bar').as('bar')
        })
      })

      describe('nested functions', () => {
        beforeEach(function () {
          this.assign = () => {
            return cy.noop('quux').as('quux')
          }
        })

        afterEach(function () {
          if (!this.quux) {
            this.test.error(new Error('this.quux not defined'))
          }
        })

        it('shares this ctx with hooks', function () {
          this.assign().then(function () {
            expect(this.quux).to.eq('quux')
          })
        })
      })
    })

    describe('errors', () => {
      it('throws as a parent command', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('before running a parent command')
          expect(err.message).to.include('`cy.as("foo")`')

          done()
        })

        cy.as('foo')
      })

      _.each([null, undefined, {}, [], 123], (value) => {
        it(`throws if when passed: ${value}`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.eq('`cy.as()` can only accept a string.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/as')

            done()
          })

          cy.get('div:first').as(value)
        })
      })

      it('throws on blank string', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.as()` cannot be passed an empty string.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/as')

          done()
        })

        cy.get('div:first').as('')
      })

      it('throws on alias starting with @ char', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`@myAlias` cannot be named starting with the `@` symbol. Try renaming the alias to `myAlias`, or something else that does not start with the `@` symbol.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/as')

          done()
        })

        cy.get('div:first').as('@myAlias')
      })

      it('throws on alias starting with @ char and dots', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`@my.alias` cannot be named starting with the `@` symbol. Try renaming the alias to `my.alias`, or something else that does not start with the `@` symbol.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/as')

          done()
        })

        cy.get('div:first').as('@my.alias')
      })

      it('does not throw on alias with @ char in non-starting position', () => {
        cy.get('div:first').as('my@Alias')

        cy.get('@my@Alias')
      })

      _.each(['test', 'runnable', 'timeout', 'slow', 'skip', 'inspect'], (reserved) => {
        it(`throws on a reserved word: ${reserved}`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.eq(`\`cy.as()\` cannot be aliased as: \`${reserved}\`. This word is reserved.`)
            expect(err.docsUrl).to.eq('https://on.cypress.io/as')

            done()
          })

          cy.get('div:first').as(reserved)
        })
      })
    })

    describe('log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('sets aliasType to \'primitive\'', () => {
        cy.wrap({}).as('obj').then(function () {
          const { lastLog } = this

          expect(lastLog.get('aliasType')).to.eq('primitive')
        })
      })

      it('sets aliasType to \'dom\'', () => {
        cy.get('body').find('button:first').click().as('button').then(function () {
          const { lastLog } = this

          expect(lastLog.get('aliasType')).to.eq('dom')
        })
      })

      it('aliases previous command / non event / matching chainerId', () => {
        Cypress.Commands.addAll({
          foo () {
            const cmd = Cypress.log({})

            cy.get('ul:first li', { log: false }).first({ log: false }).then(($li) => {
              cmd.snapshot().end()

              return undefined
            })
          },
        })

        cy.foo().as('foo').then(function () {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('alias')).to.eq('foo')
          expect(lastLog.get('aliasType')).to.eq('dom')
        })
      })

      it('does not match alias when the alias has already been applied', () => {
        cy
        .visit('/fixtures/commands.html')
        .server()
        .route(/foo/, {}).as('getFoo')
        .then(function () {
          // 1 log from visit
          // 1 log from route
          assertLogLength(this.logs, 2)

          expect(this.logs[0].get('name')).to.eq('visit')
          expect(this.logs[0].get('alias')).not.to.be.ok
          expect(this.logs[0].get('aliasType')).not.to.be.ok

          expect(this.logs[1].get('name')).to.eq('route')
          expect(this.logs[1].get('alias')).to.eq('getFoo')
        })
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/5101
    context('works with command overwrite', () => {
      it('works without overwrite', () => {
        // sanity check without command overwrite
        cy.wrap('alias value').as('myAlias')
        .then(() => {
          expect(cy.getAlias('@myAlias'), 'alias exists').to.exist
          expect(cy.getAlias('@myAlias'), 'alias value')
          .to.have.property('subject', 'alias value')
        })
        .then(() => {
          // cy.get returns the alias
          cy.get('@myAlias').should('be.equal', 'alias value')
        })
      })

      it('works with wrap', () => {
        let wrapCalled

        Cypress.Commands.overwrite('wrap', (wrapFn, value) => {
          wrapCalled = true

          return wrapFn(value)
        })

        cy.wrap('alias value').as('myAlias')
        .then(() => {
          expect(wrapCalled, 'overwrite was called').to.be.true
          expect(cy.getAlias('@myAlias'), 'alias exists').to.exist
          expect(cy.getAlias('@myAlias'), 'alias value')
          .to.have.property('subject', 'alias value')
        })
        .then(() => {
          // verify cy.get works in arrow function
          cy.get('@myAlias').should('be.equal', 'alias value')
        })
        .then(function () {
          // verify cy.get works in regular function
          cy.get('@myAlias').should('be.equal', 'alias value')
        })
      })

      it('works with wrap.then', () => {
        let wrapCalled
        let thenCalled

        Cypress.Commands.overwrite('wrap', (wrapFn, value) => {
          wrapCalled = true

          return cy.log(`wrapped "${value}"`).then(() => {
            thenCalled = true

            return wrapFn(value)
          })
        })

        cy.wrap('alias value').as('myAlias')
        .then(() => {
          expect(wrapCalled, 'overwrite was called').to.be.true
          expect(thenCalled, 'then was called').to.be.true
          expect(cy.getAlias('@myAlias'), 'alias exists').to.exist
          expect(cy.getAlias('@myAlias'), 'alias value')
          .to.have.property('subject', 'alias value')
        })
        .then(() => {
          // verify cy.get works in arrow function
          cy.get('@myAlias').should('be.equal', 'alias value')
        })
        .then(function () {
          // verify cy.get works in regular function
          cy.get('@myAlias').should('be.equal', 'alias value')
        })
      })

      it('passes this to then callback function', () => {
        // sanity test before the next one
        cy.wrap(1).as('myAlias')
        cy.wrap(2).then(function (subj) {
          expect(subj, 'subject').to.equal(2)
          expect(this, 'this is defined').to.not.be.undefined
          expect(this.myAlias, 'this has the alias as a property').to.eq(1)
        })
      })

      it('works with .then function overwrite', () => {
        // use explicit arguments and Function.prototype.call
        Cypress.Commands.overwrite('then', function (originalCommand, subject, fn, options = {}) {
          return originalCommand.call(null, subject, options, fn)
        })

        cy.wrap(1).as('myAlias')
        cy.wrap(2).then(function (subj) {
          expect(subj, 'subject').to.equal(2)
          expect(this, 'this is defined').to.not.be.undefined
          expect(this.myAlias).to.eq(1)
        })
      })

      it('works with .then arrow overwrite', () => {
        // make sure we can pass arrow functions
        Cypress.Commands.overwrite('then', (originalCommand, ...args) => {
          return originalCommand(...args)
        })

        cy.wrap(1).as('myAlias')
        cy.wrap(2).then(function (subj) {
          expect(subj, 'subject').to.equal(2)
          expect(this, 'this is defined').to.not.be.undefined
          expect(this.myAlias).to.eq(1)
        })
      })
    })
  })

  context('#replayCommandsFrom', () => {
    describe('subject in document', () => {
      it('returns if subject is still in the document', () => {
        cy.get('#list').as('list').then(() => {
          const currentLength = cy.queue.length

          cy.get('@list').then(() => {
            // should only add the .get() and the .then()
            expect(cy.queue.length).to.eq(currentLength + 2)
          })
        })
      })
    })

    describe('subject not in document', () => {
      it('inserts into the queue', () => {
        const existingNames = cy.queue.names()

        cy
        .get('#list li').eq(0).as('firstLi').then(($li) => {
          return $li.remove()
        })
        .get('@firstLi').then(() => {
          expect(cy.queue.names()).to.deep.eq(
            existingNames.concat(
              ['get', 'eq', 'as', 'then', 'get', 'get', 'eq', 'then'],
            ),
          )
        })
      })

      it('replays from last root to current', () => {
        const first = cy.$$('#list li').eq(0)
        const second = cy.$$('#list li').eq(1)

        cy
        .get('#list li').eq(0).as('firstLi').then(($li) => {
          expect($li.get(0)).to.eq(first.get(0))

          return $li.remove()
        })
        .get('@firstLi').then(($li) => {
          expect($li.get(0)).to.eq(second.get(0))
        })
      })

      it('replays up until first root command', () => {
        const existingNames = cy.queue.names()

        cy
        .get('body').noop({})
        .get('#list li').eq(0).as('firstLi').then(($li) => {
          return $li.remove()
        })
        .get('@firstLi').then(() => {
          expect(cy.queue.names()).to.deep.eq(
            existingNames.concat(
              ['get', 'noop', 'get', 'eq', 'as', 'then', 'get', 'get', 'eq', 'then'],
            ),
          )
        })
      })

      it('resets the chainerId allow subjects to be carried on', () => {
        cy.get('#dom').find('#button').as('button').then(($button) => {
          $button.remove()

          cy.$$('#dom').append($('<button />', { id: 'button' }))

          return null
        })

        // when cy is a separate chainer there *was* a bug
        // that cause the subject to null because of different
        // chainer id's
        cy.get('@button').then(($button) => {
          expect($button).to.have.id('button')
        })
      })

      it('skips commands which did not change, and starts at the first valid subject or parent command', () => {
        const existingNames = cy.queue.names()

        cy.$$('#list li').click(function () {
          const ul = $(this).parent()
          const lis = ul.children().clone()

          // this simulates a re-render
          ul.children().remove()
          ul.append(lis)

          return lis.first().remove()
        })

        cy
        .get('#list li')
        .then(($lis) => {
          return $lis
        })
        .as('items')
        .first()
        .click()
        .as('firstItem')
        .then(() => {
          expect(cy.queue.names()).to.deep.eq(
            existingNames.concat(
              ['get', 'then', 'as', 'first', 'click', 'as', 'then', 'get', 'should', 'then', 'get', 'should', 'then'],
            ),
          )
        })
        .get('@items')
        .should('have.length', 2)
        .then(() => {
          expect(cy.queue.names()).to.deep.eq(
            existingNames.concat(
              ['get', 'then', 'as', 'first', 'click', 'as', 'then', 'get', 'get', 'should', 'then', 'get', 'should', 'then'],
            ),
          )
        })
        .get('@firstItem')
        .should('contain', 'li 1')
        .then(() => {
          expect(cy.queue.names()).to.deep.eq(
            existingNames.concat(
              ['get', 'then', 'as', 'first', 'click', 'as', 'then', 'get', 'get', 'should', 'then', 'get', 'get', 'first', 'should', 'then'],
            ),
          )
        })
      })

      it('inserts assertions', (done) => {
        const existingNames = cy.queue.names()

        cy
        .get('#checkboxes input')
        .eq(0)
        .should('be.checked', 'cockatoo')
        .as('firstItem')
        .then(($input) => {
          return $input.remove()
        })
        .get('@firstItem')
        .then(() => {
          expect(cy.queue.names()).to.deep.eq(
            existingNames.concat(
              ['get', 'eq', 'should', 'as', 'then', 'get', 'get', 'eq', 'should', 'then'],
            ),
          )

          done()
        })
      })
    })
  })

  context('#getAlias', () => {
    it('retrieves aliases', () => {
      cy
      .get('body').as('b')
      .get('input:first').as('firstInput')
      .get('div:last').as('lastDiv')
      .then(() => {
        expect(cy.getAlias('@firstInput')).to.exist
      })
    })

    describe('errors', () => {
      it('throws when an alias cannot be found', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.get()` could not find a registered alias for: `@lastDiv`.\nAvailable aliases are: `b, firstInput`.')

          done()
        })

        cy
        .get('body').as('b')
        .get('input:first').as('firstInput')
        .get('@lastDiv')
      })
    })
  })
})
