const debug = require("debug")("cypress:binary")
import la from 'lazy-ass'
import is from 'check-more-types'
// using "arg" module for parsing CLI arguments
// because it plays really nicely with TypeScript
import arg from 'arg'
import S3 from 'aws-sdk/clients/s3'
import {prop, sortBy, last} from 'ramda'
import pluralize from 'pluralize'

// ignore TS errors - we are importing from CoffeeScript files
// @ts-ignore
import {getS3Credentials, validPlatformArchs} from './util/upload'
// @ts-ignore
import {getUploadDirForPlatform} from './upload-unique-binary'

/**
 * 40 character full sha commit string
 */
type commit = string
/**
 * semver string, like "3.3.0"
 */
type semver = string

interface ReleaseInformation {
  commit: commit,
  version: semver
}

interface CommitAndBuild {
  commit: commit,
  build: number,
  s3path: string
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
    s3path
  }
}

export const findBuildByCommit = (commit: commit, s3paths: string[]) => {
  const matching = s3paths.filter(s => s.includes(commit))
  if (!matching.length) {
    // could not find path with commit SHA
    return null
  }

  if (matching.length === 1) {
    return matching[0]
  }

  // each path includes commit SHA and build number, let's pick the last build
  const parsedBuilds = matching.map(parseBuildPath)
  const sortedBuilds = sortBy(prop('build'))(parsedBuilds)
  return prop('s3path', last(sortedBuilds))
}

/**
 * Returns list of prefixes in a given folder
 */
const listS3Objects = (uploadDir: string, bucket: string, s3: S3): Promise<string[]> => {
  la(is.unemptyString(uploadDir), 'invalid upload dir', uploadDir)

  return new Promise((resolve, reject) => {
    const prefix = uploadDir + '/'
    s3.listObjectsV2({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: '/'
    }, (err, result) => {
      if (err) {
        return reject(err)
      }

      debug('AWS result in %s %s', bucket, prefix)
      debug('%o', result)

      resolve(result.CommonPrefixes.map(prop('Prefix')))
    })
  })
}

/**
 * Moves binaries built for different platforms into a single
 * folder on S3 before officially releasing as a new version.
 */
export const moveBinaries = async (args = []) => {
  debug('moveBinaries with args %o', args)
  const options = arg({
    '--commit': String,
    '--version': String,
    // aliases
    '--sha': '--commit',
    '-v': '--version'
  }, {
    argv: args.slice(2)
  })
  debug('moveBinaries with options %o', options)

  // @ts-ignore
  la(is.commitId(options['--commit']), 'missing commit SHA', options)
  // @ts-ignore
  la(is.semver(options['--version']), 'missing version to collect', options)

  const releaseOptions: ReleaseInformation = {
    commit: options['--commit'],
    version: options['--version']
  }

  const aws = getS3Credentials()
  const s3 = new S3({
    accessKeyId:     aws.key,
    secretAccessKey: aws.secret
  })

  // found s3 paths with last build for same commit for all platforms
  const lastBuilds: string[] = []

  for (const platformArch of validPlatformArchs) {
    const uploadDir = getUploadDirForPlatform({
      version: releaseOptions.version
    }, platformArch)
    console.log('finding binary for %s in %s', platformArch, uploadDir)

    const list: string[] = await listS3Objects(uploadDir, aws.bucket, s3)

    if (debug.enabled) {
      console.log('all found subfolders')
      console.log(list.join('\n'))
    }

    const lastBuildPath = findBuildByCommit(releaseOptions.commit, list)
    if (!lastBuildPath) {
      throw new Error(`Cannot find build with commit ${releaseOptions.commit} for platform ${platformArch}`)
    }
    console.log('found %s for commit %s on platform %s',
      lastBuildPath,
      releaseOptions.commit, platformArch)

    lastBuilds.push(lastBuildPath)
  }

  console.log('Copying %s for commit %s',
    pluralize('last build', lastBuilds.length, true), releaseOptions.commit)
  console.log(lastBuilds.join('\n'))
}
