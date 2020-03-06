/* eslint-disable
    no-unused-vars,
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

describe('driver/src/cypress/cy', () => {
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

  context('hard deprecated private props', () => {
    it('throws on accessing props', () => {
      const fn = () => {
        return cy.props.foo
      }

      expect(fn).to.throw('You are accessing a private property')

      expect(fn).to.throw('function: cy.state\(\.\.\.\)')
    })

    it('throws on accessing privates', () => {
      const fn = () => {
        return cy.privates.foo
      }

      expect(fn).to.throw('You are accessing a private property')

      expect(fn).to.throw('function: cy.state\(\.\.\.\)')
    })
  })

  context('internals of custom commands', () => {
    beforeEach(function () {
      this.setup = function (fn = function () {}) {
        Cypress.Commands.add('nested', () => {
          return cy.url()
        })

        return cy
        .nested()
        .noop()
        .then(() => {
          return fn()
        })
      }
    })

    it('ensures to splice queue correctly on first custom command', () => {
      Cypress.Commands.add('login', (email) => {
        return cy.get('input:first').type('foo')
      })

      const existing = cy.queue.names()

      return cy.login().noop().then(() => {
        expect(cy.queue.names()).to.deep.eq(
          existing.concat(['login', 'get', 'type', 'noop', 'then']),
        )
      })
    })

    it('queues in the correct order', function () {
      const existing = cy.queue.names()

      return this.setup(() => {
        expect(cy.queue.names()).to.deep.eq(
          existing.concat(['nested', 'url', 'noop', 'then']),
        )
      })
    })

    it('nested command should reference url as next property', function () {
      return this.setup(() => {
        const nested = cy.queue.find({ name: 'nested' })

        expect(nested.get('next').get('name')).to.eq('url')
      })
    })

    it('null outs nestedIndex prior to restoring', function (done) {
      cy.on('command:queue:end', () => {
        expect(cy.state('nestedIndex')).to.be.null

        return done()
      })

      return this.setup()
    })

    it('can recursively nest', () => {
      Cypress.Commands.add('nest1', () => {
        return cy.nest2()
      })

      Cypress.Commands.add('nest2', () => {
        return cy.noop()
      })

      const existing = cy.queue.names()

      return cy
      .nest1()
      .then(() => {
        expect(cy.queue.names()).to.deep.eq(
          existing.concat(['nest1', 'nest2', 'noop', 'then']),
        )
      })
    })

    it('works with multiple nested commands', () => {
      Cypress.Commands.add('multiple', () => {
        return cy
        .url()
        .location()
        .noop()
      })

      const existing = cy.queue.names()

      return cy
      .multiple()
      .then(() => {
        expect(cy.queue.names()).to.deep.eq(
          existing.concat(['multiple', 'url', 'location', 'noop', 'then']),
        )
      })
    })
  })

  context('custom commands', () => {
    beforeEach(() => {
      Cypress.Commands.add('dashboard.selectRenderer', () => {
        return cy
        .get('[contenteditable]')
        .first()
      })

      return Cypress.Commands.add('login', { prevSubject: true }, (subject, email) => {
        return cy
        .wrap(subject.find('input:first'))
        .type(email)
      })
    })

    it('works with custom commands', () => {
      const input = cy.$$('input:first')

      return cy
      .get('input:first')
      .parent()
      .command('login', 'brian@foo.com').then(($input) => {
        expect($input.get(0)).to.eq(input.get(0))
      })
    })

    it('works with namespaced commands', () => {
      const ce = cy.$$('[contenteditable]').first()

      return cy
      .command('dashboard.selectRenderer').then(($ce) => {
        expect($ce.get(0)).to.eq(ce.get(0))
      })
    })

    describe('parent commands', () => {
      it('ignores existing subject', () => {
        Cypress.Commands.add('bar', (arg1, arg2) => {
          return [arg1, arg2]
        })

        return cy.wrap('foo').bar(1, 2).then((arr) => {
          expect(arr).to.deep.eq([1, 2])
        })
      })
    })

    describe('child commands', () => {
      beforeEach(() => {
        Cypress.Commands.add('c', { prevSubject: true }, (subject, arg) => {
          return cy.wrap([subject, arg])
        })

        Cypress.Commands.add('c2', { prevSubject: true }, (subject, arg) => {
          return [subject, arg]
        })

        Cypress.Commands.add('winOnly', { prevSubject: 'window' }, () => {})

        Cypress.Commands.add('docOnly', { prevSubject: 'document' }, () => {})

        Cypress.Commands.add('elOnly', { prevSubject: 'element' }, () => {})

        return Cypress.Commands.add('elWinOnly', { prevSubject: ['element', 'window'] }, () => {})
      })

      it('is called with the correct ctx', function () {
        const ctx = this
        let expected = false

        Cypress.Commands.add('childCtx', { prevSubject: true }, function () {
          expect(this === ctx).to.be.true
          expected = true
        })

        return cy.wrap(null).childCtx().then(() => {
          expect(expected).to.be.true
        })
      })

      it('inherits subjects', () => {
        return cy
        .wrap('foo')
        .c('bar')
        .then((arr) => {
          expect(arr).to.deep.eq(['foo', 'bar'])

          return null
        }).c('baz')
        .then((arr) => {
          expect(arr).to.deep.eq([null, 'baz'])
        }).wrap('foo2')
        .c2('bar2')
        .then((arr) => {
          expect(arr).to.deep.eq(['foo2', 'bar2'])

          return null
        }).c('baz2')
        .then((arr) => {
          expect(arr).to.deep.eq([null, 'baz2'])
        })
      })

      it('fails when calling child command before parent', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Oops, it looks like you are trying to call a child command before running a parent command')
          expect(err.message).to.include('cy.c()')

          return done()
        })

        cy.wrap('foo')

        return cy.c()
      })

      it('fails when calling child command before parent with arguments', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Oops, it looks like you are trying to call a child command before running a parent command')
          expect(err.message).to.include('cy.c("bar")')

          return done()
        })

        cy.wrap('foo')

        return cy.c('bar')
      })

      it('fails when previous subject becomes detached', (done) => {
        cy.$$('#button').click(function () {
          return $(this).remove()
        })

        cy.on('fail', (err) => {
          expect(err.message).to.include('cy.parent() failed because this element is detached from the DOM.')
          expect(err.message).to.include('<button id="button">button</button>')
          expect(err.message).to.include('> cy.click()')

          return done()
        })

        return cy.get('#button').click().parent()
      })

      it('fails when previous subject isnt window', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('cy.winOnly() failed because it requires the subject be a global \'window\' object.')
          expect(err.message).to.include('{foo: bar}')
          expect(err.message).to.include('> cy.wrap()')

          return done()
        })

        return cy.wrap({ foo: 'bar' }).winOnly()
      })

      it('fails when previous subject isnt document', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('cy.docOnly() failed because it requires the subject be a global \'document\' object.')
          expect(err.message).to.include('[1, 2, 3]')
          expect(err.message).to.include('> cy.wrap()')

          return done()
        })

        return cy.wrap([1, 2, 3]).docOnly()
      })

      it('fails when previous subject isnt an element or window', (done) => {
        let firstPassed = false

        cy.on('fail', (err) => {
          expect(firstPassed).to.be.true
          expect(err.message).to.include('cy.elWinOnly() failed because it requires a DOM element.')
          expect(err.message).to.include('string')
          expect(err.message).to.include('> cy.wrap()')
          expect(err.message).to.include('All 2 subject validations failed')

          return done()
        })

        return cy.window().elWinOnly()
        .then(() => {
          firstPassed = true

          return cy.wrap('string').elWinOnly()
        })
      })
    })

    describe('dual commands', () => {
      beforeEach(() => {
        return Cypress.Commands.add('d', { prevSubject: 'optional' }, (subject, arg) => {
          return cy.wrap([subject, arg])
        })
      })

      it('passes on subject when used as a child', () => {
        return cy
        .wrap('foo')
        .d('bar')
        .then((arr) => {
          expect(arr).to.deep.eq(['foo', 'bar'])
        })
      })

      it('has an undefined subject when used as a parent', () => {
        return cy
        .d('bar')
        .then((arr) => {
          expect(arr).to.deep.eq([undefined, 'bar'])
        })
      })

      it('has an undefined subject as a parent with a previous parent', () => {
        cy.wrap('foo')

        return cy
        .d('bar')
        .then((arr) => {
          expect(arr).to.deep.eq([undefined, 'bar'])
        }).wrap('foo')
        .d('bar')
        .then((arr) => {
          expect(arr).to.deep.eq(['foo', 'bar'])

          return null
        }).d('baz')
        .then((arr) => {
          expect(arr).to.deep.eq([null, 'baz'])
        })
      })
    })
  })

  context('overwrite custom commands', () => {
    beforeEach(() => {
      Cypress.Commands.overwrite('wrap', (orig, arg1) => {
        return orig(`foo${arg1}`)
      })

      Cypress.Commands.overwrite('first', (orig, subject) => {
        subject = $([1, 2])

        return orig(subject)
      })

      Cypress.Commands.overwrite('noop', function (orig, fn) {
        // yield the context
        return fn(this)
      })

      return Cypress.Commands.overwrite('submit', (orig, subject) => {
        return orig(subject, { foo: 'foo' })
      })
    })

    it('can modify parent commands', () => {
      return cy.wrap('bar').then((str) => {
        expect(str).to.eq('foobar')
      })
    })

    it('can modify child commands', () => {
      return cy.get('li').first().then((el) => {
        expect(el[0]).to.eq(1)
      })
    })

    it('has the current runnable ctx', function () {
      const _this = this

      return cy.noop((ctx) => {
        expect(_this === ctx).to.be.true
      })
    })

    it('overwrites only once', () => {
      Cypress.Commands.overwrite('wrap', (orig, arg1) => {
        return orig(`${arg1}baz`)
      })

      return cy.wrap('bar').should('eq', 'barbaz')
    })

    it('errors when command does not exist', () => {
      const fn = () => {
        return Cypress.Commands.overwrite('foo', () => {})
      }

      expect(fn).to.throw('Cannot overwite command for: \'foo\'. An existing command does not exist by that name.')
    })

    it('updates state(\'current\') with modified args', () => {
      return cy.get('form').eq(0).submit().then(() => {
        expect(cy.state('current').get('prev').get('args')[0].foo).to.equal('foo')
      })
    })
  })
})
