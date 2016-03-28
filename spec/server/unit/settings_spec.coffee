require("../spec_helper")

settings = require("#{root}lib/util/settings")

describe "lib/settings", ->
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

      settings.read(process.cwd()).then (obj) ->
        expect(obj).to.deep.eq {foo: "bar"}

        fs.readJsonAsync("cypress.json").then (obj) ->
          expect(obj).to.deep.eq({foo: "bar"})

    it "flattens object on readSync", ->
      @setup({foo: "bar"})

      obj = settings.readSync(process.cwd())
      expect(obj).to.deep.eq {foo: "bar"}

      fs.readJsonAsync("cypress.json").then (obj) ->
        expect(obj).to.deep.eq({foo: "bar"})

  context ".readSync", ->
    it "reads cypress.json", ->
      @setup {foo: "bar"}
      obj = settings.readSync process.cwd()
      expect(obj).to.deep.eq {foo: "bar"}

    it "throws on json errors", ->
      fs.writeFileSync "cypress.json", "{foo: 'bar}"
      fn = -> settings.readSync process.cwd()
      expect(fn).to.throw "Error reading from:"
      expect(fn).to.throw "#{process.cwd()}/cypress.json"

  context ".readEnv", ->
    afterEach ->
      fs.removeAsync("cypress.env.json")

    it "parses json", ->
      json = {foo: "bar", baz: "quux"}
      fs.writeJsonSync("cypress.env.json", json)

      settings.readEnv(process.cwd())
      .then (obj) ->
        expect(obj).to.deep.eq(json)

    it "throws when invalid json", ->
      fs.writeFileSync("cypress.env.json", "{'foo;: 'bar}")

      settings.readEnv(process.cwd())
      .catch (err) ->
        expect(err.type).to.eq("ERROR_READING_FILE")
        expect(err.message).to.include("SyntaxError")
        expect(err.message).to.include(process.cwd())

    it "does not write initial file", ->
      settings.readEnv(process.cwd())
      .then (obj) ->
        expect(obj).to.deep.eq({})
        expect(fs.existsSync("cypress.env.json")).to.be.false

  context ".read", ->
    it "promises cypress.json", ->
      @setup {foo: "bar"}
      settings.read(process.cwd()).then (obj) ->
        expect(obj).to.deep.eq {foo: "bar"}

  context ".write", ->
    it "promises cypress.json updates", ->
      @setup()

      settings.write(process.cwd(), {foo: "bar"}).then (obj) ->
        expect(obj).to.deep.eq {foo: "bar"}

    it "only writes over conflicting keys", ->
      @setup {projectId: "12345", autoOpen: true}

      settings.write(process.cwd(), projectId: "abc123").then (obj) ->
        expect(obj).to.deep.eq {projectId: "abc123", autoOpen: true}