import { assertLogLength } from '../../support/utils'
const { _ } = Cypress

describe('src/cy/commands/aliasing', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  context('#as', () => {
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

    it('stores the resulting subject chain as the alias', () => {
      cy.get('body').as('b').then(() => {
        const { subjectChain } = cy.state('aliases').b

        expect(subjectChain.length).to.eql(2)
        expect(subjectChain[0]).to.be.undefined
        expect(subjectChain[1].commandName).to.eq('get')
      })
    })

    it('stores subject of chained aliases', () => {
      const li = cy.$$('#list li').eq(0)

      cy.get('#list li').eq(0).as('firstLi').then(($li) => {
        expect($li[0]).to.eq(li[0])
      })
    })

    it('retries previous commands invoked inside custom commands', () => {
      // @ts-expect-error TODO: add types need updating to not error with string here
      Cypress.Commands.add('get2', (selector: string) => cy.get(selector))

      // @ts-expect-error - we are testing custom command, ignore types for now
      cy.get2('body').children('div').as('divs')
      cy.visit('/fixtures/dom.html')

      cy.get('@divs')
    })

    it('retries primitives and assertions', () => {
      const obj: any = {}

      cy.on('command:retry', _.after(2, () => {
        obj.foo = 'bar'
      }))

      cy.wrap(obj).as('obj')

      cy.get('@obj').should('deep.eq', { foo: 'bar' })
    })

    it('allows users to store a static value', () => {
      const obj = { foo: 'bar' }

      cy.wrap(obj).its('foo').as('alias1', { type: 'static' })
      cy.wrap(obj).its('foo').as('alias2', { type: 'query' })

      cy.then(() => {
        obj.foo = 'baz'
      })

      cy.get('@alias1').should('eq', 'bar')
      cy.get('@alias2').should('eq', 'baz')
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

    it('retries previous commands invoked inside custom commands', () => {
      // @ts-expect-error TODO: add types need updating to not error with string here
      Cypress.Commands.add('get2', (selector: string) => cy.get(selector))

      // @ts-expect-error - we are testing custom command, ignore types for now
      cy.get2('body').children('div').as('divs')
      cy.visit('/fixtures/dom.html')

      cy.get('@divs')
    })

    context('#assign', () => {
      beforeEach(() => {
        return cy.noop('foo').as('foo')
      })

      afterEach(function () {
        if (!this.foo) {
          // @ts-expect-error TODO: mocha Runnable is not expecting error here
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
            // @ts-expect-error TODO: mocha Runnable is not expecting error here
            this.test.error(new Error('this.bar not defined'))
          }

          if (!this.foo) {
            // @ts-expect-error TODO: mocha Runnable is not expecting error here
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
            // @ts-expect-error TODO: mocha Runnable is not expecting error here
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

          // @ts-expect-error - testing invalid value
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

      it('throws when given non-object options', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq(`\`cy.as()\` only accepts an options object for its second argument. You passed: \`wut?\``)
          expect(err.docsUrl).to.eq('https://on.cypress.io/as')

          done()
        })

        // @ts-expect-error - testing invalid options
        cy.wrap({}).as('value', 'wut?')
      })

      it('throws when given invalid `type`', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq(`\`cy.as()\` only accepts a \`type\` of \`'query'\` or \`'static'\`. You passed: \`wut?\``)
          expect(err.docsUrl).to.eq('https://on.cypress.io/as')

          done()
        })

        // @ts-expect-error - testing invalid options
        cy.wrap({}).as('value', { type: 'wut?' })
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
              cmd?.snapshot().end()

              return undefined
            })
          },
        })

        // @ts-expect-error - testing custom command so not worried about types here
        cy.foo().as('foo').then(function () {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('alias')).to.eq('@foo')
          expect(lastLog.get('aliasType')).to.eq('dom')
        })
      })

      it('includes the alias `type` when set to `static`', () => {
        cy.wrap({}).as('foo', { type: 'static' }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('alias')).to.eq('@foo (static)')
        })
      })

      it('does not match alias when the alias has already been applied', () => {
        cy
        .visit('/fixtures/commands.html')
        .intercept(/foo/, {}).as('getFoo')
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
          expect(cy.getAlias('@myAlias')).to.exist
          expect(cy.getAlias('@myAlias').subjectChain).to.eql(['alias value'])
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
          expect(wrapCalled).to.be.true
          expect(cy.getAlias('@myAlias')).to.exist
          expect(cy.getAlias('@myAlias').subjectChain).to.eql(['alias value'])
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
          expect(cy.getAlias('@myAlias')).to.exist
          expect(cy.getAlias('@myAlias').subjectChain).to.eql(['alias value'])
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
          expect(subj).to.equal(2)
          expect(this).to.not.be.undefined
          expect(this.myAlias).to.eq(1)
        })
      })

      it('works with .then function overwrite', () => {
        // use explicit arguments and Function.prototype.call
        Cypress.Commands.overwrite('then', function (originalCommand, subject, fn, options = {}) {
          // @ts-expect-error TODO: not expecting 4 args here
          return originalCommand.call(null, subject, options, fn)
        })

        cy.wrap(1).as('myAlias')
        cy.wrap(2).then(function (subj) {
          expect(subj).to.equal(2)
          expect(this).to.not.be.undefined
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
          expect(subj).to.equal(2)
          expect(this).to.not.be.undefined
          expect(this.myAlias).to.eq(1)
        })
      })
    })
  })

  context('#replaying subjects', () => {
    it('returns if subject is still in the document', () => {
      cy.get('#list').as('list').then((firstList) => {
        cy.get('@list').then((secondList) => {
          expect(firstList).to.eql(secondList)
        })
      })
    })

    it('requeries when reading alias', () => {
      cy
      .get('#list li')
      .as('items').then((firstItems) => {
        cy.$$('#list').append('<li class="foobar">123456789</li>')

        cy.get('@items').then((secondItems) => {
          expect(firstItems).to.have.length(3)
          expect(secondItems).to.have.length(4)
        })
      })
    })

    it('requeries when subject is not in the DOM', () => {
      cy
      .get('#list li')
      .as('items').then((firstItems) => {
        firstItems.remove()
        setTimeout(() => {
          cy.$$('#list').append('<li class="foobar">123456789</li>')
        }, 50)

        cy.get('@items').then((secondItems) => {
          expect(secondItems).to.have.length(1)
        })
      })
    })

    it('only retries up to last command', () => {
      cy
      .get('#list li')
      .then((items) => items.length)
      .as('itemCount')
      .then(() => cy.$$('#list li').remove())

      // Even though the list items have been removed from the DOM, 'then' can't be retried
      // so we just have the primitive value "3" as our subject.
      cy.get('@itemCount').should('eq', 3)
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

    it('maintains .within() context while reading aliases', () => {
      cy.get('#nested-div').within(() => {
        cy.get('span').as('spanWithin').should('have.length', 1)
      })

      cy.get('@spanWithin').should('have.length', 1)
    })
  })
})
