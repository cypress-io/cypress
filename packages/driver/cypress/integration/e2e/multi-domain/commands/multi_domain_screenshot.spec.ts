// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain screenshot', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
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

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="screenshots-link"]').click()
  })

  it('captures the fullPage', () => {
    cy.viewport(600, 200)

    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
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

  it('captures the runner', () => {
    cy.viewport(600, 200)

    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
      const automationStub = cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

      cy.screenshot({ capture: 'runner' })
      .then(() => {
        expect(automationStub).to.be.calledOnce
        expect(automationStub.args[0][1].capture).to.equal('runner')
      })
    })
  })

  it('captures the viewport', () => {
    cy.viewport(600, 200)

    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
      const automationStub = cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

      cy.screenshot({ capture: 'viewport' })
      .then(() => {
        expect(automationStub).to.be.calledOnce
        expect(automationStub.args[0][1].capture).to.equal('viewport')
      })
    })
  })

  it('supports multiple titles', () => {
    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
      const automationStub = cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

      cy.screenshot()
      .then(() => {
        expect(automationStub.args[0][1].titles).to.deep.equal(['multi-domain screenshot', 'supports multiple titles'])
      })
    })
  })

  it('supports the blackout option', () => {
    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
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

  it('supports element screenshots', () => {
    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
      const automationStub = cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

      cy.get('.tall-element').screenshot()
      .then(() => {
        expect(automationStub.args[0][1].clip.x).to.be.greaterThan(0)
        expect(automationStub.args[0][1].clip.y).to.be.greaterThan(0)
      })
    })
  })

  it('supports screenshot retrying with appropriate naming', () => {
    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
      const automationStub = cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

      cy.state('runnable')._currentRetry = 2

      cy.screenshot()
      .then(() => {
        expect(automationStub.args[0][1].testAttemptIndex).to.equal(2)
      })
    })
  })

  it('calls the onBeforeScreenshot callback', () => {
    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
      cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)
      const onBeforeScreenshot = cy.stub()

      cy.screenshot({ onBeforeScreenshot })
      cy.wrap(onBeforeScreenshot).should('be.called')
    })
  })

  it('calls the onAfterScreenshot callback', () => {
    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
      cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)
      const onAfterScreenshot = cy.stub()

      cy.screenshot({ onAfterScreenshot })
      cy.wrap(onAfterScreenshot).should('be.called')
    })
  })

  it('supports the Cypress.screenshot callbacks', () => {
    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
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

  it('supports pausing timers', () => {
    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
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

  it('does not pause timers when disableTimersAndAnimations is false', () => {
    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
      cy.stub(Cypress, 'automation').withArgs('take:screenshot').returns(Cypress.Promise.delay(500, serverResult))

      cy.window().then((win) => {
        // Hide the element using setTimeout
        win.setTimeout(() => {
          (win.document.getElementsByClassName('tall-element')[0] as HTMLElement).style.display = 'none'
        }, 50)
      })

      cy.screenshot({
        disableTimersAndAnimations: false,
        onBeforeScreenshot: ($el) => {
          // Set the timeout to be longer than the element hiding timeout so it has time to run and hide the element
          setTimeout(() => {
            expect($el.find('.tall-element').css('display')).to.equal('none')
          }, 100)
        },
      })

      cy.wait(200)
    })
  })

  it('handles errors thrown from setTimeout after the timer is paused', () => {
    cy.on('fail', (err) => {
      expect(err.name).to.eq('Error')
      expect(err.message).to.include('setTimeout error after screenshot')
    })

    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
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

  it('handles errors thrown from setTimeout when the timer is NOT paused', () => {
    cy.on('fail', (err) => {
      expect(err.name).to.eq('Error')
      expect(err.message).to.include('setTimeout error during screenshot')
      expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
      // @ts-ignore
      expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])
    })

    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
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
