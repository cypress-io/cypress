export {}

const serverResult = {
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

// the remote driver reaches the AUT through Cypress.automation too, so only the capture is stubbed
const stubTakeScreenshot = () => cy.stub(Cypress, 'automation').callThrough().withArgs('take:screenshot')

// The AUT is cross-origin, so code reaches it as an inline handler rather than through cy.window()
const runInAut = (code: string) => {
  cy.get('body').invoke('attr', 'onclick', `document.body.removeAttribute('onclick'); ${code}`)
  cy.get('body').trigger('click', { force: true })
}

// a capture that outlasts the page's timer, which reports when it finished
const stubSlowCapture = () => {
  let capturedAt = 0

  stubTakeScreenshot().callsFake(() => {
    return Cypress.Promise.delay(1000).then(() => {
      capturedAt = Date.now()

      return serverResult
    })
  })

  return () => capturedAt
}

// the page records when its timer ran, since the spec can't watch the AUT's timers
const setPageTimer = (code: string) => runInAut(`setTimeout(() => { ${code} }, 300)`)

describe('remote driver: screenshot in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  const { devicePixelRatio } = window

  context('set viewport', () => {
    beforeEach(() => {
      cy.viewport(600, 200)

      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="screenshots-link"]').click()
    })

    it('captures the fullPage', () => {
      const automationStub = stubTakeScreenshot().resolves(serverResult)

      cy.screenshot({ capture: 'fullPage' })
      .then(() => {
        expect(automationStub).to.be.calledThrice
        expect(automationStub.args[0][1].capture).to.equal('fullPage')
        expect(automationStub.args[1][1].capture).to.equal('fullPage')
        expect(automationStub.args[2][1].capture).to.equal('fullPage')
      })
    })

    it('captures the runner', () => {
      const automationStub = stubTakeScreenshot().resolves(serverResult)

      cy.screenshot({ capture: 'runner' })
      .then(() => {
        expect(automationStub).to.be.calledOnce
        expect(automationStub.args[0][1].capture).to.equal('runner')
      })
    })

    it('captures the viewport', () => {
      const automationStub = stubTakeScreenshot().resolves(serverResult)

      cy.screenshot({ capture: 'viewport' })
      .then(() => {
        expect(automationStub).to.be.calledOnce
        expect(automationStub.args[0][1].capture).to.equal('viewport')
      })
    })
  })

  context('without setting viewport', () => {
    beforeEach(() => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="screenshots-link"]').click()
    })

    it('supports multiple titles', () => {
      const automationStub = stubTakeScreenshot().resolves(serverResult)

      cy.screenshot()
      .then(() => {
        expect(automationStub.args[0][1].titles).to.deep.equal(['remote driver: screenshot in a cross-origin AUT', 'without setting viewport', 'supports multiple titles'])
      })
    })

    it('supports the blackout option', () => {
      const automationStub = stubTakeScreenshot().resolves(serverResult)

      cy.screenshot({ blackout: ['.short-element'] }).then(() => {
        expect(automationStub).to.be.called
      })

      cy.get('.__cypress-blackout').should('not.exist')
    })

    it('supports element screenshots', () => {
      const automationStub = stubTakeScreenshot().resolves(serverResult)

      cy.get('.tall-element').screenshot()
      .then(() => {
        expect(automationStub.args[0][1].clip.x).to.be.greaterThan(0)
        expect(automationStub.args[0][1].clip.y).to.be.greaterThan(0)
      })
    })

    it('supports screenshot retrying with appropriate naming', () => {
      const automationStub = stubTakeScreenshot().resolves(serverResult)

      cy.state('runnable')._currentRetry = 2

      cy.screenshot()
      .then(() => {
        expect(automationStub.args[0][1].testAttemptIndex).to.equal(2)
      })
    })

    it('calls the onBeforeScreenshot callback', () => {
      stubTakeScreenshot().resolves(serverResult)
      const onBeforeScreenshot = cy.stub()

      cy.screenshot({ onBeforeScreenshot })
      cy.wrap(onBeforeScreenshot).should('be.called')
    })

    it('calls the onAfterScreenshot callback', () => {
      stubTakeScreenshot().resolves(serverResult)
      const onAfterScreenshot = cy.stub()

      cy.screenshot({ onAfterScreenshot })
      cy.wrap(onAfterScreenshot).should('be.called')
    })

    context('timers', () => {
      it('supports pausing timers', () => {
        const capturedAt = stubSlowCapture()

        setPageTimer('document.body.dataset.timerRanAt = Date.now()')
        cy.screenshot()
        cy.get('body').should('have.attr', 'data-timer-ran-at').then((ranAt) => {
          expect(Number(ranAt)).to.be.at.least(capturedAt())
        })
      })

      it('does not pause timers when disableTimersAndAnimations is false', () => {
        const capturedAt = stubSlowCapture()

        setPageTimer('document.body.dataset.timerRanAt = Date.now()')
        cy.screenshot({ disableTimersAndAnimations: false })
        cy.get('body').should('have.attr', 'data-timer-ran-at').then((ranAt) => {
          expect(Number(ranAt)).to.be.below(capturedAt())
        })
      })

      it('handles errors thrown from setTimeout after the timer is paused', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('setTimeout error after screenshot')
          expect(err.message).to.include('The following error originated from your application code, not from Cypress.')

          done()
        })

        stubSlowCapture()
        setPageTimer('throw new Error(\'setTimeout error after screenshot\')')
        cy.screenshot()
        cy.wait(500)
      })

      it('handles errors thrown from setTimeout when the timer is NOT paused', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('setTimeout error during screenshot')
          expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
          expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])

          done()
        })

        stubSlowCapture()
        setPageTimer('throw new Error(\'setTimeout error during screenshot\')')
        cy.screenshot({ disableTimersAndAnimations: false })
      })
    })

    context('Cypress.Screenshot.defaults', () => {
      afterEach(() => {
        (Cypress.Screenshot as unknown as { reset: () => void }).reset()
      })

      it('supports the Cypress.screenshot callbacks', () => {
        stubTakeScreenshot().resolves(serverResult)
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
  })

  describe('dimensions', () => {
    let screenshotPath: string | undefined

    const onAfterScreenshot = ($el, props) => {
      screenshotPath = props.path
    }

    const checkSize = (width: number, height: number) => {
      cy.then(() => {
        cy.task('check:screenshot:size', {
          filePath: screenshotPath,
          width,
          height,
          devicePixelRatio,
        })
      })
    }

    beforeEach(() => {
      screenshotPath = undefined

      cy.visit('/fixtures/primary-origin.html')
    })

    it('crops app captures to just app size', () => {
      cy.viewport(600, 400)

      cy.visit('http://www.foobar.com:3500/fixtures/screenshot-color.html?color=yellow')
      cy.screenshot('crop-check', { capture: 'viewport', onAfterScreenshot })
      checkSize(600, 400)
    })

    it('can capture fullPage screenshots', () => {
      cy.viewport(600, 200)

      cy.visit('http://www.foobar.com:3500/fixtures/screenshot-full-page.html')
      cy.screenshot('fullPage', { capture: 'fullPage', onAfterScreenshot })
      checkSize(600, 500)
    })

    it('accepts subsequent same captures after multiple tries', () => {
      cy.viewport(600, 200)

      cy.visit('http://www.foobar.com:3500/fixtures/screenshot-full-page-same.html')
      cy.screenshot('fullPage-same', { capture: 'fullPage', onAfterScreenshot })
      checkSize(600, 500)
    })

    it('can capture element screenshots', () => {
      cy.viewport(600, 200)

      cy.visit('http://www.foobar.com:3500/fixtures/screenshot-element.html')
      cy.get('.element').screenshot('element', { onAfterScreenshot })
      checkSize(400, 300)
    })

    describe('clipping', () => {
      beforeEach(() => {
        cy.viewport(600, 200)
      })

      it('can clip app screenshots', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/screenshot-color.html?color=yellow')
        cy.screenshot('app-clip', { capture: 'viewport', clip: { x: 10, y: 10, width: 100, height: 50 }, onAfterScreenshot })
        checkSize(100, 50)
      })

      it('can clip runner screenshots', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/screenshot-color.html?color=yellow')
        cy.screenshot('runner-clip', { capture: 'runner', clip: { x: 15, y: 15, width: 120, height: 60 }, onAfterScreenshot })
        checkSize(120, 60)
      })

      it('can clip fullPage screenshots', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/screenshot-full-page.html')
        cy.screenshot('fullPage-clip', { capture: 'fullPage', clip: { x: 20, y: 20, width: 140, height: 70 }, onAfterScreenshot })
        checkSize(140, 70)
      })

      it('can clip element screenshots', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/screenshot-element.html')
        cy.get('.element').screenshot('element-clip', { clip: { x: 25, y: 25, width: 160, height: 80 }, onAfterScreenshot })
        checkSize(160, 80)
      })
    })
  })
})
