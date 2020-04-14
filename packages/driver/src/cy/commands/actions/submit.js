/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const Promise = require("bluebird");

const $dom = require("../../../dom");
const $utils = require("../../../cypress/utils");
const $errUtils = require("../../../cypress/error_utils");
const $actionability = require("../../actionability");

module.exports = (Commands, Cypress, cy, state, config) => Commands.addAll({ prevSubject: "element" }, {
  submit(subject, options = {}) {
    let dispatched, num;
    const userOptions = options;
    options = _.defaults({}, userOptions, {
      log: true,
      $el: subject
    });

    //# changing this to a promise .map() causes submit events
    //# to break when they need to be triggered synchronously
    //# like with type {enter}.  either convert type to a promise
    //# to just create a synchronous submit function
    const form = options.$el.get(0);

    if (options.log) {
      options._log = Cypress.log({
        $el: options.$el,
        consoleProps() {
          return {
            "Applied To": $dom.getElements(options.$el),
            Elements: options.$el.length
          };
        }
      });

      options._log.snapshot("before", {next: "after"});
    }

    if (!options.$el.is("form")) {
      const node = $dom.stringify(options.$el);
      const word = $utils.plural(options.$el, "contains", "is");
      $errUtils.throwErrByPath("submit.not_on_form", {
        onFail: options._log,
        args: { node, word }
      });
    }

    if ((num = options.$el.length) && (num > 1)) {
      $errUtils.throwErrByPath("submit.multiple_forms", {
        onFail: options._log,
        args: { num }
      });
    }

    //# calling the native submit method will not actually trigger
    //# a submit event, so we need to dispatch this manually so
    //# native event listeners and jquery can bind to it
    const submit = new Event("submit", {bubbles: true, cancelable: true});
    !!(dispatched = form.dispatchEvent(submit));

    //# now we need to check to see if we should actually submit
    //# the form!
    //# dont submit the form if our dispatched event was canceled (false)
    if (dispatched) { form.submit(); }

    cy.timeout($actionability.delay, true);

    return Promise
    .delay($actionability.delay, "submit")
    .then(function() {
      let verifyAssertions;
      return (verifyAssertions = () => {
        return cy.verifyUpcomingAssertions(options.$el, options, {
          onRetry: verifyAssertions
        });
      })();
    });
  }
});
