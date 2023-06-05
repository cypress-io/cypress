import _ from 'lodash'

import { s3helpers } from './s3-api'
const debug = require('debug')('cypress:binary')
import la from 'lazy-ass'
import is from 'check-more-types'

import minimist from 'minimist'
import pluralize from 'pluralize'

// inquirer-confirm is missing type definition
// @ts-ignore
import confirm from 'inquirer-confirm'

// ignore TS errors - we are importing from CoffeeScript files
// @ts-ignore
import uploadUtils from './util/upload'

// @ts-ignore
import { getUploadDirForPlatform } from './upload-build-artifact'
// @ts-ignore
import { zipName, getFullUploadPath } from './upload'

/**
 * 40 character full sha commit string
 */
type commit = string
/**
 * semver string, like "3.3.0"
 */
type semver = string

/**
 * Platform plus architecture string like "darwin-x64"
 */
type platformArch = 'darwin-x64' | 'darwin-arm64' | 'linux-x64' | 'linux-arm64' | 'win32-x64'

interface ReleaseInformation {
  commit: commit
  version: semver
}

interface CommitAndBuild {
  commit: commit
  build: number
  s3path: string
}

interface Desktop {
  s3zipPath: string
  platformArch: platformArch
}

/**
 * Parses a binary S3 path like
 * "beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-100/"
 * and returns object with SHA string and build number
 */
export const parseBuildPath = (s3path: string): CommitAndBuild | null => {
  const shaAndBuild = /([0-9a-f]{40})-(\d+)\/?$/i
  const found = s3path.match(shaAndBuild)

  if (!found) {
    return null
  }

  const [, commit, build] = found

  return {
    commit,
    build: parseInt(build),
    s3path,
  }
}

export const findBuildByCommit = (commit: commit, s3paths: string[]) => {
  const matching = s3paths.filter((s) => s.includes(commit))

  if (!matching.length) {
    // could not find path with commit SHA
    return null
  }

  if (matching.length === 1) {
    return matching[0]
  }

  // each path includes commit SHA and build number, let's pick the last build
  const parsedBuilds = matching.map(parseBuildPath)
  const sortedBuilds = _.sortBy(parsedBuilds, 'build')

  return _.last(sortedBuilds).s3path
}

/**
 * An object of all confirm prompts to the user.
 * Useful to stubbing the confirmation prompts during testing.
 */
export const prompts = {
  async shouldCopy () {
    await confirm({
      question: 'Would you like to proceed? This will overwrite existing files',
      default: false,
    })
  },
}

/**
 * Moves binaries built for different platforms into a single
 * folder on S3 before officially releasing as a new version.
 */
export const moveBinaries = async (args = []) => {
  debug('moveBinaries with args %o', args)

  const supportedOptions = [
    's3bucket',
    's3folder',
    'commit',
    'version',
    // optional, if passed, only the binary for that platform will be moved
    'platformArch',
  ]

  const options = minimist(args.slice(2), {
    string: supportedOptions,
    alias: {
      commit: ['sha'],
      version: ['v'],
    },
  })

  debug('moveBinaries with options %o', options)

  la(is.commitId(options.commit), 'missing or invalid commit SHA', options)
  la(is.semver(options.version), 'missing version to collect', options)

  const releaseOptions: ReleaseInformation = {
    commit: options.commit,
    version: options.version,
  }

  const credentials = await uploadUtils.getS3Credentials()
  const aws = {
    bucket: options.s3bucket || uploadUtils.S3Configuration.bucket,
    folder: options.s3folder || uploadUtils.S3Configuration.releaseFolder,
  }

  const s3 = s3helpers.makeS3(credentials)

  // found s3 paths with last build for same commit for all platforms
  const lastBuilds: Desktop[] = []

  let platforms: platformArch[] = uploadUtils.getValidPlatformArchs() as platformArch[]

  if (options.platformArch) {
    const onlyPlatform = options.platformArch

    console.log('only moving single platform %s', onlyPlatform)
    la(uploadUtils.isValidPlatformArch(onlyPlatform), 'invalid platform-arch', onlyPlatform)
    platforms = platforms.filter((p) => p === onlyPlatform)
  }

  la(platforms.length, 'no platforms to move', platforms)

  for (const platformArch of platforms) {
    la(uploadUtils.isValidPlatformArch(platformArch),
      'invalid platform arch', platformArch)

    const uploadDir = getUploadDirForPlatform({
      version: releaseOptions.version,
      uploadFolder: 'binary',
      platformArch,
    })

    console.log('finding binary in %s for %s in %s', aws.bucket, platformArch, uploadDir)

    const list: string[] = await s3helpers.listS3Objects(uploadDir, aws.bucket, s3)

    if (debug.enabled) {
      console.log('all found sub-folders')
      console.log(list.join('\n'))
    }

    const lastBuildPath = findBuildByCommit(releaseOptions.commit, list)

    if (!lastBuildPath) {
      throw new Error(`Cannot find build with commit ${releaseOptions.commit} for platform ${platformArch}`)
    }

    console.log('found %s for commit %s on platform %s',
      lastBuildPath,
      releaseOptions.commit, platformArch)

    const s3zipPath = lastBuildPath + zipName

    await s3helpers.verifyZipFileExists(s3zipPath, aws.bucket, s3)

    lastBuilds.push({
      platformArch,
      s3zipPath,
    })
  }

  console.log('Copying %s for commit %s',
    pluralize('last build', lastBuilds.length, true), releaseOptions.commit)

  console.log(lastBuilds.map((v) => v.s3zipPath).join('\n'))

  try {
    await prompts.shouldCopy()
  } catch (e) {
    console.log('Copying has been canceled')

    return
  }

  console.log('Copying ...')

  // final test runners that we have copied
  const testRunners: Desktop[] = []

  for (const lastBuild of lastBuilds) {
    const options = {
      folder: aws.folder,
      version: releaseOptions.version,
      platformArch: lastBuild.platformArch,
      name: zipName,
    }
    const destinationPath = getFullUploadPath(options)

    console.log('copying test runner %s to %s', lastBuild.platformArch, destinationPath)

    await s3helpers.copyS3(lastBuild.s3zipPath, destinationPath, aws.bucket,
      'application/zip', 'public-read', s3)

    testRunners.push({
      platformArch: lastBuild.platformArch,
      s3zipPath: destinationPath,
    })
  }

  await uploadUtils.purgeDesktopAppAllPlatforms(releaseOptions.version, zipName)

  // return all available information
  return { lastBuilds, testRunners }
}
