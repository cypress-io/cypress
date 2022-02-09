// @ts-ignore / session support is needed for visiting about:blank between tests
context('screenshot specs', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="screenshots-link"]').click()

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
  })

  afterEach(() => {
    // FIXME: the stub is not getting restored on its own causing other tests to fail
    cy.switchToDomain('foobar.com', () => {
      //@ts-ignore
      Cypress.automation.restore()
    })
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
        expect(automationStub.args[0][1].titles).to.deep.equal(['screenshot specs', 'supports multiple titles'])
      })
    })
  })

  // FIXME: Add support for blackout option. Has cross-domain issue due to the blackout logic
  // being called from top instead of the spec bridge
  it.skip('supports the blackout option', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.screenshot({ blackout: ['a'] })
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
      let called

      cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

      cy.screenshot({
        onBeforeScreenshot () {
          called = true
        },
      })
      .then(() => {
        return called
      })
    })
    .then((called) => {
      expect(called).to.be.true
    })
  })

  it('calls the onAfterScreenshot callback', () => {
    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
      let called

      cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

      cy.screenshot({
        onAfterScreenshot () {
          called = true
        },
      })
      .then(() => {
        return called
      })
    })
    .then((called) => {
      expect(called).to.be.true
    })
  })

  it('supports the Cypress.screenshot callbacks', () => {
    cy.switchToDomain('foobar.com', [this.serverResult], ([serverResult]) => {
      cy.stub(Cypress, 'automation').withArgs('take:screenshot').resolves(serverResult)

      let beforeCalled
      let afterCalled

      Cypress.Screenshot.defaults({
        onBeforeScreenshot () {
          beforeCalled = true
        },
        onAfterScreenshot () {
          afterCalled = true
        },
      })

      cy.screenshot()
      .then(() => {
        return { beforeCalled, afterCalled }
      })
    })
    .then(({ beforeCalled, afterCalled }) => {
      expect(beforeCalled).to.be.true
      expect(afterCalled).to.be.true
    })
  })
})
