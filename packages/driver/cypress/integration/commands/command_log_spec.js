describe('command log', () => {
  beforeEach(() => {
    cy.visit('/fixtures/command-log.html', {
      timeout: 20000,
      method: 'GET',
      qs: {
        foo: 'bar',
        baz: 3.14159265,
      },
    })
  })

  describe('visually checks if options show correctly', () => {
    it('A-E', () => {
      // Ignore cy.and(), cy.as() because they don't have options.

      cy.get('#a').focus().blur({
        force: false,
      })

      cy.get('#a').focus().blur({
        force: true,
      })

      cy.get('#checkbox').check({
        force: false,
      })

      cy.get('form').children('#a', {
        timeout: 2000,
      })

      cy.get('#a').clear({
        force: false,
      })

      cy.clearCookie('authId', {
        timeout: 4000,
      })

      cy.clearCookies({
        timeout: 4000,
      })

      // Ignore cy.clearLocalStorage() because it only has an option, log.

      cy.contains('button').click({
        force: false,
      })

      cy.contains('button').click(1, 2, {
        force: false,
      })

      cy.contains('button').click('center', {
        force: false,
      })

      // Ignore cy.clock() because it only has an option, log.

      cy.get('#a').closest('form', {
        timeout: 3000,
      })

      cy.contains('.test', 'Hello', {
        timeout: 1131,
      })

      cy.get('button').dblclick({
        force: false,
      })

      // Ignore cy.debug() because it only has an option, log.

      cy.document({
        timeout: 3000,
      })

      // Ignore cy.each() because it only has an option, timeout.
      // Ignore cy.end() because it doesn't have options.

      cy.get('input').eq(0, {
        timeout: 1111,
      })

      cy.exec('ls', {
        env: { 'a': true },
      })
    })

    it('F-P', () => {
      cy.get('input').filter('#a', {
        timeout: 2222,
      })

      cy.get('form').find('#a', {
        timeout: 2345,
      })

      cy.get('input').first({
        timeout: 2000,
      })

      // Ignore cy.fixture() because it doesn't log to reporter.

      cy.get('#a').focus({
        timeout: 2500,
      })

      cy.focused({
        timeout: 2500,
      })

      cy.get('#a', {
        withinSubject: document.forms[0],
      })

      cy.getCookie('auth_key', {
        timeout: 1800,
      })

      cy.getCookies({
        timeout: 1888,
      })

      cy.go('forward', {
        timeout: 4000,
      })

      cy.hash({
        timeout: 1100,
      })

      // Ignore invoke(), its() because they don't have options.

      cy.get('input').last({
        timeout: 3000,
      })

      cy.location('port', {
        timeout: 2000,
      })

      // Ignore log() because it doesn't have options.

      cy.get('#a').next('input', {
        timeout: 2300,
      })

      cy.get('#a').nextAll('input', {
        timeout: 1211,
      })

      cy.get('#a').nextUntil('#b', {
        timeout: 1111,
      })

      cy.get('input').not('#a', {
        timeout: 3333,
      })

      cy.get('#a').parent('form', {
        timeout: 2345,
      })

      cy.get('#a').parents('form', {
        timeout: 3333,
      })

      cy.get('#a').parentsUntil('body', {
        timeout: 1112,
      })

      // Ignore pause() because it only has an option, log.

      cy.get('#b').prev('input', {
        timeout: 1236,
      })

      cy.get('#b').prevAll('input', {
        timeout: 2111,
      })

      cy.get('#b').prevUntil('#a', {
        timeout: 3111,
      })
    })

    it('Q-Z', () => {
      cy.readFile('./cypress/fixtures/command-log.html', {
        timeout: 3000,
      })

      cy.reload(true, {
        timeout: 2000,
      })

      cy.request({
        url: '/fixtures/command-log.html',
      })

      cy.get('button').rightclick({
        timeout: 1144,
      })

      cy.root({
        timeout: 2000,
      })

      // Ignore cy.route() because it doesn't log to reporter.

      cy.screenshot({
        capture: 'viewport',
      })

      cy.get('form').scrollIntoView({
        offset: { top: 20, left: 30, right: 20, bottom: 40 },
        log: true,
        timeout: 3000,
        duration: 0,
      })

      cy.scrollTo(0, 500, {
        duration: 100,
      })

      cy.get('#fruits').select('apples', {
        force: false,
      })

      // Ignore cy.server() because it doesn't log to reporter.

      cy.setCookie('auth_key', '123key', {
        httpOnly: true,
      })

      // Ignore cy.should() because it doesn't have options.

      cy.get('#a').siblings('input', {
        timeout: 2223,
      })

      // Ignore cy.spread() because it only has an option, timeout
      // cy.spy(), cy.stub() because they don't log to reporter.

      cy.get('form').submit({
        timeout: 2000,
      })

      cy.task('return:arg', 'hello world', {
        timeout: 2000,
      })

      // Ignore cy.then() because it doesn't log to reporter.

      // Ignore cy.tick() because it doesn't have any options.

      cy.title({
        timeout: 2000,
      })

      cy.get('#a').trigger('mouseenter', 'top', {
        cancelable: true,
      })

      cy.get('#a').type('hi?', {
        delay: 10,
        force: true,
      })

      cy.get('#checkbox').uncheck('good', {
        force: false,
      })

      cy.url({
        timeout: 2000,
      })

      // Ignore cy.viewport() because it only has an option, log.

      // Ignore cy.visit() because it is tested in beforeEach().

      cy.wait(100, {
        requestTimeout: 2000,
      })

      cy.window({
        timeout: 1500,
      })

      // Ignore cy.within() because it only has an option, log.

      cy.wrap({ name: 'John Doe' }, {
        timeout: 1000,
      })

      cy.writeFile('./cypress/_test-output/test.txt', 'test', {
        timeout: 3000,
      }).exec('rm ./cypress/_test-output/test.txt')
    })
  })

  describe('All commands preserve options properly', () => {
    const testOptions = (commandName, options, order, f) => {
      const originalOptions = Object.assign({}, options)

      it(commandName, () => {
        let count = 0

        cy.on('log:added', (attrs, log) => {
          if (count === order) {
            cy.removeAllListeners('log:added')
            expect(log.get('options')).to.deep.eq(originalOptions)
          }

          count++
        })

        f(options)
      })
    }

    describe('A-E', () => {
      testOptions('blur', { force: false }, 2, (options) => {
        cy.get('#a').focus().blur(options)
      })

      testOptions('check', { force: false }, 1, (options) => {
        cy.get('#checkbox').check(options)
      })

      testOptions('children', { timeout: 2000 }, 1, (options) => {
        cy.get('form').children('#a', options)
      })

      testOptions('clear', { force: false }, 1, (options) => {
        cy.get('#a').clear(options)
      })

      testOptions('clearCookie', { timeout: 4000 }, 0, (options) => {
        cy.clearCookie('authId', options)
      })

      testOptions('clearCookies', { timeout: 4000 }, 0, (options) => {
        cy.clearCookies(options)
      })

      // Ignore cy.clearLocalStorage() because it only has an option, log.

      testOptions('click', { force: false }, 1, (options) => {
        cy.contains('button').click(options)
      })

      // Ignore cy.clock() because it only has an option, log.

      testOptions('closest', { timeout: 3000 }, 1, (options) => {
        cy.get('#a').closest('form', options)
      })

      testOptions('contains', { timeout: 1131 }, 0, (options) => {
        cy.contains('.test', 'Hello', options)
      })

      testOptions('dblclick', { force: false }, 1, (options) => {
        cy.get('button').dblclick(options)
      })

      // Ignore cy.debug() because it only has an option, log.

      testOptions('document', { timeout: 3000 }, 0, (options) => {
        cy.document(options)
      })

      // Ignore cy.each(), cy.end() because they don't have options.

      testOptions('eq', { timeout: 1111 }, 1, (options) => {
        cy.get('input').eq(0, options)
      })

      testOptions('exec', { env: { 'a': true } }, 0, (options) => {
        cy.exec('ls', options)
      })
    })

    describe('F-P', () => {
      testOptions('filter', { timeout: 2222 }, 1, (options) => {
        cy.get('input').filter('#a', options)
      })

      testOptions('find', { timeout: 2345 }, 1, (options) => {
        cy.get('form').find('#a', options)
      })

      testOptions('first', { timeout: 2000 }, 1, (options) => {
        cy.get('input').first(options)
      })

      // Ignore cy.fixture() because it doesn't log to reporter.

      testOptions('focus', { timeout: 2500 }, 1, (options) => {
        cy.get('#a').focus(options)
      })

      testOptions('focused', { timeout: 2500 }, 2, (options) => {
        cy.get('#a').focus().focused(options)
      })

      testOptions('get', { withinSubject: document.forms[0] }, 0, (options) => {
        cy.get('#a', options)
      })

      testOptions('getCookie', { timeout: 1800 }, 0, (options) => {
        cy.getCookie('auth_key', options)
      })

      testOptions('getCookies', { timeout: 1888 }, 0, (options) => {
        cy.getCookies(options)
      })

      testOptions('go', { timeout: 4000 }, 0, (options) => {
        cy.go('forward', options)
      })

      testOptions('hash', { timeout: 1100 }, 0, (options) => {
        cy.hash(options)
      })

      // Ignore invoke(), its() because they don't have options.

      testOptions('last', { timeout: 3000 }, 1, (options) => {
        cy.get('input').last(options)
      })

      testOptions('location', { timeout: 2000 }, 0, (options) => {
        cy.location('port', options)
      })

      // Ignore log() because it doesn't have options.

      testOptions('next', { timeout: 2300 }, 1, (options) => {
        cy.get('#a').next('input', options)
      })

      testOptions('nextAll', { timeout: 1211 }, 1, (options) => {
        cy.get('#a').nextAll('input', options)
      })

      testOptions('nextUntil', { timeout: 1111 }, 1, (options) => {
        cy.get('#a').nextUntil('#b', options)
      })

      testOptions('not', { timeout: 3333 }, 1, (options) => {
        cy.get('input').not('#a', options)
      })

      testOptions('parent', { timeout: 2345 }, 1, (options) => {
        cy.get('#a').parent('form', options)
      })

      testOptions('parents', { timeout: 3333 }, 1, (options) => {
        cy.get('#a').parents('form', options)
      })

      testOptions('parentsUntil', { timeout: 1112 }, 1, (options) => {
        cy.get('#a').parentsUntil('body', options)
      })

      // Ignore pause() because it only has an option, log.

      testOptions('prev', { timeout: 1236 }, 1, (options) => {
        cy.get('#b').prev('input', options)
      })

      testOptions('prevAll', { timeout: 2111 }, 1, (options) => {
        cy.get('#b').prevAll('input', options)
      })

      testOptions('prevUntil', { timeout: 3111 }, 1, (options) => {
        cy.get('#b').prevUntil('#a', options)
      })
    })

    describe('Q-Z', () => {
      testOptions('readFile', { timeout: 3000 }, 0, (options) => {
        cy.readFile('./cypress/fixtures/command-log.html', options)
      })

      testOptions('reload', { timeout: 2000 }, 0, (options) => {
        cy.reload(true, options)
      })

      testOptions('request', { url: '/fixtures/command-log.html' }, 0, (options) => {
        cy.request(options)
      })

      testOptions('rightclick', { timeout: 1144 }, 1, (options) => {
        cy.get('button').rightclick(options)
      })

      testOptions('root', { timeout: 2000 }, 0, (options) => {
        cy.root(options)
      })

      // Ignore cy.route() because it doesn't log to reporter.

      testOptions('screenshot', { capture: 'viewport' }, 0, (options) => {
        cy.screenshot(options)
      })

      testOptions('scrollIntoView', { offset: { top: 20 } }, 1, (options) => {
        cy.get('form').scrollIntoView(options)
      })

      testOptions('scrollTo', { duration: 100 }, 0, (options) => {
        cy.scrollTo(0, 500, options)
      })

      testOptions('select', { force: false }, 1, (options) => {
        cy.get('#fruits').select('apples', options)
      })

      // Ignore cy.server() because it doesn't log to reporter.

      testOptions('setCookie', { httpOnly: true }, 0, (options) => {
        cy.setCookie('auth_key', '123key', options)
      })

      // Ignore cy.should() because it doesn't have options.

      testOptions('siblings', { timeout: 2223 }, 1, (options) => {
        cy.get('#a').siblings('input', options)
      })

      // Ignore cy.spread(), cy.spy(), cy.stub() because they don't log to reporter.

      testOptions('submit', { timeout: 2000 }, 1, (options) => {
        cy.get('form').submit(options)
      })

      testOptions('task', { timeout: 2000 }, 0, (options) => {
        cy.task('return:arg', 'hello world', options)
      })

      // Ignore cy.then() because it doesn't log to reporter.

      // Ignore cy.tick() because it doesn't have any options.

      testOptions('title', { timeout: 2000 }, 0, (options) => {
        cy.title(options)
      })

      testOptions('trigger', { cancelable: true }, 1, (options) => {
        cy.get('#a').trigger('mouseenter', 'top', options)
      })

      testOptions('type', { delay: 10 }, 1, (options) => {
        cy.get('#a').type('hi?', options)
      })

      testOptions('uncheck', { force: false }, 1, (options) => {
        cy.get('#checkbox').uncheck('good', options)
      })

      testOptions('url', { timeout: 2000 }, 0, (options) => {
        cy.url(options)
      })

      // Ignore cy.viewport() because it only has an option, log.

      // Ignore cy.visit() because it is tested in beforeEach().

      testOptions('wait', { requestTimeout: 2000 }, 0, (options) => {
        cy.wait(100, options)
      })

      testOptions('window', { timeout: 1500 }, 0, (options) => {
        cy.window(options)
      })

      // Ignore cy.within() because it only has an option, log.

      testOptions('wrap', { timeout: 1000 }, 0, (options) => {
        cy.wrap({ name: 'John Doe' }, options)
      })

      testOptions('writeFile', { timeout: 3000 }, 0, (options) => {
        cy.writeFile('./cypress/_test-output/test.txt', 'test', options)
        .exec('rm ./cypress/_test-output/test.txt')//*/
      })
    })
  })
})
