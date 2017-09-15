cp      = require("child_process")
Promise = require("bluebird")
os      = require("os")
execa   = require("execa")

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

# resolves with zipped filename
linuxZip = (src, dest) ->
  # cmd = "tar -zcvf #{dest} #{src}"
  cmd = "zip -r #{dest} #{src}"
  console.log("linux zip: #{cmd}")
  execa.shell(cmd)
  .then((result) ->
    console.log("✅ zip finished")
    dest
  )
  .catch((err) ->
    console.error("⛔️ could not zip #{src} into #{dest}")
    console.error(err.message)
    throw err
  )

zippers = {
  linux: linuxZip
  darwin: macZip
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
}
