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
const uploadUtils = require('./util/upload')

const npmPackageExtension = '.tgz'
const uploadFileName = 'cypress.tgz'

const isNpmPackageFile = check.extension(npmPackageExtension)

// the package tgz file will be uploaded into unique folder
// in our case something like this
// https://cdn.cypress.io/beta/npm/<version>/<some unique hash>/cypress.tgz
const rootFolder = 'beta'
const npmFolder = 'npm'

const getCDN = function ({ version, hash, filename }) {
  la(check.semver(version), 'invalid version', version)
  la(check.unemptyString(hash), 'missing hash', hash)
  la(check.unemptyString(filename), 'missing filename', filename)
  la(isNpmPackageFile(filename), 'wrong extension for file', filename)
  const url = uploadUtils.getUploadUrl()

  la(check.url(url), 'could not get upload url', url)

  return [url, rootFolder, npmFolder, version, hash, filename].join('/')
}

const getUploadDirName = function (options) {
  la(check.unemptyString(options.version), 'missing version', options)
  la(check.unemptyString(options.hash), 'missing hash', options)
  const dir = [rootFolder, npmFolder, options.version, options.hash, null].join('/')

  return dir
}

const uploadFile = (options) => {
  return new Promise((resolve, reject) => {
    const publisher = uploadUtils.getPublisher()

    const headers = {}

    headers['Cache-Control'] = 'no-cache'

    return gulp.src(options.file)
    .pipe(rename((p) => {
      p.basename = path.basename(uploadFileName, npmPackageExtension)
      p.dirname = getUploadDirName(options)
      console.log('renaming upload to', p.dirname, p.basename)
      la(check.unemptyString(p.basename), 'missing basename')
      la(check.unemptyString(p.dirname), 'missing dirname')

      return p
    })).pipe(gulpDebug())
    .pipe(publisher.publish(headers))
    .pipe(awspublish.reporter())
    .on('error', reject)
    .on('end', resolve)
  })
}

const uploadNpmPackage = function (args = []) {
  console.log(args)
  const options = minimist(args, {
    string: ['version', 'file', 'hash'],
    alias: {
      version: 'v',
      file: 'f',
      hash: 'h',
    },
  })

  console.log('Upload NPM package options')
  console.log(options)

  la(check.unemptyString(options.file), 'missing file to upload', options)
  la(isNpmPackageFile(options.file),
    'invalid file to upload extension', options.file)

  if (!options.hash) {
    options.hash = uploadUtils.formHashFromEnvironment()
  }

  la(check.unemptyString(options.hash), 'missing hash to give', options)
  la(check.unemptyString(options.version), 'missing version', options)

  la(fs.existsSync(options.file), 'cannot find file', options.file)

  return uploadFile(options)
  .then(() => {
    const cdnUrl = getCDN({
      version: options.version,
      hash: options.hash,
      filename: uploadFileName,
    })

    console.log('NPM package can be installed using URL')
    console.log('npm install %s', cdnUrl)

    return cdnUrl
  }).then(uploadUtils.saveUrl('npm-package-url.json'))
}

// for now disable purging from CDN cache
// because each upload should be unique by hash
// .then R.tap(uploadUtils.purgeCache)

module.exports = {
  uploadNpmPackage,
  getCDN,
}

if (!module.parent) {
  uploadNpmPackage(process.argv)
}
