// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('record fails', () => {
  beforeEach(() => {
    throw new Error('foo')
  })

  it('fails 1', () => {})

  it('is skipped', () => {})
})
