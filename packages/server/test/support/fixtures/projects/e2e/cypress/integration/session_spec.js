/// <reference types="cypress" />
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
  // TODO: look into why returning this promise here throws a Cypress warning in console
  // about mixed promises and commands
  cy.wrap(Cypress.session.clearAllSavedSessions())
})

const sessionUser = (name = 'user0') => {
  return cy.session(name, () => {
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
      console.log(result)
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
      console.log({ result })
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

    // .then(() => {
    //   return Cypress.session.setStorage([
    //     // set localStorage on different origin
    //     { origin: 'https://127.0.0.2:44665', localStorage: { key2: 'val' }, clear: true },
    //     // set localStorage on current origin
    //     { localStorage: { key3: 'val' }, clear: true },
    //   ])
    // })
    // .then(() => Cypress.session.getStorage({ origin: ['current_url', 'https://127.0.0.2:44665'] }))
    // .then((result) => {
    //   expect(result).deep.eq([
    //     { origin: 'https://localhost:4466', localStorage: { key3: 'val' } },
    //     { origin: 'https://127.0.0.2:44665', localStorage: { key2: 'val' } },
    //   ])
    // })
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

describe('navigates to about:blank between tests', () => {
  cy.state('foo', true)
  it('t1', () => {
    cy.contains('default blank page')

    cy.visit('https://localhost:4466/cross_origin_iframe/foo')
    cy.contains('cross_origin_iframe')
  })

  it('t2', () => {
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
    cy.contains('session')
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

// describe('can exclude localStorage', () => {
//   const setup = () => {
//     cy.visit('https://localhost:4466/cross_origin_iframe/cookies')
//     cy.then(() => {
//       window.localStorage.foo = '1'
//       window.localStorage.foobar = '2'
//       window.localStorage.foobarbaz = '3'
//     })
//   }

//   it('exclude-origin-string', () => {
//     cy.session('exclude-origin-string', setup, {
//       exclude: {
//         localStorage: { origin: 'https://localhost:4466' },
//       },
//     })
//     .then((sessionData) => {
//       expectSessionData(sessionData, {
//         cookies: ['/set-localStorage/cookies', '/cross_origin_iframe/cookies'],
//         localStorage: [
//           { origin: 'https://127.0.0.2:44665', value: { name: 'cookies' } },

//         ],
//       })
//     })
//   })

//   it('exclude-origin-regex', () => {
//     cy.session('exclude-origin-regex', setup, {
//       exclude: {
//         localStorage: {
//           origin: /127/,
//         },
//       },
//     })
//     .then((sessionData) => {
//       expectSessionData(sessionData, {
//         cookies: ['/set-localStorage/cookies', '/cross_origin_iframe/cookies'],
//         localStorage: [
//           { origin: 'https://localhost:4466', value: { foo: '1', foobar: '2', foobarbaz: '3' } },
//         ],
//       })
//     })
//   })

//   it('exclude-value-string', () => {
//     cy.session('exclude-value-string', setup, {
//       exclude: {
//       // coerced into { key: 'name' }
//         localStorage: 'foobar',
//       },
//     })
//     .then((sessionData) => {
//       expectSessionData(sessionData, {
//         cookies: ['/set-localStorage/cookies', '/cross_origin_iframe/cookies'],
//         localStorage: [
//           { origin: 'https://127.0.0.2:44665', value: { name: 'cookies' } },
//           { origin: 'https://localhost:4466', value: { foo: '1', foobarbaz: '3' } },
//         ],
//       })
//     })
//   })

//   it('exclude-regex', () => {
//     cy.session('exclude-regex', setup, {
//       exclude: {
//       // coerced into { value: /bar/ }
//         localStorage: /bar/,
//       },
//     })
//     .then((sessionData) => {
//       expectSessionData(sessionData, {
//         cookies: ['/set-localStorage/cookies', '/cross_origin_iframe/cookies'],
//         localStorage: [
//           { origin: 'https://127.0.0.2:44665', value: { name: 'cookies' } },
//           { origin: 'https://localhost:4466', value: { foo: '1' } },
//         ],
//       })
//     })
//   })

//   it('exclude-value-regex', () => {
//     cy.session('exclude-value-regex', setup, {
//       exclude: {
//         localStorage: { key: /foo/ },
//       },
//     })
//     .then((sessionData) => {
//       expectSessionData(sessionData, {
//         cookies: ['/set-localStorage/cookies', '/cross_origin_iframe/cookies'],
//         localStorage: [
//           { origin: 'https://127.0.0.2:44665', value: { name: 'cookies' } },
//         ],
//       })
//     })
//   })
// })

// describe('can exclude cookies', () => {
//   const setup = () => {
//     cy.visit('https://localhost:4466/cross_origin_iframe/cookies')
//   }

//   it('exclude-domain-regex', () => {
//     cy.session('exclude-domain-regex', setup, {
//       exclude: {
//         cookies: {
//           domain: /localh/,
//         },
//       },
//     })
//     .then((sessionData) => {
//       expectSessionData(sessionData, {
//         cookies: ['/set-localStorage/cookies'],
//       })
//     })
//   })

//   it('exclude-domain-string', () => {
//     cy.session('exclude-domain-string', setup, {
//       exclude: {
//         cookies: {
//           domain: 'localhost',
//         },
//       },
//     })
//     .then((sessionData) => {
//       expectSessionData(sessionData, {
//         cookies: ['/set-localStorage/cookies'],
//       })
//     })
//   })

//   it('exclude-regex', () => {
//     cy.session('exclude-name-regex', setup, {
//       exclude: {
//         cookies: /set/,
//       },
//     })
//     .then((sessionData) => {
//       expectSessionData(sessionData, {
//         cookies: ['/cross_origin_iframe/cookies'],
//       })
//     })
//   })

//   it('exclude-name-string', () => {
//     cy.session('exclude-name-string', setup, {
//       exclude: {
//       // coerced into { key: 'name' }
//         cookies: { name: '/set-localStorage/cookies' },
//       },
//     })
//     .then((sessionData) => {
//       expectSessionData(sessionData, {
//         cookies: ['/cross_origin_iframe/cookies'],
//       })
//     })
//   })
// })

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

describe('options.validate called on subsequent sessions', () => {
  const steps = Cypress.sinon.stub().callsFake(() => {
    Cypress.log({
      message: 'steps',
    })
  })
  const validate = Cypress.sinon.stub().callsFake(() => {
    Cypress.log({
      message: 'validate',
    })

    expect(validate.callCount, 'validate is called before options.before').eq(steps.callCount)
  })

  beforeEach(() => {
    cy.session('hooks_user_validate', steps, {
      validate,
    })
  })

  it('t1', () => {
    expect(steps).calledOnce
    expect(validate).not.called
  })

  it('t2', () => {
    expect(steps).calledOnce
    expect(validate).calledOnce
  })
})

describe('options.validate reruns steps when returning false', () => {
  const steps = Cypress.sinon.stub().callsFake(() => {
    cy.wrap('foo').then(() => {
      localStorage.foo = 'val'
    })
  })
  const validate = Cypress.sinon.stub().callsFake(() => {
    return false
  })

  beforeEach(() => {
    cy.session('hooks_user_validate_false', steps, {
      validate,
    })
  })

  it('t1', () => {
    expect(steps).calledOnce
    expect(validate).not.called
  })

  it('t2', () => {
    expect(validate).calledOnce
    expect(steps).calledTwice
  })
})

describe('options.validate reruns steps when resolving false', () => {
  const steps = Cypress.sinon.stub().callsFake(() => {
    cy.wrap('foo').then(() => {
      localStorage.foo = 'val'
    })
  })
  const validate = Cypress.sinon.stub().callsFake(() => {
    return Promise.resolve(false)
  })

  beforeEach(() => {
    cy.session('hooks_user_validate_false_2', steps, {
      validate,
    })
  })

  it('t1', () => {
    expect(steps).calledOnce
    expect(validate).not.called
  })

  it('t2', () => {
    expect(validate).calledOnce
    expect(steps).calledTwice
  })
})

describe('options.validate reruns steps when resolving false in cypress chainer', () => {
  let lastLog = null
  const steps = Cypress.sinon.stub().callsFake(() => {
    cy.wrap('setup').then(() => {
      localStorage.foo = 'val'
    })
  })
  const validate = Cypress.sinon.stub().callsFake(() => {
    cy.wrap('wrap 1')

    cy.wrap('wrap 2').then(() => {
      return false
    })
  })

  beforeEach(() => {
    cy.on('log:added', (attrs) => {
      if (attrs.name === 'session') {
        lastLog = attrs
      }
    })

    cy.session('hooks_user_validate_false_3', steps, {
      validate,
    })
  })

  it('t1', () => {
    expect(steps).calledOnce
    expect(validate).not.called
  })

  it('t2', () => {
    expect(validate).calledOnce
    expect(steps).calledTwice
    expect(lastLog.message).include('invalidated')
  })
})

// NOTE: we dont support validate function throwing
describe.skip('options.validate reruns steps when throwing', () => {
  const steps = Cypress.sinon.stub().callsFake(() => {
    cy.wrap('foo').then(() => {
      localStorage.foo = 'val'
    })
  })
  const validate = Cypress.sinon.stub().callsFake(() => {
    cy.wrap('foo', { timeout: 100 }).should('eq', 'bar')
  })

  beforeEach(() => {
    cy.session('hooks_user_validate_false_3', steps, {
      validate,
    })
  })

  it('t1', () => {
    expect(steps).calledOnce
    expect(validate).not.called
  })

  it('t2', (done) => {
    expect(validate).calledOnce
    expect(steps).calledTwice
    cy.then(() => {
      done()
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

describe('consoleProps', () => {
  let log = null

  beforeEach(() => {
    cy.on('log:added', (__, _log) => {
      console.log(_log.get('name'))
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
      name: 'session_consoleProps',
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

describe('same session name, different options, multiple tests', () => {
  it('t1', () => {
    cy.session('bob', () => {
      localStorage.bob = '1'
      console.log('bob session 1')
    })
    .then(() => {
      expect(localStorage.bob).eq('1')
    })
  })

  it('t2', () => {
    cy.session('bob', () => {
      localStorage.bob = '2'
      console.log('bob session 2')
    })
    .then(() => {
      expect(localStorage.bob).eq('2')
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

  it('throws if session has not been defined', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).contain('session')
      .contain('No session is defined with')
      .contain('**bob**')

      expect(err.docsUrl).eq('https://on.cypress.io/session')
      expect(err.codeFrame.frame, 'has accurate codeframe')
      .contain('session')

      done()
    })

    cy.session('bob')
  })

  it('throws if multiple session calls with same name but different options', () => {
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
