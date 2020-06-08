const awspublish = require('gulp-awspublish')
const rename = require('gulp-rename')
const gulpDebug = require('gulp-debug')
let fs = require('fs-extra')
const path = require('path')
const gulp = require('gulp')
const Promise = require('bluebird')
const meta = require('./meta')
const la = require('lazy-ass')
const check = require('check-more-types')
const uploadUtils = require('./util/upload')

fs = Promise.promisifyAll(fs)

// TODO: refactor this
// system expects desktop application to be inside a file
// with this name
const zipName = 'cypress.zip'

module.exports = {
  zipName,

  getPublisher () {
    return uploadUtils.getPublisher(this.getAwsObj)
  },

  getAwsObj () {
    return uploadUtils.getS3Credentials()
  },

  // returns desktop folder for a given folder without platform
  // something like desktop/0.20.1
  getUploadeVersionFolder (aws, version) {
    la(check.unemptyString(aws.folder), 'aws object is missing desktop folder', aws.folder)
    const dirName = [aws.folder, version].join('/')

    return dirName
  },

  getFullUploadName ({ folder, version, platformArch, name }) {
    la(check.unemptyString(folder), 'missing folder', folder)
    la(check.semver(version), 'missing or invalid version', version)
    la(check.unemptyString(name), 'missing file name', name)
    la(uploadUtils.isValidPlatformArch(platformArch),
      'invalid platform and arch', platformArch)

    const fileName = [folder, version, platformArch, name].join('/')

    return fileName
  },

  // store uploaded application in subfolders by platform and version
  // something like desktop/0.20.1/darwin-x64/
  getUploadDirName ({ version, platform }) {
    const aws = this.getAwsObj()
    const platformArch = uploadUtils.getUploadNameByOsAndArch(platform)

    const versionFolder = this.getUploadeVersionFolder(aws, version)
    const dirName = [versionFolder, platformArch, null].join('/')

    console.log('target directory %s', dirName)

    return dirName
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
        win: getUrl('win32-ia32'),
        linux64: getUrl('linux-x64'),

        // start adding the new ones
        // using node's platform
        darwin: getUrl('darwin-x64'),
        win32: getUrl('win32-ia32'),
        linux: getUrl('linux-x64'),

        // the new-new names that use platform and arch as is
        'darwin-x64': getUrl('darwin-x64'),
        'linux-x64': getUrl('linux-x64'),
        'win32-ia32': getUrl('win32-ia32'),
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
    const publisher = this.getPublisher()

    const aws = this.getAwsObj()

    const headers = {}

    headers['Cache-Control'] = 'no-cache'

    let manifest = null

    return new Promise((resolve, reject) => {
      return this.createRemoteManifest(aws.folder, version)
      .then((src) => {
        manifest = src

        return gulp.src(src)
        .pipe(rename((p) => {
          p.dirname = `${aws.folder}/${p.dirname}`

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
  },

  toS3 ({ zipFile, version, platform }) {
    console.log('#uploadToS3 ⏳')

    la(check.unemptyString(version), 'expected version string', version)
    la(check.unemptyString(zipFile), 'expected zip filename', zipFile)
    la(check.extension('zip', zipFile),
      'zip filename should end with .zip', zipFile)

    la(meta.isValidPlatform(platform), 'invalid platform', platform)

    console.log(`zip filename ${zipFile}`)

    if (!fs.existsSync(zipFile)) {
      throw new Error(`Cannot find zip file ${zipFile}`)
    }

    const upload = () => {
      return new Promise((resolve, reject) => {
        const publisher = this.getPublisher()

        const headers = {}

        headers['Cache-Control'] = 'no-cache'

        return gulp.src(zipFile)
        .pipe(rename((p) => {
          // rename to standard filename zipName
          p.basename = path.basename(zipName, p.extname)
          p.dirname = this.getUploadDirName({ version, platform })

          return p
        })).pipe(gulpDebug())
        .pipe(publisher.publish(headers))
        .pipe(awspublish.reporter())
        .on('error', reject)
        .on('end', resolve)
      })
    }

    return upload()
    .then(() => {
      return uploadUtils.purgeDesktopAppFromCache({ version, platform, zipName })
    })
  },
}
