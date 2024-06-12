const Promise = require('bluebird')
const os = require('os')
const execa = require('execa')
const path = require('path')
const la = require('lazy-ass')
const fs = require('fs')
const { filesize } = require('filesize')

// prints disk usage numbers using "du" utility
// available on Linux and Mac
const printFileSizes = function (folder) {
  console.log(`File sizes in ${folder}`)
  const paths = path.join(folder, '*')
  const options = {
    stdio: 'inherit',
    shell: true,
  }

  return execa(`du -hs ${paths}`, options)
}

// resolves with zipped filename
const macZip = (src, dest) => {
  return printFileSizes(src)
  .then(() => {
    if (os.platform() !== 'darwin') {
      throw new Error('Can only zip on Mac platform')
    }

    // Ditto (Mac) options
    // http://www.unix.com/man-page/OSX/1/ditto/
    // -c create archive
    // -k set archive format to PKZip
    // --sequesterRsrc When creating a PKZip archive, preserve resource
    //   forks and HFS meta-data in the subdirectory __MACOSX
    // --keepParent when zipping folder "foo", makes the folder
    //   the top level in the archive
    //   foo.zip
    //     foo/
    //        ...
    const zip = `ditto -c -k --sequesterRsrc --keepParent ${src} ${dest}`
    const options = {
      stdio: 'inherit',
      shell: true,
    }

    console.log(zip)

    const onZipFinished = () => {
      return console.log('✅ ditto finished')
    }

    const onError = function (err) {
      console.error(`⛔️ could not zip ${src} into ${dest}`)
      console.error(err.message)
      throw err
    }

    return execa(zip, options)
    .then(onZipFinished)
    .then(() => dest)
    .catch(onError)
  })
}

const megaBytes = (bytes) => {
  return 1024 * 1024 * bytes
}

const checkZipSize = function (zipPath) {
  const stats = fs.statSync(zipPath)
  const zipSize = filesize(stats.size, { round: 0 })

  console.log(`zip file size ${zipSize}`)
  // Before you modify these max sizes, check and see what you did that might have
  // done to increase the size of the binary, and if you do need to change it,
  // call it out in the PR description / comments
  const MAX_ALLOWED_SIZE_MB = os.platform() === 'win32' ? 295 : 200
  const MAX_ZIP_FILE_SIZE = megaBytes(MAX_ALLOWED_SIZE_MB)

  if (stats.size > MAX_ZIP_FILE_SIZE) {
    throw new Error(`Zip file is too large: ${zipSize} (${stats.size} bytes) exceeds ${MAX_ZIP_FILE_SIZE} bytes`)
  }
}

const linuxZipAction = function (parentFolder, dest, relativeSource) {
  console.log(`zipping ${parentFolder}`)
  const cmd = `cd ${parentFolder} && zip -r9 ${dest} ${relativeSource}`

  console.log(`linux zip: ${cmd}`)

  const onZipFinished = () => {
    return console.log('✅ zip finished')
  }

  const onError = function (err) {
    console.error(`⛔️ could not zip ${relativeSource} in folder ${parentFolder}`)
    console.error(`to produce ${dest}`)
    console.error(err.message)
    throw err
  }

  return execa(cmd, { shell: true })
  .then(onZipFinished)
  .then(() => dest)
  .then((val) => {
    checkZipSize(val)

    return val
  })
  .catch(onError)
}

// src is built folder with packed Cypress application
// like /root/app/build/linux-unpacked or build/win-unpacked
// and we want to always have /root/app/build/Cypress
const renameFolder = function (src) {
  const parentFolder = path.dirname(src)
  const folderName = path.basename(src)

  if (folderName === 'Cypress') {
    console.log('nothing to rename, folder "%s" ends with Cypress', src)

    return Promise.resolve(src)
  }

  const renamed = path.join(parentFolder, 'Cypress')

  console.log(`renaming ${src} to ${renamed}`)

  return fs.promises.rename(src, renamed)
  .then(() => renamed)
}

// resolves with zipped filename
const linuxZip = function (src, dest) {
  // in Linux switch to the folder containing source folder
  la(path.isAbsolute(src), 'source path should be absolute', src)
  la(path.isAbsolute(dest), 'destination path should be absolute', dest)

  // on Linux, make sure the folder name is "Cypress" first
  return renameFolder(src)
  .then((renamedSource) => {
    return printFileSizes(renamedSource)
    .then(() => renamedSource)
  }).then((renamedSource) => {
    console.log(`will zip folder ${renamedSource}`)
    const parentFolder = path.dirname(renamedSource)
    const relativeSource = path.basename(renamedSource)

    return linuxZipAction(parentFolder, dest, relativeSource)
  })
}

// resolves with zipped filename
const windowsZipAction = function (src, dest) {
  // use 7Zip to zip
  // http://www.7-zip.org/
  // zips entire source directory including top level folder name
  //   Cypress/
  //     foo.txt
  // creates cypress.zip for example
  // unzip cypress.zip to get back the folder
  //   Cypress/
  //     foo.txt
  const cmd = `7z a ${dest} ${src}`

  console.log(`windows zip: ${cmd}`)

  const onZipFinished = () => {
    return console.log('✅ 7z finished')
  }

  const onError = function (err) {
    console.error(`⛔️ could not zip ${src} into ${dest}`)
    console.error(err.message)
    throw err
  }

  return execa(cmd, { shell: true })
  .then(onZipFinished)
  .then(() => dest)
  .then((val) => {
    checkZipSize(val)

    return val
  })
  .catch(onError)
}

const windowsZip = (src, dest) => {
  return renameFolder(src)
  .then((renamedSource) => {
    return windowsZipAction(renamedSource, dest)
  })
}

const zippers = {
  linux: linuxZip,
  darwin: macZip,
  win32: windowsZip,
}

module.exports = {
  // zip Cypress folder to create destination zip file
  // uses tool depending on the platform
  ditto (src, dest) {
    const platform = os.platform()

    console.log('#zip', platform)
    console.log('Zipping %s into %s', src, dest)

    const zipper = zippers[platform]

    if (!zipper) {
      throw new Error(`Missing zip function for platform ${platform}`)
    }

    return zipper(src, dest)
  },

  checkZipSize,
}
