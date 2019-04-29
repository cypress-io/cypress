const debug = require("debug")("cypress:binary")
import la from 'lazy-ass'
import is from 'check-more-types'
// using "arg" module for parsing CLI arguments
// because it plays really nicely with TypeScript
import arg from 'arg'
import S3 from 'aws-sdk/clients/s3'
import {getS3Credentials} from './util/upload'

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

  const s3 = new S3({
    credentials: getS3Credentials()
  })
}
