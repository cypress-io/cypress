require("../spec_helper")

path           = require("path")
Promise        = require("bluebird")
config         = require("#{root}lib/config")
fixture        = require("#{root}lib/fixture")
fs             = require("#{root}lib/util/fs")
FixturesHelper = require("#{root}/test/support/helpers/fixtures")
os             = require("os")
eol            = require("eol")

isWindows = () ->
  os.platform() == "win32"

describe "lib/fixture", ->
  beforeEach ->
    FixturesHelper.scaffold()

    @todosPath = FixturesHelper.projectPath("todos")

    config.get(@todosPath).then (cfg) =>
      {@fixturesFolder} = cfg

  afterEach ->
    FixturesHelper.remove()

  context "file not found", ->
    it "throws when file cannot be found", ->
      p = "does-not-exist.json"

      fixture.get(@fixturesFolder, p)
      .then ->
        throw new Error("should have failed but did not")
      .catch (err) =>
        expect(err.message).to.include "No fixture exists at:"
        expect(err.message).to.include p

  context "unicode escape syntax", ->
    it "can parse unicode escape in JSON", ->
      fixture.get(@fixturesFolder, "unicode_escape.json").then (obj) ->
        expect(obj).to.deep.eq {
          name: "\u2665"
        }

  context "nested fixtures", ->
    it "can pass path to nested fixture", ->
      fixture.get(@fixturesFolder, "nested/fixture.js").then (obj) ->
        expect(obj).to.deep.eq {
          nested: "fixture"
        }

  context "json files", ->
    it "throws when json is invalid", ->
      e =
        """
        'bad_json.json' is not valid JSON.
        Parse error on line 2:
        {  "bad": "json"  "should": "not parse
        ------------------^
        Expecting 'EOF', '}', ':', ',', ']', got 'STRING'
        """

      fixture.get(@fixturesFolder, "bad_json.json")
      .then ->
        throw new Error("should have failed but did not")
      .catch (err) ->
        if isWindows()
          # there is weird trailing whitespace in the lines
          # of the error message on Windows
          expect(err.message).to.include "'bad_json.json' is not valid JSON."
          expect(err.message).to.include "Parse error on line 2:"
          expect(err.message).to.include "Expecting 'EOF', '}', ':', ',', ']', got 'STRING'"
        else
          # on other platforms can match the error directly
          expect(eol.auto(err.message)).to.eq eol.auto(e)

    it "does not reformat json on parse error", ->
      fixture.get(@fixturesFolder, "bad_json.json")
      .then ->
        throw new Error("should have failed but did not")
      .catch (err) =>
        ## ensure the bad_json file was kept as before
        fs.readFileAsync(@fixturesFolder + "/bad_json.json", "utf8").then (str) ->
          expect(str).to.eq """
            {
              "bad": "json"
              "should": "not parse"
            }
            """

    it "does not reformat json or write fixture file", ->
      fixture.get(@fixturesFolder, "no_format.json").then (obj) =>
        fs.readFileAsync(@fixturesFolder + "/no_format.json", "utf8").then (json) ->
          expect(json).to.eq '{"id": 1, "name": "brian"}'

    it "does not remove string whitespace", ->
      fixture.get(@fixturesFolder, "words.json").then (obj) =>
        fs.readFileAsync(@fixturesFolder + "/words.json", "utf8").then (json) ->
          expect(json).to.eq """
            {
              "some": "multiple space separate words",
              "that": "should keep their spaces"
            }
          """

    it "parses json to valid JS object", ->
      fixture.get(@fixturesFolder, "users.json").then (users) ->
        expect(users).to.deep.eq [
          {
            id: 1
            name: "brian"
          },{
            id: 2
            name: "jennifer"
          }
        ]

    it "does not reformat empty objects", ->
      fn = =>
        fixture.get(@fixturesFolder, "empty_objects")

      Promise.map(Array(500), fn, {concurrency: 5}).then =>
        fs.readFileAsync(@fixturesFolder + "/empty_objects.json", "utf8").then (str) ->
          expect(str).to.eq """
            {
              "empty": {
                "object": {},
                "array": [],
                "object2": {\n\n    },
                "array2": [\n\n    ]
              }
            }
          """

  context "js files", ->
    it "returns valid JS object", ->
      fixture.get(@fixturesFolder, "user.js").then (user) ->
        expect(user).to.deep.eq {
          id: 1
          name: "brian"
          age: 29
          posts: []
        }

    it "does not rewrite file as a formated valid JS object", ->
      fixture.get(@fixturesFolder, "no_format.js").then (obj) =>
        fs.readFileAsync(@fixturesFolder + "/no_format.js", "utf8").then (str) ->
          expect(str).to.eq '{foo: "bar", baz: "quux"}'

    it "throws on a bad JS object", ->
      e =
        """
        bad_js.js:3
          bar: "bar
               ^
        ParseError: Unterminated string constant
        """

      fixture.get(@fixturesFolder, "bad_js.js")
      .then ->
        throw new Error("should have failed but did not")
      .catch (err) =>
        expect(err.message).to.eq "'bad_js.js' is not a valid JavaScript object.\n#{e}"

  context "coffee files", ->
    it "returns valid coffee object", ->
      fixture.get(@fixturesFolder, "account.coffee").then (account) ->
        expect(account).to.deep.eq {
          name: "cypress"
          users: []
        }

    it "does not rewrite coffee files", ->
      fixture.get(@fixturesFolder, "no_format.coffee").then =>
        fs.readFileAsync(@fixturesFolder + "/no_format.coffee", "utf8").then (str) ->
          expect(str).to.eq """
            [
              {id: 1}
              {id: 2}
            ]
          """

    it "throws on bad coffee object", ->
      fixture.get(@fixturesFolder, "bad_coffee.coffee")
      .then ->
        throw new Error("should have failed but did not")
      .catch (err) ->
        expect(err.message).to.eq """
        'bad_coffee.coffee is not a valid CoffeeScript object.
        [stdin]:1:1: error: missing }
        {
        ^
        """

  context "html files", ->
    it "returns html as a string", ->
      fixture.get(@fixturesFolder, "index.html").then (index) ->
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

    it "does not rewrite file as formatted html", ->
      fixture.get(@fixturesFolder, "index.html").then =>
        fs.readFileAsync(@fixturesFolder + "/index.html", "utf8").then (str) ->
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
      fixture.get(@fixturesFolder, "message.txt").then (index) ->
        expect(index).to.eq "foobarbaz"

  context "csv files", ->
    it "returns text as string", ->
      fixture.get(@fixturesFolder, "data.csv").then (index) ->
        expect(index).to.eq """
        Name,Occupation,Birth Year
        Jane,Engineer,1976
        John,Chef,1982

        """

  context "file with unknown extension", ->
    it "returns text as string", ->
      fixture.get(@fixturesFolder, "unknown_ext.yaml").then (index) ->
        expect(index).to.eq """
        - foo
        - bar
        - 

        """

  context "file with unknown extension and encoding specified", ->
    it "returns text encoded as specified", ->
      fixture.get(@fixturesFolder, "ascii.foo", {encoding: "ascii"}).then (index) ->
        expect(index).to.eq "o#?\n"

  context "image files", ->
    beforeEach ->
      @read = (folder, image, encoding) =>
        fs.readFileAsync(path.join(folder, image), encoding)

    it "returns png as string", ->
      @read(@fixturesFolder, "images/flower.png", "base64")
      .then (str) =>
        fixture.get(@fixturesFolder, "images/flower.png")
        .then (base64) ->
          expect(base64).to.eq(str)

    it "returns jpg as string", ->
      @read(@fixturesFolder, "images/sample.jpg", "base64")
      .then (str) =>
        fixture.get(@fixturesFolder, "images/sample.jpg")
        .then (base64) ->
          expect(base64).to.eq(str)

    it "returns gif as string", ->
      @read(@fixturesFolder, "images/word.gif", "base64")
      .then (str) =>
        fixture.get(@fixturesFolder, "images/word.gif")
        .then (base64) ->
          expect(base64).to.eq(str)

    it "returns tif as string", ->
      @read(@fixturesFolder, "images/sample.tif", "base64")
      .then (str) =>
        fixture.get(@fixturesFolder, "images/sample.tif")
        .then (base64) ->
          expect(base64).to.eq(str)

    it "returns png as binary", ->
      @read(@fixturesFolder, "images/flower.png", "binary")
      .then (bin) =>
        fixture.get(@fixturesFolder, "images/flower.png", {encoding: "binary"})
        .then (bin2) ->
          expect(bin).to.eq(bin2)

  context "zip files", ->
    it "returns zip as base64 string", ->
      fixture.get(@fixturesFolder, "example.zip").then (base64) ->
        str = "UEsDBAoAAAAAAK2zOUcAAAAAAAAAAAAAAAAEABAAemlwL1VYDAAGAwZWBgMGVvUBFABQSwMECgAAAAAAo7M5RwAAAAAAAAAAAAAAAAkAEAB6aXAvYS50eHRVWAwA8QIGVvECBlb1ARQAUEsDBAoAAAAAAKSzOUcAAAAAAAAAAAAAAAAJABAAemlwL2IudHh0VVgMAPMCBlbzAgZW9QEUAFBLAwQKAAAAAAClszlHAAAAAAAAAAAAAAAACQAQAHppcC9jLnR4dFVYDAD1AgZW9QIGVvUBFABQSwMECgAAAAAApbM5RwAAAAAAAAAAAAAAAAkAEAB6aXAvZC50eHRVWAwA9gIGVvYCBlb1ARQAUEsDBAoAAAAAAKazOUcAAAAAAAAAAAAAAAAJABAAemlwL2UudHh0VVgMAPgCBlb4AgZW9QEUAFBLAwQKAAAAAACnszlHAAAAAAAAAAAAAAAACQAQAHppcC9mLnR4dFVYDAD5AgZW+QIGVvUBFABQSwMECgAAAAAAqLM5RwAAAAAAAAAAAAAAAAkAEAB6aXAvZy50eHRVWAwA+wIGVvsCBlb1ARQAUEsDBAoAAAAAAKizOUcAAAAAAAAAAAAAAAAJABAAemlwL2gudHh0VVgMAPwCBlb8AgZW9QEUAFBLAwQKAAAAAACpszlHAAAAAAAAAAAAAAAACQAQAHppcC9pLnR4dFVYDAD9AgZW/QIGVvUBFABQSwMECgAAAAAAqrM5RwAAAAAAAAAAAAAAAAkAEAB6aXAvai50eHRVWAwA/wIGVv8CBlb1ARQAUEsDBAoAAAAAAK2zOUcAAAAAAAAAAAAAAAAJABAAemlwL2sudHh0VVgMAAYDBlYGAwZW9QEUAFBLAQIVAwoAAAAAAK2zOUcAAAAAAAAAAAAAAAAEAAwAAAAAAAAAAEDtQQAAAAB6aXAvVVgIAAYDBlYGAwZWUEsBAhUDCgAAAAAAo7M5RwAAAAAAAAAAAAAAAAkADAAAAAAAAAAAQKSBMgAAAHppcC9hLnR4dFVYCADxAgZW8QIGVlBLAQIVAwoAAAAAAKSzOUcAAAAAAAAAAAAAAAAJAAwAAAAAAAAAAECkgWkAAAB6aXAvYi50eHRVWAgA8wIGVvMCBlZQSwECFQMKAAAAAAClszlHAAAAAAAAAAAAAAAACQAMAAAAAAAAAABApIGgAAAAemlwL2MudHh0VVgIAPUCBlb1AgZWUEsBAhUDCgAAAAAApbM5RwAAAAAAAAAAAAAAAAkADAAAAAAAAAAAQKSB1wAAAHppcC9kLnR4dFVYCAD2AgZW9gIGVlBLAQIVAwoAAAAAAKazOUcAAAAAAAAAAAAAAAAJAAwAAAAAAAAAAECkgQ4BAAB6aXAvZS50eHRVWAgA+AIGVvgCBlZQSwECFQMKAAAAAACnszlHAAAAAAAAAAAAAAAACQAMAAAAAAAAAABApIFFAQAAemlwL2YudHh0VVgIAPkCBlb5AgZWUEsBAhUDCgAAAAAAqLM5RwAAAAAAAAAAAAAAAAkADAAAAAAAAAAAQKSBfAEAAHppcC9nLnR4dFVYCAD7AgZW+wIGVlBLAQIVAwoAAAAAAKizOUcAAAAAAAAAAAAAAAAJAAwAAAAAAAAAAECkgbMBAAB6aXAvaC50eHRVWAgA/AIGVvwCBlZQSwECFQMKAAAAAACpszlHAAAAAAAAAAAAAAAACQAMAAAAAAAAAABApIHqAQAAemlwL2kudHh0VVgIAP0CBlb9AgZWUEsBAhUDCgAAAAAAqrM5RwAAAAAAAAAAAAAAAAkADAAAAAAAAAAAQKSBIQIAAHppcC9qLnR4dFVYCAD/AgZW/wIGVlBLAQIVAwoAAAAAAK2zOUcAAAAAAAAAAAAAAAAJAAwAAAAAAAAAAECkgVgCAAB6aXAvay50eHRVWAgABgMGVgYDBlZQSwUGAAAAAAwADAAfAwAAjwIAAAAA"
        expect(base64).to.eq(str)

  context "extension omitted", ->
    it "#1 finds json", ->
      fixture.get(@fixturesFolder, "foo").then (obj) ->
        expect(obj).to.deep.eq [
          {json: true}
        ]

    it "#2 finds js", ->
      fixture.get(@fixturesFolder, "bar").then (obj) ->
        expect(obj).to.deep.eq {js: true}

    it "throws when no file by any extension can be found", ->
      fixture.get(@fixturesFolder, "does-not-exist")
      .then ->
        throw new Error("should have failed but did not")
      .catch (err) =>
        p = @fixturesFolder + "/does-not-exist"
        expect(err.message).to.eq "No fixture file found with an acceptable extension. Searched in: #{p}"

  context "new lines", ->
    it "does not remove trailing new lines on .txt", ->
      fixture.get(@fixturesFolder, "trailing_new_line.txt").then (str) =>
        fs.readFileAsync(@fixturesFolder + "/trailing_new_line.txt", "utf8").then (str2) ->
          expect(str2).to.eq "foo\nbar\nbaz\n"

    it "does not remove trailing new lines on .json", ->
      fixture.get(@fixturesFolder, "trailing_new_line.json").then (str) =>
        fs.readFileAsync(@fixturesFolder + "/trailing_new_line.json", "utf8").then (str2) ->
          expect(str2).to.eq '{"foo": "bar"}\n'

    it "does not remove trailing new lines on .js", ->
      fixture.get(@fixturesFolder, "trailing_new_line.js").then (str) =>
        fs.readFileAsync(@fixturesFolder + "/trailing_new_line.js", "utf8").then (str2) ->
          expect(str2).to.eq '{foo: "bar"}\n'

    it "does not remove trailing new lines on .coffee", ->
      fixture.get(@fixturesFolder, "trailing_new_line.coffee").then (str) =>
        fs.readFileAsync(@fixturesFolder + "/trailing_new_line.coffee", "utf8").then (str2) ->
          expect(str2).to.eq '{ foo: "bar" }\n'

    it "does not remove trailing new lines on .html", ->
      fixture.get(@fixturesFolder, "trailing_new_line.html").then (str) =>
        fs.readFileAsync(@fixturesFolder + "/trailing_new_line.html", "utf8").then (str2) ->
          expect(str2).to.eq '<html><body>foo</body></html>\n'
