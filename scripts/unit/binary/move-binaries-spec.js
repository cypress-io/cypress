const snapshot = require('snap-shot-it')
const la = require('lazy-ass')
const is = require('check-more-types')

/* eslint-env mocha */
describe('move-binaries', () => {
  const moveBinaries = require('../../binary/move-binaries')

  context('parseBuildPath', () => {
    const parseBuildPath = moveBinaries.parseBuildPath

    it('parses into SHA and build', () => {
      const path =
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/'
      const parsed = parseBuildPath(path)
      la(is.commitId(parsed.commit), 'missing commit', parsed)
      la(is.positive(parsed.build), 'missing build', parsed)

      snapshot({
        path,
        parsed
      })
    })
  })

  context('findBuildByCommit', () => {
    const findBuildByCommit = moveBinaries.findBuildByCommit
    const sha = '47e98fa1d0b18867a74da91a719d0f1ae73fcbc7'

    it('is a function', () => {
      la(is.fn(findBuildByCommit))
    })

    it('finds single matching path', () => {
      const paths = [
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/'
      ]
      const found = findBuildByCommit(sha, paths)
      la(found === paths[0], 'expected to find the only path', found)
    })

    it('finds single matching path among several', () => {
      const paths = [
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
        // these are not matching
        'beta/binary/3.3.0/darwin-x64/circle-develop-ffff8fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
        'beta/binary/3.3.0/darwin-x64/circle-develop-aaaa8fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/'
      ]
      const found = findBuildByCommit(sha, paths)
      la(found === paths[0], 'expected to find the only path', found)
    })

    it('finds last matching build', () => {
      const paths = [
        // matching, but not the last one
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-50/',
        // this is both matching and is the latest build (100)
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-100/',
        // these are not matching
        'beta/binary/3.3.0/darwin-x64/circle-develop-ffff8fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
        'beta/binary/3.3.0/darwin-x64/circle-develop-aaaa8fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
        // this one is matching, but not the latest one
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-2/'
      ]
      const found = findBuildByCommit(sha, paths)
      la(found === paths[1], 'expected to find the only path', found)
    })
  })
})
