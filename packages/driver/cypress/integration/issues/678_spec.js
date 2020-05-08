describe('issue #678', () => {
  beforeEach(() => {
    cy.visit('/fixtures/issue-678.html', {
      timeout: 20000,
      method: 'GET',
      qs: {
        foo: 'bar',
        baz: 3.14159265,
      },
    })
  })

  it('visually checks if options work correctly', () => {
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

    // Ignore cy.each(), cy.end() because they don't have options.

    cy.get('input').eq(0, {
      timeout: 1111,
    })

    cy.exec('ls', {
      env: { 'a': true },
    })

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

    cy.readFile('./cypress/fixtures/issue-678.html', {
      timeout: 3000,
    })

    cy.reload(true, {
      timeout: 2000,
    })

    cy.request({
      url: '/fixtures/issue-678.html',
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
      offset: { top: 20 },
    })

    cy.scrollTo(0, 500, {
      duration: 100,
    })

    cy.get('select').select('apples', {
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

    // Ignore cy.spread(), cy.spy(), cy.stub() because they don't log to reporter.

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

    cy.writeFile('./cypress/fixtures/test.txt', 'test', {
      timeout: 3000,
    }).exec('rm ./cypress/fixtures/test.txt')
  })
})
