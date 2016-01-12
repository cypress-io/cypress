require("../spec_helper")

Settings = require("#{root}lib/util/settings")

describe "Settings", ->
  beforeEach ->
    @setup = (obj = {}) ->
      str = JSON.stringify(obj)
      fs.writeFileSync("cypress.json", str)

  afterEach ->
    fs.removeSync("cypress.json")

  context "nested cypress object", ->
    beforeEach ->
      @setup = (obj = {}) ->
        str = JSON.stringify({cypress: obj})
        fs.writeFileSync("cypress.json", str)

    it "flattens object on read", ->
      @setup({foo: "bar"})

      Settings.read(process.cwd()).then (settings) ->
        expect(settings).to.deep.eq {foo: "bar"}

        fs.readJsonAsync("cypress.json").then (obj) ->
          expect(obj).to.deep.eq({foo: "bar"})

    it "flattens object on readSync", ->
      @setup({foo: "bar"})

      settings = Settings.readSync(process.cwd())
      expect(settings).to.deep.eq {foo: "bar"}

      fs.readJsonAsync("cypress.json").then (obj) ->
        expect(obj).to.deep.eq({foo: "bar"})

  context "#readSync", ->
    it "reads cypress.json", ->
      @setup {foo: "bar"}
      settings = Settings.readSync process.cwd()
      expect(settings).to.deep.eq {foo: "bar"}

    it "throws on json errors", ->
      fs.writeFileSync "cypress.json", "{foo: 'bar}"
      fn = -> Settings.readSync process.cwd()
      expect(fn).to.throw "Error reading from: #{process.cwd()}/cypress.json"

  context "#readEnvSync", ->
    afterEach ->
      fs.removeAsync("cypress.env.json")

    it "parses json", ->
      json = {foo: "bar", baz: "quux"}
      fs.writeJsonSync("cypress.env.json", json)
      expect(Settings.readEnvSync(process.cwd())).to.deep.eq(json)

    it "throws when invalid json", ->
      fs.writeFileSync("cypress.env.json", "{'foo;: 'bar}")

      fn = ->
        Settings.readEnvSync(process.cwd())

      expect(fn).to.throw(/Error reading from/)

    it "does not write initial file", ->
      Settings.readEnvSync(process.cwd())
      expect(fs.existsSync("cypress.env.json")).to.be.false

  context "#read", ->
    it "promises cypress.json", ->
      @setup {foo: "bar"}
      Settings.read(process.cwd()).then (settings) ->
        expect(settings).to.deep.eq {foo: "bar"}

  context "#write", ->
    it "promises cypress.json updates", ->
      @setup()

      Settings.write(process.cwd(), {foo: "bar"}).then (settings) ->
        expect(settings).to.deep.eq {foo: "bar"}

    it "only writes over conflicting keys", ->
      @setup {projectId: "12345", autoOpen: true}

      Settings.write(process.cwd(), projectId: "abc123").then (settings) ->
        expect(settings).to.deep.eq {projectId: "abc123", autoOpen: true}