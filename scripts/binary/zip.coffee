cp      = require("child_process")
Promise = require("bluebird")
os      = require("os")
execa   = require("execa")
path    = require("path")
la      = require("lazy-ass")
fs      = require("fs")
R       = require("ramda")
filesize = require("filesize")

# resolves with zipped filename
macZip = (src, dest) ->
  new Promise (resolve, reject) =>
    if os.platform() != "darwin"
      throw new Error("Can only zip on Mac platform")
    # Ditto (Mac) options
    # http://www.unix.com/man-page/OSX/1/ditto/
    # -c create archive
    # -k set archive format to PKZip
    # --sequesterRsrc When creating a PKZip archive, preserve resource
    #   forks and HFS meta-data in the subdirectory __MACOSX
    # --keepParent when zipping folder "foo", makes the folder
    #   the top level in the archive
    #   foo.zip
    #     foo/
    #        ...
    zip = "ditto -c -k --sequesterRsrc --keepParent #{src} #{dest}"
    console.log(zip)
    cp.exec zip, {}, (err, stdout, stderr) ->
      return reject(err) if err

      console.log("✅ ditto zip finished")
      resolve(dest)

megaBytes = (bytes) ->
  1024 * 1024 * bytes

checkZipSize = (zipPath) ->
  stats = fs.statSync(zipPath)
  zipSize = filesize(stats.size, {round: 0})
  console.log("zip file size #{zipSize}")
  MAX_ALLOWED_SIZE_MB = if os.platform() == "win32" then 235 else 135
  MAX_ZIP_FILE_SIZE = megaBytes(MAX_ALLOWED_SIZE_MB)
  if stats.size > MAX_ZIP_FILE_SIZE
    throw new Error("Zip file is too large: #{zipSize} exceeds #{MAX_ZIP_FILE_SIZE}")

# resolves with zipped filename
linuxZip = (src, dest) ->
  # in Linux switch to the folder containing source folder
  la(path.isAbsolute(src), "source path should be absolute", src)
  la(path.isAbsolute(dest), "destination path should be absolute", dest)
  parentFolder = path.dirname(src)
  relativeSource = path.basename(src)

  cmd = "cd #{parentFolder} && zip -r9 #{dest} #{relativeSource}"
  console.log("linux zip: #{cmd}")

  onZipFinished = () ->
    console.log("✅ zip finished")

  onError = (err) ->
    console.error("⛔️ could not zip #{src} into #{dest}")
    console.error(err.message)
    throw err

  execa.shell(cmd)
  .then onZipFinished
  .then R.always(dest)
  .then R.tap(checkZipSize)
  .catch onError

# resolves with zipped filename
windowsZip = (src, dest) ->
  # use 7Zip to zip
  # http://www.7-zip.org/
  # zips entire source directory including top level folder name
  #   Cypress/
  #     foo.txt
  # creates cypress.zip for example
  # unzip cypress.zip to get back the folder
  #   Cypress/
  #     foo.txt
  cmd = "7z a #{dest} #{src}"
  console.log("windows zip: #{cmd}")

  onZipFinished = () ->
    console.log("✅ zip finished")

  onError = (err) ->
    console.error("⛔️ could not zip #{src} into #{dest}")
    console.error(err.message)
    throw err

  execa.shell(cmd)
  .then onZipFinished
  .then R.always(dest)
  .then R.tap(checkZipSize)
  .catch onError

zippers = {
  linux: linuxZip
  darwin: macZip
  win32: windowsZip
}

module.exports = {
  ditto: (src, dest) ->
    platform = os.platform()
    console.log("#zip", platform)
    console.log("Zipping %s into %s", src, dest)
    zipper = zippers[platform]
    if !zipper
      throw new Error("Missing zip function for platform #{platform}")
    zipper(src, dest)

  checkZipSize
}
