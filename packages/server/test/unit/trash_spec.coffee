require("../spec_helper")

fs = require("fs")
os = require("os")
path = require("path")
trash = require("#{root}lib/util/trash")

describe "lib/util/trash", ->
  context ".folder", ->
    it "deletes contents of directory", ->
      basePath = path.join("foo")
      fs.mkdirSync(basePath)
      fs.mkdirSync(path.resolve(basePath, 'bar'))
      fs.writeFileSync("#{basePath}/baz.txt", "")
      fs.writeFileSync("#{basePath}/bar/qux.txt", "")

      trash.folder(basePath).then ->
        expect(fs.existsSync(basePath)).to.be.true
        expect(fs.existsSync("#{basePath}/bar.txt")).to.be.false
        expect(fs.existsSync("#{basePath}/bar/qux.txt")).to.be.false
        fs.rmdirSync(basePath)
