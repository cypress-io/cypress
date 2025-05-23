describe('Command Options and UI Display Tests', () => {
  it('commands that do not appear in command log', () => {
    cy.visit('cypress/fixtures/commandsActions.html')

    cy.wrap({ foo: { bar: 'baz' } })
    .then((obj) => obj)
    .should('have.property', 'foo')
    .and('have.property', 'bar')

    cy.wrap({ foo: { bar: 'baz' } })
    .as('myObject')

    cy.get('@myObject').then((obj) => {
      cy.log(obj)
    })

    cy.get('div').each(($div) => { }).end()

    cy.fixture('uiStates')

    cy.intercept('GET', 'comments/*').as('getComment')

    cy.wrap(['foo', 'bar']).spread(() => {})

    const obj = {
      foo () { },
      bar () { },
    }

    cy.spy(obj, 'foo')
    cy.stub(obj, 'bar')
  })

  it('form interaction command options', () => {
    cy.visit('cypress/fixtures/uiStates.html')

    cy.get('#a').focus().blur({ force: false })
    cy.get('#checkbox').check({ force: false })
    cy.get('form').children({ timeout: 2000 })
    cy.get('#a').clear({ force: false })
    cy.clearCookie('authId', { timeout: 2001 })
    cy.clearCookies({ timeout: 2002 })

    cy.contains('button').click({ force: false })
    cy.contains('button').click(1, 2, { force: false })
    cy.contains('button').click('bottom', { force: false })
  })

  it('DOM traversal command options', () => {
    cy.visit('cypress/fixtures/uiStates.html')

    cy.get('#a').closest('form', { timeout: 2003 })
    cy.contains('.test', 'Hello', { timeout: 2004 })
    cy.get('button').dblclick({ force: false })

    cy.document({ timeout: 2005 })

    cy.get('input').eq(0, { timeout: 2006 })
    cy.exec('ls', { env: { 'a': true } })
    cy.get('input').filter('#a', { timeout: 2007 })
    cy.get('form').find('#a', { timeout: 2008 })
    cy.get('input').first({ timeout: 2009 })
  })

  it('element state and navigation command options', () => {
    cy.visit('cypress/fixtures/uiStates.html')

    cy.get('#a').focus({ timeout: 2010 })
    cy.get('#a').focus()
    cy.focused({ timeout: 2011 })
    cy.get('#a', { withinSubject: document.forms[0] })
    cy.getCookie('auth_key', { timeout: 2012 })
    cy.getCookies({ timeout: 2013 })
    cy.go('forward', { timeout: 2014 })
    cy.hash({ timeout: 2015 })
    cy.get('input').last({ timeout: 2016 })
    cy.location('port', { timeout: 2017 })
    cy.get('#a').next('input', { timeout: 2018 })
    cy.get('#a').nextAll('input', { timeout: 2019 })
  })

  it('element traversal and file operations command options', () => {
    cy.visit('cypress/fixtures/uiStates.html')

    cy.get('#a').nextUntil('#b', { timeout: 2020 })
    cy.get('input').not('#a', { timeout: 2021 })
    cy.get('#a').parent('form', { timeout: 2022 })
    cy.get('#a').parents('form', { timeout: 2023 })
    cy.get('#a').parentsUntil('body', { timeout: 2024 })
    cy.get('#b').prev('input', { timeout: 2025 })
    cy.get('#b').prevAll('input', { timeout: 2026 })
    cy.get('#b').prevUntil('#a', { timeout: 2027 })
    cy.readFile('./cypress/fixtures/uiStates.json', { timeout: 2028 })
    cy.reload(true, { timeout: 2028 })
    cy.get('button').rightclick({ timeout: 2028 })
    cy.root({ timeout: 2028 })
  })

  it('scrolling and form interaction command options', () => {
    cy.visit('cypress/fixtures/uiStates.html')

    cy.screenshot({ capture: 'viewport' })
    cy.get('form').scrollIntoView({
      offset: { top: 20, left: 30, right: 20, bottom: 40 },
      log: true,
      timeout: 3000,
      duration: 0,
    })

    cy.scrollTo(0, 500, { duration: 100 })
    cy.get('#fruits').select('apples', { force: false })
    cy.setCookie('auth_key', '123key', { httpOnly: true })
    cy.get('#a').siblings('input', { timeout: 2029 })
    cy.get('form').submit({ timeout: 2030 })
    cy.title({ timeout: 2032 })
  })

  it('user interaction and window command options', () => {
    cy.visit('cypress/fixtures/uiStates.html')

    cy.get('#a').trigger('mouseenter', 'top', { cancelable: true })
    cy.get('#a').type('hi?', {
      delay: 10,
      force: true,
    })

    cy.get('#checkbox').uncheck('good', { force: false })
    cy.url({ timeout: 2033 })
    cy.visit('cypress/fixtures/uiStates.html', {
      timeout: 20000,
    })

    cy.wait(100, { requestTimeout: 2000 })
    cy.window({ timeout: 2034 })
    cy.wrap({ name: 'John Doe' }, { timeout: 2035 })
    cy.writeFile('./cypress/_test-output/test.txt', 'test', { timeout: 2036 })
  })

  it('verify element visibility state', () => {
    cy.visit('cypress/fixtures/commandsActions.html')

    cy.get('#scroll-horizontal button')
    .should('not.be.visible')
  })
})
