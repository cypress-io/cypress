require("../spec_helper")

config         = require("#{root}lib/config")
files          = require("#{root}lib/files")
FixturesHelper = require("#{root}/test/support/helpers/fixtures")
filesController = require("#{root}lib/controllers/files")

describe "lib/files", ->
  beforeEach ->
    FixturesHelper.scaffold()

    @todosPath = FixturesHelper.projectPath("todos")

    config.get(@todosPath).then (cfg) =>
      @config = cfg
      {@projectRoot} = cfg

  afterEach ->
    FixturesHelper.remove()

  context "#readFile", ->
    it "returns contents and full file path", ->
      files.readFile(@projectRoot, "tests/_fixtures/message.txt").then ({ contents, filePath }) ->
        expect(contents).to.eq "foobarbaz"
        expect(filePath).to.include "/.projects/todos/tests/_fixtures/message.txt"

    it "returns uses utf8 by default", ->
      files.readFile(@projectRoot, "tests/_fixtures/ascii.foo").then ({ contents }) ->
        expect(contents).to.eq "\n"

    it "uses encoding specified in options", ->
      files.readFile(@projectRoot, "tests/_fixtures/ascii.foo", {encoding: "ascii"}).then ({ contents }) ->
        expect(contents).to.eq "o#?\n"

    it "parses json to valid JS object", ->
      files.readFile(@projectRoot, "tests/_fixtures/users.json").then ({ contents }) ->
        expect(contents).to.eql [
          {
            id: 1
            name: "brian"
          },{
            id: 2
            name: "jennifer"
          }
        ]

  context "#writeFile", ->
    it "writes the file's contents and returns contents and full file path", ->
      files.writeFile(@projectRoot, ".projects/write_file.txt", "foo").then =>
        files.readFile(@projectRoot, ".projects/write_file.txt").then ({ contents, filePath }) ->
          expect(contents).to.equal("foo")
          expect(filePath).to.include("/.projects/todos/.projects/write_file.txt")

    it "uses encoding specified in options", ->
      files.writeFile(@projectRoot, ".projects/write_file.txt", "", {encoding: "ascii"}).then =>
        files.readFile(@projectRoot, ".projects/write_file.txt").then ({ contents }) ->
          expect(contents).to.equal("�")

    it "overwrites existing file without issue", ->
      files.writeFile(@projectRoot, ".projects/write_file.txt", "foo").then =>
        files.readFile(@projectRoot, ".projects/write_file.txt").then ({ contents }) =>
          expect(contents).to.equal("foo")
          files.writeFile(@projectRoot, ".projects/write_file.txt", "bar").then =>
            files.readFile(@projectRoot, ".projects/write_file.txt").then ({ contents }) ->
              expect(contents).to.equal("bar")
