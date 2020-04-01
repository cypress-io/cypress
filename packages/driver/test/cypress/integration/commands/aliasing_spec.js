/* eslint-disable
    brace-style,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress)
const {
  _,
} = Cypress

describe('src/cy/commands/aliasing', function () {
  before(() => {
    return cy
    .visit('/fixtures/dom.html')
    .then(function (win) {
      this.body = win.document.body.outerHTML
    })
  })

  beforeEach(function () {
    const doc = cy.state('document')

    return $(doc.body).empty().html(this.body)
  })

  context('#as', function () {
    it('is special utility command', () => {
      return cy.wrap('foo').as('f').then(() => {
        const cmd = cy.queue.find({ name: 'as' })

        return expect(cmd.get('type')).to.eq('utility')
      })
    })

    it('does not change the subject', () => {
      const body = cy.$$('body')

      return cy.get('body').as('b').then(($body) => expect($body.get(0)).to.eq(body.get(0)))
    })

    it('stores the lookup as an alias', () => cy.get('body').as('b').then(() => expect(cy.state('aliases').b).to.exist))

    it('stores the resulting subject as the alias', () => {
      const $body = cy.$$('body')

      return cy.get('body').as('b').then(() => expect(cy.state('aliases').b.subject.get(0)).to.eq($body.get(0)))
    })

    it('stores subject of chained aliases', () => {
      const li = cy.$$('#list li').eq(0)

      return cy.get('#list li').eq(0).as('firstLi').then(($li) => expect($li).to.match(li))
    })

    it('retries primitives and assertions', () => {
      const obj = {}

      cy.on('command:retry', _.after(2, () => obj.foo = 'bar'))

      cy.wrap(obj).as('obj')

      return cy.get('@obj').should('deep.eq', { foo: 'bar' })
    })

    it('allows dot in alias names', () => {
      return cy.get('body').as('body.foo').then(() => {
        expect(cy.state('aliases')['body.foo']).to.exist

        return cy.get('@body.foo').should('exist')
      })
    })

    it('recognizes dot and non dot with same alias names', () => {
      cy.get('body').as('body').then(() => {
        expect(cy.state('aliases')['body']).to.exist

        return cy.get('@body').should('exist')
      })

      return cy.contains('foo').as('body.foo').then(() => {
        expect(cy.state('aliases')['body.foo']).to.exist
        cy.get('@body.foo').should('exist')

        return cy.get('@body.foo').then((bodyFoo) => cy.get('@body').should('not.equal', bodyFoo))
      })
    })

    context('DOM subjects', () => {
      return it('assigns the remote jquery instance', function () {
        const obj = {}

        const jquery = () => obj

        cy.state('jQuery', jquery)

        return cy.get('input:first').as('input').then(function ($input) {
          return expect(this.input).to.eq(obj)
        })
      })
    })

    context('#assign', function () {
      beforeEach(() => cy.noop('foo').as('foo'))

      afterEach(function () {
        if (!this.foo) {
          return this.test.error(new Error('this.foo not defined'))
        }
      })

      it('assigns subject to runnable ctx', () => {
        return cy
        .noop({}).as('baz').then(function (obj) {
          return expect(this.baz).to.eq(obj)
        })
      })

      it('assigns subject with dot to runnable ctx', () => {
        return cy.noop({}).as('bar.baz').then(function (obj) {
          return expect(this['bar.baz']).to.eq(obj)
        })
      })

      describe('nested hooks', function () {
        afterEach(function () {
          if (!this.bar) {
            this.test.error(new Error('this.bar not defined'))
          }

          if (!this.foo) {
            return this.test.error(new Error('this.foo not defined'))
          }
        })

        return it('assigns bar', () => cy.noop('bar').as('bar'))
      })

      return describe('nested functions', function () {
        beforeEach(function () {
          this.assign = () => {
            return cy.noop('quux').as('quux')
          }
        })

        afterEach(function () {
          if (!this.quux) {
            return this.test.error(new Error('this.quux not defined'))
          }
        })

        return it('shares this ctx with hooks', function () {
          return this.assign().then(function () {
            return expect(this.quux).to.eq('quux')
          })
        })
      })
    })

    describe('errors', () => {
      it('throws as a parent command', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('before running a parent command')
          expect(err.message).to.include('`cy.as("foo")`')

          return done()
        })

        return cy.as('foo')
      })

      _.each([null, undefined, {}, [], 123], (value) => {
        return it(`throws if when passed: ${value}`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.eq('`cy.as()` can only accept a string.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/as')

            return done()
          })

          return cy.get('div:first').as(value)
        })
      })

      it('throws on blank string', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.as()` cannot be passed an empty string.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/as')

          return done()
        })

        return cy.get('div:first').as('')
      })

      it('throws on alias starting with @ char', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`@myAlias` cannot be named starting with the `@` symbol. Try renaming the alias to `myAlias`, or something else that does not start with the `@` symbol.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/as')

          return done()
        })

        return cy.get('div:first').as('@myAlias')
      })

      it('throws on alias starting with @ char and dots', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`@my.alias` cannot be named starting with the `@` symbol. Try renaming the alias to `my.alias`, or something else that does not start with the `@` symbol.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/as')

          return done()
        })

        return cy.get('div:first').as('@my.alias')
      })

      it('does not throw on alias with @ char in non-starting position', () => {
        cy.get('div:first').as('my@Alias')

        return cy.get('@my@Alias')
      })

      return _.each(['test', 'runnable', 'timeout', 'slow', 'skip', 'inspect'], (blacklist) => {
        return it(`throws on a blacklisted word: ${blacklist}`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.eq(`\`cy.as()\` cannot be aliased as: \`${blacklist}\`. This word is reserved.`)
            expect(err.docsUrl).to.eq('https://on.cypress.io/as')

            return done()
          })

          return cy.get('div:first').as(blacklist)
        })
      })
    })

    return describe('log', function () {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('sets aliasType to \'primitive\'', () => {
        return cy.wrap({}).as('obj').then(function () {
          const {
            lastLog,
          } = this

          return expect(lastLog.get('aliasType')).to.eq('primitive')
        })
      })

      it('sets aliasType to \'dom\'', () => {
        return cy.get('body').find('button:first').click().as('button').then(function () {
          const {
            lastLog,
          } = this

          return expect(lastLog.get('aliasType')).to.eq('dom')
        })
      })

      it('aliases previous command / non event / matching chainerId', function () {
        Cypress.Commands.addAll({
          foo () {
            const cmd = Cypress.log({})

            return cy.get('ul:first li', { log: false }).first({ log: false }).then(($li) => {
              cmd.snapshot().end()

              return undefined
            })
          },
        })

        return cy.foo().as('foo').then(function () {
          const {
            lastLog,
          } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('alias')).to.eq('foo')

          return expect(lastLog.get('aliasType')).to.eq('dom')
        })
      })

      return it('does not match alias when the alias has already been applied', () => {
        return cy
        .visit('/fixtures/commands.html')
        .server()
        .route(/foo/, {}).as('getFoo')
        .then(function () {
        // 1 log from visit
        // 1 log from route
          expect(this.logs.length).to.eq(2)

          expect(this.logs[0].get('name')).to.eq('visit')
          expect(this.logs[0].get('alias')).not.to.be.ok
          expect(this.logs[0].get('aliasType')).not.to.be.ok

          expect(this.logs[1].get('name')).to.eq('route')

          return expect(this.logs[1].get('alias')).to.eq('getFoo')
        })
      })
    })
  })

  context('#replayCommandsFrom', function () {
    describe('subject in document', () => {
      return it('returns if subject is still in the document', () => {
        return cy
        .get('#list').as('list').then(() => {
          const currentLength = cy.queue.length

          return cy.get('@list').then(() => // should only add the .get() and the .then()
          {
            return expect(cy.queue.length).to.eq(currentLength + 2)
          })
        })
      })
    })

    return describe('subject not in document', function () {
      it('inserts into the queue', () => {
        const existingNames = cy.queue.names()

        return cy
        .get('#list li').eq(0).as('firstLi').then(($li) => $li.remove()).get('@firstLi').then(() => {
          return expect(cy.queue.names()).to.deep.eq(
            existingNames.concat(
              ['get', 'eq', 'as', 'then', 'get', 'get', 'eq', 'then'],
            ),
          )
        })
      })

      it('replays from last root to current', () => {
        const first = cy.$$('#list li').eq(0)
        const second = cy.$$('#list li').eq(1)

        return cy
        .get('#list li').eq(0).as('firstLi').then(($li) => {
          expect($li.get(0)).to.eq(first.get(0))

          return $li.remove()
        }).get('@firstLi').then(($li) => expect($li.get(0)).to.eq(second.get(0)))
      })

      it('replays up until first root command', () => {
        const existingNames = cy.queue.names()

        return cy
        .get('body').noop({})
        .get('#list li').eq(0).as('firstLi').then(($li) => $li.remove()).get('@firstLi').then(() => {
          return expect(cy.queue.names()).to.deep.eq(
            existingNames.concat(
              ['get', 'noop', 'get', 'eq', 'as', 'then', 'get', 'get', 'eq', 'then'],
            ),
          )
        })
      })

      it('resets the chainerId allow subjects to be carried on', () => {
        cy
        .get('#dom').find('#button').as('button').then(($button) => {
          $button.remove()

          cy.$$('#dom').append($('<button />', { id: 'button' }))

          return null
        })

        // when cy is a separate chainer there *was* a bug
        // that cause the subject to null because of different
        // chainer id's
        return cy.get('@button').then(($button) => expect($button).to.have.id('button'))
      })

      it('skips commands which did not change, and starts at the first valid subject or parent command', function () {
        const existingNames = cy.queue.names()

        cy.$$('#list li').click(function () {
          const ul = $(this).parent()
          const lis = ul.children().clone()

          // this simulates a re-render
          ul.children().remove()
          ul.append(lis)

          return lis.first().remove()
        })

        return cy
        .get('#list li')
        .then(($lis) => $lis).as('items')
        .first()
        .click()
        .as('firstItem')
        .then(() => {
          return expect(cy.queue.names()).to.deep.eq(
            existingNames.concat(
              ['get', 'then', 'as', 'first', 'click', 'as', 'then', 'get', 'should', 'then', 'get', 'should', 'then'],
            ),
          )
        }).get('@items')
        .should('have.length', 2)
        .then(() => {
          return expect(cy.queue.names()).to.deep.eq(
            existingNames.concat(
              ['get', 'then', 'as', 'first', 'click', 'as', 'then', 'get', 'get', 'should', 'then', 'get', 'should', 'then'],
            ),
          )
        }).get('@firstItem')
        .should('contain', 'li 1')
        .then(() => {
          return expect(cy.queue.names()).to.deep.eq(
            existingNames.concat(
              ['get', 'then', 'as', 'first', 'click', 'as', 'then', 'get', 'get', 'should', 'then', 'get', 'get', 'first', 'should', 'then'],
            ),
          )
        })
      })

      return it('inserts assertions', (done) => {
        const existingNames = cy.queue.names()

        return cy
        .get('#checkboxes input')
        .eq(0)
        .should('be.checked', 'cockatoo')
        .as('firstItem')
        .then(($input) => $input.remove()).get('@firstItem')
        .then(() => {
          expect(cy.queue.names()).to.deep.eq(
            existingNames.concat(
              ['get', 'eq', 'should', 'as', 'then', 'get', 'get', 'eq', 'should', 'then'],
            ),
          )

          return done()
        })
      })
    })
  })

  return context('#getAlias', () => {
    it('retrieves aliases', () => {
      return cy
      .get('body').as('b')
      .get('input:first').as('firstInput')
      .get('div:last').as('lastDiv')
      .then(() => expect(cy.getAlias('@firstInput')).to.exist)
    })

    return describe('errors', () => {
      it('throws when an alias cannot be found', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.get()` could not find a registered alias for: `@lastDiv`.\nAvailable aliases are: `b, firstInput`.')

          return done()
        })

        return cy
        .get('body').as('b')
        .get('input:first').as('firstInput')
        .get('@lastDiv')
      })

      return it('throws when alias is missing \'@\' but matches an available alias', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('Invalid alias: `getAny`.\nYou forgot the `@`. It should be written as: `@getAny`.')

          return done()
        })

        return cy
        .server()
        .route('*', {}).as('getAny')
        .wait('getAny').then(() => {})
      })
    })
  })
})
