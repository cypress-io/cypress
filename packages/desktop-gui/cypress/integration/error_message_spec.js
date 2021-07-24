describe('Error Message', function () {
  beforeEach(function () {
    this.err = {
      message: 'Port 2020 is already in use.',
      name: 'Error',
      port: 2020,
      portInUse: true,
      stack: '[object Object]↵  at Object.API.get (/Users/jennifer/Dev/Projects/cypress-app/lib/errors.coffee:55:15)↵  at Object.wrapper [as get] (/Users/jennifer/Dev/Projects/cypress-app/node_modules/lodash/lodash.js:4414:19)↵  at Server.portInUseErr (/Users/jennifer/Dev/Projects/cypress-app/lib/server.coffee:58:16)↵  at Server.onError (/Users/jennifer/Dev/Projects/cypress-app/lib/server.coffee:86:19)↵  at Server.g (events.js:273:16)↵  at emitOne (events.js:90:13)↵  at Server.emit (events.js:182:7)↵  at emitErrorNT (net.js:1253:8)↵  at _combinedTickCallback (internal/process/next_tick.js:74:11)↵  at process._tickDomainCallback (internal/process/next_tick.js:122:9)↵From previous event:↵    at fn (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:57919:14)↵    at Object.appIpc [as ipc] (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:57939:10)↵    at openProject (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:59135:24)↵    at new Project (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:58848:34)↵    at ReactCompositeComponentMixin._constructComponentWithoutOwner (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44052:27)↵    at ReactCompositeComponentMixin._constructComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44034:21)↵    at ReactCompositeComponentMixin.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:43953:21)↵    at Object.ReactReconciler.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:51315:35)↵    at ReactCompositeComponentMixin.performInitialMount (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44129:34)↵    at ReactCompositeComponentMixin.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44016:21)↵    at Object.ReactReconciler.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:51315:35)↵    at ReactDOMComponent.ReactMultiChild.Mixin._mountChildAtIndex (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:50247:40)↵    at ReactDOMComponent.ReactMultiChild.Mixin._updateChildren (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:50163:43)↵    at ReactDOMComponent.ReactMultiChild.Mixin.updateChildren (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:50123:12)↵    at ReactDOMComponent.Mixin._updateDOMChildren (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:45742:12)↵    at ReactDOMComponent.Mixin.updateComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:45571:10)↵    at ReactDOMComponent.Mixin.receiveComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:45527:10)↵    at Object.ReactReconciler.receiveComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:51396:22)↵    at ReactCompositeComponentMixin._updateRenderedComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44547:23)',
      type: 'PORT_IN_USE_SHORT',
    }

    this.detailsErr = {
      name: 'Error',
      message: 'This is an error message explaining an event. Learn more about this event in the error details section.',
      stack: '[object Object]↵',
      details: 'ReferenceError: alsdkjf is not defined\n \
\tat module.exports (/Users/lilaconlee/cypress/debug/desktop-gui-mishap/cypress/plugins/index.js:15:3)\n \
\tat Promise.try (/Users/lilaconlee/cypress/cypress/packages/server/lib/plugins/child/run_plugins.js:62:12)\n \
\tat tryCatcher (/Users/lilaconlee/cypress/cypress/packages/server/node_modules/bluebird/js/release/util.js:16:23)\n \
\tat Function.Promise.attempt.Promise.try (/Users/lilaconlee/cypress/cypress/packages/server/node_modules/bluebird/js/release/method.js:39:29)\n \
\tat load (/Users/lilaconlee/cypress/cypress/packages/server/lib/plugins/child/run_plugins.js:61:7)\n \
\tat EventEmitter.ipc.on (/Users/lilaconlee/cypress/cypress/packages/server/lib/plugins/child/run_plugins.js:132:5)\n \
\tat emitOne (events.js:115:13)\n \
\tat EventEmitter.emit (events.js:210:7)\n \
\tat process.<anonymous> (/Users/lilaconlee/cypress/cypress/packages/server/lib/plugins/util.coffee:18:7)\n \
\tat emitTwo (events.js:125:13)\n \
\tat process.emit (events.js:213:7)\n \
\tat emit (internal/child_process.js:768:12)\n \
\tat _combinedTickCallback (internal/process/next_tick.js:141:11)\n \
\tat process._tickCallback (internal/process/next_tick.js:180:9)',
    }

    cy.visitIndex().then((win) => {
      ({ start: this.start, ipc: this.ipc } = win.App)

      cy.stub(this.ipc, 'getOptions').resolves({ projectRoot: '/foo/bar' })
      cy.stub(this.ipc, 'getCurrentUser').resolves(this.user)
      cy.stub(this.ipc, 'openProject').resolves(this.config)
      cy.stub(this.ipc, 'closeProject').resolves()
      cy.stub(this.ipc, 'onConfigChanged')
      cy.stub(this.ipc, 'externalOpen')

      this.updaterCheck = this.util.deferred()

      cy.stub(this.ipc, 'updaterCheck').resolves(this.updaterCheck.promise)
    })
  })

  it('displays normal error message', function () {
    this.ipc.openProject.rejects(this.err)
    this.start()

    cy.get('.error')
    .should('contain', this.err.message)

    cy.percySnapshot()
  })

  it('displays error message with html escaped', function () {
    this.err.message = 'Error reading from: <span class=\'ansi-blur-gf\'>/Users/cypress.json</span><br /><br /> <span class=\'ansi-yellow-fg\'>SyntaxError</span>'
    this.ipc.openProject.rejects(this.err)
    this.start()

    cy.get('.error')
    .should('contain', 'Error reading from: /Users/cypress.json')
    .should('not.contain', '<span')
  })

  it('displays Port in Use instructions on err', function () {
    this.ipc.openProject.rejects(this.err)
    this.start()

    cy.get('.error')
    .should('contain', this.err.message)
    .and('contain', 'To fix')
  })

  it('displays miscellaneous project error', function () {
    cy.stub(this.ipc, 'onProjectError').yields(null, this.err)
    this.start()

    cy.get('.error')
    .should('contain', this.err.message)
    .and('contain', 'To fix')
  })

  it('word wraps long error message', function () {
    this.updaterCheck.resolve('1.3.4')
    this.longErrMessage = 'Morbileorisus,portaacconsecteturac,vestibulumateros.Nullamquisrisusegeturnamollis ornare vel eu leo. Donec sed odio dui. Nullam quis risus eget urna mollis ornare vel eu leo. Etiam porta sem malesuada magna mollis euismod. Maecenas faucibus mollis interdum. Nullam id dolor id nibh ultricies vehicula ut id elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam id dolor id nibh ultricies vehicula ut id elit. Vestibulum id ligula porta felis euismod semper. Vestibulum id ligula porta felis euismod semper.Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nullam id dolor id nibh ultricies vehicula ut id elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Donec id elit non mi porta gravida at eget metus. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Cras justo odio, dapibus ac facilisis in, egestas eget quam.Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod.'
    this.ipc.openProject.rejects({ name: 'Error', message: this.longErrMessage, stack: '[object Object]↵' })
    this.start()

    cy.get('.error')
    .and('contain', this.longErrMessage)

    cy.percySnapshot()
  })

  it('re-opens project on click of \'Try again\' button', function () {
    this.ipc.openProject.rejects(this.err)
    this.start()

    cy.get('.error')
    .contains('Try Again').click().should(() => {
      expect(this.ipc.closeProject).to.be.called

      expect(this.ipc.openProject).to.be.called
    })
  })

  it('renders markdown', function () {
    this.withMarkdown = '**this** is _markdown_'
    this.markdownErr = {
      name: 'Error',
      message: this.withMarkdown,
      stack: '[object Object]↵',
    }

    cy.stub(this.ipc, 'onProjectError').yields(null, this.markdownErr)
    this.start()

    cy.get('.error')
    .should('not.contain', this.withMarkdown)
    .should('contain', 'this is markdown')
  })

  it('shows error details if provided', function () {
    cy.stub(this.ipc, 'onProjectError').yields(null, this.detailsErr)
    this.start()

    cy.get('.error').contains('ReferenceError: alsdkjf is not defined')
    cy.get('details.details-body').should('not.have.attr', 'open')
    cy.get('details.details-body').click().should('have.attr', 'open')
    cy.get('details.details-body > summary').should('contain', 'ReferenceError')
  })

  it('doesn\'t show error details if not provided', function () {
    cy.stub(this.ipc, 'onProjectError').yields(null, this.err)
    this.start()

    cy.get('details.details-body > summary').should('not.exist')
  })

  it('shows error stack trace if provided', function () {
    const err = new Error('foo')

    err.stack = 'bar'

    cy.stub(this.ipc, 'onProjectError').yields(null, err)
    this.start()

    cy.get('.error').contains('foo')
    cy.get('details.stacktrace').should('not.have.attr', 'open')
    cy.get('details.stacktrace').click().should('have.attr', 'open')
    cy.get('details.stacktrace').should('contain', 'bar')
    cy.percySnapshot()
  })

  it('doesn\'t show error stack trace if not provided', function () {
    const err = new Error()

    delete err.stack
    cy.stub(this.ipc, 'onProjectError').yields(null, err)
    this.start()

    cy.get('.error')
    cy.get('details.stacktrace > summary').should('not.exist')
  })

  it('shows abbreviated error details if only one line', function () {
    const messageText = 'This is an error message explaining an event. Learn more about this event in the error details section.'

    this.detailsErr = {
      name: 'Error',
      message: messageText,
      stack: '[object Object]↵',
      details: 'ReferenceError: alsdkjf is not defined',
    }

    cy.stub(this.ipc, 'onProjectError').yields(null, this.detailsErr)
    this.start()

    cy.get('.error').contains('ReferenceError: alsdkjf is not defined')
    cy.get('details.details-body > summary').should('not.exist')
  })

  it('opens links outside of electron', function () {
    this.err.message = 'Error: read some docs at [http://example.com](http://example.com)'

    this.ipc.openProject.rejects(this.err)
    this.start()

    cy.contains('.alert-content a', 'http://example.com')
    .click().then(function () {
      expect(this.ipc.externalOpen).to.be.calledWith('http://example.com/')
    })
  })

  it('doesn\'t try to open non-links', function () {
    this.err.message = 'Error: read some docs at <strong>not here</strong>'

    this.ipc.openProject.rejects(this.err)
    this.start()

    cy.contains('strong', 'not here').click().then(function () {
      expect(this.ipc.externalOpen).to.not.be.called
    })
  })

  it('footer is at bottom when error is displayed (issue #4912)', function () {
    this.ipc.openProject.rejects(this.err)
    this.start()

    cy.get('footer').invoke('position').then(({ top }) => {
      cy.get('footer').invoke('outerHeight').then((height) => {
        expect(top).to.equal(Cypress.config('viewportHeight') - height)
      })
    })
  })

  it('does not overlay the nav/footer when long details are expanded (issue #4959)', function () {
    this.detailsErr.details = `${this.detailsErr.details}${this.detailsErr.details}` // make details longer
    this.ipc.openProject.rejects(this.detailsErr)
    this.start()

    cy.get('details.details-body').click()
    cy.get('nav').should('be.visible')
    cy.get('footer').should('be.visible')
  })

  it('it scrolls the error details when details are expanded (issue #4959)', function () {
    this.detailsErr.details = `${this.detailsErr.details}${this.detailsErr.details}` // make details longer
    this.ipc.openProject.rejects(this.detailsErr)
    this.start()

    cy.get('details.details-body').click()
    cy.contains('Try Again').should('be.visible')
    cy.get('.full-alert pre').should('have.css', 'overflow', 'auto')
  })
})
