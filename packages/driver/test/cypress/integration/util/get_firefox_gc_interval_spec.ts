import { create } from '../../../../src/util/get_firefox_gc_interval'

const run = (configObj) => {
  const configFn = (key) => {
    return key ? configObj[key] : configObj
  }

  return create(configFn)()
}

describe('driver/src/util/get_firefox_gc_interval', () => {
  describe('#create returns a function that', () => {
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
  })
})
