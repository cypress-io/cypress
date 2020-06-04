/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const config         = require(`${root}lib/config`);
const files          = require(`${root}lib/files`);
const FixturesHelper = require(`${root}/test/support/helpers/fixtures`);
const filesController = require(`${root}lib/controllers/files`);

describe("lib/files", function() {
  beforeEach(function() {
    FixturesHelper.scaffold();

    this.todosPath = FixturesHelper.projectPath("todos");

    return config.get(this.todosPath).then(cfg => {
      this.config = cfg;
      return ({projectRoot: this.projectRoot} = cfg);
    });
  });

  afterEach(() => FixturesHelper.remove());

  context("#readFile", function() {
    it("returns contents and full file path", function() {
      return files.readFile(this.projectRoot, "tests/_fixtures/message.txt").then(function({ contents, filePath }) {
        expect(contents).to.eq("foobarbaz");
        return expect(filePath).to.include("/.projects/todos/tests/_fixtures/message.txt");
      });
    });

    it("returns uses utf8 by default", function() {
      return files.readFile(this.projectRoot, "tests/_fixtures/ascii.foo").then(({ contents }) => expect(contents).to.eq("\n"));
    });

    it("uses encoding specified in options", function() {
      return files.readFile(this.projectRoot, "tests/_fixtures/ascii.foo", {encoding: "ascii"}).then(({ contents }) => expect(contents).to.eq("o#?\n"));
    });

    return it("parses json to valid JS object", function() {
      return files.readFile(this.projectRoot, "tests/_fixtures/users.json").then(({ contents }) => expect(contents).to.eql([
        {
          id: 1,
          name: "brian"
        },{
          id: 2,
          name: "jennifer"
        }
      ]));
  });
});

  return context("#writeFile", function() {
    it("writes the file's contents and returns contents and full file path", function() {
      return files.writeFile(this.projectRoot, ".projects/write_file.txt", "foo").then(() => {
        return files.readFile(this.projectRoot, ".projects/write_file.txt").then(function({ contents, filePath }) {
          expect(contents).to.equal("foo");
          return expect(filePath).to.include("/.projects/todos/.projects/write_file.txt");
        });
      });
    });

    it("uses encoding specified in options", function() {
      return files.writeFile(this.projectRoot, ".projects/write_file.txt", "", {encoding: "ascii"}).then(() => {
        return files.readFile(this.projectRoot, ".projects/write_file.txt").then(({ contents }) => expect(contents).to.equal("�"));
      });
    });

    it("overwrites existing file by default", function() {
      return files.writeFile(this.projectRoot, ".projects/write_file.txt", "foo").then(() => {
        return files.readFile(this.projectRoot, ".projects/write_file.txt").then(({ contents }) => {
          expect(contents).to.equal("foo");
          return files.writeFile(this.projectRoot, ".projects/write_file.txt", "bar").then(() => {
            return files.readFile(this.projectRoot, ".projects/write_file.txt").then(({ contents }) => expect(contents).to.equal("bar"));
          });
        });
      });
    });

    return it("appends content to file when specified", function() {
      return files.writeFile(this.projectRoot, ".projects/write_file.txt", "foo").then(() => {
        return files.readFile(this.projectRoot, ".projects/write_file.txt").then(({ contents }) => {
          expect(contents).to.equal("foo");
          return files.writeFile(this.projectRoot, ".projects/write_file.txt", "bar", {flag: "a+"}).then(() => {
            return files.readFile(this.projectRoot, ".projects/write_file.txt").then(({ contents }) => expect(contents).to.equal("foobar"));
          });
        });
      });
    });
  });
});
