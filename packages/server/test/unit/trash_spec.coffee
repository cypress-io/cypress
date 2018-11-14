require("../spec_helper")

fs = require("fs")
os = require("os")
path = require("path")
trash = require("#{root}lib/util/trash")

populateDirectories = (basePath) ->
  fs.mkdirSync(basePath)
  fs.mkdirSync(path.resolve(basePath, "bar"))
  fs.mkdirSync(path.resolve(basePath, "bar", "baz"))

  fs.writeFileSync(path.resolve(basePath, "a.txt"), "")
  fs.writeFileSync(path.resolve(basePath, "bar", "b.txt"), "")
  fs.writeFileSync(path.resolve(basePath,"bar", "baz", "c.txt"), "")

  expect(fs.existsSync(path.resolve(basePath, "a.txt"))).to.be.true
  expect(fs.existsSync(path.resolve(basePath, "bar", "b.txt"))).to.be.true
  expect(fs.existsSync(path.resolve(basePath,"bar", "baz", "c.txt"))).to.be.true

expectDirectoriesExist = (basePath) ->
  expect(fs.existsSync(basePath)).to.be.true
  expect(fs.existsSync(path.resolve(basePath, "a.txt"))).to.be.false
  expect(fs.existsSync(path.resolve(basePath, "bar", "b.txt"))).to.be.false
  expect(fs.existsSync(path.resolve(basePath,"bar", "baz", "c.txt"))).to.be.false

describe "lib/util/trash", ->
  context ".folder", ->
    it "trashes contents of directory in non-Linux", ->
      sinon.stub(os, "platform").returns("darwin")
      basePath = path.join("foo")

      populateDirectories(basePath)

      trash.folder(basePath).then ->
        expectDirectoriesExist(basePath)
        fs.rmdirSync(basePath)

    it "doesn't fail if directory is non-existent", (done) ->
      trash.folder('bar').then ->
        done()
      .catch ->
        throw new Error('should not have errored')

    it "completely removes directory on Linux", ->
      sinon.stub(os, "platform").returns("linux")
      basePath = path.join("foo")

      populateDirectories(basePath)

      trash.folder(basePath).then ->
        expectDirectoriesExist(basePath)
        fs.rmdirSync(basePath)
