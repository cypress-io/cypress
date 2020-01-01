/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const Promise = require("bluebird");

const $dom = require("../dom");
const $utils = require("../cypress/utils");

//# TODO
//# bTagOpen + bTagClosed
//# are duplicated in assertions.coffee
const butRe = /,? but\b/;
const bTagOpen = /\*\*/g;
const bTagClosed = /\*\*/g;
const stackTracesRe = / at .*\n/gm;

const IS_DOM_TYPES = [$dom.isElement, $dom.isDocument, $dom.isWindow];

const invokeWith = value => fn => fn(value);

const functionHadArguments = function(current) {
  const fn = current && current.get("args") && current.get("args")[0];
  return fn && _.isFunction(fn) && (fn.length > 0);
};

const isAssertionType = cmd => cmd && cmd.is("assertion");

const isDomSubjectAndMatchesValue = function(value, subject) {
  let isDomTypeFn;
  const allElsAreTheSame = function() {
    const els1 = $dom.getElements(value);
    const els2 = $dom.getElements(subject);

    //# no difference
    return _.difference(els1, els2).length === 0;
  };

  //# iterate through each dom type until we
  //# find the function for this particular value
  if (isDomTypeFn = _.find(IS_DOM_TYPES, invokeWith(value))) {
    //# then check that subject also matches this
    //# and that all the els are the same
    return isDomTypeFn(subject) && allElsAreTheSame();
  }
};

//# Rules:
//# 1. always remove value
//# 2. if value is a jquery object set a subject
//# 3. if actual is undefined or its not expected remove both actual + expected
const parseValueActualAndExpected = function(value, actual, expected) {
  const obj = {actual, expected};

  if ($dom.isJquery(value)) {
    obj.subject = value;

    if (_.isUndefined(actual) || (actual !== expected)) {
      delete obj.actual;
      delete obj.expected;
    }
  }

  return obj;
};

const create = function(state, queue, retryFn) {
  const getUpcomingAssertions = function() {
    const current = state("current");
    const index   = state("index") + 1;

    const assertions = [];

    //# grab the rest of the queue'd commands
    for (let cmd of queue.slice(index).get()) {
      //# don't break on utilities, just skip over them
      if (cmd.is("utility")) {
        continue;
      }

      //# grab all of the queued commands which are
      //# assertions and match our current chainerId
      if (cmd.is("assertion")) {
        assertions.push(cmd);
      } else {
        break;
      }
    }

    return assertions;
  };

  const injectAssertionFns = cmds => _.map(cmds, injectAssertion);

  var injectAssertion = cmd => (function(subject) {
    //# set assertions to itself or empty array
    if (!cmd.get("assertions")) {
      cmd.set("assertions", []);
    }

    //# reset the assertion index back to 0
    //# so we can track assertions and merge
    //# them up with existing ones
    cmd.set("assertionIndex", 0);

    return cmd.get("fn").originalFn.apply(
      state("ctx"),
      [subject].concat(cmd.get("args"))
    );
  });

  const finishAssertions = assertions => _.each(assertions, function(log) {
    let e;
    log.snapshot();

    if ((e = log.get("_error"))) {
      return log.error(e);
    } else {
      return log.end();
    }
  });

  const verifyUpcomingAssertions = function(subject, options = {}, callbacks = {}) {
    const cmds = getUpcomingAssertions();

    state("upcomingAssertions", cmds);

    //# we're applying the default assertion in the
    //# case where there are no upcoming assertion commands
    const isDefaultAssertionErr = cmds.length === 0;

    if (options.assertions == null) { options.assertions = []; }

    _.defaults(callbacks, {
      ensureExistenceFor: "dom"
    });

    const ensureExistence = function() {
      //# by default, ensure existence for dom subjects,
      //# but not non-dom subjects
      switch (callbacks.ensureExistenceFor) {
        case "dom":
          var $el = determineEl(options.$el, subject);
          if (!$dom.isJquery($el)) { return; }

          return cy.ensureElExistence($el);

        case "subject":
          return cy.ensureExistence(subject);
      }
    };

    var determineEl = function($el, subject) {
      //# prefer $el unless it is strickly undefined
      if (!_.isUndefined($el)) { return $el; } else { return subject; }
    };

    const onPassFn = () => {
      if (_.isFunction(callbacks.onPass)) {
        return callbacks.onPass.call(this, cmds, options.assertions);
      } else {
        return subject;
      }
    };

    const onFailFn = err => {
      //# when we fail for whatever reason we need to
      //# check to see if we would firstly fail if
      //# we don't have an el in existence. what this
      //# catches are assertions downstream about an
      //# elements existence but the element never
      //# exists in the first place. this will probably
      //# ensure the error is about existence not about
      //# the downstream assertion.
      try {
        ensureExistence();
      } catch (e2) {
        err = e2;
      }

      options.error = err;

      if (err.retry === false) {
        throw err;
      }

      const {
        onFail
      } = callbacks;
      const {
        onRetry
      } = callbacks;

      if (!onFail && !onRetry) {
        throw err;
      }

      //# if our onFail throws then capture it
      //# and finish the assertions and then throw
      //# it again
      try {
        if (_.isFunction(onFail)) {
          //# pass in the err and the upcoming assertion commands
          onFail.call(this, err, isDefaultAssertionErr, cmds);
        }
      } catch (e3) {
        finishAssertions(options.assertions);
        throw e3;
      }

      if (_.isFunction(onRetry)) {
        return retryFn(onRetry, options);
      }
    };

    //# bail if we have no assertions and apply
    //# the default assertions if applicable
    if (!cmds.length) {
      return Promise
        .try(ensureExistence)
        .then(onPassFn)
        .catch(onFailFn);
    }

    let i = 0;

    const cmdHasFunctionArg = cmd => _.isFunction(cmd.get("args")[0]);

    const overrideAssert = function(...args) {
      ((cmd) => {
        const setCommandLog = log => {
          //# our next log may not be an assertion
          //# due to page events so make sure we wait
          //# until we see page events
          let l;
          if (log.get("name") !== "assert") { return; }

          //# when we do immediately unbind this function
          state("onBeforeLog", null);

          const insertNewLog = function(log) {
            cmd.log(log);
            return options.assertions.push(log);
          };

          //# its possible a single 'should' will assert multiple
          //# things such as the case with have.property. we can
          //# detect when that is happening because cmd will be null.
          //# if thats the case then just set cmd to be the previous
          //# cmd and do not increase 'i'
          //# this will prevent 2 logs from ever showing up but still
          //# provide errors when the 1st assertion fails.
          if (!cmd) {
            cmd = cmds[i - 1];
          } else {
            i += 1;
          }

          //# if our command has a function argument
          //# then we know it may contain multiple
          //# assertions
          if (cmdHasFunctionArg(cmd)) {
            let assertion;
            let index      = cmd.get("assertionIndex");
            const assertions = cmd.get("assertions");

            const incrementIndex = () => //# always increase the assertionIndex
            //# so our next assertion matches up
            //# to the correct index
            cmd.set("assertionIndex", index += 1);

            //# if we dont have an assertion at this
            //# index then insert a new log
            if (!(assertion = assertions[index])) {
              assertions.push(log);
              incrementIndex();

              return insertNewLog(log);
            } else {
              //# else just merge this log
              //# into the previous assertion log
              incrementIndex();
              assertion.merge(log);

              //# dont output a new log
              return false;
            }
          }

          //# if we already have a log
          //# then just update its attrs from
          //# the new log
          if (l = cmd.getLastLog()) {
            l.merge(log);

            //# and make sure we return false
            //# which prevents a new log from
            //# being added
            return false;
          } else {
            return insertNewLog(log);
          }
        };

        return state("onBeforeLog", setCommandLog);
      })(cmds[i]);

      //# send verify=true as the last arg
      return assertFn.apply(this, args.concat(true));
    };

    const fns = injectAssertionFns(cmds);

    const subjects = [];

    //# iterate through each subject
    //# and force the assertion to return
    //# this value so it does not get
    //# invoked again
    const setSubjectAndSkip = () => (() => {
      const result = [];
      for (i = 0; i < subjects.length; i++) {
        subject = subjects[i];
        const cmd  = cmds[i];
        cmd.set("subject", subject);
        result.push(cmd.skip());
      }
      return result;
    })();

    const assertions = (memo, fn, i) => {
      //# HACK: bluebird .reduce will not call the callback
      //# if given an undefined initial value, so in order to
      //# support undefined subjects, we wrap the initial value
      //# in an Array and unwrap it if index = 0
      if (i === 0) {
        memo = memo[0];
      }
      return fn(memo).then(subject => subjects[i] = subject);
    };

    const restore = function() {
      state("upcomingAssertions", []);

      //# no matter what we need to
      //# restore the assert fn
      return state("overrideAssert", undefined);
    };

    //# store this in case our test ends early
    //# and we reset between tests
    state("overrideAssert", overrideAssert);

    return Promise
    .reduce(fns, assertions, [subject])
    .then(function() {
      restore();

      setSubjectAndSkip();

      finishAssertions(options.assertions);

      return onPassFn();}).catch(function(err) {
      restore();

      //# when we're told not to retry
      if (err.retry === false) {
        //# finish the assertions
        finishAssertions(options.assertions);

        //# and then push our command into this err
        try {
          $utils.throwErr(err, { onFail: options._log });
        } catch (e) {
          err = e;
        }
      }

      throw err;}).catch(onFailFn);
  };

  var assertFn = function(passed, message, value, actual, expected, error, verifying = false) {
    //# slice off everything after a ', but' or ' but ' for passing assertions, because
    //# otherwise it doesn't make sense:
    //# "expected <div> to have a an attribute 'href', but it was 'href'"
    if (message && passed && butRe.test(message)) {
      message = message.substring(0, message.search(butRe));
    }

    if (value != null ? value.isSinonProxy : undefined) {
      message = message.replace(stackTracesRe, "\n");
    }

    let obj = parseValueActualAndExpected(value, actual, expected);

    if ($dom.isElement(value)) {
      obj.$el = $dom.wrap(value);
    }

    const current = state("current");

    //# if we are simply verifying the upcoming
    //# assertions then do not immediately end or snapshot
    //# else do
    if (verifying) {
      obj._error = error;
    } else {
      obj.end = true;
      obj.snapshot = true;
      obj.error = error;
    }

    const isChildLike = (subject, current) => {
      return (value === subject) ||
        isDomSubjectAndMatchesValue(value, subject) ||
          //# if our current command is an assertion type
          isAssertionType(current) ||
            //# are we currently verifying assertions?
            (__guard__(state("upcomingAssertions"), x => x.length) > 0) ||
              //# did the function have arguments
              functionHadArguments(current);
    };

    _.extend(obj, {
      name:     "assert",
      // end:      true
      // snapshot: true
      message,
      passed,
      selector: (value != null ? value.selector : undefined),
      type(current, subject) {
        //# if our current command has arguments assume
        //# we are an assertion that's involving the current
        //# subject or our value is the current subject
        if (isChildLike(subject, current)) {
          return "child";
        } else {
          return "parent";
        }
      },

      consoleProps: () => {
        obj = {Command: "assert"};

        _.extend(obj, parseValueActualAndExpected(value, actual, expected));

        return _.extend(obj,
          {Message: message.replace(bTagOpen, "").replace(bTagClosed, "")});
      }
    }
    );

    //# think about completely gutting the whole object toString
    //# which chai does by default, its so ugly and worthless

    if (error) {
      error.onFail = function(err) {};
    }

    Cypress.log(obj);

    return null;
  };

  const assert = function() {
    //# if we've temporarily overriden assertions
    //# then just bail early with this function
    let left;
    const fn = (left = state("overrideAssert")) != null ? left : assertFn;
    return fn.apply(this, arguments);
  };

  return {
    finishAssertions,

    verifyUpcomingAssertions,

    assert
  };
};

module.exports = {
  create
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}