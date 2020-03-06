/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { SelectorPlayground, $ } = Cypress;

const SELECTOR_DEFAULTS = [
  "data-cy", "data-test", "data-testid", "id", "class", "tag", "attributes", "nth-child"
];

describe("src/cypress/selector_playground", function() {
  beforeEach(() => //# reset state since this is a singleton
  SelectorPlayground.reset());

  it("has defaults", function() {
    expect(SelectorPlayground.getSelectorPriority()).to.deep.eq(SELECTOR_DEFAULTS);
    return expect(SelectorPlayground.getOnElement()).to.be.null;
  });

  context(".defaults", function() {
    it("is noop if not called with selectorPriority or onElement", function() {
      SelectorPlayground.defaults({});
      expect(SelectorPlayground.getSelectorPriority()).to.deep.eq(SELECTOR_DEFAULTS);
      return expect(SelectorPlayground.getOnElement()).to.be.null;
    });

    it("sets selector:playground:priority if selectorPriority specified", function() {
      SelectorPlayground.defaults({
        selectorPriority: ["foo"]
      });
      return expect(SelectorPlayground.getSelectorPriority()).to.eql(["foo"]);
    });

    it("sets selector:playground:on:element if onElement specified", function() {
      const onElement = function() {};
      SelectorPlayground.defaults({ onElement });
      return expect(SelectorPlayground.getOnElement()).to.equal(onElement);
    });

    it("throws if not passed an object", () => expect(() => {
      return SelectorPlayground.defaults();
  }).to.throw("Cypress.SelectorPlayground.defaults() must be called with an object. You passed: "));

    it("throws if selectorPriority is not an array", () => expect(() => {
      return SelectorPlayground.defaults({ selectorPriority: "foo" });
  }).to.throw("Cypress.SelectorPlayground.defaults() called with invalid 'selectorPriority' property. It must be an array. You passed: foo"));

    return it("throws if onElement is not a function", () => expect(() => {
      return SelectorPlayground.defaults({ onElement: "foo" });
  }).to.throw("Cypress.SelectorPlayground.defaults() called with invalid 'onElement' property. It must be a function. You passed: foo"));
  });

  return context(".getSelector", () => it("uses defaults.selectorPriority", function() {
    const $div = $("<div data-cy='main button 123' data-foo-bar-baz='quux' data-test='qwerty' data-foo='bar' />");

    Cypress.$("body").append($div);

    expect(SelectorPlayground.getSelector($div)).to.eq("[data-cy=\"main button 123\"]");

    SelectorPlayground.defaults({
      selectorPriority: ['data-foo']
    });

    expect(SelectorPlayground.getSelector($div)).to.eq("[data-foo=bar]");

    SelectorPlayground.defaults({
      onElement($el) {
        return "quux";
      }
    });

    expect(SelectorPlayground.getSelector($div)).to.eq("quux");

    SelectorPlayground.defaults({
      onElement($el) {
        return null;
      }
    });

    return expect(SelectorPlayground.getSelector($div)).to.eq("[data-foo=bar]");
  }));
});
