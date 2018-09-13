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
      fs.writeFileSync("#{basePath}/bar.txt", "")
      expect(fs.existsSync(basePath)).to.be.true
      expect(fs.existsSync("#{basePath}/bar.txt")).to.be.true

      trash.folder("foo").then ->
        expect(fs.existsSync(basePath)).to.be.true
        expect(fs.existsSync("#{basePath}/bar.txt")).to.be.false
        fs.rmdirSync(basePath)
