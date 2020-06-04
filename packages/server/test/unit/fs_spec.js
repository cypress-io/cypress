/* eslint-disable
    no-console,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('../spec_helper')

const fs = require(`${root}lib/util/fs`)

describe('lib/util/fs', () => {
  beforeEach(() => {
    return sinon.spy(console, 'error')
  })

  it('warns when trying to use fs.existsSync', () => {
    fs.existsSync(__filename)
    const warning = 'WARNING: fs sync methods can fail due to EMFILE errors'

    expect(console.error).to.be.calledWith(warning)
  })
  // also print stack trace, maybe check that

  context('fs.pathExists', () => {
    it('finds this file', () => {
      return fs.pathExists(__filename)
      .then((found) => {
        expect(found).to.be.true
      })
    })

    it('does not find non-existent file', () => {
      return fs.pathExists('does-not-exist')
      .then((found) => {
        expect(found).to.be.false
      })
    })
  })
})
