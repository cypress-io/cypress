// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('simple failing hook spec', () => {
  context('beforeEach hooks', () => {
    beforeEach(() => {
      throw new Error('fail1')
    })

    it('never gets here', () => {})
  })

  context('pending', () => {
    it('is pending')
  })

  context('afterEach hooks', () => {
    afterEach(() => {
      throw new Error('fail2')
    })

    it('runs this', () => {})

    it('does not run this', () => {})
  })

  context('after hooks', () => {
    after(() => {
      throw new Error('fail3')
    })

    it('runs this', () => {})

    it('fails on this', () => {})
  })
})
