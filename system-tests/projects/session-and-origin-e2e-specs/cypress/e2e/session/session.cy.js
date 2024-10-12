/**
 * Used in sessions_spec system-tests tests. Throws cross-origin errors
 * cy-in-cy tests in @packages/app.
 */
/// <reference types="cypress" />
window.top.__cySkipValidateConfig = true
Cypress.config('isInteractive', true)

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

const sessionUser = (name = 'user0', cacheAcrossSpecs = false) => {
  return cy.session(name, () => {
    cy.visit(`https://localhost:4466/cross_origin_iframe/${name}`)
    cy.window().then((win) => {
      win.localStorage.username = name
    })
  }, {
    cacheAcrossSpecs,
  })
}

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
        { origin: 'https://127.0.0.1:44665', value: { name: 'foo' } },
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
        { origin: 'https://127.0.0.1:44665', value: { name: 'foo' } },
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
  it('t1', () => {
    cy.contains('Default blank page')
    cy.contains('This page was cleared by navigating to about:blank.')
    cy.contains('All active session data (cookies, localStorage and sessionStorage) across all domains are cleared.')

    cy.visit('https://localhost:4466/cross_origin_iframe/foo')
    cy.contains('cross_origin_iframe')
  })

  it('t2', () => {
    cy.contains('Default blank page')
    cy.contains('This page was cleared by navigating to about:blank.')
    cy.contains('All active session data (cookies, localStorage and sessionStorage) across all domains are cleared.')
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
    cy.contains('Default blank page')
    cy.contains('This page was cleared by navigating to about:blank.')

    cy.visit('https://localhost:4466/cross_origin_iframe/foo')
    cy.contains('cross_origin_iframe')
  })

  it('t2', () => {
    cy.contains('Default blank page')
    cy.contains('This page was cleared by navigating to about:blank.')
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
        { origin: 'https://127.0.0.1:44665', value: { name: 'cookies' } },
      ],
    })
  })

  it('t2', () => {
    expectCurrentSessionData({
      cookies: ['/set-localStorage/cookies', '/cross_origin_iframe/cookies'],
      localStorage: [
        { origin: 'https://127.0.0.1:44665', value: { name: 'cookies' } },
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
    cy.url().should('eq', 'about:srcdoc')

    cy.visit('https://localhost:4466/form')
    expectCurrentSessionData({
      cookies: ['/set-localStorage/alice', '/cross_origin_iframe/alice', '/form'],
      localStorage: [
        { origin: 'https://127.0.0.1:44665', value: { name: 'alice' } },
        { origin: 'https://localhost:4466', value: { username: 'alice' } },
      ],
    })

    sessionUser('bob')

    cy.url().should('eq', 'about:srcdoc')

    expectCurrentSessionData({
      cookies: ['/set-localStorage/bob', '/cross_origin_iframe/bob'],
      localStorage: [
        { origin: 'https://127.0.0.1:44665', value: { name: 'bob' } },
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
    cy.url().should('eq', 'about:srcdoc')

    cy.visit('https://localhost:4466/form')
    expectCurrentSessionData({
      cookies: ['/set-localStorage/alice', '/cross_origin_iframe/alice', '/form'],
      localStorage: [
        { origin: 'https://127.0.0.1:44665', value: { name: 'alice' } },
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

    cy.url().should('eq', 'about:srcdoc')

    expectCurrentSessionData({
      cookies: ['/set-localStorage/bob', '/cross_origin_iframe/bob'],
      localStorage: [
        { origin: 'https://127.0.0.1:44665', value: { name: 'bob' } },
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

    // expect(cy.state('window').location.href).eq('about:srcdoc')

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
    cy.url().should('eq', 'about:srcdoc')

    expect(setup).calledOnce
    expect(validate).calledOnce
    // (1,2) about:srcdoc before & after session creation
    // (3) after validate runs
    expect(numPageLoads, 'number of page loads').eq(2)
  })

  it('t2', () => {
    cy.url().should('eq', 'about:srcdoc')
    expect(setup).calledTwice
    expect(validate).calledThrice
    // (4) about:srcdoc before session rehydrating
    // (5,6) about:srcdoc before & after setup function
    // (7) about:srcdoc after 2nd validate runs
    expect(numPageLoads, 'number of page loads').eq(5)
  })
}

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
  SuiteWithValidateFn('validate_throw', (callCount) => {
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

    cy.request('https://127.0.0.1:44665/redirect').then((res) => {
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

    cy.request(`https://127.0.0.1:44665/status/${status}`)
  })
})

describe('can wait for login redirect automatically', () => {
  it('t1', () => {
    cy.session('redirect-login', () => {
      cy.visit('https://localhost:4466/form')
      cy.get('[name="delay"]').type('100{enter}')
    })

    expectCurrentSessionData({
      cookies: ['/form', '/home'],
    })
  })
})

describe('same session name, different options, multiple tests', () => {
  it('t1', () => {
    cy.session('bob_1', () => {
      localStorage.bob = '1'
    })
    .then(() => {
      expect(localStorage.bob).eq('1')
    })
  })

  it('t2', () => {
    cy.session('bob_2', () => {
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
      name: 'session',
      type: 'command',
      props: {
        id: 'session_consoleProps',
      },
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
          'name': '🍪 Cookies - 127.0.0.1 (1)',
          'data': [
            {
              'name': '/set-localStorage/foo',
              'value': 'value',
              'path': '/',
              'domain': '127.0.0.1',
              'secure': true,
              'httpOnly': false,
              'sameSite': 'no_restriction',
            },
          ],
        },
        {
          'name': '📁 Storage - 127.0.0.1 (1)',
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
// the first test in each suite visits insecure origin with so data is not cleared
// on test:before:run, which allows the next run to switch top back to a secure context
// and finally for the 3rd tests, which will now try to clear insecure
// bar.foo.com data.
describe('ignores setting insecure context data when on secure context', () => {
  describe('no cross origin secure origins, nothing to clear', () => {
    it('sets insecure content', () => {
      cy.visit('http://bar.foo.com:4465/form')
    })

    let logSpy

    it('nothing to clear - 1/2', () => {
      cy.visit('https://localhost:4466/form')
      .then(() => {
        logSpy = Cypress.sinon.spy(Cypress, 'log')
      })
    })

    it('nothing to clear - 2/2', () => {
      top.logSpy = logSpy
      expect(Cypress._.find(logSpy.args, (v) => v[0].name === 'warning')).to.not.exist
    })
  })

  describe('only secure origins cleared', () => {
    it('sets insecure content', () => {
      cy.visit('http://bar.foo.com:4465/form')
    })

    let logSpy

    it('switches to secure context - clears only secure context data - 1/2', () => {
      cy.visit('https://localhost:4466/cross_origin_iframe/foo')
      .then(() => {
        logSpy = Cypress.sinon.spy(Cypress, 'log')
      })
    })

    it('clears only secure context data - 2/2', () => {
      top.logSpy = logSpy
      expect(Cypress._.find(logSpy.args, (v) => v[0].name === 'warning')).to.not.exist
    })
  })
})
