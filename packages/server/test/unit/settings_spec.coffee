require("../spec_helper")

path = require("path")
R = require("ramda")
fs = require("#{root}lib/util/fs")
settings = require("#{root}lib/util/settings")

projectRoot = process.cwd()

describe "lib/settings", ->
  context "with no configFile option", ->
    beforeEach ->
      @setup = (obj = {}) ->
        fs.writeJsonAsync("cypress.json", obj)

    afterEach ->
      fs.removeAsync("cypress.json")

    context "nested cypress object", ->
      it "flattens object on read", ->
        @setup({cypress: {foo: "bar"}})
        .then ->
          settings.read(projectRoot)
        .then (obj) ->
          expect(obj).to.deep.eq {foo: "bar"}

          fs.readJsonAsync("cypress.json")
        .then (obj) ->
          expect(obj).to.deep.eq({foo: "bar"})

    context ".readEnv", ->
      afterEach ->
        fs.removeAsync("cypress.env.json")

      it "parses json", ->
        json = {foo: "bar", baz: "quux"}
        fs.writeJsonSync("cypress.env.json", json)

        settings.readEnv(projectRoot)
        .then (obj) ->
          expect(obj).to.deep.eq(json)

      it "throws when invalid json", ->
        fs.writeFileSync("cypress.env.json", "{'foo;: 'bar}")

        settings.readEnv(projectRoot)
        .catch (err) ->
          expect(err.type).to.eq("ERROR_READING_FILE")
          expect(err.message).to.include("SyntaxError")
          expect(err.message).to.include(projectRoot)

      noArguments = R.nAry(0)

      it "does not write initial file", ->
        settings.readEnv(projectRoot)
        .then (obj) ->
          expect(obj).to.deep.eq({})
        .then () ->
          fs.pathExists("cypress.env.json")
        .then (found) ->
          expect(found).to.be.false

    context ".id", ->
      beforeEach ->
        @projectRoot = path.join(projectRoot, "_test-output/path/to/project/")
        fs.ensureDirAsync(@projectRoot)

      afterEach ->
        fs.removeAsync("#{@projectRoot}cypress.json")

      it "returns project id for project", ->
        fs.writeJsonAsync("#{@projectRoot}cypress.json", {
          projectId: "id-123"
        })
        .then =>
          settings.id(@projectRoot)
        .then (id) ->
          expect(id).to.equal("id-123")

    context ".read", ->
      it "promises cypress.json", ->
        @setup({foo: "bar"})
        .then ->
          settings.read(projectRoot)
        .then (obj) ->
          expect(obj).to.deep.eq {foo: "bar"}

      it "renames commandTimeout -> defaultCommandTimeout", ->
        @setup({commandTimeout: 30000, foo: "bar"})
        .then ->
          settings.read(projectRoot)
        .then (obj) ->
          expect(obj).to.deep.eq {defaultCommandTimeout: 30000, foo: "bar"}

      it "renames supportFolder -> supportFile", ->
        @setup({supportFolder: "foo", foo: "bar"})
        .then ->
          settings.read(projectRoot)
        .then (obj) ->
          expect(obj).to.deep.eq {supportFile: "foo", foo: "bar"}

      it "renames visitTimeout -> pageLoadTimeout", ->
        @setup({visitTimeout: 30000, foo: "bar"})
        .then ->
          settings.read(projectRoot)
        .then (obj) ->
          expect(obj).to.deep.eq {pageLoadTimeout: 30000, foo: "bar"}

      it "renames visitTimeout -> pageLoadTimeout on nested cypress obj", ->
        @setup({cypress: {visitTimeout: 30000, foo: "bar"}})
        .then ->
          settings.read(projectRoot)
        .then (obj) ->
          expect(obj).to.deep.eq {pageLoadTimeout: 30000, foo: "bar"}

    context ".write", ->
      it "promises cypress.json updates", ->
        @setup().then ->
          settings.write(projectRoot, {foo: "bar"})
        .then (obj) ->
          expect(obj).to.deep.eq {foo: "bar"}

      it "only writes over conflicting keys", ->
        @setup({projectId: "12345", autoOpen: true})
        .then ->
          settings.write(projectRoot, {projectId: "abc123"})
        .then (obj) ->
          expect(obj).to.deep.eq {projectId: "abc123", autoOpen: true}

  context "with configFile: false", ->
    beforeEach ->
      @projectRoot = path.join(projectRoot, "_test-output/path/to/project/")
      @options = {
        configFile: false
      }
    
    it ".exists passes", ->
      settings.exists(@projectRoot, @options)
      .then (exists) ->
        expect(exists).to.equal(undefined)

    it ".write does not create a file", ->
      settings.write(@projectRoot, {}, @options)
      .then () =>
        fs.exists(path.join(@projectRoot, "cypress.json"))
        .then (exists) ->
          expect(exists).to.equal(false)

    it ".read returns empty object", ->
      settings.read(@projectRoot, @options)
      .then (settings) ->
        expect(settings).to.deep.equal({})

  context "with a configFile set", ->
    beforeEach ->
      @projectRoot = path.join(projectRoot, "_test-output/path/to/project/")
      @options = {
        configFile: "my-test-config-file.json"
      }

    afterEach ->
      fs.removeAsync("#{@projectRoot}#{@options.configFile}")
    
    it ".exists fails when configFile doesn't exist", ->
      settings.exists(@projectRoot, @options)
      .catch (error) ->
        expect(error.type).to.equal('PROJECT_DOES_NOT_EXIST')

    it ".write creates configFile" , ->
      settings.write(@projectRoot, { foo: "bar" }, @options)
      .then () =>
        fs.readJsonAsync(path.join(@projectRoot, @options.configFile))
        .then (json) ->
          expect(json).to.deep.equal({ foo: "bar" })

    it ".read returns from configFile", ->
      fs.writeJsonAsync(path.join(@projectRoot, @options.configFile), { foo: "bar" })
      .then () =>
        settings.read(@projectRoot, @options)
        .then (settings) ->
          expect(settings).to.deep.equal({ foo: "bar" })
