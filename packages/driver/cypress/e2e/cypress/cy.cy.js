const { $ } = Cypress

describe('driver/src/cypress/cy', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  // https://github.com/cypress-io/cypress/issues/7731
  // NOTE: this must remain the first test in the file
  // or it will not properly check for the described issue
  context('closing commands', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.logs.push(log)
      })

      return null
    })

    it('properly closes commands', function () {
      expect(true).to.be.true
      expect(this.logs.length).to.be.equal(1)
      expect(this.logs[0].toJSON()).to.have.property('type', 'parent')
    })
  })

  context('internals of custom commands', () => {
    let setup

    beforeEach(() => {
      setup = (fn = () => {}) => {
        Cypress.Commands.add('nested', () => {
          cy.url()
        })

        cy.nested().noop().then(() => fn())
      }
    })

    it('ensures to splice queue correctly on first custom command', () => {
      Cypress.Commands.add('login', () => {
        cy.get('input:first').type('foo')
      })

      const existing = cy.queue.names()

      cy.login().noop().then(() => {
        expect(cy.queue.names()).to.deep.eq(
          existing.concat(['login', 'get', 'type', 'noop', 'then']),
        )
      })
    })

    it('queues in the correct order', function () {
      const existing = cy.queue.names()

      setup(() => {
        expect(cy.queue.names()).to.deep.eq(
          existing.concat(['nested', 'url', 'noop', 'then']),
        )
      })
    })

    it('nested command should reference url as next property', function () {
      setup(() => {
        const nested = cy.queue.find({ name: 'nested' })

        expect(nested.get('next').get('name')).to.eq('url')
      })
    })

    it('null outs nestedIndex prior to restoring', function (done) {
      cy.on('command:queue:end', () => {
        expect(cy.state('nestedIndex')).to.be.null

        done()
      })

      setup()
    })

    it('can recursively nest', () => {
      Cypress.Commands.add('nest1', () => {
        cy.nest2()
      })

      Cypress.Commands.add('nest2', () => {
        cy.noop()
      })

      const existing = cy.queue.names()

      cy.nest1().then(() => {
        expect(cy.queue.names()).to.deep.eq(
          existing.concat(['nest1', 'nest2', 'noop', 'then']),
        )
      })
    })

    it('works with multiple nested commands', () => {
      Cypress.Commands.add('multiple', () => {
        cy.url().location().noop()
      })

      const existing = cy.queue.names()

      cy.multiple().then(() => {
        expect(cy.queue.names()).to.deep.eq(
          existing.concat(['multiple', 'url', 'location', 'noop', 'then']),
        )
      })
    })

    // TODO(webkit): fix+unskip for experimental webkit
    it('stores invocation stack for first command', { browser: '!webkit' }, () => {
      cy
      .get('input:first')
      .then(() => {
        const userInvocationStack = cy.queue.find({ name: 'get' }).get('userInvocationStack')

        expect(userInvocationStack).to.include('.cy.js')
      })
    })

    // TODO(webkit): fix+unskip for experimental webkit
    it('stores invocation stack for chained command', { browser: '!webkit' }, () => {
      cy
      .get('div')
      .find('input')
      .then(() => {
        const userInvocationStack = cy.queue.find({ name: 'find' }).get('userInvocationStack')

        expect(userInvocationStack).to.include('.cy.js')
      })
    })

    it('supports cy.state(\'subject\') for backwards compatability', () => {
      cy.stub(Cypress.utils, 'warning')
      const subject = {}

      cy.wrap(subject).then(() => {
        expect(cy.state('subject')).to.equal(subject)
        expect(Cypress.utils.warning).to.be.calledWith('`cy.state(\'subject\')` has been deprecated and will be removed in a future release. Consider migrating to `cy.subject()` instead.')
      })
    })
  })

  context('custom commands', () => {
    beforeEach(() => {
      Cypress.Commands.add('dashboard.selectRenderer', () => {
        cy.get('[contenteditable]').first()
      })

      Cypress.Commands.add('login', { prevSubject: true }, (subject, email) => {
        cy.wrap(subject.find('input:first')).type(email)
      })
    })

    it('works with custom commands', () => {
      const input = cy.$$('input:first')

      cy.get('input:first').parent()
      .command('login', 'brian@foo.com').then(($input) => {
        expect($input.get(0)).to.eq(input.get(0))
      })
    })

    it('works with namespaced commands', () => {
      const ce = cy.$$('[contenteditable]').first()

      cy.command('dashboard.selectRenderer').then(($ce) => {
        expect($ce.get(0)).to.eq(ce.get(0))
      })
    })

    // TODO(webkit): fix+unskip for experimental webkit
    describe('invocation stack', { browser: '!webkit' }, () => {
      beforeEach(() => {
        Cypress.Commands.add('getInput', () => cy.get('input'))
        Cypress.Commands.add('findInput', { prevSubject: 'element' }, (subject) => {
          subject.find('input')
        })
      })

      it('stores invocation stack for first command', () => {
        cy
        .getInput()
        .then(() => {
          const userInvocationStack = cy.queue.find({ name: 'getInput' }).get('userInvocationStack')

          expect(userInvocationStack).to.include('.cy.js')
        })
      })

      it('stores invocation stack for chained command', () => {
        cy
        .get('div')
        .findInput()
        .then(() => {
          const userInvocationStack = cy.queue.find({ name: 'findInput' }).get('userInvocationStack')

          expect(userInvocationStack).to.include('.cy.js')
        })
      })
    })

    describe('parent commands', () => {
      it('ignores existing subject', () => {
        Cypress.Commands.add('bar', (arg1, arg2) => {
          return [arg1, arg2]
        })

        cy.wrap('foo').bar(1, 2).then((arr) => {
          expect(arr).to.deep.eq([1, 2])
        })
      })
    })

    describe('child commands', () => {
      beforeEach(() => {
        Cypress.Commands.add('c', { prevSubject: true }, (subject, arg) => {
          cy.wrap([subject, arg])
        })

        Cypress.Commands.add('c2', { prevSubject: true }, (subject, arg) => {
          return [subject, arg]
        })

        Cypress.Commands.add('winOnly', { prevSubject: 'window' }, () => {})
        Cypress.Commands.add('docOnly', { prevSubject: 'document' }, () => {})
        Cypress.Commands.add('elOnly', { prevSubject: 'element' }, () => {})
        Cypress.Commands.add('elWinOnly', { prevSubject: ['element', 'window'] }, () => {})
      })

      it('is called with the correct ctx', function () {
        const ctx = this
        let expected = false

        Cypress.Commands.add('childCtx', { prevSubject: true }, function () {
          expect(this).to.equal(ctx)
          expected = true
        })

        cy.wrap(null).childCtx().then(() => {
          expect(expected).to.be.true
        })
      })

      it('inherits subjects', () => {
        cy
        .wrap('foo')
        .c('bar')
        .then((arr) => {
          expect(arr).to.deep.eq(['foo', 'bar'])

          return null
        })
        .c('baz')
        .then((arr) => {
          expect(arr).to.deep.eq([null, 'baz'])
        })
        .wrap('foo2')
        .c2('bar2')
        .then((arr) => {
          expect(arr).to.deep.eq(['foo2', 'bar2'])

          return null
        })
        .c('baz2')
        .then((arr) => {
          expect(arr).to.deep.eq([null, 'baz2'])
        })
      })

      it('fails when calling child command before parent', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Oops, it looks like you are trying to call a child command before running a parent command')
          expect(err.message).to.include('cy.c()')

          done()
        })

        cy.wrap('foo')

        cy.c()
      })

      it('fails when calling child command before parent with arguments', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Oops, it looks like you are trying to call a child command before running a parent command')
          expect(err.message).to.include('cy.c("bar")')

          done()
        })

        cy.wrap('foo')

        cy.c('bar')
      })

      it('fails when previous subject isnt window', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.winOnly()` failed because it requires the subject be a global `window` object.')
          expect(err.message).to.include('{foo: bar}')
          expect(err.message).to.include('> `cy.wrap()`')

          done()
        })

        cy.wrap({ foo: 'bar' }).winOnly()
      })

      it('fails when previous subject isnt document', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.docOnly()` failed because it requires the subject be a global `document` object.')
          expect(err.message).to.include('[1, 2, 3]')
          expect(err.message).to.include('> `cy.wrap()`')

          done()
        })

        cy.wrap([1, 2, 3]).docOnly()
      })

      it('fails when previous subject isnt an element or window', (done) => {
        let firstPassed = false

        cy.on('fail', (err) => {
          expect(firstPassed).to.be.true
          expect(err.message).to.include('`cy.elWinOnly()` failed because it requires a DOM element or window.')
          expect(err.message).to.include('string')
          expect(err.message).to.include('> `cy.wrap()`')

          done()
        })

        cy.window().elWinOnly()
        .then(() => {
          firstPassed = true

          cy.wrap('string').elWinOnly()
        })
      })
    })

    describe('dual commands', () => {
      beforeEach(() => {
        Cypress.Commands.add('d', { prevSubject: 'optional' }, (subject, arg) => {
          cy.wrap([subject, arg])
        })
      })

      it('passes on subject when used as a child', () => {
        cy
        .wrap('foo')
        .d('bar')
        .then((arr) => {
          expect(arr).to.deep.eq(['foo', 'bar'])
        })
      })

      it('has an undefined subject when used as a parent', () => {
        cy
        .d('bar')
        .then((arr) => {
          expect(arr).to.deep.eq([undefined, 'bar'])
        })
      })

      it('has an undefined subject as a parent with a previous parent', () => {
        cy.wrap('foo')

        cy
        .d('bar')
        .then((arr) => {
          expect(arr).to.deep.eq([undefined, 'bar'])
        })
        .wrap('foo')
        .d('bar')
        .then((arr) => {
          expect(arr).to.deep.eq(['foo', 'bar'])

          return null
        })
        .d('baz')
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

      Cypress.Commands.overwrite('each', (orig, subject, cb) => {
        subject = $([1])

        return orig(subject, cb)
      })

      Cypress.Commands.overwrite('noop', function (orig, fn) {
        // yield the context
        return fn(this)
      })

      Cypress.Commands.overwrite('submit', (orig, subject) => {
        return orig(subject, { foo: 'foo' })
      })
    })

    it('can modify parent commands', () => {
      cy.wrap('bar').then((str) => {
        expect(str).to.eq('foobar')
      })
    })

    it('can modify child commands', () => {
      cy.get('li').each((i) => {
        expect(i).to.eq(1)
      })
    })

    it('has the current runnable ctx', function () {
      const _this = this

      cy.noop((ctx) => {
        expect(_this === ctx).to.be.true
      })
    })

    it('overwrites only once', () => {
      Cypress.Commands.overwrite('wrap', (orig, arg1) => {
        return orig(`${arg1}baz`)
      })

      cy.wrap('bar').should('eq', 'barbaz')
    })

    it('errors when command does not exist', () => {
      const fn = () => {
        Cypress.Commands.overwrite('foo', () => {})
      }

      expect(fn).to.throw().with.property('message')
      .and.include('Cannot overwite command for: `foo`. An existing command does not exist by that name.')

      expect(fn).to.throw().with.property('docsUrl')
      .and.include('https://on.cypress.io/api')
    })

    it('updates state(\'current\') with modified args', () => {
      cy.get('form').eq(0).submit().then(() => {
        expect(cy.state('current').get('prev').get('args')[0].foo).to.equal('foo')
      })
    })

    // https://github.com/cypress-io/cypress/issues/18892
    it('passes this through to overwritten command', () => {
      Cypress.Commands.add('bar', function () {
        expect(this.test.title).to.exist
      })

      cy.bar()

      Cypress.Commands.overwrite('bar', function (originalFn) {
        return originalFn.call(this)
      })

      cy.bar()
    })
  })

  context('queries', {
    defaultCommandTimeout: 30,
  }, () => {
    it('throws when queries return a promise', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.promiseQuery()` failed because you returned a promise from a query.\n\nQueries must be synchronous functions that return a function. You cannot invoke commands or return promises inside of them.')
        done()
      })

      Cypress.Commands.addQuery('promiseQuery', () => Promise.resolve())
      cy.promiseQuery()
    })

    it('throws when a query returns a non-function value', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.badReturnQuery()` failed because you returned a value other than a function from a query.\n\nQueries must be synchronous functions that return a function.\n\nThe returned value was:\n\n  > `1`')
        done()
      })

      Cypress.Commands.addQuery('badReturnQuery', () => 1)
      cy.badReturnQuery()
    })

    it('throws when a command is invoked inside a query', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.commandQuery()` failed because you invoked a command inside a query.\n\nQueries must be synchronous functions that return a function. You cannot invoke commands or return promises inside of them.\n\nThe command invoked was:\n\n  > `cy.visit()`')
        done()
      })

      Cypress.Commands.addQuery('commandQuery', () => cy.visit('/'))
      cy.commandQuery()
    })

    it('custom commands that return query chainers retry', () => {
      Cypress.Commands.add('getButton', () => cy.get('button'))
      cy.on('command:retry', () => cy.$$('button').first().remove())

      cy.getButton().should('have.length', 23)
    })

    it('allows queries to use other queries', () => {
      const logs = []

      cy.on('log:added', (attrs, log) => logs.push(log))

      Cypress.Commands.addQuery('getButtonQuery', () => {
        cy.now('get', 'body')

        return cy.now('get', 'button')
      })

      Cypress.Commands.addQuery('queryQuery', () => cy.now('getButtonQuery'))

      cy.queryQuery().should('have.length', 24)
      cy.then(() => {
        // Length of 3: getButtonQuery.body (from get), getButtonQuery.button (from get), `should.have.length.24`
        expect(logs.length).to.eq(3)
      })
    })

    it('closes each log as the query completes', (done) => {
      let getLog

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'get') {
          getLog = log
        } else if (attrs.name === 'find') {
          expect(getLog.get('state')).to.eq('passed')
          done()
        }
      })

      cy.get('body').find('#wrapper')
    })

    it('ends all messages when query chain fails', (done) => {
      const logs = []

      cy.on('log:added', (attrs, log) => logs.push(log))

      cy.on('fail', (err) => {
        const state = logs.map((l) => l.get('state'))

        expect(state).to.eql(['passed', 'passed', 'passed', 'failed'])
        done()
      })

      cy.get('body').find('#specific-contains').children().should('have.class', 'active')
    })

    context('overwriting queries', () => {
      it('does not allow commands to overwrite queries', () => {
        const fn = () => Cypress.Commands.overwrite('get', () => {})

        expect(fn).to.throw().with.property('message')
        .and.include('Cannot overwite the `get` query. Queries can only be overwritten with `Cypress.Commands.overwriteQuery()`.')

        expect(fn).to.throw().with.property('docsUrl')
        .and.include('https://on.cypress.io/api')
      })

      it('does not allow queries to overwrite commands', () => {
        const fn = () => Cypress.Commands.overwriteQuery('click', () => {})

        expect(fn).to.throw().with.property('message')
        .and.include('Cannot overwite the `click` command. Commands can only be overwritten with `Cypress.Commands.overwrite()`.')

        expect(fn).to.throw().with.property('docsUrl')
        .and.include('https://on.cypress.io/api')
      })

      it('can call the originalFn', () => {
        // Ensure nothing gets confused when we overwrite the same query multiple times.
        // Both overwrites should succeed, layered on top of each other.

        let overwriteCalled = 0

        Cypress.Commands.overwriteQuery('get', function (originalFn, ...args) {
          overwriteCalled++

          return originalFn.call(this, ...args)
        })

        let secondOverwriteCalled = 0

        Cypress.Commands.overwriteQuery('get', function (originalFn, ...args) {
          secondOverwriteCalled++

          return originalFn.call(this, ...args)
        })

        cy.get('button').should('have.length', 24)
        cy.then(() => {
          expect(overwriteCalled).to.eq(1)
          expect(secondOverwriteCalled).to.eq(1)
        })
      })
    })
  })
})
