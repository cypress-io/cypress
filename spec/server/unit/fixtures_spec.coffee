root         = '../../../'
path         = require 'path'
fs           = require 'fs'
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

  context "#get", ->
    it "returns users.json", ->
      @fixture.get("users.json").then (str) ->
        expect(str).to.deep.eq
        [
          {
            id: 1
            name: "brian"
          },{
            id: 2
            name: "jennifer"
          }

        ]

    it "returns user.js", ->
      @fixture.get("user.js").then (str) ->
        expect(str).to.deep.eq {
         id: 1,
         name: "brian",
         age: 29,
         posts: []
       }

  context "order of parsing", ->

  context "file not found", ->
    it "throws when file cannot be found", (done) ->
      @fixture.get("does-not-exist.json")
        .catch (err) =>
          p = @fixture.folder + "/does-not-exist.json"
          expect(err.message).to.eq "No file exists at: #{p}"
          done()

  context "invalid extension", ->

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
          expect(err.message).to.eq "'bad_js.js' is not a valid JavaScript object literal.\n#{e}"
          done()