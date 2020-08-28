const _ = require('lodash')

const testLog = (commandName, options, f) => {
  it(commandName, () => {
    cy.on('log:added', (attrs, log) => {
      if (log.get('name') === commandName) {
        cy.removeAllListeners('log:added')
        expect(log.get('options')).to.deep.eq(_.clone(options))
      }
    })

    f(options)
  })
}

describe('log options on success', () => {
  beforeEach(() => {
    cy.visit('/fixtures/command-log.html')
  })

  // Ignore cy.and(), cy.as() because they don't have options.

  testLog('blur', { force: false }, (options) => {
    cy.get('#a').focus().blur(options)
  })

  testLog('check', { force: false }, (options) => {
    cy.get('#checkbox').check(options)
  })

  testLog('children', { timeout: 2000 }, (options) => {
    cy.get('form').children(options)
  })

  testLog('clear', { force: false }, (options) => {
    cy.get('#a').clear(options)
  })

  testLog('clearCookie', { timeout: 2001 }, (options) => {
    cy.clearCookie('authId', options)
  })

  testLog('clearCookies', { timeout: 2002 }, (options) => {
    cy.clearCookies(options)
  })

  // Ignore cy.clearLocalStorage() because it only has an option, log.

  testLog('click - simple', { force: false }, (options) => {
    cy.contains('button').click(options)
  })

  testLog('click - point', { force: false }, (options) => {
    cy.contains('button').click(1, 2, options)
  })

  testLog('click - position', { force: false }, (options) => {
    cy.contains('button').click('bottom', options)
  })

  // Ignore cy.clock() because it only has an option, log.

  testLog('closest', { timeout: 2003 }, (options) => {
    cy.get('#a').closest('form', options)
  })

  testLog('contains', { timeout: 2004 }, (options) => {
    cy.contains('.test', 'Hello', options)
  })

  testLog('dblclick', { force: false }, (options) => {
    cy.get('button').dblclick(options)
  })

  // Ignore cy.debug() because it only has an option, log.

  testLog('document', { timeout: 2005 }, (options) => {
    cy.document(options)
  })

  // Ignore cy.each() because it only has an option, timeout.
  // Ignore cy.end() because it doesn't have options.

  testLog('eq', { timeout: 2006 }, (options) => {
    cy.get('input').eq(0, options)
  })

  testLog('exec', { env: { 'a': true } }, (options) => {
    cy.exec('ls', options)
  })

  testLog('filter', { timeout: 2007 }, (options) => {
    cy.get('input').filter('#a', options)
  })

  testLog('find', { timeout: 2008 }, (options) => {
    cy.get('form').find('#a', options)
  })

  testLog('first', { timeout: 2009 }, (options) => {
    cy.get('input').first(options)
  })

  // Ignore cy.fixture() because it doesn't log to reporter.

  testLog('focus', { timeout: 2010 }, (options) => {
    cy.get('#a').focus(options)
  })

  testLog('focused', { timeout: 2011 }, (options) => {
    cy.get('#a').focus()
    cy.focused(options)
  })

  testLog('get', { withinSubject: null }, (options) => {
    cy.get('#a', options)
  })

  testLog('getCookie', { timeout: 2012 }, (options) => {
    cy.getCookie('auth_key', options)
  })

  testLog('getCookies', { timeout: 2013 }, (options) => {
    cy.getCookies(options)
  })

  testLog('go', { timeout: 2014 }, (options) => {
    cy.go('forward', options)
  })

  testLog('hash', { timeout: 2015 }, (options) => {
    cy.hash(options)
  })

  testLog('last', { timeout: 2016 }, (options) => {
    cy.get('input').last(options)
  })

  testLog('location', { timeout: 2017 }, (options) => {
    cy.location('port', options)
  })

  testLog('next', { timeout: 2018 }, (options) => {
    cy.get('#a').next('input', options)
  })

  testLog('nextAll', { timeout: 2019 }, (options) => {
    cy.get('#a').nextAll('input', options)
  })

  testLog('nextUntil', { timeout: 2020 }, (options) => {
    cy.get('#a').nextUntil('#b', options)
  })

  testLog('not', { timeout: 2021 }, (options) => {
    cy.get('input').not('#a', options)
  })

  testLog('parent ', { timeout: 2022 }, (options) => {
    cy.get('#a').parent('form', options)
  })

  testLog('parents', { timeout: 2023 }, (options) => {
    cy.get('#a').parents('form', options)
  })

  testLog('parentsUntil', { timeout: 2024 }, (options) => {
    cy.get('#a').parentsUntil('body', options)
  })

  // Ignore pause() because it only has an option, log.

  testLog('prev', { timeout: 2025 }, (options) => {
    cy.get('#b').prev('input', options)
  })

  testLog('prevAll', { timeout: 2026 }, (options) => {
    cy.get('#b').prevAll('input', options)
  })

  testLog('prevUntil', { timeout: 2027 }, (options) => {
    cy.get('#b').prevUntil('#a', options)
  })

  testLog('readFile', { timeout: 2028 }, (options) => {
    cy.readFile('./cypress/fixtures/command-log.html', options)
  })

  testLog('reload', { timeout: 2028 }, (options) => {
    cy.reload(true, options)
  })

  testLog('request', { url: '/fixtures/command-log.html' }, (options) => {
    cy.request(options)
  })

  testLog('rightclick', { timeout: 2028 }, (options) => {
    cy.get('button').rightclick(options)
  })

  testLog('root', { timeout: 2028 }, (options) => {
    cy.root(options)
  })

  // Ignore cy.route() because it doesn't log to reporter.

  testLog('screenshot', { capture: 'viewport' }, (options) => {
    cy.screenshot(options)
  })

  testLog('scrollIntoView', {
    offset: { top: 20, left: 30, right: 20, bottom: 40 },
    log: true,
    timeout: 3000,
    duration: 0,
  },
  (options) => {
    cy.get('form').scrollIntoView(options)
  })

  testLog('scrollTo', { duration: 100 }, (options) => {
    cy.scrollTo(0, 500, options)
  })

  testLog('select', { force: false }, (options) => {
    cy.get('#fruits').select('apples', options)
  })

  // Ignore cy.server() because it doesn't log to reporter.

  testLog('setCookie', { httpOnly: true }, (options) => {
    cy.setCookie('auth_key', '123key', options)
  })

  // Ignore cy.should() because it doesn't have options.

  testLog('siblings', { timeout: 2029 }, (options) => {
    cy.get('#a').siblings('input', options)
  })

  // Ignore cy.spread() because it only has an option, timeout
  // cy.spy(), cy.stub() because they don't log to reporter.

  testLog('submit', { timeout: 2030 }, (options) => {
    cy.get('form').submit(options)
  })

  testLog('task', { timeout: 2031 }, (options) => {
    cy.task('return:arg', 'hello world', options)
  })

  // Ignore cy.then() because it doesn't log to reporter.

  // Ignore cy.tick() because it doesn't have any options.

  testLog('title', { timeout: 2032 }, (options) => {
    cy.title(options)
  })

  testLog('trigger', { cancelable: true }, (options) => {
    cy.get('#a').trigger('mouseenter', 'top', options)
  })

  testLog('type', {
    delay: 10,
    force: true,
  }, (options) => {
    cy.get('#a').type('hi?', options)
  })

  testLog('uncheck', { force: false }, (options) => {
    cy.get('#checkbox').uncheck('good', options)
  })

  testLog('url', { timeout: 2033 }, (options) => {
    cy.url(options)
  })

  testLog('visit', {
    timeout: 20000,
    method: 'GET',
    qs: {
      foo: 'bar',
      baz: 3.14159265,
    },
  },
  (options) => {
    cy.visit('/fixtures/command-log.html', options)
  })

  testLog('wait', { requestTimeout: 2000 }, (options) => {
    cy.wait(100, options)
  })

  testLog('window', { timeout: 2034 }, (options) => {
    cy.window(options)
  })

  testLog('wrap', { timeout: 2035 }, (options) => {
    cy.wrap({ name: 'John Doe' }, options)
  })

  testLog('writeFile', { timeout: 2036 }, (options) => {
    cy.writeFile('./cypress/_test-output/test.txt', 'test', options)
  })
})

describe('last arg can be an object, but not an option', () => {
  before(() => {
    cy.visit('/fixtures/command-log.html')
  })

  beforeEach(() => {
    this.logs = []

    cy.on('log:added', (attrs, log) => {
      this.logs.push(log)
    })
  })

  afterEach(() => {
    cy.removeAllListeners('log:added')
  })

  it('check', () => {
    cy.on('fail', () => {
      expect(this.logs[1].get('options')).to.deep.eq(null)
    })

    cy.get('#b').check(['us', 'ca'])
  })

  it('clearLocalStorage', () => {
    cy.on('log:added', () => {
      cy.removeAllListeners('log:added')
      expect(this.logs[0].get('message')).to.eq('/app-/')
    })

    cy.clearLocalStorage(/app-/)
  })

  it('clock', () => {
    cy.on('fail', () => {
      expect(this.logs[0].get('options')).to.deep.eq(null)
    })

    cy.clock('invoke failure', ['setTimeout', 'clearTimeout'])
  })

  it('contains', () => {
    cy.on('fail', () => {
      expect(this.logs[0].get('options')).to.deep.eq({})
    })

    cy.contains('', /app-/)
  })

  it('invoke', () => {
    cy.on('fail', () => {
      expect(this.logs[1].get('options')).to.deep.eq({
        log: true,
      })
    })

    cy.wrap({}).invoke({ log: true }, 'non-exist')
  })

  it('nextUntil - jquery', () => {
    cy.on('log:added', (attrs, log) => {
      if (log.get('name') === 'nextUntil') {
        cy.removeAllListeners('log:added')
        expect(log.get('options')).to.deep.eq({})
      }
    })

    cy.get('div').nextUntil(cy.$$('.warning'))
  })

  it('nextUntil - DOM', () => {
    cy.on('log:added', (attrs, log) => {
      if (log.get('name') === 'nextUntil') {
        cy.removeAllListeners('log:added')
        expect(log.get('options')).to.deep.eq({})
      }
    })

    cy.get('div').nextUntil(document.getElementsByClassName('warning')[0])
  })

  it('parentsUntil - jquery', () => {
    cy.on('log:added', (attrs, log) => {
      if (log.get('name') === 'parentsUntil') {
        cy.removeAllListeners('log:added')
        expect(log.get('options')).to.deep.eq({})
      }
    })

    cy.get('div').parentsUntil(cy.$$('.warning'))
  })

  it('parentsUntil - DOM', () => {
    cy.on('log:added', (attrs, log) => {
      if (log.get('name') === 'parentsUntil') {
        cy.removeAllListeners('log:added')
        expect(log.get('options')).to.deep.eq({})
      }
    })

    cy.get('div').parentsUntil(document.getElementsByClassName('warning')[0])
  })

  it('prevUntil - jquery', () => {
    cy.on('log:added', (attrs, log) => {
      if (log.get('name') === 'prevUntil') {
        cy.removeAllListeners('log:added')
        expect(log.get('options')).to.deep.eq({})
      }
    })

    cy.get('div').prevUntil(cy.$$('.warning'))
  })

  it('prevUntil - DOM', () => {
    cy.on('log:added', (attrs, log) => {
      if (log.get('name') === 'prevUntil') {
        cy.removeAllListeners('log:added')
        expect(log.get('options')).to.deep.eq({})
      }
    })

    cy.get('div').prevUntil(document.getElementsByClassName('warning')[0])
  })

  it('select', () => {
    cy.on('log:added', (attrs) => {
      if (attrs.name === 'select') {
        expect(this.logs[1].get('options')).to.deep.eq({})
      }
    })

    cy.get('#auto-test').select(['Cypress', 'Jest'])
  })

  it('spread', () => {
    cy.on('fail', () => {
      expect(this.logs[1].get('options')).to.deep.eq({
        timeout: 1000,
      })
    })

    cy.wrap([1, 2, 3]).spread({ timeout: 1000 }, (a, b, c) => {
      throw new Error()
    })
  })

  it('task', () => {
    cy.on('fail', () => {
      expect(this.logs[0].get('options')).to.deep.eq({})
    })

    cy.task('throw', { a: 1, b: 2 })
  })

  it('then', () => {
    cy.on('fail', () => {
      expect(this.logs[1].get('options')).to.deep.eq({
        timeout: 1000,
      })
    })

    cy.wrap('a').then({ timeout: 1000 }, () => {
      throw new Error('hi?')
    })
  })

  it('uncheck', () => {
    cy.on('fail', () => {
      expect(this.logs[1].get('options')).to.deep.eq(null)
    })

    cy.get('#b').uncheck(['us', 'ca'])
  })
})

const log = require('../../../src/cypress/log')

describe('display props are relayed correctly', () => {
  it('timeout and wallClockStartedAt', () => {
    const props = log.getDisplayProps({
      timeout: 4000,
      wallClockStartedAt: new Date().toJSON(),
    })

    expect(props).to.haveOwnProperty('timeout')
    expect(props).to.haveOwnProperty('wallClockStartedAt')
  })
})
