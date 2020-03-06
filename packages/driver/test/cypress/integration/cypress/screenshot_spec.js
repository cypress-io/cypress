/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { Screenshot, $ } = Cypress;

const DEFAULTS = {
  capture: "fullPage",
  scale: false,
  disableTimersAndAnimations: true,
  screenshotOnRunFailure: true,
  blackout: []
};

describe("src/cypress/screenshot", function() {
  beforeEach(() => //# reset state since this is a singleton
  Screenshot.reset());

  it("has defaults", function() {
    expect(Screenshot.getConfig()).to.deep.eq(DEFAULTS);
    expect(() => Screenshot.onBeforeScreenshot()).not.to.throw();
    return expect(() => Screenshot.onAfterScreenshot()).not.to.throw();
  });

  context(".getConfig", () => it("returns copy of config", function() {
    const config = Screenshot.getConfig();
    config.blackout.push(".foo");
    return expect(Screenshot.getConfig().blackout).to.deep.eq(DEFAULTS.blackout);
  }));

  return context(".defaults", function() {
    it("is noop if not called with any valid properties", function() {
      Screenshot.defaults({});
      expect(Screenshot.getConfig()).to.deep.eq(DEFAULTS);
      expect(() => Screenshot.onBeforeScreenshot()).not.to.throw();
      return expect(() => Screenshot.onAfterScreenshot()).not.to.throw();
    });

    it("sets capture if specified", function() {
      Screenshot.defaults({
        capture: "runner"
      });
      return expect(Screenshot.getConfig().capture).to.eql("runner");
    });

    it("sets scale if specified", function() {
      Screenshot.defaults({
        scale: true
      });
      return expect(Screenshot.getConfig().scale).to.equal(true);
    });

    it("sets disableTimersAndAnimations if specified", function() {
      Screenshot.defaults({
        disableTimersAndAnimations: false
      });
      return expect(Screenshot.getConfig().disableTimersAndAnimations).to.equal(false);
    });

    it("sets screenshotOnRunFailure if specified", function() {
      Screenshot.defaults({
        screenshotOnRunFailure: false
      });
      return expect(Screenshot.getConfig().screenshotOnRunFailure).to.equal(false);
    });

    it("sets clip if specified", function() {
      Screenshot.defaults({
        clip: { width: 200, height: 100, x: 0, y: 0 }
      });
      return expect(
        Screenshot.getConfig().clip
      ).to.eql(
        { width: 200, height: 100, x: 0, y:0 }
      );
    });

    it("sets and normalizes padding if specified", function() {
      const tests = [
        [ 50, [50, 50, 50, 50] ],
        [ [15], [15, 15, 15, 15] ],
        [ [30, 20], [30, 20, 30, 20] ],
        [ [10, 20, 30], [10, 20, 30, 20] ],
        [ [20, 10, 20, 10], [20, 10, 20, 10] ]
      ];

      return (() => {
        const result = [];
        for (let test of tests) {
          const [ input, expected ] = test;
          Screenshot.defaults({
            padding: input
          });
          result.push(expect(
            Screenshot.getConfig().padding
          ).to.eql(
            expected
          ));
        }
        return result;
      })();
    });

    it("sets onBeforeScreenshot if specified", function() {
      const onBeforeScreenshot = cy.stub();
      Screenshot.defaults({ onBeforeScreenshot });
      Screenshot.onBeforeScreenshot();
      return expect(onBeforeScreenshot).to.be.called;
    });

    it("sets onAfterScreenshot if specified", function() {
      const onAfterScreenshot = cy.stub();
      Screenshot.defaults({ onAfterScreenshot });
      Screenshot.onAfterScreenshot();
      return expect(onAfterScreenshot).to.be.called;
    });

    return describe("errors", function() {
      it("throws if not passed an object", () => expect(() => {
        return Screenshot.defaults();
    }).to.throw("Cypress.Screenshot.defaults() must be called with an object. You passed: "));

      it("throws if capture is not a string", () => expect(() => {
        return Screenshot.defaults({ capture: true });
    }).to.throw("Cypress.Screenshot.defaults() 'capture' option must be one of the following: 'fullPage', 'viewport', or 'runner'. You passed: true"));

      it("throws if capture is not a valid option", () => expect(() => {
        return Screenshot.defaults({ capture: "foo" });
    }).to.throw("Cypress.Screenshot.defaults() 'capture' option must be one of the following: 'fullPage', 'viewport', or 'runner'. You passed: foo"));

      it("throws if scale is not a boolean", () => expect(() => {
        return Screenshot.defaults({ scale: "foo" });
    }).to.throw("Cypress.Screenshot.defaults() 'scale' option must be a boolean. You passed: foo"));

      it("throws if disableTimersAndAnimations is not a boolean", () => expect(() => {
        return Screenshot.defaults({ disableTimersAndAnimations: "foo" });
    }).to.throw("Cypress.Screenshot.defaults() 'disableTimersAndAnimations' option must be a boolean. You passed: foo"));

      it("throws if screenshotOnRunFailure is not a boolean", () => expect(() => {
        return Screenshot.defaults({ screenshotOnRunFailure: "foo" });
    }).to.throw("Cypress.Screenshot.defaults() 'screenshotOnRunFailure' option must be a boolean. You passed: foo"));

      it("throws if blackout is not an array", () => expect(() => {
        return Screenshot.defaults({ blackout: "foo" });
    }).to.throw("Cypress.Screenshot.defaults() 'blackout' option must be an array of strings. You passed: foo"));

      it("throws if blackout is not an array of strings", () => expect(() => {
        return Screenshot.defaults({ blackout: [true] });
    }).to.throw("Cypress.Screenshot.defaults() 'blackout' option must be an array of strings. You passed: true"));

      it("throws if padding is not a number or an array of numbers with a length between 1 and 4", function() {
        expect(() => {
          return Screenshot.defaults({ padding: '50px' });
      }).to.throw("Cypress.Screenshot.defaults() 'padding' option must be either a number or an array of numbers with a maximum length of 4. You passed: 50px");
        expect(() => {
          return Screenshot.defaults({ padding: ['bad', 'bad', 'bad', 'bad'] });
      }).to.throw("Cypress.Screenshot.defaults() 'padding' option must be either a number or an array of numbers with a maximum length of 4. You passed: bad, bad, bad, bad");
        return expect(() => {
          return Screenshot.defaults({ padding: [20, 10, 20, 10, 50] });
      }).to.throw("Cypress.Screenshot.defaults() 'padding' option must be either a number or an array of numbers with a maximum length of 4. You passed: 20, 10, 20, 10, 50");
      });

      it("throws if clip is lacking proper keys", () => expect(() => {
        return Screenshot.defaults({ clip: { x: 5 } });
    }).to.throw("Cypress.Screenshot.defaults() 'clip' option must be an object with the keys { width, height, x, y } and number values. You passed: {x: 5}"));

      it("throws if clip has extraneous keys", () => expect(() => {
        return Screenshot.defaults({ clip: { width: 100, height: 100, x: 5, y: 5, foo: 10 } });
    }).to.throw("Cypress.Screenshot.defaults() 'clip' option must be an object with the keys { width, height, x, y } and number values. You passed: Object{5}"));

      it("throws if clip has non-number values", () => expect(() => {
        return Screenshot.defaults({ clip: { width: 100, height: 100, x: 5, y: "5" } });
    }).to.throw("Cypress.Screenshot.defaults() 'clip' option must be an object with the keys { width, height, x, y } and number values. You passed: Object{4}"));

      it("throws if onBeforeScreenshot is not a function", () => expect(() => {
        return Screenshot.defaults({ onBeforeScreenshot: "foo" });
    }).to.throw("Cypress.Screenshot.defaults() 'onBeforeScreenshot' option must be a function. You passed: foo"));

      return it("throws if onAfterScreenshot is not a function", () => expect(() => {
        return Screenshot.defaults({ onAfterScreenshot: "foo" });
    }).to.throw("Cypress.Screenshot.defaults() 'onAfterScreenshot' option must be a function. You passed: foo"));
    });
  });
});
