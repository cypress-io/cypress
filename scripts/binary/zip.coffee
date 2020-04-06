Promise = require("bluebird")
os      = require("os")
execa   = require("execa")
path    = require("path")
la      = require("lazy-ass")
fs      = require("fs")
R       = require("ramda")
filesize = require("filesize")

# prints disk usage numbers using "du" utility
# available on Linux and Mac
printFileSizes = (folder) ->
  console.log("File sizes in #{folder}")
  paths = path.join(folder, "*")
  options = {
    stdio: "inherit",
    shell: true
  }
  execa("du -hs #{paths}", options)

# resolves with zipped filename
macZip = (src, dest) ->
  printFileSizes(src)
  .then () ->
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
    options = {
      stdio: "inherit",
      shell: true
    }
    console.log(zip)

    onZipFinished = () ->
      console.log("✅ ditto finished")

    onError = (err) ->
      console.error("⛔️ could not zip #{src} into #{dest}")
      console.error(err.message)
      throw err

    execa(zip, options)
    .then onZipFinished
    .then R.always(dest)
    .catch onError

megaBytes = (bytes) ->
  1024 * 1024 * bytes

checkZipSize = (zipPath) ->
  stats = fs.statSync(zipPath)
  zipSize = filesize(stats.size, {round: 0})
  console.log("zip file size #{zipSize}")
  MAX_ALLOWED_SIZE_MB = if os.platform() == "win32" then 245 else 170
  MAX_ZIP_FILE_SIZE = megaBytes(MAX_ALLOWED_SIZE_MB)
  if stats.size > MAX_ZIP_FILE_SIZE
    throw new Error("Zip file is too large: #{zipSize} (#{stats.size} bytes) exceeds #{MAX_ZIP_FILE_SIZE} bytes")

linuxZipAction = (parentFolder, dest, relativeSource) ->
  console.log("zipping #{parentFolder}")
  cmd = "cd #{parentFolder} && zip -r9 #{dest} #{relativeSource}"
  console.log("linux zip: #{cmd}")

  onZipFinished = () ->
    console.log("✅ zip finished")

  onError = (err) ->
    console.error("⛔️ could not zip #{relativeSource} in folder #{parentFolder}")
    console.error("to produce #{dest}")
    console.error(err.message)
    throw err

  execa(cmd, {shell: true})
  .then onZipFinished
  .then R.always(dest)
  .then R.tap(checkZipSize)
  .catch onError

# src is built folder with packed Cypress application
# like /root/app/build/linux-unpacked or build/win-unpacked
# and we want to always have /root/app/build/Cypress
renameFolder = (src) ->
  parentFolder = path.dirname(src)
  folderName = path.basename(src)
  if folderName is "Cypress"
    console.log('nothing to rename, folder "%s" ends with Cypress', src)
    return Promise.resolve(src)

  renamed = path.join(parentFolder, "Cypress")
  console.log("renaming #{src} to #{renamed}")
  fs.promises.rename(src, renamed)
  .then R.always(renamed)

# resolves with zipped filename
linuxZip = (src, dest) ->
  # in Linux switch to the folder containing source folder
  la(path.isAbsolute(src), "source path should be absolute", src)
  la(path.isAbsolute(dest), "destination path should be absolute", dest)

  # on Linux, make sure the folder name is "Cypress" first
  renameFolder(src)
  .then (renamedSource) ->
    printFileSizes(renamedSource)
    .then R.always(renamedSource)
  .then (renamedSource) ->
    console.log("will zip folder #{renamedSource}")
    parentFolder = path.dirname(renamedSource)
    relativeSource = path.basename(renamedSource)
    linuxZipAction(parentFolder, dest, relativeSource)

# resolves with zipped filename
windowsZipAction = (src, dest) ->
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
    console.log("✅ 7z finished")

  onError = (err) ->
    console.error("⛔️ could not zip #{src} into #{dest}")
    console.error(err.message)
    throw err

  execa(cmd, {shell: true})
  .then onZipFinished
  .then R.always(dest)
  .then R.tap(checkZipSize)
  .catch onError

windowsZip = (src, dest) ->
  renameFolder(src)
  .then (renamedSource) ->
    windowsZipAction(renamedSource, dest)

zippers = {
  linux: linuxZip
  darwin: macZip
  win32: windowsZip
}

module.exports = {
  # zip Cypress folder to create destination zip file
  # uses tool depending on the platform
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
