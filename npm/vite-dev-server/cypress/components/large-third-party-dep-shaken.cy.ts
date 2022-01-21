import { isBoolean } from 'lodash'

/**
 * This test is failing because after vite
 * detects a dependency, it optimizes it and **Refresh**
 * the whole page.
 * FIXME: If there is any uncompiled dependency,
 * we should wait for the dependency to be compiled and
 * the page to be refreshed before running the tests.
 */
describe('Large 3rd party library with tree-shaking', () => {
  it('successfully imports isBoolean from lodash', () => {
    expect(isBoolean(true)).to.be.true
  })
})
