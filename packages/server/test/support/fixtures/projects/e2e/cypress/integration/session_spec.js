/// <reference types="cypress" />
Cypress.config('isInteractive', true)

const expectSessionData = (obj) => {
  cy.then(() => {
    return Cypress.session.getCurrentSessionData()
    .then((result) => {
      expect(result.cookies.map((v) => v.name)).members(obj.cookies || [])
      expect(result.localStorage).deep.members(obj.localStorage || [])
    })
  })
}

before(() => {
  // TODO: look into why returning this promise here throws a Cypress warning in console
  // about mixed promises and commands
  cy.wrap(Cypress.session.clearAllSavedSessions())
})

cy.defineSession({
  name: 'user',
  steps () {
    cy.visit('https://localhost:4466/cross_origin_iframe')
    cy.window().then((win) => {
      win.localStorage.username = 'user'
    })
  },
})

cy.defineSession({
  name: 'user2',
  steps () {
    cy.visit('https://localhost:4466/cross_origin_iframe2')
    cy.window().then((win) => {
      win.localStorage.username = 'user2'
    })
  },
})

describe('cross origin automations', function () {
  it('get localStorage', () => {
    cy.visit('https://localhost:4466/cross_origin_iframe')
    .then(() => {
      localStorage.key1 = 'val1'
    })

    Cypress.session.getLocalStorage({ origin: ['https://127.0.0.2:44665', 'current_origin'] })
    .then((result) => {
      expect(result).deep.eq([{ origin: 'https://localhost:4466', value: { key1: 'val1' } }, { origin: 'https://127.0.0.2:44665', value: { foo: 'bar' } }])
    })
  })

  it('set localStorage', () => {
    cy.visit('https://localhost:4466/cross_origin_iframe')
    .then(() => {
      localStorage.key1 = 'val1'
    })
    .then(() => Cypress.session.setLocalStorage({ value: { key1: 'val1' } }))
    .then(() => {
      expect(window.localStorage.key1).eq('val1')
    })

    .then(() => {
      return Cypress.session.setLocalStorage([
        // set localStorage on different origin
        { origin: 'https://127.0.0.2:44665', value: { key2: 'val' }, clear: true },
        // set localStorage on current origin
        { value: { key3: 'val' }, clear: true },
      ])
    })
    .then(() => Cypress.session.getLocalStorage({ origin: ['current_url', 'https://127.0.0.2:44665'] }))
    .then((result) => {
      expect(result).deep.eq([
        { origin: 'https://localhost:4466', value: { key3: 'val' } },
        { origin: 'https://127.0.0.2:44665', value: { key2: 'val' } },
      ])
    })
  })

  it('get localStorage from all origins', () => {
    cy.visit('https://localhost:4466/cross_origin_iframe')
    .then(() => {
      localStorage.key1 = 'val1'
    })

    .then(() => Cypress.session.getLocalStorage({ origin: '*' }))
    .then((result) => {
      expect(result).deep.eq([{ origin: 'https://localhost:4466', value: { key1: 'val1' } }, { origin: 'https://127.0.0.2:44665', value: { foo: 'bar' } }])
    })
  })

  it('only gets localStorage from origins visited in test', () => {
    cy.visit('https://localhost:4466/form')
    .then(() => {
      localStorage.key1 = 'val1'
    })

    .then(() => Cypress.session.getLocalStorage({ origin: '*' }))
    .then((result) => {
      expect(result).deep.eq([{ origin: 'https://localhost:4466', value: { key1: 'val1' } }])
    })
  })
})

describe('with a blank session', () => {
  const sessionBlank = cy.defineSession({
    name: 'sess1',
    steps: () => {
      // blank session. no cookies, no LS
    },
  })

  beforeEach(() => {
    cy.useSession(sessionBlank)
  })

  it('t1', () => {
    cy.visit('https://localhost:4466/cross_origin_iframe')

    cy.contains('cross_origin_iframe')

    expectSessionData({
      cookies: ['/set-localStorage', '/cross_origin_iframe'],
      localStorage: [
        { origin: 'https://127.0.0.2:44665', value: { foo: 'bar' } },
      ],
    })
  })

  it('t2', () => {
    cy.visit('https://localhost:4466/form')
    cy.contains('form')

    expectSessionData({
      cookies: ['/form'],

    })
  })
})

describe('clears session data beforeEach test even with no useSession', () => {
  it('t1', () => {
    cy.visit('https://localhost:4466/cross_origin_iframe')
    cy.contains('cross_origin_iframe')
    expectSessionData({
      cookies: ['/set-localStorage', '/cross_origin_iframe'],
      localStorage: [
        { origin: 'https://127.0.0.2:44665', value: { foo: 'bar' } },
      ],
    })
  })

  it('t2', () => {
    cy.visit('https://localhost:4466/form')
    cy.contains('form')

    expectSessionData({
      cookies: ['/form'],
    })
  })
})

describe('navigates to about:blank between tests', () => {
  cy.state('foo', true)
  it('t1', () => {
    cy.contains('default blank page')

    cy.visit('https://localhost:4466/cross_origin_iframe')
    cy.contains('cross_origin_iframe')
  })

  it('t2', () => {
    cy.contains('default blank page')
  })
})

describe('navigates to special about:blank after useSession', () => {
  beforeEach(() => {
    cy.useSession('user')
  })

  it('t1', () => {
    cy.contains('useSession')
    cy.contains('blank page')

    cy.visit('https://localhost:4466/cross_origin_iframe')
    cy.contains('cross_origin_iframe')
  })

  it('t2', () => {
    cy.contains('useSession')
    cy.contains('blank page')
  })
})

describe('save/restore session with cookies and localStorage', () => {
  const stub = Cypress.sinon.stub()
  const sessionCookiesLS = cy.defineSession({
    name: 'mysession',
    steps: () => {
      stub()
      cy.visit('https://localhost:4466/cross_origin_iframe')
    },
  })

  beforeEach(() => {
    cy.useSession(sessionCookiesLS)
  })

  it('t1', () => {
    cy.visit('https://localhost:4466/form')
    cy.contains('form')

    expectSessionData({
      cookies: ['/set-localStorage', '/cross_origin_iframe', '/form'],
      localStorage: [
        { origin: 'https://127.0.0.2:44665', value: { foo: 'bar' } },
      ],
    })
  })

  it('t2', () => {
    expectSessionData({
      cookies: ['/set-localStorage', '/cross_origin_iframe'],
      localStorage: [
        { origin: 'https://127.0.0.2:44665', value: { foo: 'bar' } },
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
    cy.stub(() => {})
    cy.useSession('user')
    cy.url().should('eq', 'about:blank')

    cy.visit('https://localhost:4466/form')
    expectSessionData({
      cookies: ['/set-localStorage', '/cross_origin_iframe', '/form'],
      localStorage: [
        { origin: 'https://127.0.0.2:44665', value: { foo: 'bar' } },
        { origin: 'https://localhost:4466', value: { username: 'user' } },
      ],
    })

    console.log('enqueue useSession')
    cy.useSession('user2')

    cy.url().should('eq', 'about:blank')

    expectSessionData({
      cookies: ['/set-localStorage2', '/cross_origin_iframe2'],
      localStorage: [
        { origin: 'https://127.0.0.3:44665', value: { foo: 'bar' } },
        { origin: 'https://localhost:4466', value: { username: 'user2' } },
      ],
    })
  })
})

describe('session hooks - before/after', () => {
  const steps = Cypress.sinon.stub().callsFake(() => {
    Cypress.log({ message: 'steps' })
  })
  const before = Cypress.sinon.stub().callsFake(() => {
    Cypress.log({ message: 'before' })
  })
  const after = Cypress.sinon.stub()

  cy.defineSession('hooks_user', steps, {
    before,
    after,
  })

  beforeEach(() => {
    cy.useSession('hooks_user')
    cy.then(() => {
      expect(before).called
      expect(after).called
    })
  })

  it('t1', () => {
    expect(before).calledOnce
    expect(after).calledOnce
  })

  it('t2', () => {
    expect(steps).calledOnce
    expect(before).calledTwice
    expect(after).calledTwice
  })
})

describe('options.validate called on subsequent useSessions', () => {
  const steps = Cypress.sinon.stub().callsFake(() => {
    cy.wrap('foo')
  })
  const validate = Cypress.sinon.stub().callsFake(() => {
    Cypress.log({
      message: 'validate',
    })

    expect(validate.callCount, 'validate is called before options.before').eq(before.callCount)
  })
  const before = Cypress.sinon.stub().callsFake(() => {
    Cypress.log({
      message: 'before',
    })
  })

  cy.defineSession('hooks_user_validate', steps, {
    validate,
    before,
  })

  beforeEach(() => {
    cy.useSession('hooks_user_validate')
  })

  it('t1', () => {
    expect(steps).calledOnce
    expect(validate).not.called
    expect(before).calledOnce
  })

  it('t2', () => {
    expect(steps).calledOnce
    expect(validate).calledOnce
    expect(before).calledTwice
  })
})

describe('options.validate returning false reruns steps', () => {
  const steps = Cypress.sinon.stub().callsFake(() => {
    cy.wrap('foo').then(() => {
      localStorage.foo = 'val'
    })
  })
  const validate = Cypress.sinon.stub().callsFake(() => {
    return false
  })
  const before = Cypress.sinon.stub().callsFake(() => {
    Cypress.log({
      message: 'before',
    })
  })

  cy.defineSession('hooks_user_validate_false', steps, {
    validate,
    before,
  })

  beforeEach(() => {
    cy.useSession('hooks_user_validate_false')
  })

  it('t1', () => {
    expect(steps).calledOnce
    expect(validate).not.called
    expect(before).calledOnce
  })

  it('t2', () => {
    expect(steps).calledTwice
    expect(validate).calledOnce
    expect(before).calledTwice
  })
})

describe('consoleProps', () => {
  cy.defineSession({
    name: 'session_consoleProps',
    steps: () => {
      cy.visit('https://localhost:4466/cross_origin_iframe')
    },
  })

  let log = null

  beforeEach(() => {
    cy.on('log:added', (__, _log) => {
      console.log(_log.get('name'))
      if (_log.get('name') === 'useSession') {
        log = _log
      }
    })

    cy.useSession('session_consoleProps')
  })

  it('t1', () => {
    const renderedConsoleProps = Cypress._.omit(log.get('consoleProps')(), 'Snapshot')

    renderedConsoleProps.table = renderedConsoleProps.table.map((v) => v())

    expect(renderedConsoleProps).deep.eq({
      Command: 'useSession',
      name: 'session_consoleProps',
      table: [
        {
          'name': '🍪 Cookies - localhost (1)',
          'data': [
            {
              'name': '/cross_origin_iframe',
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
              'name': '/set-localStorage',
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
              'key': 'foo',
              'value': 'bar',
            },
          ],
        },
      ],
    })
  })
})

describe('errors', () => {
  it('throws error when experimentalSessionSupport not enabled', { experimentalSessionSupport: false }, (done) => {
    cy.on('fail', ({ message }) => {
      expect(message).contain('You must enable')
      done()
    })

    cy.defineSession({
      name: 'foo',
      steps () {

      },
    })
  })

  it('throws if multiple defineSession calls with same name', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).contain('defineSession')
      .contain('has already been called with the name **foobar**')

      expect(err.docsUrl).eq('https://on.cypress.io/defineSession')
      expect(err.codeFrame.frame, 'has accurate codeframe')
      .contain('defineSession')

      done()
    })

    cy.defineSession('foobar', () => {})
    cy.defineSession('foobar', () => {})
  })
})
