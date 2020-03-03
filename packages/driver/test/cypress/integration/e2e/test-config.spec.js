/* eslint-disable @cypress/dev/skip-comment,mocha/no-exclusive-tests */
/// <reference path="../../../../../../cli/types/index.d.ts" />
// @ts-check

const testState = {
  ranFirefox: false,
  ranChrome: false,
}

describe('per-test config', () => {
  after(function () {
    if (hasOnly(this.currentTest)) return

    if (Cypress.browser.name === 'firefox') {
      return expect(testState).deep.eq({
        ranChrome: false,
        ranFirefox: true,
      })
    }

    if (Cypress.browser.name === 'chrome') {
      return expect(testState).deep.eq({
        ranChrome: true,
        ranFirefox: false,
      })
    }

    throw new Error('should have made assertion')
  })

  it('set various config values', {
    defaultCommandTimeout: 200,
    env: {
      FOO_VALUE: 'foo',
    },
  }, () => {
    expect(Cypress.config().defaultCommandTimeout).eq(200)
    expect(Cypress.config('defaultCommandTimeout')).eq(200)
    expect(Cypress.env('FOO_VALUE')).eq('foo')
  })

  it('does not leak various config values', {
  }, () => {
    expect(Cypress.config().defaultCommandTimeout).not.eq(200)
    expect(Cypress.config('defaultCommandTimeout')).not.eq(200)
    expect(Cypress.env('FOO_VALUE')).not.eq('foo')
  })

  it('can set viewport', {
    viewportWidth: 400,
    viewportHeight: 200,
  }, () => {
    expect(Cypress.config().viewportHeight).eq(200)
    expect(Cypress.config().viewportWidth).eq(400)
  })

  it('can specify only run in chrome', {
    browser: 'chrome',
  }, () => {
    testState.ranChrome = true
    expect(Cypress.browser.name).eq('chrome')
  })

  it('can specify only run in firefox', {
    browser: 'firefox',
  }, () => {
    testState.ranFirefox = true
    expect(Cypress.browser.name).eq('firefox')
  })

  describe('in beforeEach', () => {
    it('set various config values', {
      defaultCommandTimeout: 200,
      env: {
        FOO_VALUE: 'foo',
      },
    }, () => {
      expect(Cypress.config().defaultCommandTimeout).eq(200)
      expect(Cypress.config('defaultCommandTimeout')).eq(200)
      expect(Cypress.env('FOO_VALUE')).eq('foo')
    })

    beforeEach(() => {
      expect(Cypress.config().defaultCommandTimeout).eq(200)
      expect(Cypress.config('defaultCommandTimeout')).eq(200)
      expect(Cypress.env('FOO_VALUE')).eq('foo')
    })
  })

  describe('in afterEach', () => {
    it('set various config values', {
      defaultCommandTimeout: 200,
      env: {
        FOO_VALUE: 'foo',
      },
    }, () => {
      expect(Cypress.config().defaultCommandTimeout).eq(200)
      expect(Cypress.config('defaultCommandTimeout')).eq(200)
      expect(Cypress.env('FOO_VALUE')).eq('foo')
    })

    afterEach(() => {
      expect(Cypress.config().defaultCommandTimeout).eq(200)
      expect(Cypress.config('defaultCommandTimeout')).eq(200)
      expect(Cypress.env('FOO_VALUE')).eq('foo')
    })
  })

  describe('in suite', () => {
    describe('config in suite', {
      defaultCommandTimeout: 200,
    }, () => {
      it('test', () => {
        expect(Cypress.config().defaultCommandTimeout).eq(200)
      })
    })
  })
})

function hasOnly (test) {
  let curSuite = test.parent
  let hasOnly = false

  while (curSuite) {
    if (curSuite._onlySuites.length || curSuite._onlyTests.length) {
      hasOnly = true
    }

    curSuite = curSuite.parent
  }

  return hasOnly
}
