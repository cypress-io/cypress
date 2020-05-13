/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  _
} = Cypress;

const okResponse = {
  contents: "contents",
  filePath: "/path/to/foo.json"
};

describe("src/cy/commands/files", function() {
  beforeEach(() => //# call through normally on everything
  cy.stub(Cypress, "backend").callThrough());

  describe("#readFile", function() {
    it("triggers 'read:file' with the right options", function() {
      Cypress.backend.resolves(okResponse);

      return cy.readFile("foo.json").then(() => expect(Cypress.backend).to.be.calledWith(
        "read:file",
        "foo.json",
        { encoding: "utf8" }
      ));
    });

    it("can take encoding as second argument", function() {
      Cypress.backend.resolves(okResponse);

      return cy.readFile("foo.json", "ascii").then(() => expect(Cypress.backend).to.be.calledWith(
        "read:file",
        "foo.json",
        { encoding: "ascii" }
      ));
    });

    it("sets the contents as the subject", function() {
      Cypress.backend.resolves(okResponse);

      return cy.readFile('foo.json').then(subject => expect(subject).to.equal("contents"));
    });

    it("retries to read when ENOENT", function() {
      const err = new Error("foo");
      err.code = "ENOENT";

      let retries = 0;

      cy.on("command:retry", () => retries += 1);

      Cypress.backend
      .onFirstCall()
      .rejects(err)
      .onSecondCall()
      .resolves(okResponse);

      return cy.readFile('foo.json').then(() => expect(retries).to.eq(1));
    });

    it("retries assertions until they pass", function() {
      let retries = 0;

      cy.on("command:retry", () => retries += 1);

      Cypress.backend
      .onFirstCall()
      .resolves({
        contents: "foobarbaz"
      })
      .onSecondCall()
      .resolves({
        contents: "quux"
      });

      return cy.readFile("foo.json").should("eq", "quux").then(() => expect(retries).to.eq(1));
    });

    it("really works", () => cy.readFile("cypress.json").its("baseUrl").should("eq", "http://localhost:3500"));

    it("works when contents are supposed to be null", () => cy.readFile("does-not-exist").should("be.null"));

    describe(".log", function() {
      beforeEach(function() {
        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          this.lastLog = log;
          return this.logs.push(log);
        });

        return null;
      });

      it("can turn off logging", function() {
        Cypress.backend.resolves(okResponse);

        return cy.readFile('foo.json', { log: false }).then(function() {
          const logs = _.filter(this.logs, log => log.get("name") === "readFile");

          return expect(logs.length).to.eq(0);
        });
      });

      return it("logs immediately before resolving", function() {
        Cypress.backend.resolves(okResponse);

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "readFile") {
            expect(log.get("state")).to.eq("pending");
            return expect(log.get("message")).to.eq("foo.json");
          }
        });

        return cy.readFile("foo.json").then(() => {
          if (!this.lastLog) { throw new Error("failed to log before resolving"); }
        });
      });
    });

    return describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 50);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "readFile") {
            this.lastLog = log;
            return this.logs.push(log);
          }
        });

        return null;
      });

      it("throws when file argument is absent", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq("`cy.readFile()` must be passed a non-empty string as its 1st argument. You passed: `undefined`.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/readfile");
          return done();
        });

        return cy.readFile();
      });

      it("throws when file argument is not a string", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq("`cy.readFile()` must be passed a non-empty string as its 1st argument. You passed: `2`.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/readfile");
          return done();
        });

        return cy.readFile(2);
      });

      it("throws when file argument is an empty string", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq("`cy.readFile()` must be passed a non-empty string as its 1st argument. You passed: ``.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/readfile");
          return done();
        });

        return cy.readFile("");
      });

      it("throws when there is an error reading the file", function(done) {
        const err = new Error("EISDIR: illegal operation on a directory, read");
        err.name = "EISDIR";
        err.code = "EISDIR";
        err.filePath = "/path/to/foo";

        Cypress.backend.rejects(err);

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq(`\
\`cy.readFile(\"foo\")\` failed while trying to read the file at the following path:

  \`/path/to/foo\`

The following error occurred:

  > "EISDIR: illegal operation on a directory, read"\
`
          );
          expect(err.docsUrl).to.eq("https://on.cypress.io/readfile");

          return done();
        });

        return cy.readFile("foo");
      });

      it("has implicit existence assertion and throws a specific error when file does not exist", function(done) {
        const err = new Error("ENOENT: no such file or directory, open 'foo.json'");
        err.name = "ENOENT";
        err.code = "ENOENT";
        err.filePath = "/path/to/foo.json";

        Cypress.backend.rejects(err);

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");

          expect(err.message).to.eq(`Timed out retrying: \`cy.readFile(\"foo.json\")\` failed because the file does not exist at the following path:

\`/path/to/foo.json\`\
`);
          expect(err.docsUrl).to.eq("https://on.cypress.io/readfile");
          return done();
        });

        return cy.readFile("foo.json");
      });

      it("throws a specific error when file exists when it shouldn't", function(done) {
        Cypress.backend.resolves(okResponse);

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq(`\
Timed out retrying: \`cy.readFile(\"foo.json\")\` failed because the file exists when expected not to exist at the following path:

\`/path/to/foo.json\`\
`);
          expect(err.docsUrl).to.eq("https://on.cypress.io/readfile");
          return done();
        });

        return cy.readFile("foo.json").should("not.exist");
      });

      return it("passes through assertion error when not about existence", function(done) {
        Cypress.backend.resolves({
          contents: "foo"
        });

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq("Timed out retrying: expected 'foo' to equal 'contents'");
          return done();
        });

        return cy.readFile("foo.json").should("equal", "contents");
      });
    });
  });

  return describe("#writeFile", function() {
    it("triggers 'write:file' with the right options", function() {
      Cypress.backend.resolves(okResponse);

      return cy.writeFile("foo.txt", "contents").then(() => expect(Cypress.backend).to.be.calledWith(
        "write:file",
        "foo.txt",
        "contents",
        {
          encoding: "utf8",
          flag: "w"
        }
      ));
    });

    it("can take encoding as third argument", function() {
      Cypress.backend.resolves(okResponse);

      return cy.writeFile("foo.txt", "contents", "ascii").then(() => expect(Cypress.backend).to.be.calledWith(
        "write:file",
        "foo.txt",
        "contents",
        {
          encoding: "ascii",
          flag: "w"
        }
      ));
    });

    it("can take encoding as part of options", function() {
      Cypress.backend.resolves(okResponse);

      return cy.writeFile("foo.txt", "contents", {encoding: "ascii"}).then(() => expect(Cypress.backend).to.be.calledWith(
        "write:file",
        "foo.txt",
        "contents",
        {
          encoding: "ascii",
          flag: "w"
        }
      ));
    });

    it("yields null", function() {
      Cypress.backend.resolves(okResponse);

      return cy.writeFile("foo.txt", "contents").then(subject => expect(subject).to.not.exist);
    });

    it("can write a string", function() {
      Cypress.backend.resolves(okResponse);

      return cy.writeFile("foo.txt", "contents");
    });

    it("can write an array as json", function() {
      Cypress.backend.resolves(okResponse);

      return cy.writeFile("foo.json", []);
    });

    it("can write an object as json", function() {
      Cypress.backend.resolves(okResponse);

      return cy.writeFile("foo.json", {});
    });

    it("writes the file to the filesystem, overwriting existing file", () => cy
      .writeFile("cypress/fixtures/foo.txt", "")
      .writeFile("cypress/fixtures/foo.txt", "bar")
      .readFile("cypress/fixtures/foo.txt").should("equal", "bar")
      .exec("rm cypress/fixtures/foo.txt"));

    describe(".flag", function() {
      it("sends a flag if specified", function() {
        Cypress.backend.resolves(okResponse);

        return cy.writeFile("foo.txt", "contents", { flag: "a+" }).then(() => expect(Cypress.backend).to.be.calledWith(
          "write:file",
          "foo.txt",
          "contents",
          {
            encoding: "utf8",
            flag: "a+"
          }));
      });

      return it("appends content to existing file if specified", () => cy
        .writeFile("cypress/fixtures/foo.txt", "foo")
        .writeFile("cypress/fixtures/foo.txt", "bar", { flag: "a+"})
        .readFile("cypress/fixtures/foo.txt").should("equal", "foobar")
        .exec("rm cypress/fixtures/foo.txt"));
    });

    describe(".log", function() {
      beforeEach(function() {
        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          this.lastLog = log;
          return this.logs.push(log);
        });

        return null;
      });

      it("can turn off logging", function() {
        Cypress.backend.resolves(okResponse);

        return cy.writeFile("foo.txt", "contents", { log: false }).then(function() {
          const logs = _.filter(this.logs, log => log.get("name") === "writeFile");

          return expect(logs.length).to.eq(0);
        });
      });

      return it("logs immediately before resolving", function() {
        Cypress.backend.resolves(okResponse);

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "writeFile") {
            expect(log.get("state")).to.eq("pending");
            return expect(log.get("message")).to.eq("foo.txt", "contents");
          }
        });

        return cy.writeFile("foo.txt", "contents").then(() => {
          if (!this.lastLog) { throw new Error("failed to log before resolving"); }
        });
      });
    });

    return describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 50);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "writeFile") {
            this.lastLog = log;
            return this.logs.push(log);
          }
        });

        return null;
      });

      it("throws when file name argument is absent", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq("`cy.writeFile()` must be passed a non-empty string as its 1st argument. You passed: `undefined`.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/writefile");
          return done();
        });

        return cy.writeFile();
      });

      it("throws when file name argument is not a string", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq("`cy.writeFile()` must be passed a non-empty string as its 1st argument. You passed: `2`.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/writefile");
          return done();
        });

        return cy.writeFile(2);
      });

      it("throws when contents argument is absent", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq("`cy.writeFile()` must be passed a non-empty string, an object, or an array as its 2nd argument. You passed: `undefined`.");
          return done();
        });

        return cy.writeFile("foo.txt");
      });

      it("throws when contents argument is not a string, object, or array", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq("`cy.writeFile()` must be passed a non-empty string, an object, or an array as its 2nd argument. You passed: `2`.");
          return done();
        });

        return cy.writeFile("foo.txt", 2);
      });

      return it("throws when there is an error writing the file", function(done) {
        const err = new Error("WHOKNOWS: unable to write file");
        err.name = "WHOKNOWS";
        err.code = "WHOKNOWS";
        err.filePath = "/path/to/foo.txt";

        Cypress.backend.rejects(err);

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq(`\`cy.writeFile(\"foo.txt\")\` failed while trying to write the file at the following path:

  \`/path/to/foo.txt\`

The following error occurred:

  > "WHOKNOWS: unable to write file"\
`
          );
          expect(err.docsUrl).to.eq("https://on.cypress.io/writefile");

          return done();
        });

        return cy.writeFile("foo.txt", "contents");
      });
    });
  });
});
