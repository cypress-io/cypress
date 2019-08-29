require("../spec_helper")

os = require("os")
path = require("path")
Promise = require("bluebird")
lockFile = Promise.promisifyAll(require("lockfile"))
fs = require("#{root}lib/util/fs")
env = require("#{root}lib/util/env")
exit = require("#{root}lib/util/exit")
FileUtil = require("#{root}lib/util/file")

describe "lib/util/file", ->
  beforeEach ->
    @dir = path.join(os.tmpdir(), "cypress", "file_spec")
    @path = path.join(@dir, "file.json")

    fs.removeAsync(@dir).catch ->
      ## ignore error if directory didn't exist in the first place

  it "throws if path is not specified", ->
    expect(-> new FileUtil()).to.throw("Must specify path to file when creating new FileUtil()")

  it "unlocks file on exit", ->
    sinon.spy(lockFile, "unlockSync")
    sinon.stub(exit, "ensure")
    new FileUtil({path: @path})
    exit.ensure.yield()
    expect(lockFile.unlockSync).to.be.called

  context "#transaction", ->
    beforeEach ->
      @fileUtil = new FileUtil({path: @path})

    it "ensures returned promise completely resolves before moving on with queue", ->
      Promise.all([
        @fileUtil.transaction (tx) =>
          tx.get("items", []).then (items) =>
            tx.set("items", items.concat("foo"))

        @fileUtil.transaction (tx) =>
          tx.get("items", []).then (items) =>
            tx.set("items", items.concat("bar"))

        @fileUtil.transaction (tx) =>
          tx.get("items", []).then (items) =>
            tx.set("items", items.concat("baz"))
      ])
      .then =>
        @fileUtil.transaction (tx) =>
          tx.get("items").then (items) ->
            expect(items).to.eql(["foo", "bar", "baz"])

  context "#get", ->
    beforeEach ->
      @fileUtil = new FileUtil({path: @path})

    it "resolves entire object if given no key", ->
      @fileUtil.get().then (contents) ->
        expect(contents).to.eql({})

    it "resolves value for key when one is set", ->
      @fileUtil.set("foo", "bar")
      .then =>
        @fileUtil.get("foo")
      .then (value) ->
        expect(value).to.equal("bar")

    it "resolves value for path when one is set", ->
      @fileUtil.set("foo.baz", "bar")
      .then =>
        @fileUtil.get("foo.baz")
      .then (value) ->
        expect(value).to.equal("bar")

    it "resolves default value if given key is undefined", ->
      @fileUtil.get("foo", "default").then (value) ->
        expect(value).to.equal("default")

    it "resolves undefined if value is undefined", ->
      @fileUtil.get("foo").then (value) ->
        expect(value).to.be.undefined

    it "resolves null if value is null", ->
      @fileUtil.set("foo", null)
      .then =>
        @fileUtil.get("foo")
      .then (value) ->
        expect(value).to.be.null

    it "resolves empty object when contents file does not exist", ->
      fs.removeAsync(@dir)
      .then =>
        @fileUtil.get()
      .then (contents) ->
        expect(contents).to.eql({})

    it "resolves empty object when contents file is empty", ->
      fs.ensureDirAsync(@dir)
      .then =>
        fs.writeFileAsync(path.join(@dir, "file.json"), "")
      .then =>
        @fileUtil.get()
      .then (contents) ->
        expect(contents).to.eql({})

    it "resolves empty object when it can't get lock on file on initial read", ->
      fs.ensureDirAsync(@dir)
      .then =>
        fs.writeJsonAsync(@path, {foo: "bar"})
      .then =>
        sinon.stub(lockFile, "lockAsync").rejects({name: "", message: "", code: "EEXIST"})
        @fileUtil.get()
      .then (contents) ->
        expect(contents).to.eql({})

    it "resolves cached contents when it can't get lock on file after an initial read", ->
      @fileUtil.set("foo", "bar")
      .then =>
        sinon.stub(lockFile, "lockAsync").rejects({name: "", message: "", code: "EEXIST"})
        @fileUtil.get()
      .then (contents) ->
        expect(contents).to.eql({foo: "bar"})

    it "resolves empty object when contents file has invalid json", ->
      fs.ensureDirAsync(@dir)
      .then =>
        fs.writeFileAsync(path.join(@dir, "file.json"), "{")
      .then =>
        @fileUtil.get()
      .then (contents) ->
        expect(contents).to.eql({})

    it "debounces reading from disk", ->
      sinon.stub(fs, "readJsonAsync").resolves({})
      Promise.all([
        @fileUtil.get()
        @fileUtil.get()
        @fileUtil.get()
      ])
      .then ->
        expect(fs.readJsonAsync).to.be.calledOnce

    it "locks file while reading", ->
      sinon.spy(lockFile, "lockAsync")
      @fileUtil.get().then ->
        expect(lockFile.lockAsync).to.be.called

    it "unlocks file when finished reading", ->
      sinon.spy(lockFile, "unlockAsync")
      @fileUtil.get().then ->
        expect(lockFile.unlockAsync).to.be.called

    it "unlocks file even if reading fails", ->
      sinon.spy(lockFile, "unlockAsync")
      sinon.stub(fs, "readJsonAsync").rejects(new Error("fail!"))
      @fileUtil.get().catch ->
        expect(lockFile.unlockAsync).to.be.called

    it "times out and carries on if unlocking times out", ->
      sinon.stub(lockFile, "lockAsync").resolves()
      sinon.stub(lockFile, "unlockAsync").callsFake -> Promise.delay(1e9)
      sinon.stub(fs, "readJsonAsync").resolves({})
      sinon.stub(env, "get").withArgs("FILE_UNLOCK_TIMEOUT").returns(100)

      @fileUtil.get()

  context "#set", ->
    beforeEach ->
      @fileUtil = new FileUtil({path: @path})

    it "throws if 1st argument is not a string or plain object", ->
      expect(=> @fileUtil.set(1)).to.throw("Expected `key` to be of type `string` or `object`, got `number`")
      expect(=> @fileUtil.set([])).to.throw("Expected `key` to be of type `string` or `object`, got `array`")

    it "sets value for given key", ->
      @fileUtil.set("foo", "bar")
      .then =>
        @fileUtil.get("foo")
      .then (value) ->
        expect(value).to.equal("bar")

    it "sets value for given path", ->
      @fileUtil.set("foo.baz", "bar")
      .then =>
        @fileUtil.get()
      .then (contents) ->
        expect(contents).to.eql({
          foo: {
            baz: "bar"
          }
        })

    it "sets values for object",  ->
      @fileUtil.set({
        foo: "bar"
        baz: {
          qux: "lolz"
        }
      })
      .then =>
        @fileUtil.get()
      .then (contents) ->
        expect(contents).to.eql({
          foo: "bar"
          baz: {
            qux: "lolz"
          }
        })

    it "leaves existing values alone", ->
      @fileUtil.set("foo", "bar")
      .then =>
        @fileUtil.set("baz", "qux")
      .then =>
        @fileUtil.get()
      .then (contents) ->
        expect(contents).to.eql({
          foo: "bar"
          baz: "qux"
        })

    it "updates file on disk", ->
      @fileUtil.set("foo", "bar")
      .then =>
        fs.readFileAsync(path.join(@dir, "file.json"), "utf8")
      .then (contents) ->
        expect(JSON.parse(contents)).to.eql({foo: "bar"})

    it "locks file while writing", ->
      sinon.spy(lockFile, "lockAsync")
      @fileUtil.set("foo", "bar").then ->
        expect(lockFile.lockAsync).to.be.called

    it "unlocks file when finished writing", ->
      sinon.spy(lockFile, "unlockAsync")
      @fileUtil.set("foo", "bar").then ->
        expect(lockFile.unlockAsync).to.be.called

    it "unlocks file even if writing fails", ->
      sinon.spy(lockFile, "unlockAsync")
      sinon.stub(fs, "outputJsonAsync").rejects(new Error("fail!"))
      @fileUtil.set("foo", "bar").catch ->
        expect(lockFile.unlockAsync).to.be.called

  context "#remove", ->
    beforeEach ->
      @fileUtil = new FileUtil({path: @path})

    it "removes the file", ->
      @fileUtil.remove()
      .then =>
        fs.statAsync(@path)
      .catch ->

    it "locks file while removing", ->
      sinon.spy(lockFile, "lockAsync")
      @fileUtil.remove().then ->
        expect(lockFile.lockAsync).to.be.called

    it "unlocks file when finished removing", ->
      sinon.spy(lockFile, "unlockAsync")
      @fileUtil.remove()
      .then ->
        expect(lockFile.unlockAsync).to.be.called

    it "unlocks file even if removing fails", ->
      sinon.spy(lockFile, "unlockAsync")
      sinon.stub(fs, "removeAsync").rejects(new Error("fail!"))

      @fileUtil.remove()
      .then ->
        throw new Error("should have caught!")
      .catch (err) ->
        expect(err.message).to.eq("fail!")
        expect(lockFile.unlockAsync).to.be.called
