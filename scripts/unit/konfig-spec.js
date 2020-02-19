const la = require('lazy-ass')
const is = require('check-more-types')
const { join } = require('path')

/* eslint-env mocha */
describe('konfig check', () => {
  /*
    script tests should NOT suddenly change the current working directory to
    packages/server - otherwise the local path filenames might be all wrong
    and unexpected. The current working directory changes when we
    require `packages/server/lib/konfig` which in turn requires
    `lib/cwd` which changes CWD.

    From the scripts unit tests we should not use `lib/konfig` directly,
    instead we should use `binary/get-config` script to get the konfig function.
  */

  let cwd

  before(() => {
    cwd = process.cwd()
    la(
      !cwd.includes(join('packages', 'server')),
      'process CWD is set to',
      cwd,
      'for some reason',
    )
    // if the above assertion breaks, it means some script in binary scripts
    // loads "lib/konfig" directly, which unexpectedly changes the CWD.
  })

  it('does not change CWD on load', () => {
    const konfig = require('../binary/get-config')()
    const cwdAfter = process.cwd()

    la(
      cwd === cwdAfter,
      'previous cwd',
      cwd,
      'differs after loading konfig',
      cwdAfter,
    )

    la(is.fn(konfig), 'expected konfig to be a function', konfig)
  })
})
