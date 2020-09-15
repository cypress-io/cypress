import { createIntervalGetter, install } from '../../../src/util/firefox_forced_gc'

describe('driver/src/util/firefox_forced_gc', () => {
  describe('#createIntervalGetter returns a function that', () => {
    const run = (configObj) => {
      const configFn = (key) => {
        return key ? configObj[key] : configObj
      }

      return createIntervalGetter(configFn)()
    }

    it('returns undefined if not in Firefox', () => {
      expect(run({
        browser: {
          family: 'chrome',
        },
      })).to.be.undefined
    })

    it('returns a number if firefoxGcInterval is a plain number', () => {
      expect(run({
        browser: {
          family: 'firefox',
        },
        firefoxGcInterval: 99,
      })).to.eq(99)
    })

    it('returns null if firefoxGcInterval is null', () => {
      expect(run({
        browser: {
          family: 'firefox',
        },
        firefoxGcInterval: null,
      })).to.eq(null)
    })

    it('returns the appropriate interval for open mode', () => {
      expect(run({
        browser: {
          family: 'firefox',
        },
        firefoxGcInterval: {
          runMode: 10,
          openMode: 20,
        },
        isInteractive: true,
      })).to.eq(20)
    })

    it('returns the appropriate interval for run mode', () => {
      expect(run({
        browser: {
          family: 'firefox',
        },
        firefoxGcInterval: {
          runMode: 10,
          openMode: 20,
        },
        isInteractive: false,
      })).to.eq(10)
    })

    it('has been correctly mounted at Cypress.getFirefoxGcInterval', {
      // @ts-ignore
      firefoxGcInterval: 5,
    }, () => {
      const real = Cypress.getFirefoxGcInterval
      const fake = createIntervalGetter(Cypress.config)

      // conditional, so it can pass in non-ff browsers
      expect(real()).to.eq(fake()).and.eq(Cypress.isBrowser('firefox') ? 5 : undefined)
    })
  })

  describe('#install', () => {
    let MockCypress: any
    let commandStartFn: any
    let testBeforeRunAsyncFn: any

    beforeEach(() => {
      MockCypress = {
        on: cy.stub().throws(),
        emit: cy.stub().throws(),
        isBrowser: cy.stub().throws(),
        getFirefoxGcInterval: cy.stub().throws(),
        backend: cy.stub().throws(),
      }

      commandStartFn = testBeforeRunAsyncFn = undefined

      MockCypress.on.withArgs('command:start').callsFake((_, fn) => {
        commandStartFn = fn
      })

      MockCypress.on.withArgs('test:before:run:async').callsFake((_, fn) => {
        testBeforeRunAsyncFn = fn
      })
    })

    const fakeVisit = () => {
      commandStartFn({ get: cy.stub().throws().withArgs('name').returns('visit') })
    }

    const fakeBeforeTestRun = (order) => {
      return testBeforeRunAsyncFn({ order }) || Promise.resolve()
    }

    it('registers no event handlers if not in Firefox', () => {
      MockCypress.isBrowser.withArgs('firefox').returns(false)

      install(MockCypress)

      expect(MockCypress.on).to.not.be.called
    })

    it('triggers a forced GC correctly with interval = 1', () => {
      MockCypress.isBrowser.withArgs('firefox').returns(true)
      MockCypress.getFirefoxGcInterval.returns(1)

      const forceGc = MockCypress.backend.withArgs('firefox:force:gc').resolves()
      const emitBefore = MockCypress.emit.withArgs('before:firefox:force:gc').returns()
      const emitAfter = MockCypress.emit.withArgs('after:firefox:force:gc').returns()

      install(MockCypress)

      return fakeBeforeTestRun(0).then(() => {
        fakeVisit()

        return fakeBeforeTestRun(1)
      })
      .then(() => {
        expect(forceGc).to.be.calledOnce
        expect(emitBefore).to.be.calledOnce
        expect(emitAfter).to.be.calledOnce
      })
      .then(() => {
        return fakeBeforeTestRun(2)
      })
      .then(() => {
        return fakeBeforeTestRun(3)
      })
      .then(() => {
        expect(forceGc).to.be.calledOnce
        expect(emitBefore).to.be.calledOnce
        expect(emitAfter).to.be.calledOnce

        fakeVisit()

        return fakeBeforeTestRun(4)
      })
      .then(() => {
        expect(forceGc).to.be.calledTwice
        expect(emitBefore).to.be.calledTwice
        expect(emitAfter).to.be.calledTwice
      })
    })

    it('triggers a forced GC correctly with interval = 3', () => {
      MockCypress.isBrowser.withArgs('firefox').returns(true)
      MockCypress.getFirefoxGcInterval.returns(3)

      const forceGc = MockCypress.backend.withArgs('firefox:force:gc').resolves()
      const emitBefore = MockCypress.emit.withArgs('before:firefox:force:gc').returns()
      const emitAfter = MockCypress.emit.withArgs('after:firefox:force:gc').returns()

      install(MockCypress)

      return fakeBeforeTestRun(0).then(() => {
        return fakeBeforeTestRun(1)
      })
      .then(() => {
        expect(forceGc).to.not.be.called
        expect(emitBefore).to.not.be.called
        expect(emitAfter).to.not.be.called

        fakeVisit()
      })
      .then(() => {
        return fakeBeforeTestRun(2)
      })
      .then(() => {
        return fakeBeforeTestRun(3)
      })
      .then(() => {
        expect(forceGc).to.be.calledOnce
        expect(emitBefore).to.be.calledOnce
        expect(emitAfter).to.be.calledOnce
      })
    })

    it('does not trigger any forced GC with falsy interval', () => {
      MockCypress.isBrowser.withArgs('firefox').returns(true)
      MockCypress.getFirefoxGcInterval.returns(false)

      const forceGc = MockCypress.backend.withArgs('firefox:force:gc').resolves()
      const emitBefore = MockCypress.emit.withArgs('before:firefox:force:gc').returns()
      const emitAfter = MockCypress.emit.withArgs('after:firefox:force:gc').returns()

      install(MockCypress)

      return fakeBeforeTestRun(0).then(() => {
        return fakeBeforeTestRun(1)
      })
      .then(() => {
        expect(forceGc).to.not.be.called
        expect(emitBefore).to.not.be.called
        expect(emitAfter).to.not.be.called

        fakeVisit()
      })
      .then(() => {
        return fakeBeforeTestRun(2)
      })
      .then(() => {
        expect(forceGc).to.not.be.called
        expect(emitBefore).to.not.be.called
        expect(emitAfter).to.not.be.called
      })
    })
  })
})
