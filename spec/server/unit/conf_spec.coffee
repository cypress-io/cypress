require("../spec_helper")

os = require("os")
path = require("path")
Promise = require("bluebird")
Conf = require("#{root}lib/util/conf")
fs = Promise.promisifyAll(require("fs-extra"))

describe "lib/util/conf", ->

  beforeEach ->
    @dir = path.join(os.tmpdir(), "conf_spec")
    fs.removeAsync(@dir).catch ->
      ## ignore error if directory didn't exist in the first place

  it "throws if cwd is not specified", ->
    expect(-> new Conf()).to.throw("Must specify cwd when creating new Conf()")

  context "configName", ->
    it "defaults to config.json", ->
      expect(path.basename(new Conf({cwd: @dir}).path)).to.equal("config.json")

    it "can be specified", ->
      expect(path.basename(new Conf({cwd: @dir, configName: "custom"}).path)).to.equal("custom.json")

  context "#get", ->
    beforeEach ->
      @conf = new Conf({cwd: @dir})

    it "resolves entire object if given no key", ->
      @conf.get().then (config) ->
        expect(config).to.eql({})

    it "resolves value for key when one is set", ->
      @conf.set("foo", "bar")
      .then =>
        @conf.get("foo")
      .then (value) ->
        expect(value).to.equal("bar")

    it "resolves value for path when one is set", ->
      @conf.set("foo.baz", "bar")
      .then =>
        @conf.get("foo.baz")
      .then (value) ->
        expect(value).to.equal("bar")

    it "resolves default value if given key is undefined", ->
      @conf.get("foo", "default").then (value) ->
        expect(value).to.equal("default")

    it "resolves undefined if value is undefined", ->
      @conf.get("foo").then (value) ->
        expect(value).to.be.undefined

    it "resolves null if value is null", ->
      @conf.set("foo", null)
      .then =>
        @conf.get("foo")
      .then (value) ->
        expect(value).to.be.null

    it "resolves empty object when config file does not exist", ->
      fs.removeAsync(@dir)
      .then =>
        @conf.get()
      .then (config) ->
        expect(config).to.eql({})

    it "resolves empty object when config file is empty", ->
      fs.ensureDirAsync(@dir)
      .then =>
        fs.writeFileAsync(path.join(@dir, "config.json"), "")
      .then =>
        @conf.get()
      .then (config) ->
        expect(config).to.eql({})

    it "resolves empty object when config file has invalid json", ->
      fs.ensureDirAsync(@dir)
      .then =>
        fs.writeFileAsync(path.join(@dir, "config.json"), "{")
      .then =>
        @conf.get()
      .then (config) ->
        expect(config).to.eql({})

    it "caches store so subsequent gets don't read from disk", ->
      @originallySet = { foo: "bar" }
      @conf.set(@originallySet)
      .then =>
        fs.writeFileAsync(path.join(@dir, "config.json"), "{}")
      .then =>
        @conf.get()
      .then (config) =>
        expect(config).to.eql(@originallySet)

  context "#set", ->
    beforeEach ->
      @conf = new Conf({cwd: @dir})

    it "throws if 1st argument is not a string or object", ->
      expect(=> @conf.set(5)).to.throw("Expected `key` to be of type `string` or `object`, got `number`")

    it "sets value for given key", ->
      @conf.set("foo", "bar")
      .then =>
        @conf.get("foo")
      .then (value) ->
        expect(value).to.equal("bar")

    it "sets value for given path", ->
      @conf.set("foo.baz", "bar")
      .then =>
        @conf.get()
      .then (config) ->
        expect(config).to.eql({
          foo: {
            baz: "bar"
          }
        })

    it "sets values for object",  ->
      @conf.set({
        foo: "bar"
        baz: {
          qux: "lolz"
        }
      })
      .then =>
        @conf.get()
      .then (config) ->
        expect(config).to.eql({
          foo: "bar"
          baz: {
            qux: "lolz"
          }
        })

    it "leaves existing values alone", ->
      @conf.set("foo", "bar")
      .then =>
        @conf.set("baz", "qux")
      .then =>
        @conf.get()
      .then (config) ->
        expect(config).to.eql({
          foo: "bar"
          baz: "qux"
        })

    it "updates file on disk", ->
      @conf.set("foo", "bar")
      .then =>
        fs.readFileAsync(path.join(@dir, "config.json"), "utf8")
      .then (contents) ->
        expect(JSON.parse(contents)).to.eql({foo: "bar"})

    it "updates cache", ->
      @conf.set("foo", "bar")
      .then =>
        @conf.set("foo", "baz")
      .then (contents) =>
        expect(@conf.cache).to.eql({foo: "baz"})
