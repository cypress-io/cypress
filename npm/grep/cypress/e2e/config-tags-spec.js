// @ts-check
/// <reference path="../../src/index.d.ts" />
describe('tags in the config object', () => {
  it('works as an array', { tags: ['config', 'some-other-tag'] }, () => {
    expect(true).to.be.true
  })

  it('works as a string', { tags: 'config' }, () => {
    expect(true).to.be.true
  })

  it('does not use tags', () => {
    // so it fails
    expect(true).to.be.false
  })
})
