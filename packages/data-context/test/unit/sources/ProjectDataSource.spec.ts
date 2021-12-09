import { expect } from 'chai'
import { transformSpec, longestCommonPrefix } from '../../../src/sources/ProjectDataSource'

describe('ProjectDataSource', () => {
  it.only('longestCommonPrefix', () => {
    const result = longestCommonPrefix([
      '/Users/lachlan/code/work/cypress6/packages/app/a.js',
      '/Users/lachlan/code/work/cypress6/packages/app/b/foo.js',
      '/Users/lachlan/code/work/cypress6/packages/app/b/c/foo.js',
    ])

    expect(result).to.eq('/Users/lachlan/code/work/cypress6/packages/app/')
  })

  it('transformSpec', () => {
    // const result = transformSpec(
    //   '/Users/lachlan/code/work/cypress6/packages/app',
    //   '/Users/lachlan/code/work/cypress6/packages/app/src/foo.js',
    //   '/Users/lachlan/code/work/cypress6/packages/app/src/qux/foo.js',
    //   'component',
    // )
  })
})