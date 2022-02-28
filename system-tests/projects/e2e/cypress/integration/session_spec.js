/// <reference types="cypress" />
window.top.__cySkipValidateConfig = true
Cypress.config('isInteractive', true)
Cypress.config('experimentalSessionSupport', true)

const expectCurrentSessionData = (obj) => {
  cy.then(() => {
    return Cypress.session.getCurrentSessionData()
    .then((result) => {
      expect(result.cookies.map((v) => v.name)).members(obj.cookies || [])
      expect(result.localStorage).deep.members(obj.localStorage || [])
      expect(result.sessionStorage).deep.members(obj.sessionStorage || [])
    })
  })
}

before(() => {
  if (top.doNotClearSessions) {
    top.doNotClearSessions = false

    return
  }

  cy.wrap(Cypress.session.clearAllSavedSessions())
})

const sessionUser = (name = 'user0') => {
  console.log('session User')

  return cy.session(name, () => {
    console.log('cyvisit')
    cy.visit(`https://localhost:4466/cross_origin_iframe/${name}`)
    cy.window().then((win) => {
      win.localStorage.username = name
    })
  })
}

describe('cross origin automations', function () {
  it('get storage', () => {
    cy.visit('https://localhost:4466/cross_origin_iframe/foo')
    .then(() => {
      localStorage.key1 = 'val1'
    })

    .then(() => Cypress.session.getStorage({ origin: ['https://127.0.0.2:44665', 'current_origin'] }))
    .then((result) => {
      expect(result).deep.eq({
        localStorage: [
          { origin: 'https://localhost:4466', value: { key1: 'val1' } },
          { origin: 'https://127.0.0.2:44665', value: { name: 'foo' } },
        ],
        sessionStorage: [],
      })
    })
  })

  it('get storage w/ sessionStorage', () => {
    cy.visit('https://localhost:4466/cross_origin_iframe/foo')
    .then(() => {
      localStorage.key1 = 'val'
      sessionStorage.key1 = 'val'
    })

    .then(() => Cypress.session.getStorage({ origin: ['https://127.0.0.2:44665', 'current_origin'] }))
    .then((result) => {
      expect(result).deep.eq({
        localStorage: [
          { origin: 'https://localhost:4466', value: { key1: 'val' } },
          { origin: 'https://127.0.0.2:44665', value: { name: 'foo' } },
        ],
        sessionStorage: [
          { origin: 'https://localhost:4466', value: { key1: 'val' } },
        ],
      })
    })
  })

  it('set storage', () => {
    cy.visit('https://localhost:4466/cross_origin_iframe/foo')
    .then(() => {
      localStorage.key1 = 'val1'
    })
    .then(() => Cypress.session.setStorage({ localStorage: [{ value: { key2: 'val2' } }] }))
    .then(() => {
      expect(window.localStorage.key2).eq('val2')
    })
    .then(() => {
      return Cypress.session.setStorage({
        localStorage: [
        // set localStorage on different origin
          { origin: 'https://127.0.0.2:44665', value: { key2: 'val' }, clear: true },
          // set localStorage on current origin
          { value: { key3: 'val' }, clear: true },
        ],
      })
    })
    .then(() => Cypress.session.getStorage({ origin: ['current_url', 'https://127.0.0.2:44665'] }))
    .then((result) => {
      expect(result).deep.eq({
        localStorage: [
          { origin: 'https://localhost:4466', value: { key3: 'val' } },
          { origin: 'https://127.0.0.2:44665', value: { key2: 'val' } },
        ],
        sessionStorage: [],
      })
    })
  })

  it('get localStorage from all origins', () => {
    cy.visit('https://localhost:4466/cross_origin_iframe/foo')
    .then(() => {
      localStorage.key1 = 'val1'
    })

    .then(() => Cypress.session.getStorage({ origin: '*' }))
    .then((result) => {
      expect(result.localStorage).deep.eq([{ origin: 'https://localhost:4466', value: { key1: 'val1' } }, { origin: 'https://127.0.0.2:44665', value: { name: 'foo' } }])
    })
  })

  it('only gets localStorage from origins visited in test', () => {
    cy.visit('https://localhost:4466/form')
    .then(() => {
      localStorage.key1 = 'val1'
    })

    .then(() => Cypress.session.getStorage({ origin: '*' }))
    .then((result) => {
      expect(result.localStorage).deep.eq([{ origin: 'https://localhost:4466', value: { key1: 'val1' } }])
    })
  })
})

describe('args', () => {
  it('accepts string or object as id', () => {
    cy.session('some-name', () => {})
    cy.session({ name: 'some-name', zkey: 'val' }, () => {})
  })

  it('uses sorted stringify and rejects duplicate registrations', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).contain('previously used name')
      expect(err.message).contain('{"key":"val"')
      done()
    })

    cy.session({ name: 'bob', key: 'val' }, () => {
      // foo
    })

    cy.session({ key: 'val', name: 'bob' }, () => {
      // bar
    })
  })
})

describe('with a blank session', () => {
  beforeEach(() => {
    cy.session('sess1',
      () => {
        // blank session. no cookies, no LS
      })
  })

  it('t1', () => {
    cy.visit('https://localhost:4466/cross_origin_iframe/foo')

    cy.contains('cross_origin_iframe')

    expectCurrentSessionData({
      cookies: ['/set-localStorage/foo', '/cross_origin_iframe/foo'],
      localStorage: [
        { origin: 'https://127.0.0.2:44665', value: { name: 'foo' } },
      ],
    })
  })

  it('t2', () => {
    cy.visit('https://localhost:4466/form')
    cy.contains('form')

    expectCurrentSessionData({
      cookies: ['/form'],

    })
  })
})

describe('clears session data beforeEach test even with no session', () => {
  it('t1', () => {
    cy.visit('https://localhost:4466/cross_origin_iframe/foo')
    cy.contains('cross_origin_iframe')
    expectCurrentSessionData({
      cookies: ['/set-localStorage/foo', '/cross_origin_iframe/foo'],
      localStorage: [
        { origin: 'https://127.0.0.2:44665', value: { name: 'foo' } },
      ],
    })
  })

  it('t2', () => {
    cy.visit('https://localhost:4466/form')
    cy.contains('form')

    expectCurrentSessionData({
      cookies: ['/form'],
    })
  })
})

describe('navigates to about:blank between tests and shows warning about session lifecycle', () => {
  cy.state('foo', true)
  it('t1', () => {
    // only warns after initial blank page
    // unfortunately this fails when run alongside other tests
    // cy.contains('experimentalSessionSupport').should('not.exist')
    cy.contains('default blank page')

    cy.visit('https://localhost:4466/cross_origin_iframe/foo')
    cy.contains('cross_origin_iframe')
  })

  it('t2', () => {
    cy.contains('Because experimentalSessionSupport')
    cy.contains('default blank page')
  })
})

describe('navigates to special about:blank after session', () => {
  beforeEach(() => {
    cy.session('user', () => {
      cy.visit('https://localhost:4466/cross_origin_iframe/user')
      cy.window().then((win) => {
        win.localStorage.username = 'user'
      })
    })
  })

  it('t1', () => {
    cy.contains('session')
    cy.contains('blank page')

    cy.visit('https://localhost:4466/cross_origin_iframe/foo')
    cy.contains('cross_origin_iframe')
  })

  it('t2', () => {
    cy.contains('cy.session')
    cy.contains('blank page')
  })
})

describe('save/restore session with cookies and localStorage', () => {
  const stub = Cypress.sinon.stub()

  beforeEach(() => {
    cy.session('cookies-session', () => {
      stub()
      cy.visit('https://localhost:4466/cross_origin_iframe/cookies')
    })
  })

  it('t1', () => {
    cy.visit('https://localhost:4466/form')
    cy.contains('form')

    expectCurrentSessionData({
      cookies: ['/set-localStorage/cookies', '/cross_origin_iframe/cookies', '/form'],
      localStorage: [
        { origin: 'https://127.0.0.2:44665', value: { name: 'cookies' } },
      ],
    })
  })

  it('t2', () => {
    expectCurrentSessionData({
      cookies: ['/set-localStorage/cookies', '/cross_origin_iframe/cookies'],
      localStorage: [
        { origin: 'https://127.0.0.2:44665', value: { name: 'cookies' } },
      ],
    })
  })

  after(() => {
    expect(stub).calledOnce
    // should have only initialized the session once
    // TODO: add a test for when server state exists and session steps are never called
    // expect(stub).calledOnce
  })
})

describe('multiple sessions in test', () => {
  it('switch session during test', () => {
    sessionUser('alice')
    cy.url().should('eq', 'about:blank')

    cy.visit('https://localhost:4466/form')
    expectCurrentSessionData({
      cookies: ['/set-localStorage/alice', '/cross_origin_iframe/alice', '/form'],
      localStorage: [
        { origin: 'https://127.0.0.2:44665', value: { name: 'alice' } },
        { origin: 'https://localhost:4466', value: { username: 'alice' } },
      ],
    })

    sessionUser('bob')

    cy.url().should('eq', 'about:blank')

    expectCurrentSessionData({
      cookies: ['/set-localStorage/bob', '/cross_origin_iframe/bob'],
      localStorage: [
        { origin: 'https://127.0.0.2:44665', value: { name: 'bob' } },
        { origin: 'https://localhost:4466', value: { username: 'bob' } },
      ],
    })
  })
})

describe('multiple sessions in test - can switch without redefining', () => {
  it('switch session during test', () => {
    const clearSpy = cy.spy(Cypress.session, 'clearCurrentSessionData')

    sessionUser('bob')
    sessionUser('alice')
    cy.url().should('eq', 'about:blank')

    cy.visit('https://localhost:4466/form')
    expectCurrentSessionData({
      cookies: ['/set-localStorage/alice', '/cross_origin_iframe/alice', '/form'],
      localStorage: [
        { origin: 'https://127.0.0.2:44665', value: { name: 'alice' } },
        { origin: 'https://localhost:4466', value: { username: 'alice' } },
      ],
    })

    cy.then(() => {
      expect(clearSpy).calledTwice
    })

    sessionUser('bob')

    cy.then(() => {
      expect(clearSpy).calledThrice
    })

    cy.url().should('eq', 'about:blank')

    expectCurrentSessionData({
      cookies: ['/set-localStorage/bob', '/cross_origin_iframe/bob'],
      localStorage: [
        { origin: 'https://127.0.0.2:44665', value: { name: 'bob' } },
        { origin: 'https://localhost:4466', value: { username: 'bob' } },
      ],
    })
  })
})

function SuiteWithValidateFn (id, fn) {
  const setup = Cypress.sinon.stub().callsFake(() => {
    cy.log('setup')
  })
  const validate = Cypress.sinon.stub().callsFake(() => {
    Cypress.log({
      name: 'log',
      message: 'validate',
      type: 'parent',
    })

    // expect(cy.state('window').location.href).eq('about:blank')

    return fn(validate.callCount)
  })

  let numPageLoads = 0

  beforeEach(() => {
    cy.on('log:added', (attr) => {
      if (attr.name === 'page load') {
        numPageLoads++
      }
    })

    cy.session(id, setup, {
      validate,
    })

    cy.log('outside session')
  })

  it('t1', () => {
    cy.url().should('eq', 'about:blank')

    expect(setup).calledOnce
    expect(validate).calledOnce
    // (1,2) about:blank before & after session creation
    // (3) after validate runs
    expect(numPageLoads, 'number of page loads').eq(3)
  })

  it('t2', () => {
    cy.url().should('eq', 'about:blank')
    expect(setup).calledTwice
    expect(validate).calledThrice
    // (4) about:blank before session rehydrating
    // (5,6) about:blank before & after setup function
    // (7) about:blank after 2nd validate runs
    expect(numPageLoads, 'number of page loads').eq(7)
  })
}

describe('options.validate reruns steps when returning false', () => {
  SuiteWithValidateFn('validate_return_false', (callCount) => {
    return callCount !== 2
  })
})

describe('options.validate reruns steps when resolving false', () => {
  SuiteWithValidateFn('validate_resolve_false', (callCount) => {
    return Promise.resolve(callCount !== 2)
  })
})

describe('options.validate reruns steps when rejecting', () => {
  SuiteWithValidateFn('validate_reject', (callCount) => {
    if (callCount === 2) {
      return Promise.reject(new Error('rejected validate'))
    }
  })
})

describe('options.validate reruns steps when throwing', () => {
  SuiteWithValidateFn('validate_reject', (callCount) => {
    if (callCount === 2) {
      throw new Error('validate error')
    }
  })
})

describe('options.validate reruns steps when resolving false in cypress command', () => {
  SuiteWithValidateFn('validate_resolve_false_command_1', (callCount) => {
    if (callCount === 2) {
      // cy.wait(10000)
    }

    cy.request('https://127.0.0.2:44665/redirect').then((res) => {
      return callCount !== 2
    })
  })
})

describe('options.validate reruns steps when resolving false in cypress chainer', () => {
  SuiteWithValidateFn('validate_resolve_false_command_2', (callCount) => {
    cy.wrap('validate wrap 1')
    cy.wrap('validate wrap 2').then(() => {
      return callCount !== 2
    })
  })
})

describe('options.validate reruns steps when failing cypress command', () => {
  SuiteWithValidateFn('validate_fail_command_1', (callCount) => {
    cy.wrap('validate wrap 1')
    cy.wrap('validate wrap 2').then(() => {
      return callCount !== 2
    })

    if ([1, 3].includes(callCount)) return

    cy.get('h1', { timeout: 100 }).should('contain', 'does not exist')
    cy.get('h1').should('contain', 'hi')
  })
})

describe('options.validate reruns steps when failing cy.request', () => {
  SuiteWithValidateFn('validate_fail_command_2', (callCount) => {
    const status = callCount === 2 ? 500 : 200

    cy.request(`https://127.0.0.2:44665/status/${status}`)
  })
})

describe('options.validate failing test', () => {
  it('test fails when options.validate after setup fails command', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).contain('foo')
      expect(err.message).contain('in a session validate hook')
      expect(err.message).not.contain('not from Cypress')
      expect(err.codeFrame).exist

      done()
    })

    cy.session('user_validate_fails_after_setup_1', () => {
      cy.log('setup')
    }, {
      validate () {
        cy.wrap('foo', { timeout: 30 }).should('eq', 'bar')
      },
    })
  })

  it('test fails when options.validate after setup throws', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).contain('in a session validate hook')
      expect(err.message).not.contain('not from Cypress')
      expect(err.codeFrame).exist

      done()
    })

    cy.session('user_validate_fails_after_setup_2', () => {
      cy.log('setup')
    }, {
      validate () {
        throw new Error('validate error')
      },
    })
  })

  it('test fails when options.validate after setup rejects', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).contain('validate error')
      expect(err.message).contain('in a session validate hook')
      expect(err.message).not.contain('not from Cypress')
      expect(err.codeFrame).exist

      done()
    })

    cy.session('user_validate_fails_after_setup_3', () => {
      cy.log('setup')
    }, {
      validate () {
        return Promise.reject(new Error('validate error'))
      },
    })
  })

  it('test fails when options.validate after setup returns false', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).contain('returned false')
      expect(err.message).contain('in a session validate hook')
      expect(err.message).not.contain('not from Cypress')
      expect(err.codeFrame).exist

      done()
    })

    cy.session('user_validate_fails_after_setup_4', () => {
      cy.log('setup')
    }, {
      validate () {
        return false
      },
    })
  })

  it('test fails when options.validate after setup resolves false', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).contain('callback resolved false')
      expect(err.message).contain('in a session validate hook')
      expect(err.message).not.contain('not from Cypress')
      expect(err.codeFrame).exist

      done()
    })

    cy.session('user_validate_fails_after_setup_5', () => {
      cy.log('setup')
    }, {
      validate () {
        return Promise.resolve(false)
      },
    })
  })

  // TODO: cy.validate that will fail, hook into event, soft-reload inside and test everything is halted
  // Look at other tests for cancellation
  // make error collapsible by default

  it('test fails when options.validate after setup returns Chainer<false>', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).contain('callback resolved false')
      expect(err.message).contain('in a session validate hook')
      expect(err.message).not.contain('not from Cypress')
      done()
    })

    cy.session('user_validate_fails_after_setup', () => {
      cy.log('setup')
    }, {
      validate () {
        return cy.wrap(false)
      },
    })
  })
})

describe('can wait for login redirect automatically', () => {
  it('t1', () => {
    cy.session('redirect-login', () => {
      cy.visit('https://localhost:4466/form')
      cy.get('[name="delay"]').type('100{enter}')
      // not needed since cypress will pause command queue during the redirect
      // cy.url().should('include', '/home')
    })

    expectCurrentSessionData({
      cookies: ['/form', '/home'],
    })
  })
})

describe('can wait for a js redirect with an assertion', () => {
  it('t1', () => {
    cy.session('redirect-login', () => {
      cy.visit('https://localhost:4466/form')
      cy.get('[name="delay"]').type('100{enter}')
      // cy.url().should('include', '/home')
    })

    expectCurrentSessionData({
      cookies: ['/form', '/home'],
    })
  })
})

describe('same session name, different options, multiple tests', () => {
  it('t1', () => {
    cy.session('bob', () => {
      localStorage.bob = '1'
    })
    .then(() => {
      expect(localStorage.bob).eq('1')
    })
  })

  it('t2', () => {
    cy.session('bob', () => {
      localStorage.bob = '2'
    })
    .then(() => {
      expect(localStorage.bob).eq('2')
    })
  })
})

// NOTE: flake. unskip when we fix it
describe.skip('consoleProps', () => {
  let log = null

  beforeEach(() => {
    cy.on('log:added', (__, _log) => {
      if (_log.get('name') === 'session') {
        log = _log
      }
    })

    cy.session('session_consoleProps', () => {
      cy.visit('https://localhost:4466/cross_origin_iframe/foo')
    })
  })

  it('t1', () => {
    const renderedConsoleProps = Cypress._.omit(log.get('consoleProps')(), 'Snapshot')

    renderedConsoleProps.table = renderedConsoleProps.table.map((v) => v())

    expect(renderedConsoleProps).deep.eq({
      Command: 'session',
      id: 'session_consoleProps',
      table: [
        {
          'name': '🍪 Cookies - localhost (1)',
          'data': [
            {
              'name': '/cross_origin_iframe/foo',
              'value': 'value',
              'path': '/',
              'domain': 'localhost',
              'secure': true,
              'httpOnly': false,
              'sameSite': 'no_restriction',
            },
          ],
        },
        {
          'name': '🍪 Cookies - 127.0.0.2 (1)',
          'data': [
            {
              'name': '/set-localStorage/foo',
              'value': 'value',
              'path': '/',
              'domain': '127.0.0.2',
              'secure': true,
              'httpOnly': false,
              'sameSite': 'no_restriction',
            },
          ],
        },
        {
          'name': '📁 Storage - 127.0.0.2 (1)',
          'data': [
            {
              'key': 'name',
              'value': 'foo',
            },
          ],
        },
      ],
    })
  })
})

// because browsers prevent an https page from embedding http domains, we filter out
// insecure origins (contexts) when top is a secure context when we clear cross origin session data
// the first test in each suite visits insecure origin with sessionSupport OFF so data is not cleared
// on test:before:run, which allows the next run to switch top back to a secure context
// and finally we turn sessionSupport back ON for the 3rd tests, which will now try to clear insecure
// bar.foo.com data.
describe('ignores setting insecure context data when on secure context', () => {
  describe('no cross origin secure origins, nothing to clear', () => {
    it('sets insecure content', { experimentalSessionSupport: false }, () => {
      cy.visit('http://bar.foo.com:4465/form')
    })

    let logSpy

    it('nothing to clear - 1/2', { experimentalSessionSupport: false }, () => {
      cy.visit('https://localhost:4466/form')
      .then(() => {
        logSpy = Cypress.sinon.spy(Cypress, 'log')
      })
    })

    it('nothing to clear - 2/2', { experimentalSessionSupport: true }, () => {
      top.logSpy = logSpy
      expect(Cypress._.find(logSpy.args, (v) => v[0].name === 'warning')).to.not.exist
    })
  })

  describe('only secure origins cleared', () => {
    it('sets insecure content', { experimentalSessionSupport: false }, () => {
      cy.visit('http://bar.foo.com:4465/form')
    })

    let logSpy

    it('switches to secure context - clears only secure context data - 1/2', { experimentalSessionSupport: false }, () => {
      cy.visit('https://localhost:4466/cross_origin_iframe/foo')
      .then(() => {
        logSpy = Cypress.sinon.spy(Cypress, 'log')
      })
    })

    it('clears only secure context data - 2/2', { experimentalSessionSupport: true }, () => {
      top.logSpy = logSpy
      expect(Cypress._.find(logSpy.args, (v) => v[0].name === 'warning')).to.not.exist
    })
  })
})

describe('errors', () => {
  it('throws error when experimentalSessionSupport not enabled', { experimentalSessionSupport: false }, (done) => {
    cy.on('fail', ({ message }) => {
      expect(message).contain('You must enable')
      done()
    })

    cy.session('sessions-not-enabled')
  })

  it('throws if session has not been defined during current test', (done) => {
    cy.on('fail', (err) => {
      expect(err.message)
      .contain('session')
      .contain('No session is defined with')
      .contain('**bob**')

      expect(err.docsUrl).eq('https://on.cypress.io/session')
      expect(err.codeFrame.frame, 'has accurate codeframe').contain('session')

      done()
    })

    cy.session('bob')
  })

  it('throws if multiple session calls with same name but different options', (done) => {
    cy.on('fail', (err) => {
      expect(err.message)
      expect(err.message).contain('previously used name')
      .contain('**duplicate-session**')

      expect(err.docsUrl).eq('https://on.cypress.io/session')
      expect(err.codeFrame.frame, 'has accurate codeframe').contain('session')

      done()
    })

    cy.session('duplicate-session', () => {
      // function content
      window.localStorage.one = 'value'
    })

    cy.session('duplicate-session', () => {
      // different function content
      window.localStorage.two = 'value'
    })

    expectCurrentSessionData({
      localStorage: [{ origin: 'https://localhost:4466', value: { two: 'value' } }],
    })
  })
})
