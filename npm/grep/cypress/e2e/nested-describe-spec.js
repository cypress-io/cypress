/// <reference path="../../src/index.d.ts" />

// @ts-check
describe('grand', () => {
  context('outer', { tags: '@smoke' }, () => {
    describe('inner', () => {
      it('runs', () => {})
    })
  })
})

describe('top', { tags: '@smoke' }, () => {
  describe('middle', () => {
    context('bottom', { tags: ['@integration', '@fast'] }, () => {
      it('runs too', () => {})
    })
  })
})
