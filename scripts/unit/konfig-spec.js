const la = require('lazy-ass')
const is = require('check-more-types')
const { join } = require('path')

/* eslint-env mocha */
describe('konfig check', () => {
  let cwd

  before(() => {
    cwd = process.cwd()
    la(
      !cwd.includes(join('packages', 'server')),
      'process CWD is set to',
      cwd,
      'for some reason'
    )
  })

  it('does not change CWD on load', () => {
    const konfig = require('../binary/get-config')()
    const cwdAfter = process.cwd()

    la(
      cwd === cwdAfter,
      'previous cwd',
      cwd,
      'differs after loading konfig',
      cwdAfter
    )
    la(is.fn(konfig), 'expected konfig to be a function', konfig)
  })
})
