import { stripIndent } from 'common-tags'
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
        // @ts-expect-error - custom command names are not in the Chainable types
        Cypress.Commands.add('nested', () => {
          cy.url()
        })

        // @ts-expect-error - custom command names are not in the Chainable types
        cy.nested().noop().then(() => fn())
      }
    })

    it('ensures to splice queue correctly on first custom command', () => {
      // @ts-expect-error - custom command names are not in the Chainable types
      Cypress.Commands.add('login', () => {
        cy.get('input:first').type('foo')
      })

      const existing = cy.queue.names()

      // @ts-expect-error - custom command names are not in the Chainable types
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
      // @ts-expect-error - custom command names are not in the Chainable types
      Cypress.Commands.add('nest1', () => {
        // @ts-expect-error - custom command names are not in the Chainable types
        cy.nest2()
      })

      // @ts-expect-error - custom command names are not in the Chainable types
      Cypress.Commands.add('nest2', () => {
        cy.noop()
      })

      const existing = cy.queue.names()

      // @ts-expect-error - custom command names are not in the Chainable types
      cy.nest1().then(() => {
        expect(cy.queue.names()).to.deep.eq(
          existing.concat(['nest1', 'nest2', 'noop', 'then']),
        )
      })
    })

    it('works with multiple nested commands', () => {
      // @ts-expect-error - custom command names are not in the Chainable types
      Cypress.Commands.add('multiple', () => {
        // @ts-expect-error - noop is an internal command and is not in the Chainable types
        cy.url().location().noop()
      })

      const existing = cy.queue.names()

      // @ts-expect-error - custom command names are not in the Chainable types
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

        expect(userInvocationStack).to.include('.cy.ts')
      })
    })

    // TODO(webkit): fix+unskip for experimental webkit
    it('stores invocation stack for chained command', { browser: '!webkit' }, () => {
      cy
      .get('div')
      .find('input')
      .then(() => {
        const userInvocationStack = cy.queue.find({ name: 'find' }).get('userInvocationStack')

        expect(userInvocationStack).to.include('.cy.ts')
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
      // @ts-expect-error - custom command names are not in the Chainable types
      Cypress.Commands.add('dashboard.selectRenderer', () => {
        cy.get('[contenteditable]').first()
      })

      // @ts-expect-error - custom command names are not in the Chainable types
      Cypress.Commands.add('login', { prevSubject: true }, (subject: JQuery, email: string) => {
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
        // @ts-expect-error - custom command names are not in the Chainable types
        Cypress.Commands.add('getInput', () => cy.get('input'))
        // @ts-expect-error - custom command names are not in the Chainable types
        Cypress.Commands.add('findInput', { prevSubject: 'element' }, (subject: JQuery) => {
          subject.find('input')
        })
      })

      it('stores invocation stack for first command', () => {
        cy
        // @ts-expect-error - custom command names are not in the Chainable types
        .getInput()
        .then(() => {
          const userInvocationStack = cy.queue.find({ name: 'getInput' }).get('userInvocationStack')

          expect(userInvocationStack).to.include('.cy.ts')
        })
      })

      it('stores invocation stack for chained command', () => {
        cy
        .get('div')
        // @ts-expect-error - custom command names are not in the Chainable types
        .findInput()
        .then(() => {
          const userInvocationStack = cy.queue.find({ name: 'findInput' }).get('userInvocationStack')

          expect(userInvocationStack).to.include('.cy.ts')
        })
      })
    })

    describe('parent commands', () => {
      it('ignores existing subject', () => {
        // @ts-expect-error - custom command names are not in the Chainable types
        Cypress.Commands.add('bar', (arg1, arg2) => {
          return [arg1, arg2]
        })

        // @ts-expect-error - custom command names are not in the Chainable types
        cy.wrap('foo').bar(1, 2).then((arr) => {
          expect(arr).to.deep.eq([1, 2])
        })
      })
    })

    describe('child commands', () => {
      beforeEach(() => {
        // @ts-expect-error - custom command names are not in the Chainable types
        Cypress.Commands.add('c', { prevSubject: true }, (subject, arg) => {
          cy.wrap([subject, arg])
        })

        // @ts-expect-error - custom command names are not in the Chainable types
        Cypress.Commands.add('c2', { prevSubject: true }, (subject, arg) => {
          return [subject, arg]
        })

        // @ts-expect-error - custom command names are not in the Chainable types
        Cypress.Commands.add('winOnly', { prevSubject: 'window' }, () => {})
        // @ts-expect-error - custom command names are not in the Chainable types
        Cypress.Commands.add('docOnly', { prevSubject: 'document' }, () => {})
        // @ts-expect-error - custom command names are not in the Chainable types
        Cypress.Commands.add('elOnly', { prevSubject: 'element' }, () => {})
        // @ts-expect-error - custom command names are not in the Chainable types
        Cypress.Commands.add('elWinOnly', { prevSubject: ['element', 'window'] }, () => {})
      })

      it('is called with the correct ctx', function () {
        const ctx = this
        let expected = false

        // @ts-expect-error - custom command names are not in the Chainable types
        Cypress.Commands.add('childCtx', { prevSubject: true }, function () {
          expect(this).to.equal(ctx)
          expected = true
        })

        // @ts-expect-error - custom command names are not in the Chainable types
        cy.wrap(null).childCtx().then(() => {
          expect(expected).to.be.true
        })
      })

      it('inherits subjects', () => {
        cy
        .wrap('foo')
        // @ts-expect-error - custom command names are not in the Chainable types
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
          expect(err.message).to.include('`cy.c()` failed because it is not chained off a command that yields a subject.')

          done()
        })

        cy.wrap('foo')

        // @ts-expect-error - custom command names are not in the Chainable types
        cy.c()
      })

      it('fails when calling child command before parent with arguments', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq(stripIndent`\
            \`cy.c("bar")\` failed because it is not chained off a command that yields a subject.

            \`cy.c()\` runs on the subject yielded by the command it is chained off, so calling it directly off \`cy\` gives it no subject. Chain it off a command that yields a subject, such as \`cy.get()\` or \`cy.wrap()\`.`)

          expect(err.docsUrl).to.eq('https://on.cypress.io/introduction-to-cypress')

          done()
        })

        cy.wrap('foo')

        // @ts-expect-error - custom command names are not in the Chainable types
        cy.c('bar')
      })

      it('fails when previous subject isnt window', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.winOnly()` failed because it requires the subject be a global `window` object.')
          expect(err.message).to.include('{foo: bar}')
          expect(err.message).to.include('> `cy.wrap()`')

          done()
        })

        // @ts-expect-error - custom command names are not in the Chainable types
        cy.wrap({ foo: 'bar' }).winOnly()
      })

      it('fails when previous subject isnt document', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.docOnly()` failed because it requires the subject be a global `document` object.')
          expect(err.message).to.include('[1, 2, 3]')
          expect(err.message).to.include('> `cy.wrap()`')

          done()
        })

        // @ts-expect-error - custom command names are not in the Chainable types
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

        // @ts-expect-error - custom command names are not in the Chainable types
        cy.window().elWinOnly()
        .then(() => {
          firstPassed = true

          // @ts-expect-error - custom command names are not in the Chainable types
          cy.wrap('string').elWinOnly()
        })
      })
    })

    describe('dual commands', () => {
      beforeEach(() => {
        // @ts-expect-error - custom command names are not in the Chainable types
        Cypress.Commands.add('d', { prevSubject: 'optional' }, (subject, arg) => {
          cy.wrap([subject, arg])
        })
      })

      it('passes on subject when used as a child', () => {
        cy
        .wrap('foo')
        // @ts-expect-error - custom command names are not in the Chainable types
        .d('bar')
        .then((arr) => {
          expect(arr).to.deep.eq(['foo', 'bar'])
        })
      })

      it('has an undefined subject when used as a parent', () => {
        cy
        // @ts-expect-error - custom command names are not in the Chainable types
        .d('bar')
        .then((arr) => {
          expect(arr).to.deep.eq([undefined, 'bar'])
        })
      })

      it('has an undefined subject as a parent with a previous parent', () => {
        cy.wrap('foo')

        cy
        // @ts-expect-error - custom command names are not in the Chainable types
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
        // @ts-expect-error - the overwrite's parameters are typed from the chainer method, which does not take the subject
        subject = $([1])

        return orig(subject, cb)
      })

      // @ts-expect-error - noop is an internal command and is not in the Chainable types
      Cypress.Commands.overwrite('noop', function (orig, fn: (ctx: Mocha.Context) => void) {
        // yield the context
        return fn(this)
      })

      Cypress.Commands.overwrite('submit', (orig, subject) => {
        // @ts-expect-error - the overwrite's parameters are typed from the chainer method, which does not take the subject
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
        // @ts-expect-error - foo is not an existing command
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
      // @ts-expect-error - custom command names are not in the Chainable types
      Cypress.Commands.add('bar', function () {
        expect(this.test?.title).to.exist
      })

      // @ts-expect-error - custom command names are not in the Chainable types
      cy.bar()

      // @ts-expect-error - custom command names are not in the Chainable types
      Cypress.Commands.overwrite('bar', function (originalFn) {
        return originalFn.call(this)
      })

      // @ts-expect-error - custom command names are not in the Chainable types
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

      // @ts-expect-error - custom command names are not in the Chainable types
      Cypress.Commands.addQuery('promiseQuery', () => Promise.resolve())
      // @ts-expect-error - custom command names are not in the Chainable types
      cy.promiseQuery()
    })

    it('throws when a query returns a non-function value', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.badReturnQuery()` failed because you returned a value other than a function from a query.\n\nQueries must be synchronous functions that return a function.\n\nThe returned value was:\n\n  > `1`')
        done()
      })

      // @ts-expect-error - custom command names are not in the Chainable types
      Cypress.Commands.addQuery('badReturnQuery', () => 1)
      // @ts-expect-error - custom command names are not in the Chainable types
      cy.badReturnQuery()
    })

    it('throws when a command is invoked inside a query', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.commandQuery()` failed because you invoked a command inside a query.\n\nQueries must be synchronous functions that return a function. You cannot invoke commands or return promises inside of them.\n\nThe command invoked was:\n\n  > `cy.visit()`')
        done()
      })

      // @ts-expect-error - custom command names are not in the Chainable types
      Cypress.Commands.addQuery('commandQuery', () => cy.visit('/'))
      // @ts-expect-error - custom command names are not in the Chainable types
      cy.commandQuery()
    })

    it('custom commands that return query chainers retry', () => {
      // @ts-expect-error - custom command names are not in the Chainable types
      Cypress.Commands.add('getButton', () => cy.get('button'))
      cy.on('command:retry', () => cy.$$('button').first().remove())

      // @ts-expect-error - custom command names are not in the Chainable types
      cy.getButton().should('have.length', 23)
    })

    it('allows queries to use other queries', () => {
      const logs: Cypress.Log[] = []

      cy.on('log:added', (attrs, log) => logs.push(log))

      // @ts-expect-error - custom command names are not in the Chainable types
      Cypress.Commands.addQuery('getButtonQuery', () => {
        cy.now('get', 'body')

        return cy.now('get', 'button')
      })

      // @ts-expect-error - custom command names are not in the Chainable types, and the driver's internal cy.now type requires a second argument
      Cypress.Commands.addQuery('queryQuery', () => cy.now('getButtonQuery'))

      // @ts-expect-error - custom command names are not in the Chainable types
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
      const logs: Cypress.Log[] = []

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
        // @ts-expect-error - a query must return a function, but this one is rejected by name first
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

describe('driver/src/cypress/cy - subject validation as the first command in the test', () => {
  before(() => {
    // @ts-expect-error - custom command names are not in the Chainable types
    Cypress.Commands.add('validatesElementAsParent', () => {
      // @ts-expect-error - the driver's internal cy.now type differs from Chainable.now, so cy does not satisfy ensure's Chainable parameter
      Cypress.ensure.isElement('abc', 'validatesElementAsParent', cy)
    })

    // @ts-expect-error - custom command names are not in the Chainable types
    Cypress.Commands.add('validatesWindowAsParent', () => {
      // @ts-expect-error - the driver's internal cy.now type differs from Chainable.now, so cy does not satisfy ensure's Chainable parameter
      Cypress.ensure.isWindow('abc', 'validatesWindowAsParent', cy)
    })

    // @ts-expect-error - custom command names are not in the Chainable types
    Cypress.Commands.add('validatesDocumentAsParent', () => {
      // @ts-expect-error - the driver's internal cy.now type differs from Chainable.now, so cy does not satisfy ensure's Chainable parameter
      Cypress.ensure.isDocument('abc', 'validatesDocumentAsParent', cy)
    })

    // @ts-expect-error - custom command names are not in the Chainable types
    Cypress.Commands.add('validatesElementAsDual', { prevSubject: 'optional' }, (subject) => {
      // @ts-expect-error - the driver's internal cy.now type differs from Chainable.now, so cy does not satisfy ensure's Chainable parameter
      Cypress.ensure.isType(subject, ['element'], 'validatesElementAsDual', cy)
    })
  })

  const cases = [
    { name: 'validatesElementAsParent', requirement: 'requires a DOM element.' },
    { name: 'validatesWindowAsParent', requirement: 'requires the subject be a global `window` object.' },
    { name: 'validatesDocumentAsParent', requirement: 'requires the subject be a global `document` object.' },
  ]

  cases.forEach(({ name, requirement }) => {
    it(`reports the invalid subject from cy.${name}() without a previous command`, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.match(new RegExp(`^\`cy\\.${name}\\(\\)\` failed because it ${Cypress._.escapeRegExp(requirement)}`))
        expect(err.message).not.to.include('The previous command that ran was')

        done()
      })

      cy[name]()
    })
  })

  it('reports the invalid subject when no command is running', () => {
    // @ts-expect-error - the driver's internal cy.now type differs from Chainable.now, so cy does not satisfy ensure's Chainable parameter
    expect(() => Cypress.ensure.isElement('abc', 'foo', cy)).to.throw('`cy.foo()` failed because it requires a DOM element.')
    // @ts-expect-error - the driver's internal cy.now type differs from Chainable.now, so cy does not satisfy ensure's Chainable parameter
    expect(() => Cypress.ensure.isWindow('abc', 'foo', cy)).to.throw('`cy.foo()` failed because it requires the subject be a global `window` object.')
    // @ts-expect-error - the driver's internal cy.now type differs from Chainable.now, so cy does not satisfy ensure's Chainable parameter
    expect(() => Cypress.ensure.isDocument('abc', 'foo', cy)).to.throw('`cy.foo()` failed because it requires the subject be a global `document` object.')
  })

  it('reports a missing element, not a missing parent, for a dual command with no subject', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.match(/^`cy\.validatesElementAsDual\(\)` failed because it requires a DOM element\./)

      done()
    })

    // @ts-expect-error - custom command names are not in the Chainable types
    cy.validatesElementAsDual()
  })
})
