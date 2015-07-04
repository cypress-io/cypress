root         = '../../../'
path         = require 'path'
fs           = require 'fs-extra'
chai         = require 'chai'
Server         = require "#{root}lib/server"
Fixtures       = require "#{root}lib/fixtures"
FixturesHelper = require "#{root}/spec/server/helpers/fixtures"

expect       = chai.expect

describe "Fixtures", ->
  beforeEach ->
    FixturesHelper.scaffold()

    @todos = FixturesHelper.project("todos")

    @server  = Server(@todos)
    @app     = @server.app
    @fixture = Fixtures(@app)

  afterEach ->
    FixturesHelper.remove()

  context "#constructor", ->
    it "sets folder to fixturesFolder", ->
      expect(@fixture.folder).to.eq @todos + "/tests/_fixtures"

  context "file not found", ->
    it "throws when file cannot be found", (done) ->
      @fixture.get("does-not-exist.json")
        .catch (err) =>
          p = @fixture.folder + "/does-not-exist.json"
          expect(err.message).to.eq "No fixture exists at: #{p}"
          done()

  context "invalid extension", ->

  context "nested fixtures", ->
    it "can pass path to nested fixture", ->
      @fixture.get("nested/fixture.js").then (obj) ->
        expect(obj).to.deep.eq {
          nested: "fixture"
        }

  context "json files", ->
    it "throws when json is invalid", (done) ->
      e =
        """
        Parse error on line 2:
        {  "bad": "json""should": "not parse
        ----------------^
        Expecting 'EOF', '}', ':', ',', ']', got 'STRING'
        """

      @fixture.get("bad_json.json")
        .catch (err) ->
          expect(err.message).to.eq "'bad_json.json' is not valid JSON.\n#{e}"
          done()

    it "reformats json and writes back even on parse error", (done) ->
      @fixture.get("bad_json.json")
        .catch (err) =>
          ## ensure the bad_json file was rewritten even though there was a parse error
          fs.readFileAsync(@fixture.folder + "/bad_json.json", "utf8").then (str) ->
            expect(str).to.eq """
              {
                "bad": "json""should": "not parse"
              }
              """
            done()

    it "reformats json and writes this back", ->
      @fixture.get("no_format.json").then (obj) =>
        fs.readFileAsync(@fixture.folder + "/no_format.json", "utf8").then (json) ->
          expect(json).to.eq """
            {
              "id": 1,
              "name": "brian"
            }
          """

    it "does not remove string whitespace", ->
      @fixture.get("words.json").then (obj) =>
        fs.readFileAsync(@fixture.folder + "/words.json", "utf8").then (json) ->
          expect(json).to.eq """
            {
              "some": "multiple space separate words",
              "that": "should keep their spaces"
            }
          """

    it "parses json to valid JS object", ->
      @fixture.get("users.json").then (users) ->
        expect(users).to.deep.eq [
          {
            id: 1
            name: "brian"
          },{
            id: 2
            name: "jennifer"
          }
        ]

  context "js files", ->
    it "returns valid JS object", ->
      @fixture.get("user.js").then (user) ->
        expect(user).to.deep.eq {
          id: 1
          name: "brian"
          age: 29
          posts: []
        }

    it "rewrites file as a formated valid JS object", ->
      @fixture.get("no_format.js").then (obj) =>
        fs.readFileAsync(@fixture.folder + "/no_format.js", "utf8").then (str) ->
          expect(str).to.eq """
            {
              foo: "bar",
              baz: "quux"
            }

          """

    it "throws on a bad JS object", (done) ->
      e =
        """
        bad_js.js:3
          bar: "bar
               ^
        ParseError: Unterminated string constant
        """

      @fixture.get("bad_js.js")
        .catch (err) =>
          expect(err.message).to.eq "'bad_js.js' is not a valid JavaScript object.\n#{e}"
          done()

  context "coffee files", ->
    it "returns valid coffee object", ->
      @fixture.get("account.coffee").then (account) ->
        expect(account).to.deep.eq {
          name: "cypress"
          users: []
        }

    it "rewrites file as formatted valid coffee object", ->
      @fixture.get("no_format.coffee").then =>
        fs.readFileAsync(@fixture.folder + "/no_format.coffee", "utf8").then (str) ->
          expect(str).to.eq """
            [
              {
                id: 1
              },
              {
                id: 2
              }
            ]

          """

    it "throws on bad coffee object", (done) ->
      e =
        """
        [stdin]:3:16: error: missing }
          name: "brian"
                       ^
        """

      @fixture.get("bad_coffee.coffee")
        .catch (err) ->
          expect(err.message).to.eq "'bad_coffee.coffee is not a valid CoffeeScript object.\n#{e}"
          done()

  context "html files", ->
    it "returns html as a string", ->
      @fixture.get("index.html").then (index) ->
        expect(index).to.eq """
          <!doctype html>
          <html>
          <head>
            <title>index.html</title>
          </head>
          <body>
            index
          </body>
          </html>
        """

    it "rewrites file as formatted html", ->
      @fixture.get("index.html").then =>
        fs.readFileAsync(@fixture.folder + "/index.html", "utf8").then (str) ->
          expect(str).to.eq """
          <!doctype html>
          <html>
          <head>
            <title>index.html</title>
          </head>
          <body>
            index
          </body>
          </html>
        """

  context "txt files", ->
    it "returns text as string", ->
      @fixture.get("message.txt").then (index) ->
        expect(index).to.eq "foobarbaz"

  context "extension omitted", ->
    it "#1 finds json", ->
      @fixture.get("foo").then (obj) ->
        expect(obj).to.deep.eq [
          {json: true}
        ]

    it "#2 finds js", ->
      @fixture.get("bar").then (obj) ->
        expect(obj).to.deep.eq {js: true}

    it "throws when no file by any extension can be found", (done) ->
      @fixture.get("does-not-exist")
        .catch (err) =>
          p = @fixture.folder + "/does-not-exist"
          expect(err.message).to.eq "No fixture file found with an acceptable extension. Searched in: #{p}"
          done()

  context "#scaffold", ->
    it "creates both fixturesFolder and example.json when fixturesFolder does not exist", ->
      ## todos has a fixtures folder so let's first nuke it and then scaffold
      fs.removeAsync(@fixture.folder).then =>
        @fixture.scaffold().then =>
          fs.readFileAsync(@fixture.folder + "/example.json", "utf8").then (str) ->
            expect(str).to.eq """
            {
              "example": "fixture"
            }
            """

    it "does not create example.json if fixturesFolder already exists", (done) ->
      ## create the fixturesFolder ourselves manually
      fs.ensureDirAsync(@fixture.folder).then =>
        ## now scaffold
        @fixture.scaffold().then =>
          ## ensure example.json doesnt exist
          fs.statAsync(path.join(@fixture.folder, "example.json"))
            .catch -> done()