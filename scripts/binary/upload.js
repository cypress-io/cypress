const awspublish = require('gulp-awspublish')
const rename = require('gulp-rename')
const gulpDebug = require('gulp-debug')
let fs = require('fs-extra')
const path = require('path')
const gulp = require('gulp')
const Promise = require('bluebird')
const la = require('lazy-ass')
const check = require('check-more-types')

const uploadUtils = require('./util/upload')

fs = Promise.promisifyAll(fs)

// TODO: refactor this
// system expects desktop application to be inside a file
// with this name
const zipName = uploadUtils.S3Configuration.binaryZipName

module.exports = {
  zipName,

  async getPublisher () {
    return uploadUtils.getPublisher()
  },

  // returns desktop folder for a given folder without platform
  // something like desktop/0.20.1
  getUploadVersionFolder (aws, version) {
    la(check.unemptyString(aws.folder), 'aws object is missing desktop folder', aws.folder)
    const dirName = [aws.folder, version].join('/')

    return dirName
  },

  // store uploaded application in subfolders by version and platform
  // something like desktop/0.20.1/darwin-x64/
  getFullUploadPath (options) {
    let { folder, version, platformArch, name } = options

    if (!folder) {
      folder = uploadUtils.S3Configuration.releaseFolder
    }

    la(check.unemptyString(folder), 'missing folder', options)
    la(check.semver(version), 'missing or invalid version', options)
    la(check.unemptyString(name), 'missing file name', options)
    la(uploadUtils.isValidPlatformArch(platformArch),
      'invalid platform and arch', platformArch)

    const fileName = [folder, version, platformArch, name].join('/')

    return fileName
  },

  getManifestUrl (folder, version, uploadOsName) {
    const url = uploadUtils.getUploadUrl()

    la(check.url(url), 'could not get upload url', url)

    return {
      url: [url, folder, version, uploadOsName, zipName].join('/'),
    }
  },

  getRemoteManifest (folder, version) {
    la(check.unemptyString(folder), 'missing manifest folder', folder)
    la(check.semver(version), 'invalid manifest version', version)

    const getUrl = this.getManifestUrl.bind(null, folder, version)

    return {
      name: 'Cypress',
      version,
      packages: {
        // keep these for compatibility purposes
        // although they are now deprecated
        mac: getUrl('darwin-x64'),
        linux64: getUrl('linux-x64'),

        // start adding the new ones
        // using node's platform
        darwin: getUrl('darwin-x64'),
        linux: getUrl('linux-x64'),

        // the new-new names that use platform and arch as is
        'darwin-x64': getUrl('darwin-x64'),
        'linux-x64': getUrl('linux-x64'),
        'win32-x64': getUrl('win32-x64'),
      },
    }
  },

  createRemoteManifest (folder, version) {
    const obj = this.getRemoteManifest(folder, version)

    const src = path.resolve('manifest.json')

    return fs.outputJsonAsync(src, obj).return(src)
  },

  s3Manifest (version) {
    return this.getPublisher()
    .then((publisher) => {
      const { releaseFolder } = uploadUtils.S3Configuration

      const headers = {
        'Cache-Control': 'no-cache',
      }
      let manifest = null

      return new Promise((resolve, reject) => {
        return this.createRemoteManifest(releaseFolder, version)
        .then((src) => {
          manifest = src

          return gulp.src(src)
          .pipe(rename((p) => {
            p.dirname = `${releaseFolder}/${p.dirname}`

            return p
          })).pipe(gulpDebug())
          .pipe(publisher.publish(headers))
          .pipe(awspublish.reporter())
          .on('error', reject)
          .on('end', resolve)
        })
      }).finally(() => {
        return fs.removeAsync(manifest)
      })
    })
  },

  toS3 ({ file, uploadPath }) {
    console.log('#uploadToS3 ⏳')
    console.log('uploading', file, 'to', uploadPath)

    la(check.unemptyString(file), 'missing file to upload', file)
    la(fs.existsSync(file), 'cannot find file', file)
    la(check.extension(path.extname(uploadPath))(file),
      'invalid file to upload extension', file)

    return this.getPublisher()
    .then((publisher) => {
      const headers = {
        'Cache-Control': 'no-cache',
      }

      return new Promise((resolve, reject) => {
        return gulp.src(file)
        .pipe(rename((p) => {
          // rename to standard filename for upload
          p.basename = path.basename(uploadPath, path.extname(uploadPath))
          p.dirname = path.dirname(uploadPath)

          return p
        }))
        .pipe(gulpDebug())
        .pipe(publisher.publish(headers))
        .pipe(awspublish.reporter())
        .on('error', reject)
        .on('end', resolve)
      })
    })
  },
}
