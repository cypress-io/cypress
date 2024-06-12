const minimist = require('minimist')
const la = require('lazy-ass')
const check = require('check-more-types')
const fs = require('fs')
const hasha = require('hasha')
const _ = require('lodash')

const upload = require('./upload')
const uploadUtils = require('./util/upload')
const { s3helpers } = require('./s3-api')

const uploadTypes = uploadUtils.S3Configuration.betaUploadTypes

const getCDN = function (uploadPath) {
  return [uploadUtils.getUploadUrl(), uploadPath].join('/')
}

const getUploadDirForPlatform = function (options) {
  const { version, uploadFolder, platformArch } = options

  return ['beta', uploadFolder, version, platformArch].join('/')
}
// the artifact will be uploaded for every platform and uploaded into under a unique folder
// https://cdn.cypress.io/beta/(binary|npm)/<version>/<platform>/<some unique version info>/cypress.zip
// For binary:
//     beta/binary/9.4.2/win32-x64/develop-219138ca4e952edc4af831f2ae16ce659ebdb50b/cypress.zip
// For NPM package:
//     beta/npm/9.4.2/develop-219138ca4e952edc4af831f2ae16ce659ebdb50b/cypress.tgz
const getUploadPath = function (options) {
  const { hash, uploadFileName } = options

  return [getUploadDirForPlatform(options), hash, uploadFileName].join('/')
}

const setChecksum = async (filename, key) => {
  console.log('setting checksum for file %s', filename)
  console.log('on s3 object %s', key)

  la(check.unemptyString(filename), 'expected filename', filename)
  la(check.unemptyString(key), 'expected uploaded S3 key', key)

  const checksum = hasha.fromFileSync(filename, { algorithm: 'sha512' })
  const {
    size,
  } = fs.statSync(filename)

  console.log('SHA256 checksum %s', checksum)
  console.log('size', size)

  const aws = await uploadUtils.getS3Credentials()
  const s3 = s3helpers.makeS3(aws)
  // S3 object metadata can only have string values
  const metadata = {
    checksum,
    size: String(size),
  }

  // by default s3.copyObject does not preserve ACL when copying
  // thus we need to reset it for our public files
  return s3helpers.setUserMetadata(uploadUtils.S3Configuration.bucket, key, metadata,
    'application/zip', 'public-read', s3)
}

const validateOptions = (options) => {
  const { type, version, platform } = options
  const supportedUploadTypes = Object.keys(uploadTypes)

  la(check.defined(type) && supportedUploadTypes.includes(type),
    `specify which upload type you\'d like to upload. One of ${supportedUploadTypes.join(',')}`, type)

  const { uploadFolder, uploadFileName } = uploadTypes[type]

  options.uploadFolder = uploadFolder
  options.uploadFileName = uploadFileName

  la(check.unemptyString(version) && check.semver(version), 'invalid version', version)

  if (!options.hash) {
    options.hash = uploadUtils.formHashFromEnvironment()
  }

  la(check.unemptyString(options.hash), 'missing hash to give', options)

  options.platformArch = uploadUtils.getUploadNameByOsAndArch(platform || process.platform)

  return options
}

const uploadArtifactToS3 = function (args = []) {
  const supportedOptions = ['type', 'version', 'file', 'hash', 'platform', 'dry-run']
  let options = minimist(args, {
    string: supportedOptions,
  })

  console.log('Upload options')
  console.log(_.pick(options, supportedOptions))

  validateOptions(options)

  const uploadPath = getUploadPath(options)

  const cdnUrl = getCDN(uploadPath)

  if (options['dry-run']) {
    return new Promise((resolve) => resolve(cdnUrl))
  }

  return upload.toS3({ file: options.file, uploadPath })
  .then(() => {
    return setChecksum(options.file, uploadPath)
  })
  .then(() => {
    if (options.type === 'binary') {
      console.log('Binary can be downloaded using URL')
      console.log(cdnUrl)
    } else {
      console.log('NPM package can be installed using URL')
      console.log('npm install %s', cdnUrl)
    }

    return cdnUrl
  })
  .then(uploadUtils.saveUrl(`${options.type}-url.json`))
  .catch((e) => {
    console.error('There was an issue uploading the artifact.')
    throw e
  })
}

module.exports = {
  getCDN,
  getUploadDirForPlatform,
  getUploadPath,
  setChecksum,
  uploadArtifactToS3,
}

if (!module.parent) {
  uploadArtifactToS3(process.argv)
}
