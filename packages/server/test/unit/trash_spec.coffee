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
      fs.mkdirSync(path.resolve(basePath, "bar"))
      fs.mkdirSync(path.resolve(basePath, "bar", "baz"))

      fs.writeFileSync(path.resolve(basePath, "a.txt"), "")
      fs.writeFileSync(path.resolve(basePath, "bar", "b.txt"), "")
      fs.writeFileSync(path.resolve(basePath,"bar", "baz", "c.txt"), "")

      expect(fs.existsSync(path.resolve(basePath, "a.txt"))).to.be.true
      expect(fs.existsSync(path.resolve(basePath, "bar", "b.txt"))).to.be.true
      expect(fs.existsSync(path.resolve(basePath,"bar", "baz", "c.txt"))).to.be.true

      trash.folder(basePath).then ->
        expect(fs.existsSync(basePath)).to.be.true
        expect(fs.existsSync(path.resolve(basePath, "a.txt"))).to.be.false
        expect(fs.existsSync(path.resolve(basePath, "bar", "b.txt"))).to.be.false
        expect(fs.existsSync(path.resolve(basePath,"bar", "baz", "c.txt"))).to.be.false
        fs.rmdirSync(basePath)
