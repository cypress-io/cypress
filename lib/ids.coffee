fs      = require("fs")
path    = require("path")
glob    = require("glob")
Promise = require("bluebird")

fs   = Promise.promisifyAll(fs)
idRe = /\s*\[.{3}\]/g

module.exports = {
  files: (pathToTestFiles) ->
    new Promise (resolve, reject) ->
      glob path.join(pathToTestFiles, "**", "*"), {nodir: true}, (err, files) ->
        reject(err) if err

        resolve(files)

  get: (pathToTestFiles) ->
    getIds = (memo, file) ->
      fs.readFileAsync(file, "utf8")
      .then (contents) ->
        if matches = contents.match(idRe)
          memo = memo.concat(matches)

        memo

    Promise.reduce @files(pathToTestFiles), getIds, []

  remove: (pathToTestFiles) ->
    removeIds = (memo, file) ->
      fs.readFileAsync(file, "utf8")
      .then (contents) ->
        if matches = contents.match(idRe)
          ## add the number of matched ids
          memo.ids += matches.length

          ## add to the total number of files
          memo.files += 1

          ## strip out all of the ids
          contents = contents.replace(idRe, "")

          fs.writeFileAsync(file, contents)

        ## always return the memo object
        memo

    Promise.reduce @files(pathToTestFiles), removeIds, {ids: 0, files: 0}
}