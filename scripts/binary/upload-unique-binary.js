const minimist = require('minimist')
const Promise = require('bluebird')
const la = require('lazy-ass')
const check = require('check-more-types')
const fs = require('fs')
const path = require('path')
const awspublish = require('gulp-awspublish')
const rename = require('gulp-rename')
const gulpDebug = require('gulp-debug')
const gulp = require('gulp')
const R = require('ramda')
const hasha = require('hasha')

const uploadUtils = require('./util/upload')
const {
  s3helpers,
} = require('./s3-api')

// we zip the binary on every platform and upload under same name
const binaryExtension = '.zip'
const uploadFileName = 'cypress.zip'

const isBinaryFile = check.extension(binaryExtension)

const rootFolder = 'beta'
const folder = 'binary'

// the binary will be uploaded into unique folder
// in our case something like this
// https://cdn.cypress.io/desktop/binary/0.20.2/<platform>/<some unique version info>/cypress.zip
const getCDN = function ({ version, hash, filename, platform }) {
  la(check.semver(version), 'invalid version', version)
  la(check.unemptyString(hash), 'missing hash', hash)
  la(check.unemptyString(filename), 'missing filename', filename)
  la(isBinaryFile(filename), 'wrong extension for file', filename)
  la(check.unemptyString(platform), 'missing platform', platform)

  const cdnUrl = uploadUtils.getUploadUrl()

  la(check.url(cdnUrl), 'could not get cdn url', cdnUrl)

  return [cdnUrl, rootFolder, folder, version, platform, hash, filename].join('/')
}

// returns folder that contains beta (unreleased) binaries for given version
//
const getUploadVersionDirName = function (options) {
  la(check.unemptyString(options.version), 'missing version', options)

  const dir = [rootFolder, folder, options.version].join('/')

  return dir
}

const getUploadDirForPlatform = function (options, platformArch) {
  la(uploadUtils.isValidPlatformArch(platformArch),
    'missing or invalid platformArch', platformArch)

  const versionDir = getUploadVersionDirName(options)

  la(check.unemptyString(versionDir), 'could not form folder from', options)

  const dir = [versionDir, platformArch].join('/')

  return dir
}

const getUploadDirName = function (options) {
  la(check.unemptyString(options.hash), 'missing hash', options)

  const uploadFolder = getUploadDirForPlatform(options, options.platformArch)

  la(check.unemptyString(uploadFolder), 'could not form folder from', options)

  const dir = [uploadFolder, options.hash, null].join('/')

  return dir
}

const uploadFile = (options) => {
  return new Promise((resolve, reject) => {
    const publisher = uploadUtils.getPublisher()

    const headers = {}

    headers['Cache-Control'] = 'no-cache'

    let key = null

    return gulp.src(options.file)
    .pipe(rename((p) => {
      p.basename = path.basename(uploadFileName, binaryExtension)
      p.dirname = getUploadDirName(options)
      console.log('renaming upload to', p.dirname, p.basename)
      la(check.unemptyString(p.basename), 'missing basename')
      la(check.unemptyString(p.dirname), 'missing dirname')
      key = p.dirname + uploadFileName

      return p
    })).pipe(gulpDebug())
    .pipe(publisher.publish(headers))
    .pipe(awspublish.reporter())
    .on('error', reject)
    .on('end', () => {
      return resolve(key)
    })
  })
}

const setChecksum = (filename, key) => {
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

  const aws = uploadUtils.getS3Credentials()
  const s3 = s3helpers.makeS3(aws)
  // S3 object metadata can only have string values
  const metadata = {
    checksum,
    size: String(size),
  }

  // by default s3.copyObject does not preserve ACL when copying
  // thus we need to reset it for our public files
  return s3helpers.setUserMetadata(aws.bucket, key, metadata,
    'application/zip', 'public-read', s3)
}

const uploadUniqueBinary = function (args = []) {
  const options = minimist(args, {
    string: ['version', 'file', 'hash', 'platform'],
    alias: {
      version: 'v',
      file: 'f',
      hash: 'h',
    },
  })

  console.log('Upload unique binary options')
  const pickOptions = R.pick(['file', 'version', 'hash'])

  console.log(pickOptions(options))

  la(check.unemptyString(options.file), 'missing file to upload', options)
  la(isBinaryFile(options.file),
    'invalid file to upload extension', options.file)

  if (!options.hash) {
    options.hash = uploadUtils.formHashFromEnvironment()
  }

  la(check.unemptyString(options.hash), 'missing hash to give', options)
  la(check.unemptyString(options.version), 'missing version', options)

  la(fs.existsSync(options.file), 'cannot find file', options.file)

  const platform = options.platform != null ? options.platform : process.platform

  options.platformArch = uploadUtils.getUploadNameByOsAndArch(platform)

  return uploadFile(options)
  .then((key) => {
    return setChecksum(options.file, key)
  }).then(() => {
    const cdnUrl = getCDN({
      version: options.version,
      hash: options.hash,
      filename: uploadFileName,
      platform: options.platformArch,
    })

    console.log('Binary can be downloaded using URL')
    console.log(cdnUrl)

    return cdnUrl
  }).then(uploadUtils.saveUrl('binary-url.json'))
}

module.exports = {
  getUploadDirName,
  getUploadDirForPlatform,
  uploadUniqueBinary,
  getCDN,
}

if (!module.parent) {
  uploadUniqueBinary(process.argv)
}
