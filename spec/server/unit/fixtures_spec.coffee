require("../spec_helper")

path           = require 'path'
Server         = require "#{root}lib/server"
Fixtures       = require "#{root}lib/fixtures"
FixturesHelper = require "#{root}/spec/server/helpers/fixtures"

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
    it "throws", (done) ->
      @fixture.get("foo.exe")
        .catch (err) ->
          expect(err.message).to.eq "Invalid fixture extension: '.exe'. Acceptable file extensions are: .json, .js, .coffee, .html, .txt, .png, .jpg, .jpeg, .gif, .tif, .tiff, .zip"
          done()

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

    it "reformats empty objects", ->
      fn = =>
        @fixture.get("empty_objects")

      Promise.map(Array(500), fn, {concurrency: 5}).then =>
        fs.readFileAsync(@fixture.folder + "/empty_objects.json", "utf8").then (str) ->
          expect(str).to.eq """
            {
              "empty": {
                "object": {\n      \n    },
                "array": [\n      \n    ],
                "object2": {\n      \n    },
                "array2": [\n      \n    ]
              }
            }
          """

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

  context "image files", ->
    it "returns png as string", ->
      @fixture.get("images/flower.png").then (base64) ->
        str = "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"
        expect(base64).to.eq(str)

    it "returns jpg as string", ->
      @fixture.get("images/sample.jpg").then (base64) ->
        str = "/9j/4AAQSkZJRgABAQEASABIAAD/4QCMRXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAAEsAAAAAQAAASwAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAABmgAwAEAAAAAQAAABEAAAAA/+EJyWh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHBob3Rvc2hvcDpUcmFuc21pc3Npb25SZWZlcmVuY2U9IjUzNjE2Yzc0NjU2NDVmNWY2MDViNWNjY2MxYTNmZmIwNmJkMzIwZDVhZDljY2FhMjVhNjhjNjEzZjA0ZDdhZDBkY2FlZDZlMWMwNDljMTA5Ii8+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPD94cGFja2V0IGVuZD0idyI/PgD/7QCcUGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAGQc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"
        expect(base64).to.eq(str)

    it "returns gif as string", ->
      @fixture.get("images/word").then (base64) ->
        str = "R0lGODlhGAAYAKIAAISEhMbGxv///wAAAAAA/wAAAAAAAAAAACwAAAAAGAAYAAADTyi63P4wyklrHATrzDfs4KZBGFU+GZU+Ygh+HieEJAGkY07AQilngNmgJnQFejvUsDUSEn+aIJKnwxydrB10NVWqhlmmC+ZiWs7otHotSAAAOw=="
        expect(base64).to.eq(str)

    it "returns tif as string", ->
      @fixture.get("images/sample.tif").then (base64) ->
        str = "TU0AKgAADOz+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/fz9/v3+/v3+/v39/P7+/v7+/P3+/v39/v3+/f3+/f7+/vz9/vz8/v7+/v7+/v7+/v3+/v79/v7+/v3+/v7+/v7+/f7+/v79/v7+/v3+/v3+/vz+/v7+/v7+/v7+/v7+/v79/+3J6P/t+f3p//fu8NL49/T/8tTY9//v3fXs//Ts/+z5/+/L4/rX1fH//v7+/v7+/f7it8/T9lru2m/+iru3u6K24/6ux87y/sSqx4H+eNHxWPfdr9TDv7vP6/79/v7+/v78/76M+P+8qubAmMCdzK3gpqr/8ny/6v//tuq5nMCV8L6t4Kf18f+Is+H//f7+/v7+/v7+/teKuY+XzsK/vcG9m9fSzP7Jy/bx/vyx5768v8W2j6Cyx/6HucP37v7+/v7+/v79/uKz0KSw/LKn1f7Wv7X7/qmj3pyy1v7+ua7O1P7SpL77p8eSz7ito9L5/v7+/v7+/v7++dXf9vn+9+77/vT29P797dzm7Nzi/v7k6/T7/vXt/P7z/ufT9/Ld3vr+/v7+/v7+/v7+/v7+/v3+/v79/v7+/v7+/v7+/v7+/v7+/v7+/v7+/f7+/v7+/v7+/v7+/v7+/v7+/v79/f7+/v7+/v7+/v7+/v79/f39/f7+/f3+/v7+/v7+/v79/f7+/f3+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v79/fb1+fL4/v3+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v/o5//82Ov////+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+58jY3fLo7uPS+//+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/f6pzqzOy8+w2KXj/v3+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v78/rDhsuC516mz4/f+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+x9rL18rQ0czR+P7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v38+/75/P38/vv8/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/////v/////+///+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+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AGwA4QBuAG8AcwAgAHMAegD8AHIAawBlACAAcAByAG8AZgBpAGyQGnUocHCWjoJyX2ljz4/wAEcAZQBuAGUAcgBpAHMAawAgAGcAcgDlAHQAbwBuAGUAcAByAG8AZgBpAGwATwBiAGUAYwBuAP0AIAFhAGUAZAD9ACAAcAByAG8AZgBpAGwF5AXoBdUF5AXZBdwAIABHAHIAYQB5ACAF2wXcBdwF2QBQAHIAbwBmAGkAbABvACAAZwByAGkAZwBpAG8AIABnAGUAbgBlAHIAaQBjAG8AUAByAG8AZgBpAGwAIABnAHIAaQAgAGcAZQBuAGUAcgBpAGMAQQBsAGwAZwBlAG0AZQBpAG4AZQBzACAARwByAGEAdQBzAHQAdQBmAGUAbgAtAFAAcgBvAGYAaQBsx3y8GAAgAEcAcgBhAHkAINUEuFzTDMd8AEcAZQBuAGUAcgBpAHMAawAgAGcAcgDlAHMAawBhAGwAZQBwAHIAbwBmAGkAbGZukBpwcF6mY8+P8GWHTvZOAIIsMLAw7DCkMNcw7TDVMKEwpDDrA5MDtQO9A7kDugPMACADwAPBA78DxgOvA7sAIAOzA7oDwQO5AFAAZQByAGYAaQBsACAAZwBlAG4A6QByAGkAYwBvACAAZABlACAAYwBpAG4AegBlAG4AdABvAHMAQQBsAGcAZQBtAGUAZQBuACAAZwByAGkAagBzAHAAcgBvAGYAaQBlAGwAUABlAHIAZgBpAGwAIABnAHIAaQBzACAAZwBlAG4A6QByAGkAYwBvDkIOGw4jDkQOHw4lDkwOKg41DkAOFw4yDhcOMQ5IDicORA4bAEcAZQBuAGUAbAAgAEcAcgBpACAAUAByAG8AZgBpAGwAaQBZAGwAZQBpAG4AZQBuACAAaABhAHIAbQBhAGEAcAByAG8AZgBpAGkAbABpAEcAZQBuAGUAcgBpAQ0AawBpACAAcAByAG8AZgBpAGwAIABzAGkAdgBpAGgAIAB0AG8AbgBvAHYAYQBVAG4AaQB3AGUAcgBzAGEAbABuAHkAIABwAHIAbwBmAGkAbAAgAHMAegBhAHIAbwFbAGMAaQQeBDEESQQ4BDkAIARBBDUEQARLBDkAIAQ/BEAEPgREBDgEOwRMBkUGRAZBACAGKgY5BjEGSgZBACAARwByAGEAeQAgBicGRAY5BicGRQBHAGUAbgBlAHIAaQBjACAARwByAGEAeQAgAFAAcgBvAGYAaQBsAGUAAHRleHQAAAAAQ29weXJpZ2h0IDIwMDcgQXBwbGUgSW5jLiwgYWxsIHJpZ2h0cyByZXNlcnZlZC4AWFlaIAAAAAAAAPNRAAEAAAABFsxjdXJ2AAAAAAAAAAEBzQAA"
        expect(base64).to.eq(str)

  context "zip files", ->
    it "returns zip as base64 string", ->
      @fixture.get("example.zip").then (base64) ->
        str = "UEsDBAoAAAAAAK2zOUcAAAAAAAAAAAAAAAAEABAAemlwL1VYDAAGAwZWBgMGVvUBFABQSwMECgAAAAAAo7M5RwAAAAAAAAAAAAAAAAkAEAB6aXAvYS50eHRVWAwA8QIGVvECBlb1ARQAUEsDBAoAAAAAAKSzOUcAAAAAAAAAAAAAAAAJABAAemlwL2IudHh0VVgMAPMCBlbzAgZW9QEUAFBLAwQKAAAAAAClszlHAAAAAAAAAAAAAAAACQAQAHppcC9jLnR4dFVYDAD1AgZW9QIGVvUBFABQSwMECgAAAAAApbM5RwAAAAAAAAAAAAAAAAkAEAB6aXAvZC50eHRVWAwA9gIGVvYCBlb1ARQAUEsDBAoAAAAAAKazOUcAAAAAAAAAAAAAAAAJABAAemlwL2UudHh0VVgMAPgCBlb4AgZW9QEUAFBLAwQKAAAAAACnszlHAAAAAAAAAAAAAAAACQAQAHppcC9mLnR4dFVYDAD5AgZW+QIGVvUBFABQSwMECgAAAAAAqLM5RwAAAAAAAAAAAAAAAAkAEAB6aXAvZy50eHRVWAwA+wIGVvsCBlb1ARQAUEsDBAoAAAAAAKizOUcAAAAAAAAAAAAAAAAJABAAemlwL2gudHh0VVgMAPwCBlb8AgZW9QEUAFBLAwQKAAAAAACpszlHAAAAAAAAAAAAAAAACQAQAHppcC9pLnR4dFVYDAD9AgZW/QIGVvUBFABQSwMECgAAAAAAqrM5RwAAAAAAAAAAAAAAAAkAEAB6aXAvai50eHRVWAwA/wIGVv8CBlb1ARQAUEsDBAoAAAAAAK2zOUcAAAAAAAAAAAAAAAAJABAAemlwL2sudHh0VVgMAAYDBlYGAwZW9QEUAFBLAQIVAwoAAAAAAK2zOUcAAAAAAAAAAAAAAAAEAAwAAAAAAAAAAEDtQQAAAAB6aXAvVVgIAAYDBlYGAwZWUEsBAhUDCgAAAAAAo7M5RwAAAAAAAAAAAAAAAAkADAAAAAAAAAAAQKSBMgAAAHppcC9hLnR4dFVYCADxAgZW8QIGVlBLAQIVAwoAAAAAAKSzOUcAAAAAAAAAAAAAAAAJAAwAAAAAAAAAAECkgWkAAAB6aXAvYi50eHRVWAgA8wIGVvMCBlZQSwECFQMKAAAAAAClszlHAAAAAAAAAAAAAAAACQAMAAAAAAAAAABApIGgAAAAemlwL2MudHh0VVgIAPUCBlb1AgZWUEsBAhUDCgAAAAAApbM5RwAAAAAAAAAAAAAAAAkADAAAAAAAAAAAQKSB1wAAAHppcC9kLnR4dFVYCAD2AgZW9gIGVlBLAQIVAwoAAAAAAKazOUcAAAAAAAAAAAAAAAAJAAwAAAAAAAAAAECkgQ4BAAB6aXAvZS50eHRVWAgA+AIGVvgCBlZQSwECFQMKAAAAAACnszlHAAAAAAAAAAAAAAAACQAMAAAAAAAAAABApIFFAQAAemlwL2YudHh0VVgIAPkCBlb5AgZWUEsBAhUDCgAAAAAAqLM5RwAAAAAAAAAAAAAAAAkADAAAAAAAAAAAQKSBfAEAAHppcC9nLnR4dFVYCAD7AgZW+wIGVlBLAQIVAwoAAAAAAKizOUcAAAAAAAAAAAAAAAAJAAwAAAAAAAAAAECkgbMBAAB6aXAvaC50eHRVWAgA/AIGVvwCBlZQSwECFQMKAAAAAACpszlHAAAAAAAAAAAAAAAACQAMAAAAAAAAAABApIHqAQAAemlwL2kudHh0VVgIAP0CBlb9AgZWUEsBAhUDCgAAAAAAqrM5RwAAAAAAAAAAAAAAAAkADAAAAAAAAAAAQKSBIQIAAHppcC9qLnR4dFVYCAD/AgZW/wIGVlBLAQIVAwoAAAAAAK2zOUcAAAAAAAAAAAAAAAAJAAwAAAAAAAAAAECkgVgCAAB6aXAvay50eHRVWAgABgMGVgYDBlZQSwUGAAAAAAwADAAfAwAAjwIAAAAA"
        expect(base64).to.eq(str)

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

  context "new lines", ->
    it "does not remove trailing new lines on .txt", ->
      @fixture.get("trailing_new_line.txt").then (str) =>
        fs.readFileAsync(@fixture.folder + "/trailing_new_line.txt", "utf8").then (str2) ->
          expect(str2).to.eq "foo\nbar\nbaz\n"

    it "does not remove trailing new lines on .json", ->
      @fixture.get("trailing_new_line.json").then (str) =>
        fs.readFileAsync(@fixture.folder + "/trailing_new_line.json", "utf8").then (str2) ->
          expect(str2).to.eq """
            {
              "foo": "bar"
            }\n
          """

    it "does not remove trailing new lines on .js", ->
      @fixture.get("trailing_new_line.js").then (str) =>
        fs.readFileAsync(@fixture.folder + "/trailing_new_line.js", "utf8").then (str2) ->
          expect(str2).to.eq """
            {
              foo: "bar"
            }\n
          """

    it "does not remove trailing new lines on .coffee", ->
      @fixture.get("trailing_new_line.coffee").then (str) =>
        fs.readFileAsync(@fixture.folder + "/trailing_new_line.coffee", "utf8").then (str2) ->
          expect(str2).to.eq """
            {
              foo: "bar"
            }\n
          """

    it "does not remove trailing new lines on .html", ->
      @fixture.get("trailing_new_line.html").then (str) =>
        fs.readFileAsync(@fixture.folder + "/trailing_new_line.html", "utf8").then (str2) ->
          expect(str2).to.eq """
            <html>
            <body>foo</body>
            </html>\n
          """

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