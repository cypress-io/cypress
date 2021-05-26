import dayjs from 'dayjs'

const utils = require('../../src/lib/utils')

describe('durationFormatted', function () {
  it('formats ms', function () {
    expect(utils.durationFormatted(496)).to.eq('496ms')
  })

  it('formats 1 digit secs', function () {
    expect(utils.durationFormatted(1000)).to.eq('00:01')
  })

  it('formats 2 digit secs', function () {
    expect(utils.durationFormatted(21000)).to.eq('00:21')
  })

  it('formats mins and secs', function () {
    expect(utils.durationFormatted(321000)).to.eq('05:21')
  })

  it('formats 2 digit mins and secs', function () {
    expect(utils.durationFormatted(3330000)).to.eq('55:30')
  })

  it('formats hours with mins', function () {
    expect(utils.durationFormatted(33300000)).to.eq('9:15:00')
  })
})

describe('getFormattedTimeFromNow', function () {
  it('displays time a minute ago', () => {
    const now = dayjs()
    const dateInPast = now.subtract(1, 'minute').toISOString()

    expect(utils.getFormattedTimeFromNow(dateInPast)).to.eq('a min ago')
  })
})

describe('stripLeadingCyDirs', function () {
  it('strips leading cypress directories from spec', function () {
    expect(utils.stripLeadingCyDirs('cypress/integration/login_spec.js')).to.eq('login_spec.js')
  })
})

describe('stripSharedDirsFromDir2', function () {
  it('returns 2nd dirs with shared dirs stripped', function () {
    const expectsPath = (one, two, osName, result) => {
      expect(utils.stripSharedDirsFromDir2(one, two, osName)).to.eq(result)
    }

    const linuxDir1 = '/Users/spies_stubs_clocks/Dev/Projects/jekyl-blog/tests/e2e'
    const linuxDir2 = 'tests/e2e/spies_stubs_clocks/a.spec.js'
    const linuxDirNested2 = 'tests/e2e/foo/bar/spies_stubs_clocks.spec.js'

    const winDir1 = '\\Users\\jane\\Dev\\cypress\\jekyl-blog\\cypress\\integration'
    const winDir2 = 'cypress\\integration\\spies_stubs_clocks.spec.js'
    const winDirNested2 = 'cypress\\integration\\foo\\bar\\spies_stubs_clocks.spec.js'

    expectsPath(linuxDir1, linuxDir2, 'linux', 'spies_stubs_clocks/a.spec.js')
    expectsPath(linuxDir1, linuxDirNested2, 'linux', 'foo/bar/spies_stubs_clocks.spec.js')

    expectsPath(winDir1, winDir2, 'win32', 'spies_stubs_clocks.spec.js')
    expectsPath(winDir1, winDirNested2, 'win32', 'foo\\bar\\spies_stubs_clocks.spec.js')
  })
})
