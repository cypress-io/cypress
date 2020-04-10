const snapshot = require('snap-shot-it')
const la = require('lazy-ass')
const is = require('check-more-types')
const uploadUtils = require('../../binary/util/upload')
const s3helpers = require('../../binary/s3-api').s3helpers

/* eslint-env mocha */
/* global sinon */
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
        parsed,
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
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
      ]
      const found = findBuildByCommit(sha, paths)

      la(found === paths[0], 'expected to find the only path', found)
    })

    it('finds single matching path among several', () => {
      const paths = [
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
        // these are not matching
        'beta/binary/3.3.0/darwin-x64/circle-develop-ffff8fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
        'beta/binary/3.3.0/darwin-x64/circle-develop-aaaa8fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
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
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-2/',
      ]
      const found = findBuildByCommit(sha, paths)

      la(found === paths[1], 'expected to find the only path', found)
    })
  })

  context('moveBinaries', () => {
    const move = moveBinaries.moveBinaries

    it('is a function', () => {
      la(is.fn(move))
    })

    it('finds and copies latest build for each platform', () => {
      // realistic end-to-end test
      // stubs S3 method calls
      // and lets our "moveBinaries" function collect builds
      // find latest build for each platform (for the same commit)
      // then call S3 to copy the desktop zip file to the final destination folder

      const sha = '455046b928c861d4457b2ec5426a51de1fda74fd'
      const version = '3.3.0'

      // limit ourselves to single platform
      sinon.stub(uploadUtils, 'getValidPlatformArchs').returns(['darwin-x64'])

      // Mac builds for several commits in the beta folder
      // below is the latest build matching the commit
      const latestMacBuild =
        'beta/binary/3.3.0/darwin-x64/circle-develop-455046b928c861d4457b2ec5426a51de1fda74fd-102457/'
      const darwinBuilds = [
        'beta/binary/3.3.0/darwin-x64/circle-develop-167934f0e45a07f03f6b1c5ddd6d8f201b5bb708-102287/',
        'beta/binary/3.3.0/darwin-x64/circle-develop-455046b928c861d4457b2ec5426a51de1fda74fd-102212/',
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
        latestMacBuild,
        'beta/binary/3.3.0/darwin-x64/circle-develop-5015cbbe876687deca571c221dfbc90715ad6d00-101982/',
        'beta/binary/3.3.0/darwin-x64/circle-develop-9372bc3f67a6a83bd5ec8a69d7350f5a9b52ddf9-102246/',
        'beta/binary/3.3.0/darwin-x64/circle-develop-455046b928c861d4457b2ec5426a51de1fda74fd-102359/',
        'beta/binary/3.3.0/darwin-x64/circle-develop-ec36bf013224942f6198bf831d62af64b9b16cf5-102729/',
        'beta/binary/3.3.0/darwin-x64/circle-issue-3996-6d539513e709ddd5aad866f6bf653280db6622cd-98450/',
      ]

      // fake AWS config
      const aws = {
        bucket: 'cdn.cypress.io',
        folder: 'desktop', // destination for test runner downloads
      }

      sinon.stub(uploadUtils, 'getS3Credentials').returns(aws)

      // fake S3 api
      const s3 = {}

      sinon.stub(s3helpers, 'makeS3').returns(s3)
      sinon
      .stub(s3helpers, 'listS3Objects')
      .withArgs('beta/binary/3.3.0/darwin-x64', aws.bucket)
      .resolves(darwinBuilds)

      sinon
      .stub(s3helpers, 'verifyZipFileExists')
      .withArgs(`${latestMacBuild}cypress.zip`, aws.bucket)
      .resolves()

      // our method will ask user to confirm copying
      sinon.stub(moveBinaries.prompts, 'shouldCopy').resolves()

      sinon
      .stub(s3helpers, 'copyS3')
      .withArgs(
        `${latestMacBuild}cypress.zip`,
        'desktop/3.3.0/darwin-x64/cypress.zip',
        aws.bucket,
      )
      .resolves()

      // first two arguments are sliced anyway
      const nodeName = null
      const scriptName = null
      const args = [nodeName, scriptName, '--sha', sha, '--version', version]

      return move(args).then((result) => {
        la(is.object(result), 'expected a result', result)

        snapshot('collected builds and copied desktop', result)
      })
    })
  })
})
