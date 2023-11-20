context('cy.origin screenshot', { browser: '!webkit' }, () => {
  const { devicePixelRatio } = window

  context('set viewport', () => {
    beforeEach(function () {
      this.serverResult = {
        path: '/path/to/screenshot',
        size: 12,
        dimensions: { width: 20, height: 20 },
        multipart: false,
        pixelRatio: 1,
        takenAt: new Date().toISOString(),
        name: 'name',
        blackout: [],
        testAttemptIndex: 0,
        duration: 100,
      }

      cy.viewport(600, 200)

      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="screenshots-link"]').click()
    })

    it('captures the fullPage', function () {
      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        const automationStub = cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

        cy.screenshot({ capture: 'fullPage' })
        .then(() => {
          expect(automationStub).to.be.calledThrice
          expect(automationStub.args[0][1].capture).to.equal('fullPage')
          expect(automationStub.args[1][1].capture).to.equal('fullPage')
          expect(automationStub.args[2][1].capture).to.equal('fullPage')
        })
      })
    })

    it('captures the runner', function () {
      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        const automationStub = cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

        cy.screenshot({ capture: 'runner' })
        .then(() => {
          expect(automationStub).to.be.calledOnce
          expect(automationStub.args[0][1].capture).to.equal('runner')
        })
      })
    })

    it('captures the viewport', function () {
      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        const automationStub = cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

        cy.screenshot({ capture: 'viewport' })
        .then(() => {
          expect(automationStub).to.be.calledOnce
          expect(automationStub.args[0][1].capture).to.equal('viewport')
        })
      })
    })
  })

  context('without setting viewport', () => {
    beforeEach(function () {
      this.serverResult = {
        path: '/path/to/screenshot',
        size: 12,
        dimensions: { width: 20, height: 20 },
        multipart: false,
        pixelRatio: 1,
        takenAt: new Date().toISOString(),
        name: 'name',
        blackout: [],
        testAttemptIndex: 0,
        duration: 100,
      }

      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="screenshots-link"]').click()
    })

    it('supports multiple titles', function () {
      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        const automationStub = cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

        cy.screenshot()
        .then(() => {
          expect(automationStub.args[0][1].titles).to.deep.equal(['cy.origin screenshot', 'without setting viewport', 'supports multiple titles'])
        })
      })
    })

    it('supports the blackout option', function () {
      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

        cy.screenshot({
          blackout: ['.short-element'],
          onBeforeScreenshot: ($el) => {
            const $blackoutElement = $el.find('.__cypress-blackout')
            const $shortElement = $el.find('.short-element')

            expect($blackoutElement.outerHeight()).to.equal($shortElement.outerHeight())
            expect($blackoutElement.outerWidth()).to.equal($shortElement.outerWidth())
            expect($blackoutElement.offset()).to.deep.equal($shortElement.offset())
          },
        })
      })
    })

    it('supports element screenshots', function () {
      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        const automationStub = cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

        cy.get('.tall-element').screenshot()
        .then(() => {
          expect(automationStub.args[0][1].clip.x).to.be.greaterThan(0)
          expect(automationStub.args[0][1].clip.y).to.be.greaterThan(0)
        })
      })
    })

    it('supports screenshot retrying with appropriate naming', function () {
      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        const automationStub = cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

        cy.state('runnable')._currentRetry = 2

        cy.screenshot()
        .then(() => {
          expect(automationStub.args[0][1].testAttemptIndex).to.equal(2)
        })
      })
    })

    it('calls the onBeforeScreenshot callback', function () {
      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)
        const onBeforeScreenshot = cy.stub()

        cy.screenshot({ onBeforeScreenshot })
        cy.wrap(onBeforeScreenshot).should('be.called')
      })
    })

    it('calls the onAfterScreenshot callback', function () {
      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)
        const onAfterScreenshot = cy.stub()

        cy.screenshot({ onAfterScreenshot })
        cy.wrap(onAfterScreenshot).should('be.called')
      })
    })

    it('supports the Cypress.screenshot callbacks', function () {
      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)
        const onAfterScreenshot = cy.stub()
        const onBeforeScreenshot = cy.stub()

        Cypress.Screenshot.defaults({
          onBeforeScreenshot,
          onAfterScreenshot,
        })

        cy.screenshot()
        cy.wrap(onBeforeScreenshot).should('be.called')
        cy.wrap(onAfterScreenshot).should('be.called')
      })
    })

    it('supports pausing timers', function () {
      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        cy.stub(Cypress, 'automation').withArgs('take:screenshot').returns(Cypress.Promise.delay(500, serverResult))

        cy.window().then((win) => {
        // Hide the element using setTimeout
          win.setTimeout(() => {
            (win.document.getElementsByClassName('tall-element')[0] as HTMLElement).style.display = 'none'
          }, 50)
        })

        cy.screenshot({
          onBeforeScreenshot: ($el) => {
          // Set the timeout to be longer than the element hiding timeout so if the timer was
          // not paused, it would've hidden the element but since we are pausing the
          // timers, the style is still 'block'
            setTimeout(() => {
              expect($el.find('.tall-element').css('display')).to.equal('block')
            }, 100)
          },
          onAfterScreenshot: ($el) => {
          // Set the timeout to be longer than the element hiding timeout so when the timers
          // are unpaused, this will run after the timeout to hide the element
            setTimeout(() => {
              expect($el.find('.tall-element').css('display')).to.equal('none')
            }, 100)
          },
        })

        cy.wait(200)
      })
    })

    it('does not pause timers when disableTimersAndAnimations is false', function () {
      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        cy.stub(Cypress, 'automation').withArgs('take:screenshot').returns(Cypress.Promise.delay(500, serverResult))

        cy.window().then((win) => {
        // Hide the element using setTimeout
          win.setTimeout(() => {
            (win.document.getElementsByClassName('tall-element')[0] as HTMLElement).style.display = 'none'
          }, 100)
        })

        cy.screenshot({
          disableTimersAndAnimations: false,
          onBeforeScreenshot: ($el) => {
          // Set the timeout to be longer than the element hiding timeout so it has time to run and hide the element
            setTimeout(() => {
              expect($el.find('.tall-element').css('display')).to.equal('none')
            }, 200)
          },
        })

        cy.wait(400)
      })
    })

    it('handles errors thrown from setTimeout after the timer is paused', function () {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('setTimeout error after screenshot')
      })

      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        cy.stub(Cypress, 'automation').withArgs('take:screenshot').returns(Cypress.Promise.delay(100, serverResult))

        cy.window().then((win) => {
        // Add a timeout error
          win.setTimeout(() => {
            throw new Error('setTimeout error after screenshot')
          }, 50)
        })

        cy.screenshot()

        // wait to ensure the timeout error has time to process
        cy.wait(100)
      })
    })

    it('handles errors thrown from setTimeout when the timer is NOT paused', function () {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('setTimeout error during screenshot')
        expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
        expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])
      })

      cy.origin('http://www.foobar.com:3500', { args: this.serverResult }, (serverResult) => {
        cy.stub(Cypress, 'automation').withArgs('take:screenshot').returns(Cypress.Promise.delay(100, serverResult))

        cy.window().then((win) => {
        // Add a timeout error
          win.setTimeout(() => {
            throw new Error('setTimeout error during screenshot')
          }, 50)
        })

        cy.screenshot({ disableTimersAndAnimations: false })

        // wait to ensure the timeout error has time to process
        cy.wait(100)
      })
    })
  })

  describe('dimensions', () => {
    it('crops app captures to just app size', () => {
      cy.viewport(600, 400)

      cy.visit('/')
      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/screenshot-color.html?color=yellow')
        const screenShotPromiseWithPath = new Promise((resolve) => {
          cy.screenshot('crop-check', {
            capture: 'viewport',
            onAfterScreenshot ($el, props) {
              resolve(props.path)
            },
          })
        })

        cy.wrap(screenShotPromiseWithPath)
      }).then((screenshotPath) => {
        cy.task('check:screenshot:size', {
          filePath: screenshotPath,
          width: 600,
          height: 400,
          devicePixelRatio,
        })
      })
    })

    it('can capture fullPage screenshots', () => {
      cy.viewport(600, 200)

      cy.visit('/')
      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/screenshot-full-page.html')
        const screenShotPromiseWithPath = new Promise((resolve) => {
          cy.screenshot('fullPage', {
            capture: 'fullPage',
            onAfterScreenshot ($el, props) {
              resolve(props.path)
            },
          })
        })

        cy.wrap(screenShotPromiseWithPath)
      }).then((screenshotPath) => {
        cy.task('check:screenshot:size', {
          filePath: screenshotPath,
          width: 600,
          height: 500,
          devicePixelRatio,
        })
      })
    })

    it('accepts subsequent same captures after multiple tries', () => {
      cy.viewport(600, 200)

      cy.visit('/')
      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/screenshot-full-page-same.html')

        const screenShotPromiseWithPath = new Promise((resolve) => {
          cy.screenshot('fullPage-same', {
            capture: 'fullPage',
            onAfterScreenshot ($el, props) {
              resolve(props.path)
            },
          })
        })

        cy.wrap(screenShotPromiseWithPath)
      }).then((screenshotPath) => {
        cy.task('check:screenshot:size', {
          filePath: screenshotPath,
          width: 600,
          height: 500,
          devicePixelRatio,
        })
      })
    })

    it('can capture element screenshots', () => {
      cy.viewport(600, 200)

      cy.visit('/')
      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/screenshot-element.html')

        const screenShotPromiseWithPath = new Promise((resolve) => {
          cy.get('.element').screenshot('element', {
            onAfterScreenshot ($el, props) {
              resolve(props.path)
            },
          })
        })

        cy.wrap(screenShotPromiseWithPath)
      }).then((screenshotPath) => {
        cy.task('check:screenshot:size', {
          filePath: screenshotPath,
          width: 400,
          height: 300,
          devicePixelRatio,
        })
      })
    })

    describe('clipping', () => {
      it('can clip app screenshots', () => {
        cy.viewport(600, 200)

        cy.visit('/')
        cy.origin('http://www.foobar.com:3500', () => {
          cy.visit('http://www.foobar.com:3500/fixtures/screenshot-color.html?color=yellow')
          const screenShotPromiseWithPath = new Promise((resolve) => {
            cy.screenshot('app-clip', {
              capture: 'viewport', clip: { x: 10, y: 10, width: 100, height: 50 },
              onAfterScreenshot ($el, props) {
                resolve(props.path)
              },
            })
          })

          cy.wrap(screenShotPromiseWithPath)
        }).then((screenshotPath) => {
          cy.task('check:screenshot:size', {
            filePath: screenshotPath,
            width: 100,
            height: 50,
            devicePixelRatio,
          })
        })
      })

      it('can clip runner screenshots', () => {
        cy.viewport(600, 200)

        cy.visit('/')
        cy.origin('http://www.foobar.com:3500', () => {
          cy.visit('http://www.foobar.com:3500/fixtures/screenshot-color.html?color=yellow')

          const screenShotPromiseWithPath = new Promise((resolve) => {
            cy.screenshot('runner-clip', {
              capture: 'runner', clip: { x: 15, y: 15, width: 120, height: 60 },
              onAfterScreenshot ($el, props) {
                resolve(props.path)
              },
            })
          })

          cy.wrap(screenShotPromiseWithPath)
        }).then((screenshotPath) => {
          cy.task('check:screenshot:size', {
            filePath: screenshotPath,
            width: 120,
            height: 60,
            devicePixelRatio,
          })
        })
      })

      it('can clip fullPage screenshots', () => {
        cy.viewport(600, 200)

        cy.visit('/')
        cy.origin('http://www.foobar.com:3500', () => {
          cy.visit('http://www.foobar.com:3500/fixtures/screenshot-full-page.html')

          const screenShotPromiseWithPath = new Promise((resolve) => {
            cy.screenshot('fullPage-clip', {
              capture: 'fullPage', clip: { x: 20, y: 20, width: 140, height: 70 },
              onAfterScreenshot ($el, props) {
                resolve(props.path)
              },
            })
          })

          cy.wrap(screenShotPromiseWithPath)
        }).then((screenshotPath) => {
          cy.task('check:screenshot:size', {
            filePath: screenshotPath,
            width: 140,
            height: 70,
            devicePixelRatio,
          })
        })
      })

      it('can clip element screenshots', () => {
        cy.viewport(600, 200)

        cy.visit('/')
        cy.origin('http://www.foobar.com:3500', () => {
          cy.visit('http://www.foobar.com:3500/fixtures/screenshot-element.html')
          const screenShotPromiseWithPath = new Promise((resolve) => {
            cy.get('.element').screenshot('element-clip', {
              clip: { x: 25, y: 25, width: 160, height: 80 },
              onAfterScreenshot ($el, props) {
                resolve(props.path)
              },
            })
          })

          cy.wrap(screenShotPromiseWithPath)
        }).then((screenshotPath) => {
          cy.task('check:screenshot:size', {
            filePath: screenshotPath,
            width: 160,
            height: 80,
            devicePixelRatio,
          })
        })
      })
    })
  })

  context('#consoleProps', () => {
    const { findCrossOriginLogs } = require('../../../../support/utils')
    let logs: Map<string, any>

    beforeEach(() => {
      logs = new Map()

      cy.on('log:changed', (attrs, log) => {
        logs.set(attrs.id, log)
      })

      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="screenshots-link"]').click()
    })

    it('.screenshot()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.screenshot({ capture: 'fullPage' })
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('screenshot', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('screenshot')
        expect(consoleProps.type).to.equal('command')

        expect(consoleProps.props).to.have.property('blackout')
        expect(consoleProps.props).to.have.property('capture').that.equals('fullPage')
        expect(consoleProps.props).to.have.property('dimensions').that.is.a('string')
        expect(consoleProps.props).to.have.property('disableTimersAndAnimations').that.is.a('boolean')
        expect(consoleProps.props).to.have.property('duration').that.is.a('string')
        expect(consoleProps.props).to.have.property('multipart').that.is.a('boolean')
        expect(consoleProps.props).to.have.property('name').to.be.null
        expect(consoleProps.props).to.have.property('path').that.is.a('string')
        expect(consoleProps.props).to.have.property('pixelRatio').that.is.a('number')
        expect(consoleProps.props).to.have.property('scaled').that.is.a('boolean')
        expect(consoleProps.props).to.have.property('size').that.is.a('string')
        expect(consoleProps.props).to.have.property('specName').that.is.a('string')
        expect(consoleProps.props).to.have.property('takenAt').that.is.a('string')
        expect(consoleProps.props).to.have.property('testAttemptIndex').that.is.a('number')
      })
    })
  })
})
