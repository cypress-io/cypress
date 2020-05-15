/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("src/cy/commands/popups", function() {
  context("alert", function() {
    beforeEach(function() {
      cy.visit("/fixtures/generic.html");

      this.logs = [];

      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "alert") {
          return this.logs.push(log);
        }
      });

      return null;
    });

    return it("logs the alert", () => cy.window().then(win => win.alert("fooooo")).then(function() {
      expect(this.logs.length).to.eq(1);
      expect(this.logs[0].get("name")).to.eq("alert");
      expect(this.logs[0].get("message")).to.eq("fooooo");

      const consoleProps = this.logs[0].invoke("consoleProps");

      return expect(consoleProps).to.deep.eq({
        Event: "alert",
        Alerted: "fooooo"
      });
    }));
  });

  return context("confirm", function() {
    beforeEach(function() {
      cy.visit("/fixtures/generic.html");

      this.logs = [];

      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "confirm") {
          return this.logs.push(log);
        }
      });

      return null;
    });

    it("logs the confirm", () => cy.window().then(win => win.confirm("Delete hard drive?")).then(function() {
      expect(this.logs.length).to.eq(1);
      expect(this.logs[0].get("name")).to.eq("confirm");
      expect(this.logs[0].get("message")).to.eq("Delete hard drive?");

      const consoleProps = this.logs[0].invoke("consoleProps");

      return expect(consoleProps).to.deep.eq({
        Event: "confirm",
        Prompted: "Delete hard drive?",
        Confirmed: true
      });
    }));

    return it("can turn on and off confirmation", function() {
      cy.on("window:confirm", function(str) {
        switch (str) {
          case "foo": return false;
          case "bar": return true;
          case "baz": return undefined;
        }
      });

      return cy.window().then(function(win) {
        const confirmedFoo = win.confirm("foo");
        expect(confirmedFoo).to.be.false;

        const confirmedBar = win.confirm("bar");
        expect(confirmedBar).to.be.true;

        //# undefined is not strictly false
        //# so the confirmation should be true
        const confirmedBaz = win.confirm("baz");
        return expect(confirmedBaz).to.be.true;
      });
    });
  });
});
