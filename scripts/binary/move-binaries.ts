const debug = require("debug")("cypress:binary")
import la from 'lazy-ass'
import is from 'check-more-types'
// using "arg" module for parsing CLI arguments
// because it plays really nicely with TypeScript
import arg from 'arg'
import S3 from 'aws-sdk/clients/s3'
import {prop} from 'ramda'

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

  validPlatformArchs.slice(0,1).forEach(async (platformArch: string) => {
    const uploadDir = getUploadDirForPlatform({
      version: releaseOptions.version
    }, platformArch)
    console.log('finding binary for %s in %s', platformArch, uploadDir)

    const list: string[] = await new Promise((resolve, reject) => {
      const prefix = uploadDir + '/'

      s3.listObjectsV2({
        Bucket: aws.bucket,
        Prefix: prefix,
        Delimiter: '/'
      }, (err, result) => {
        if (err) {
          return reject(err)
        }

        debug('AWS result in %s %s', aws.bucket, prefix)
        debug('%o', result)

        resolve(result.CommonPrefixes.map(prop('Prefix')))
      })
    })

    if (debug.isEnabled) {
      debug('all found subfolders')
      debug(list.join('\n'))
    }
  })
}
