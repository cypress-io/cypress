import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import uploadUtils from '../../binary/util/upload'
import { s3helpers } from '../../binary/s3-api'
import { findBuildByCommit, moveBinaries, parseBuildPath, prompts } from '../../binary/move-binaries'

describe('move-binaries', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('parseBuildPath', () => {
    it('parses into SHA and build', () => {
      const path =
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/'
      const parsed = parseBuildPath(path)

      expect(parsed?.commit).toMatch(/^[0-9a-f]{40}$/)
      expect(parsed?.build).toBeGreaterThan(0)

      expect({
        path,
        parsed,
      }).toMatchSnapshot()
    })
  })

  describe('findBuildByCommit', () => {
    const sha = '47e98fa1d0b18867a74da91a719d0f1ae73fcbc7'

    it('finds single matching path', () => {
      const paths = [
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
      ]

      expect(findBuildByCommit(sha, paths)).toBe(paths[0])
    })

    it('finds single matching path among several', () => {
      const paths = [
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
        'beta/binary/3.3.0/darwin-x64/circle-develop-ffff8fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
        'beta/binary/3.3.0/darwin-x64/circle-develop-aaaa8fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
      ]

      expect(findBuildByCommit(sha, paths)).toBe(paths[0])
    })

    it('finds last matching build', () => {
      const paths = [
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-50/',
        // the highest build number for the commit wins, wherever it sits in the list
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-100/',
        'beta/binary/3.3.0/darwin-x64/circle-develop-ffff8fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
        'beta/binary/3.3.0/darwin-x64/circle-develop-aaaa8fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/',
        'beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-2/',
      ]

      expect(findBuildByCommit(sha, paths)).toBe(paths[1])
    })
  })

  describe('moveBinaries', () => {
    beforeEach(() => {
      vi.spyOn(uploadUtils, 'purgeDesktopAppAllPlatforms').mockResolvedValue(undefined)
    })

    it('finds and copies latest build for each platform', async () => {
      const sha = '455046b928c861d4457b2ec5426a51de1fda74fd'
      const version = '3.3.0'

      vi.spyOn(uploadUtils, 'getValidPlatformArchs').mockReturnValue(['darwin-x64'])

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

      const credentials = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        sessionToken: 'FwoGZXIvYXdzEBYaDEXAMPLESESSIONTOKEN',
      }
      const s3 = {}

      vi.spyOn(uploadUtils, 'getS3Credentials').mockResolvedValue(credentials)
      vi.spyOn(s3helpers, 'makeS3').mockReturnValue(s3 as ReturnType<typeof s3helpers.makeS3>)
      vi.spyOn(s3helpers, 'listS3Objects').mockResolvedValue(darwinBuilds)
      vi.spyOn(s3helpers, 'verifyZipFileExists').mockResolvedValue(undefined)
      vi.spyOn(s3helpers, 'copyS3').mockResolvedValue(undefined)
      vi.spyOn(prompts, 'shouldCopy').mockResolvedValue(undefined)

      // moveBinaries drops the first two entries, as it does with process.argv
      const args = ['node', 'binary.js', '--sha', sha, '--version', version]

      const result = await moveBinaries(args)

      expect(s3helpers.makeS3).toHaveBeenCalledWith(credentials)
      expect(s3helpers.listS3Objects).toHaveBeenCalledWith('beta/binary/3.3.0/darwin-x64', 'cdn.cypress.io', s3)
      expect(s3helpers.verifyZipFileExists).toHaveBeenCalledWith(`${latestMacBuild}cypress.zip`, 'cdn.cypress.io', s3)
      expect(s3helpers.copyS3).toHaveBeenCalledWith(
        `${latestMacBuild}cypress.zip`,
        'desktop/3.3.0/darwin-x64/cypress.zip',
        'cdn.cypress.io',
        'application/zip',
        'public-read',
        s3,
      )

      expect(uploadUtils.purgeDesktopAppAllPlatforms).toHaveBeenCalledWith(version, 'cypress.zip')

      expect(result).toMatchSnapshot('collected builds and copied desktop')
    })
  })
})
