const $ = require('jquery')
const { assertLogLength } = require('../../support/utils')

const { _, Promise, Screenshot } = Cypress

const getViewportHeight = () => {
  return Math.min(cy.state('viewportHeight'), $(cy.state('window')).height())
}

describe('src/cy/commands/screenshot', () => {
  beforeEach(function () {
    cy.stub(Cypress, 'automation').callThrough()

    this.serverResult = {
      path: '/path/to/screenshot',
      size: 12,
      dimensions: { width: 20, height: 20 },
      multipart: false,
      pixelRatio: 1,
      takenAt: new Date().toISOString(),
      name: 'name',
      blackout: ['.foo'],
      testAttemptIndex: 0,
      duration: 100,
    }

    this.screenshotConfig = {
      capture: 'viewport',
      screenshotOnRunFailure: true,
      disableTimersAndAnimations: true,
      overwrite: false,
      scale: true,
      blackout: ['.foo'],
    }
  })

  context('runnable:after:run:async', () => {
    it('is noop when not isTextTerminal', () => {
      // backup this property so we set it back to whatever
      // is correct based on what mode we're currently in
      const isTextTerminal = Cypress.config('isTextTerminal')

      Cypress.config('isTextTerminal', false)

      cy.spy(Cypress, 'action').log(false)

      const test = {
        err: new Error,
      }

      const runnable = cy.state('runnable')

      Cypress.action('runner:runnable:after:run:async', test, runnable)
      .then(() => {
        expect(Cypress.action).not.to.be.calledWith('test:set:state')
        expect(Cypress.automation).not.to.be.called
      })
      .finally(() => {
        Cypress.config('isTextTerminal', isTextTerminal)
      })
    })

    it('is noop when no test.err', () => {
      Cypress.config('isInteractive', false)

      cy.spy(Cypress, 'action').log(false)

      const test = {}

      const runnable = cy.state('runnable')

      Cypress.action('runner:runnable:after:run:async', test, runnable)
      .then(() => {
        expect(Cypress.action).not.to.be.calledWith('test:set:state')
        expect(Cypress.automation).not.to.be.called
      })
    })

    it('is noop when screenshotOnRunFailure is false', () => {
      Cypress.config('isInteractive', false)
      Cypress.config('screenshotOnRunFailure', false)

      cy.spy(Cypress, 'action').log(false)

      const test = {
        err: new Error,
      }

      const runnable = cy.state('runnable')

      Cypress.action('runner:runnable:after:run:async', test, runnable)
      .then(() => {
        expect(Cypress.action).not.to.be.calledWith('cy:test:set:state')
        expect(Cypress.automation).not.to.be.called
      })
    })

    it('sends before/after events', function () {
      Cypress.config('isInteractive', false)
      this.screenshotConfig.scale = false
      cy.stub(Screenshot, 'getConfig').returns(this.screenshotConfig)
      Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)

      cy.stub(Cypress, 'action').log(false)
      .callThrough()
      .withArgs('cy:before:screenshot')
      .yieldsAsync()

      const test = { id: '123', err: new Error() }
      const runnable = cy.state('runnable')

      Cypress.action('runner:runnable:after:run:async', test, runnable)
      .then(() => {
        expect(Cypress.action).to.be.calledWith('cy:before:screenshot', {
          id: runnable.id,
          isOpen: true,
          appOnly: false,
          scale: true,
          overwrite: false,
          waitForCommandSynchronization: true,
          disableTimersAndAnimations: true,
          blackout: [],
          testAttemptIndex: 0,
        })

        expect(Cypress.action).to.be.calledWith('cy:after:screenshot', {
          id: runnable.id,
          isOpen: false,
          appOnly: false,
          scale: true,
          overwrite: false,
          waitForCommandSynchronization: true,
          disableTimersAndAnimations: true,
          blackout: [],
          testAttemptIndex: 0,
        })
      })
    })

    it('takes screenshot when not isInteractive', function () {
      Cypress.config('isInteractive', false)
      Cypress.config('screenshotOnRunFailure', true)
      cy.stub(Screenshot, 'getConfig').returns(this.screenshotConfig)

      Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)

      const test = {
        id: '123',
        err: new Error,
      }

      const runnable = cy.state('runnable')

      Cypress.action('runner:runnable:after:run:async', test, runnable)
      .then(() => {
        expect(Cypress.automation).to.be.calledWith('take:screenshot')
        let args = Cypress.automation.withArgs('take:screenshot').args[0][1]

        args = _.omit(args, 'padding', 'clip', 'userClip', 'viewport', 'takenPaths', 'startTime')

        expect(args).to.eql({
          testId: runnable.id,
          titles: [
            'src/cy/commands/screenshot',
            'runnable:after:run:async',
            runnable.title,
          ],
          capture: 'runner',
          simple: true,
          testFailure: true,
          blackout: [],
          scaled: true,
          testAttemptIndex: 0,
        })
      })
    })

    describe('simple: false', () => {
      beforeEach(function () {
        this.hideRunnerUiOld = Cypress.config('hideRunnerUi')
      })

      afterEach(function () {
        Cypress.config('hideRunnerUi', this.hideRunnerUiOld)
      })

      it('if screenshot has been taken in test', function () {
        cy.state('screenshotTaken', true)
        Cypress.config('isInteractive', false)
        cy.stub(Screenshot, 'getConfig').returns(this.screenshotConfig)

        Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)

        const test = {
          id: '123',
          err: new Error,
        }

        const runnable = cy.state('runnable')

        Cypress.action('runner:runnable:after:run:async', test, runnable)
        .delay(1) // before:screenshot promise requires a tick
        .then(() => {
          expect(Cypress.automation.withArgs('take:screenshot')).to.be.calledOnce
          let args = Cypress.automation.withArgs('take:screenshot').args[0][1]

          args = _.omit(args, 'padding', 'clip', 'userClip', 'viewport', 'takenPaths', 'startTime')

          expect(args).to.eql({
            testId: runnable.id,
            titles: [
              'src/cy/commands/screenshot',
              'runnable:after:run:async',
              'simple: false',
              runnable.title,
            ],
            capture: 'runner',
            testFailure: true,
            simple: false,
            scaled: true,
            blackout: [],
            testAttemptIndex: 0,
          })
        })
      })

      it('if the runner is hidden', function () {
        Cypress.config('isInteractive', false)
        Cypress.config('hideRunnerUi', true)
        cy.stub(Screenshot, 'getConfig').returns(this.screenshotConfig)

        Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)

        const test = {
          id: '123',
          err: new Error,
        }

        const runnable = cy.state('runnable')

        Cypress.action('runner:runnable:after:run:async', test, runnable)
        .delay(1) // before:screenshot promise requires a tick
        .then(() => {
          expect(Cypress.automation.withArgs('take:screenshot')).to.be.calledOnce
          const args = Cypress.automation.withArgs('take:screenshot').args[0][1]

          expect(args.simple).to.be.false
        })
      })
    })
  })

  context('runnable:after:run:async hooks', () => {
    beforeEach(function () {
      Cypress.config('isInteractive', false)
      cy.stub(Screenshot, 'getConfig').returns(this.screenshotConfig)

      Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)

      const test = {
        id: '123',
        err: new Error,
      }
      const runnable = cy.state('runnable')

      Cypress.action('runner:runnable:after:run:async', test, runnable)
      .then(() => {
        expect(Cypress.automation).to.be.calledWith('take:screenshot')
        let args = Cypress.automation.withArgs('take:screenshot').args[0][1]

        args = _.omit(args, 'padding', 'clip', 'userClip', 'viewport', 'takenPaths', 'startTime')

        expect(args).to.eql({
          testId: runnable.id,
          titles: [
            'src/cy/commands/screenshot',
            'runnable:after:run:async hooks',
            'takes screenshot of hook title with test',
            '"before each" hook',
          ],
          capture: 'runner',
          simple: true,
          testFailure: true,
          scaled: true,
          blackout: [],
          testAttemptIndex: 0,
        })
      })
    })

    it('takes screenshot of hook title with test', () => { })
  })

  context('#screenshot', () => {
    beforeEach(function () {
      cy.stub(Screenshot, 'getConfig').returns(this.screenshotConfig)
      cy.stub(cy, 'pauseTimers').resolves()
    })

    it('sets name to undefined when not passed name', function () {
      Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)

      cy.screenshot().then(() => {
        expect(Cypress.automation.withArgs('take:screenshot').args[0][1].name).to.be.undefined
      })
    })

    it('can pass name', function () {
      Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)

      cy.screenshot('my/file').then(() => {
        expect(Cypress.automation.withArgs('take:screenshot').args[0][1].name).to.equal('my/file')
      })
    })

    it('calls onBeforeScreenshot callback with documentElement', function () {
      Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)
      cy.stub(Screenshot, 'onBeforeScreenshot')
      cy.spy(Cypress, 'action').log(false)

      cy
      .screenshot('foo')
      .then(() => {
        expect(Screenshot.onBeforeScreenshot).to.be.calledOnce
        expect(Screenshot.onBeforeScreenshot.firstCall.args[0].get(0)).to.eq(cy.state('document').documentElement)
      })
    })

    it('calls onAfterScreenshot callback with documentElement', function () {
      Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)
      cy.stub(Screenshot, 'onAfterScreenshot')
      cy.spy(Cypress, 'action').log(false)

      cy
      .screenshot('foo')
      .then(() => {
        expect(Screenshot.onAfterScreenshot).to.be.calledOnce
        expect(Screenshot.onAfterScreenshot.firstCall.args[0].get(0)).to.eq(cy.state('document').documentElement)
      })
    })

    it('pauses then unpauses timers if disableTimersAndAnimations is true', function () {
      Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)
      cy.spy(Cypress, 'action').log(false)

      cy
      .screenshot('foo')
      .then(() => {
        expect(cy.pauseTimers).to.be.calledWith(true)
        expect(cy.pauseTimers).to.be.calledWith(false)
      })
    })

    it('does not pause timers if disableTimersAndAnimations is false', function () {
      this.screenshotConfig.disableTimersAndAnimations = false
      Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)
      cy.spy(Cypress, 'action').log(false)

      cy
      .screenshot('foo')
      .then(() => {
        expect(cy.pauseTimers).not.to.be.called
      })
    })

    it('sends clip as userClip if specified', function () {
      Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)
      cy.spy(Cypress, 'action').log(false)
      const clip = { width: 100, height: 100, x: 0, y: 0 }

      cy
      .screenshot({ clip })
      .then(() => {
        expect(Cypress.automation.withArgs('take:screenshot').args[0][1].userClip).to.equal(clip)
      })
    })

    it('sends viewport dimensions of main browser window', function () {
      Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)
      cy.spy(Cypress, 'action').log(false)

      cy
      .screenshot()
      .then(() => {
        expect(Cypress.automation.withArgs('take:screenshot').args[0][1].viewport).to.eql({
          width: window.parent.innerWidth,
          height: window.parent.innerHeight,
        })
      })
    })

    it('can handle window w/length > 1 as a subject', () => {
      cy.visit('/fixtures/dom.html')

      cy.window().should('have.length.gt', 1)
      .screenshot()
    })

    describe('before/after events', () => {
      beforeEach(function () {
        Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)

        cy.spy(Cypress, 'action').log(false)
      })

      it('sends before:screenshot', () => {
        const runnable = cy.state('runnable')

        cy
        .screenshot('foo')
        .then(() => {
          expect(Cypress.action.withArgs('cy:before:screenshot')).to.be.calledOnce
          expect(Cypress.action.withArgs('cy:before:screenshot').args[0][1]).to.eql({
            id: runnable.id,
            isOpen: true,
            appOnly: true,
            scale: true,
            overwrite: false,
            waitForCommandSynchronization: false,
            disableTimersAndAnimations: true,
            blackout: ['.foo'],
            testAttemptIndex: 0,
          })
        })
      })

      it('sends after:screenshot', () => {
        const runnable = cy.state('runnable')

        cy
        .screenshot('foo')
        .then(() => {
          expect(Cypress.action.withArgs('cy:after:screenshot')).to.be.calledOnce
          expect(Cypress.action.withArgs('cy:after:screenshot').args[0][1]).to.eql({
            id: runnable.id,
            isOpen: false,
            appOnly: true,
            scale: true,
            overwrite: false,
            waitForCommandSynchronization: false,
            disableTimersAndAnimations: true,
            blackout: ['.foo'],
            testAttemptIndex: 0,
          })
        })
      })

      it('always sends scale: true, waitForCommandSynchronization: true, and blackout: [] for non-app captures', function () {
        const runnable = cy.state('runnable')

        this.screenshotConfig.capture = 'runner'
        this.screenshotConfig.scale = false

        cy
        .screenshot('foo')
        .then(() => {
          expect(Cypress.action.withArgs('cy:before:screenshot').args[0][1]).to.eql({
            id: runnable.id,
            isOpen: true,
            appOnly: false,
            scale: true,
            overwrite: false,
            waitForCommandSynchronization: true,
            disableTimersAndAnimations: true,
            blackout: [],
            testAttemptIndex: 0,
          })
        })
      })

      it('always sends waitForCommandSynchronization: false for viewport/fullPage captures', function () {
        const runnable = cy.state('runnable')

        this.screenshotConfig.waitForAnimations = true

        cy
        .screenshot('foo')
        .then(() => {
          expect(Cypress.action.withArgs('cy:before:screenshot').args[0][1]).to.eql({
            id: runnable.id,
            isOpen: true,
            appOnly: true,
            scale: true,
            overwrite: false,
            waitForCommandSynchronization: false,
            disableTimersAndAnimations: true,
            blackout: ['.foo'],
            testAttemptIndex: 0,
          })
        })
      })
    })

    describe('capture: fullPage', () => {
      beforeEach(function () {
        Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)
        cy.spy(Cypress, 'action').log(false)
        cy.viewport(600, 200)
        cy.visit('/fixtures/screenshots.html')
      })

      it('takes a screenshot for each time it needs to scroll', () => {
        cy.screenshot({ capture: 'fullPage' })
        .then(() => {
          expect(Cypress.automation.withArgs('take:screenshot')).to.be.calledThrice
        })
      })

      it('sends capture: fullPage', () => {
        cy.screenshot({ capture: 'fullPage' })
        .then(() => {
          const take = Cypress.automation.withArgs('take:screenshot')

          expect(take.args[0][1].capture).to.equal('fullPage')
          expect(take.args[1][1].capture).to.equal('fullPage')
          expect(take.args[2][1].capture).to.equal('fullPage')
        })
      })

      it('sends number of current screenshot for each time it needs to scroll', () => {
        cy.screenshot({ capture: 'fullPage' })
        .then(() => {
          const take = Cypress.automation.withArgs('take:screenshot')

          expect(take.args[0][1].current).to.equal(1)
          expect(take.args[1][1].current).to.equal(2)
          expect(take.args[2][1].current).to.equal(3)
        })
      })

      it('sends total number of screenshots for each time it needs to scroll', () => {
        cy.screenshot({ capture: 'fullPage' })
        .then(() => {
          const take = Cypress.automation.withArgs('take:screenshot')

          expect(take.args[0][1].total).to.equal(3)
          expect(take.args[1][1].total).to.equal(3)
          expect(take.args[2][1].total).to.equal(3)
        })
      })

      it('scrolls the window to the right place for each screenshot', () => {
        const win = cy.state('window')

        win.scrollTo(0, 100)
        const scrollTo = cy.spy(win, 'scrollTo')

        cy.screenshot({ capture: 'fullPage' })
        .then(() => {
          expect(scrollTo.getCall(0).args.join(',')).to.equal('0,0')
          expect(scrollTo.getCall(1).args.join(',')).to.equal('0,200')
          expect(scrollTo.getCall(2).args.join(',')).to.equal('0,400')
        })
      })

      it('scrolls the window back to the original place', () => {
        const win = cy.state('window')

        win.scrollTo(0, 100)
        const scrollTo = cy.spy(win, 'scrollTo')

        cy.screenshot({ capture: 'fullPage' })
        .then(() => {
          expect(scrollTo.getCall(3).args.join(',')).to.equal('0,100')
        })
      })

      it('sends the right clip values', () => {
        cy.screenshot({ capture: 'fullPage' })
        .then(() => {
          const take = Cypress.automation.withArgs('take:screenshot')

          expect(take.args[0][1].clip).to.eql({ x: 0, y: 0, width: 600, height: 200 })
          expect(take.args[1][1].clip).to.eql({ x: 0, y: 0, width: 600, height: 200 })
          expect(take.args[2][1].clip).to.eql({ x: 0, y: 120, width: 600, height: 80 })
        })
      })
    })

    describe('element capture', () => {
      beforeEach(function () {
        Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)
        cy.spy(Cypress, 'action').log(false)
        cy.viewport(600, 200)
        cy.visit('/fixtures/screenshots.html')
      })

      it('yields an object with details', function () {
        Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)
        cy.stub(Screenshot, 'onAfterScreenshot')
        cy.stub(Screenshot, 'onBeforeScreenshot')

        cy
        .get('.tall-element')
        .screenshot('name', {
          onBeforeScreenshot ($el) {
            expect($el).to.match('.tall-element')
          },

          onAfterScreenshot ($el, results) {
            expect($el).to.match('.tall-element')
            expect(results).to.deep.eq(this.serverResult)
            expect(results.name).to.eq('name')
            expect(results.blackout).to.eql(this.screenshotConfig.blackout)
            expect(results.dimensions).to.eql(this.serverResult.dimensions)

            expect(Screenshot.onBeforeScreenshot).to.be.calledOnce
            expect(Screenshot.onBeforeScreenshot.firstCall.args[0]).to.match('.tall-element')
            expect(Screenshot.onAfterScreenshot).not.to.be.called
          },
        })
        .then(() => {
          expect(Screenshot.onAfterScreenshot).to.be.calledOnce
          expect(Screenshot.onAfterScreenshot.firstCall.args[0]).to.match('.tall-element')
        })
      })

      it('takes a screenshot for each time it needs to scroll', () => {
        cy.get('.tall-element').screenshot()
        .then(() => {
          expect(Cypress.automation.withArgs('take:screenshot')).to.be.calledTwice
        })
      })

      it('sends number of current screenshot for each time it needs to scroll', () => {
        cy.get('.tall-element').screenshot()
        .then(() => {
          const take = Cypress.automation.withArgs('take:screenshot')

          expect(take.args[0][1].current).to.equal(1)
          expect(take.args[1][1].current).to.equal(2)
        })
      })

      it('sends total number of screenshots for each time it needs to scroll', () => {
        cy.get('.tall-element').screenshot()
        .then(() => {
          const take = Cypress.automation.withArgs('take:screenshot')

          expect(take.args[0][1].total).to.equal(2)
          expect(take.args[1][1].total).to.equal(2)
        })
      })

      it('scrolls the window to the right place for each screenshot', () => {
        const win = cy.state('window')

        win.scrollTo(0, 100)
        const scrollTo = cy.spy(win, 'scrollTo')

        cy.get('.tall-element').screenshot()
        .then(() => {
          expect(scrollTo.getCall(0).args.join(',')).to.equal('0,140')
          expect(scrollTo.getCall(1).args.join(',')).to.equal('0,340')
        })
      })

      it('scrolls the window back to the original place', () => {
        const win = cy.state('window')

        win.scrollTo(0, 100)
        const scrollTo = cy.spy(win, 'scrollTo')

        cy.get('.tall-element').screenshot()
        .then(() => {
          expect(scrollTo.getCall(2).args.join(',')).to.equal('0,100')
        })
      })

      it('sends the right clip values for elements that need scrolling', () => {
        const scrollTo = cy.spy(cy.state('window'), 'scrollTo')

        cy.get('.tall-element').screenshot()
        .then(() => {
          expect(scrollTo.getCall(0).args).to.eql([0, 140])

          const take = Cypress.automation.withArgs('take:screenshot')

          expect(take.args[0][1].clip).to.eql({ x: 20, y: 0, width: 560, height: 200 })
          expect(take.args[1][1].clip).to.eql({ x: 20, y: 60, width: 560, height: 120 })
        })
      })

      it('sends the right clip values for elements that don\'t need scrolling', () => {
        const scrollTo = cy.spy(cy.state('window'), 'scrollTo')

        cy.get('.short-element').screenshot()
        .then(() => {
          // even though we don't need to scroll, the implementation behaviour is to
          // try to scroll until the element is at the top of the viewport.
          expect(scrollTo.getCall(0).args).to.eql([0, 20])

          const take = Cypress.automation.withArgs('take:screenshot')

          expect(take.args[0][1].clip).to.eql({ x: 40, y: 0, width: 200, height: 100 })
        })
      })

      it('applies padding to clip values for elements that need scrolling', () => {
        const padding = 10

        const scrollTo = cy.spy(cy.state('window'), 'scrollTo')

        cy.get('.tall-element').screenshot({ padding })
        .then(() => {
          const viewportHeight = getViewportHeight()

          expect(scrollTo.getCall(0).args).to.eql([0, 140 - padding])
          expect(scrollTo.getCall(1).args).to.eql([0, (140 + viewportHeight) - padding])

          const take = Cypress.automation.withArgs('take:screenshot')

          expect(take.args[0][1].clip).to.eql({
            x: 20 - padding,
            y: 0,
            width: 560 + (padding * 2),
            height: viewportHeight,
          })

          expect(take.args[1][1].clip).to.eql({
            x: 20 - padding,
            y: 60 - padding,
            width: 560 + (padding * 2),
            height: 120 + (padding * 2),
          })
        })
      })

      it('applies padding to clip values for elements that don\'t need scrolling', () => {
        const padding = 10

        const scrollTo = cy.spy(cy.state('window'), 'scrollTo')

        cy.get('.short-element').screenshot({ padding })
        .then(() => {
          expect(scrollTo.getCall(0).args).to.eql([0, padding])

          const take = Cypress.automation.withArgs('take:screenshot')

          expect(take.args[0][1].clip).to.eql({
            x: 30,
            y: 0,
            width: 220,
            height: 120,
          })
        })
      })

      it('works with cy.within()', () => {
        cy.get('.short-element').within(() => {
          cy.screenshot()
        }).then(() => {
          const take = Cypress.automation.withArgs('take:screenshot')

          expect(take.args[0][1].clip).to.eql({ x: 40, y: 0, width: 200, height: 100 })
        })
      })

      // https://github.com/cypress-io/cypress/issues/14253
      it('ignores within subject when capturing the runner', () => {
        cy.get('.short-element').within(() => {
          cy.screenshot({ capture: 'runner' })
        }).then(() => {
          // the runner was captured ("appOnly === true" means to hide the runner UI)
          expect(Cypress.action.withArgs('cy:before:screenshot').args[0][1].appOnly).to.be.false
          expect(Cypress.automation.withArgs('take:screenshot').args[0][1].capture).to.equal('runner')
        })
      })

      it('coerces capture option into \'app\'', function () {
        Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)

        cy.get('.short-element').screenshot({ capture: 'runner' })
        .then(() => {
          expect(Cypress.action.withArgs('cy:before:screenshot').args[0][1].appOnly).to.be.true
          expect(Cypress.automation.withArgs('take:screenshot').args[0][1].capture).to.equal('viewport')
        })
      })

      it('passes through the existing $l subject', () => {
        cy
        .get('.short-element').then(($el) => {
          cy
          .get('.short-element')
          .screenshot()
          .then(($el2) => {
            expect($el2.get(0)).to.equal($el.get(0))
          })
        })
      })

      it('passes through window', () => {
        cy
        .window()
        .then((win) => {
          cy.wrap(win)
          .screenshot()
          .then((w) => {
            expect(win === w).to.be.true
          })
        })
      })

      it('passes through document', () => {
        cy
        .document()
        .then((doc) => {
          cy.wrap(doc)
          .screenshot()
          .then((d) => {
            expect(doc === d).to.be.true
          })
        })
      })

      // https://github.com/cypress-io/cypress/issues/6099
      it('can screenshot when element height changes on scroll', () => {
        cy.visit('fixtures/issue-6099.html')
        cy.get('main').screenshot()
      })
    })

    describe('timeout', () => {
      beforeEach(function () {
        Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)
      })

      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.screenshot().then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.screenshot({ timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('can override timeout and pass name', () => {
        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.screenshot('foo', { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.screenshot().then(() => {
          expect(cy.clearTimeout).to.be.calledWith('take:screenshot')

          // restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'screenshot') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        this.assertErrorMessage = function (message, done) {
          cy.on('fail', (err) => {
            const lastErr = this.lastLog.get('error')

            expect(lastErr.message).to.eq(message)

            done()
          })
        }

        return null
      })

      it('throws if capture is not a string', function (done) {
        cy.on('fail', (err) => {
          const lastErr = this.lastLog.get('error')

          expect(lastErr.message).to.eq('`cy.screenshot()` `capture` option must be one of the following: `fullPage`, `viewport`, or `runner`. You passed: `true`')
          expect(lastErr.docsUrl).to.eq('https://on.cypress.io/screenshot')

          done()
        })

        cy.screenshot({ capture: true })
      })

      it('throws if capture is not a valid option', function (done) {
        cy.on('fail', (err) => {
          const lastErr = this.lastLog.get('error')

          expect(lastErr.message).to.eq('`cy.screenshot()` `capture` option must be one of the following: `fullPage`, `viewport`, or `runner`. You passed: `foo`')
          expect(lastErr.docsUrl).to.eq('https://on.cypress.io/screenshot')

          done()
        })

        cy.screenshot({ capture: 'foo' })
      })

      it('throws if scale is not a boolean', function (done) {
        cy.on('fail', (err) => {
          const lastErr = this.lastLog.get('error')

          expect(lastErr.message).to.eq('`cy.screenshot()` `scale` option must be a boolean. You passed: `foo`')
          expect(lastErr.docsUrl).to.eq('https://on.cypress.io/screenshot')

          done()
        })

        cy.screenshot({ scale: 'foo' })
      })

      it('throws if disableTimersAndAnimations is not a boolean', function (done) {
        cy.on('fail', (err) => {
          const lastErr = this.lastLog.get('error')

          expect(lastErr.message).to.eq('`cy.screenshot()` `disableTimersAndAnimations` option must be a boolean. You passed: `foo`')
          expect(lastErr.docsUrl).to.eq('https://on.cypress.io/screenshot')

          done()
        })

        cy.screenshot({ disableTimersAndAnimations: 'foo' })
      })

      it('throws if blackout is not an array', function (done) {
        cy.on('fail', (err) => {
          const lastErr = this.lastLog.get('error')

          expect(lastErr.message).to.eq('`cy.screenshot()` `blackout` option must be an array of strings. You passed: `foo`')
          expect(lastErr.docsUrl).to.eq('https://on.cypress.io/screenshot')

          done()
        })

        cy.screenshot({ blackout: 'foo' })
      })

      it('throws if blackout is not an array of strings', function (done) {
        cy.on('fail', (err) => {
          const lastErr = this.lastLog.get('error')

          expect(lastErr.message).to.eq('`cy.screenshot()` `blackout` option must be an array of strings. You passed: `true`')
          expect(lastErr.docsUrl).to.eq('https://on.cypress.io/screenshot')

          done()
        })

        cy.screenshot({ blackout: [true] })
      })

      it('throws if there is a 0px tall element height', function (done) {
        this.assertErrorMessage('`cy.screenshot()` only works with a screenshot area with a height greater than zero.', done)
        cy.visit('/fixtures/screenshots.html')

        cy.get('.empty-element').screenshot()
      })

      it('throws if padding is not a number', function (done) {
        this.assertErrorMessage('`cy.screenshot()` `padding` option must be either a number or an array of numbers with a maximum length of 4. You passed: `50px`', done)

        cy.screenshot({ padding: '50px' })
      })

      it('throws if padding is not an array of numbers', function (done) {
        this.assertErrorMessage('`cy.screenshot()` `padding` option must be either a number or an array of numbers with a maximum length of 4. You passed: `bad, bad, bad, bad`', done)

        cy.screenshot({ padding: ['bad', 'bad', 'bad', 'bad'] })
      })

      it('throws if padding is not an array with a length between 1 and 4', function (done) {
        this.assertErrorMessage('`cy.screenshot()` `padding` option must be either a number or an array of numbers with a maximum length of 4. You passed: `20, 10, 20, 10, 50`', done)

        cy.screenshot({ padding: [20, 10, 20, 10, 50] })
      })

      it('throws if padding is a large negative number that causes a 0px tall element height', function (done) {
        this.assertErrorMessage('`cy.screenshot()` only works with a screenshot area with a height greater than zero.', done)
        cy.visit('/fixtures/screenshots.html')

        cy.get('.tall-element').screenshot({ padding: -161 })
      })

      it('throws if clip is not an object', function (done) {
        this.assertErrorMessage('`cy.screenshot()` `clip` option must be an object with the keys `{ width, height, x, y }` and number values. You passed: `true`', done)

        cy.screenshot({ clip: true })
      })

      it('throws if clip is lacking proper keys', function (done) {
        this.assertErrorMessage('`cy.screenshot()` `clip` option must be an object with the keys `{ width, height, x, y }` and number values. You passed: `{x: 5}`', done)

        cy.screenshot({ clip: { x: 5 } })
      })

      it('throws if clip has extraneous keys', function (done) {
        this.assertErrorMessage('`cy.screenshot()` `clip` option must be an object with the keys `{ width, height, x, y }` and number values. You passed: `Object{5}`', done)

        cy.screenshot({ clip: { width: 100, height: 100, x: 5, y: 5, foo: 10 } })
      })

      it('throws if clip has non-number values', function (done) {
        this.assertErrorMessage('`cy.screenshot()` `clip` option must be an object with the keys `{ width, height, x, y }` and number values. You passed: `Object{4}`', done)

        cy.screenshot({ clip: { width: 100, height: 100, x: 5, y: '5' } })
      })

      it('throws if element capture with multiple elements', function (done) {
        cy.on('fail', (err) => {
          const lastErr = this.lastLog.get('error')

          expect(lastErr.message).to.eq('`cy.screenshot()` only works for a single element. You attempted to screenshot 4 elements.')
          expect(lastErr.docsUrl).to.eq('https://on.cypress.io/screenshot')

          done()
        })

        cy.visit('/fixtures/screenshots.html')

        cy.get('.multiple').screenshot()
      })

      it('logs once on error', function (done) {
        const error = new Error('some error')

        error.name = 'foo'
        error.stack = 'stack'

        Cypress.automation.withArgs('take:screenshot').rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq(error.message)
          expect(lastLog.get('error').name).to.eq(error.name)
          expect(lastLog.get('error').stack).to.eq(error.stack)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.screenshot()
      })

      it('throws after timing out', function (done) {
        Cypress.automation.withArgs('take:screenshot').resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('screenshot')
          expect(lastLog.get('message')).to.eq('foo')
          expect(err.message).to.eq('`cy.screenshot()` timed out waiting `50ms` to complete.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/screenshot')

          done()
        })

        cy.screenshot('foo', { timeout: 50 })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'screenshot') {
            this.lastLog = log
          }
        })

        return null
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'screenshot') {
            this.hiddenLog = log
          }
        })

        cy.screenshot('bar', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'screenshot') {
            this.hiddenLog = log
          }
        })

        cy.screenshot('bar', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined

          expect(hiddenLog.get('name'), 'log name').to.eq('screenshot')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('ends immediately', () => {
        cy.screenshot().then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.screenshot().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', function () {
        Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)

        let expected = _.extend({}, this.serverResult, this.screenshotConfig, {
          scaled: true,
          duration: '100ms',
        })

        expected = _.omit(expected, 'blackout', 'dimensions', 'screenshotOnRunFailure', 'scale', 'size')

        cy.screenshot().then(() => {
          const consoleProps = this.lastLog.invoke('consoleProps')
          const actual = _.omit(consoleProps.props, 'blackout', 'dimensions', 'size')
          const { width, height } = this.serverResult.dimensions

          expect(actual).to.eql(expected)
          expect(consoleProps.props.size).to.eq('12 B')
          expect(consoleProps.props.blackout).to.eql(this.screenshotConfig.blackout)
          expect(consoleProps.props.dimensions).to.equal(`${width}px x ${height}px`)
        })
      })
    })

    describe('runner hidden', () => {
      beforeEach(function () {
        this.hideRunnerUiOld = Cypress.config('hideRunnerUi')
      })

      afterEach(function () {
        Cypress.config('hideRunnerUi', this.hideRunnerUiOld)
      })

      it('sends hideRunnerUi: false when the runner is not hidden', function () {
        Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)
        cy.spy(Cypress, 'action').log(false)

        Cypress.config('hideRunnerUi', false)

        cy
        .screenshot()
        .then(() => {
          expect(Cypress.automation.withArgs('take:screenshot').args[0][1].hideRunnerUi).to.eql(false)
        })
      })

      it('sends hideRunnerUi: true when the runner is hidden', function () {
        Cypress.automation.withArgs('take:screenshot').resolves(this.serverResult)
        cy.spy(Cypress, 'action').log(false)

        Cypress.config('hideRunnerUi', true)

        cy
        .screenshot()
        .then(() => {
          expect(Cypress.automation.withArgs('take:screenshot').args[0][1].hideRunnerUi).to.eql(true)
        })
      })
    })
  })
})
