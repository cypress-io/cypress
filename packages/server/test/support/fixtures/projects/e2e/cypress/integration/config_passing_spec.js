/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("Cypress static methods + props", function() {
  it(".version", () => expect(Cypress.version).to.be.a("string"));

  it(".platform", function() {
    expect(Cypress.platform).to.be.a("string");
    return expect(Cypress.platform).to.be.oneOf(["darwin", "linux", "win32"]);
  });

  it(".arch", () => expect(Cypress.arch).to.be.a("string"));

  it(".browser", function() {
    const { browser } = Cypress;

    expect(browser).to.be.an("object");
    expect(browser.name).to.be.oneOf(["electron", "chrome", "chromium"]);
    expect(browser.displayName).to.be.oneOf(["Electron", "Chrome", "Canary", "Chromium"]);
    expect(browser.version).to.be.a("string");
    // we are parsing major version, so it should be a number
    expect(browser.majorVersion).to.be.a("number");
    expect(browser.path).to.be.a("string");

    switch (browser.isHeadless) {
      case true:
        return expect(browser.isHeaded).to.be.false;
      case false:
        return expect(browser.isHeaded).to.be.true;
      default:
        return expect(browser.isHeadless, "browser.isHeadless").not.to.be.undefined;
    }
  });

  it(".spec", function() {
    const { spec } = Cypress;

    expect(spec).to.be.an("object");
    expect(spec.name).to.eq("config_passing_spec.coffee");
    expect(spec.relative).to.eq("cypress/integration/config_passing_spec.coffee");
    return expect(spec.absolute.indexOf("cypress/integration/config_passing_spec.coffee")).to.be.gt(0);
  });

  return context(".env", () => //# https://github.com/cypress-io/cypress/issues/4952
  it(
    "doesn't die on <script> tags",
    () => expect(Cypress.env('scriptlet')).to.eq("<script>alert('this should not break')</script>")
  ));
});
