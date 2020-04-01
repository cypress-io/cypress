/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const Promise = require("bluebird");

const $dom = require("../../dom");
const $utils = require("../../cypress/utils");
const $errUtils = require("../../cypress/error_utils");

const returnFalseIfThenable = function(key, ...args) {
  if ((key === "then") && _.isFunction(args[0]) && _.isFunction(args[1])) {
    //# https://github.com/cypress-io/cypress/issues/111
    //# if we're inside of a promise then the promise lib will naturally
    //# pass (at least) two functions to another cy.then
    //# this works similar to the way mocha handles thenables. for instance
    //# in coffeescript when we pass cypress commands within a Promise's
    //# .then() because the return value is the cypress instance means that
    //# the Promise lib will attach a new .then internally. it would never
    //# resolve unless we invoked it immediately, so we invoke it and
    //# return false then ensuring the command is not queued
    args[0]();
    return false;
  }
};

const primitiveToObject = function(memo) {
  switch (false) {
    case !_.isString(memo):
      return new String(memo);
    case !_.isNumber(memo):
      return new Number(memo);
    default:
      return memo;
  }
};

const getFormattedElement = function($el) {
  if ($dom.isElement($el)) {
    return $dom.getElements($el);
  } else {
    return $el;
  }
};

module.exports = function(Commands, Cypress, cy, state, config) {
  //# thens can return more "thenables" which are not resolved
  //# until they're 'really' resolved, so naturally this API
  //# supports nesting promises
  const thenFn = function(subject, options, fn) {
    let hasSpreadArray;
    const ctx = this;

    if (_.isFunction(options)) {
      fn = options;
      options = {};
    }

    _.defaults(options,
      {timeout: cy.timeout()});

    //# clear the timeout since we are handling
    //# it ourselves
    cy.clearTimeout();

    //# TODO: use subject from state("subject")

    const remoteSubject = cy.getRemotejQueryInstance(subject);

    let args = remoteSubject || subject;

    try {
      hasSpreadArray = subject.includes("_spreadArray") || (subject != null ? subject._spreadArray : undefined);
    } catch (error) {}
    args = hasSpreadArray ? args : [args];

    //# name could be invoke or its!
    const name = state("current").get("name");

    const cleanup = function() {
      state("onInjectCommand", undefined);
      cy.removeListener("command:enqueued", enqueuedCommand);
      return null;
    };

    let invokedCyCommand = false;

    var enqueuedCommand = () => invokedCyCommand = true;

    state("onInjectCommand", returnFalseIfThenable);

    cy.once("command:enqueued", enqueuedCommand);

    //# this code helps juggle subjects forward
    //# the same way that promises work
    const current = state("current");
    const next    = current.get("next");

    //# TODO: this code may no longer be necessary
    //# if the next command is chained to us then when it eventually
    //# runs we need to reset the subject to be the return value of the
    //# previous command so the subject is continuously juggled forward
    if (next && (next.get("chainerId") === current.get("chainerId"))) {
      var checkSubject = function(newSubject, args) {
        if (state("current") !== next) { return; }

        //# get whatever the previous commands return
        //# value is. this likely does not match the 'var current'
        //# command in the case of nested cy commands
        const s = next.get("prev").get("subject");

        //# find the new subject and splice it out
        //# with our existing subject
        const index = _.indexOf(args, newSubject);
        if (index > -1) {
          args.splice(index, 1, s);
        }

        return cy.removeListener("next:subject:prepared", checkSubject);
      };

      cy.on("next:subject:prepared", checkSubject);
    }

    const getRet = function() {
      let ret = fn.apply(ctx, args);

      if (cy.isCy(ret)) {
        ret = undefined;
      }

      if ((ret != null) && invokedCyCommand && !ret.then) {
        $errUtils.throwErrByPath("then.callback_mixes_sync_and_async", {
          onFail: options._log,
          args: { value: $utils.stringify(ret) }
        });
      }

      return ret;
    };

    return Promise
    .try(getRet)
    .timeout(options.timeout)
    .then(function(ret) {
      //# if ret is undefined then
      //# resolve with the existing subject
      if (_.isUndefined(ret)) { return subject; } else { return ret; }}).catch(Promise.TimeoutError, () => $errUtils.throwErrByPath("invoke_its.timed_out", {
      onFail: options._log,
      args: {
        cmd: name,
        timeout: options.timeout,
        func: fn.toString()
      }
    }))
    .finally(cleanup);
  };

  const invokeItsFn = (subject, str, options, ...args) => invokeBaseFn(options || { log: true }, subject, str, ...args);

  const invokeFn = function(subject, optionsOrStr, ...args) {
    const optionsPassed = _.isObject(optionsOrStr) && !_.isFunction(optionsOrStr);
    let options = null;
    let str = null;

    if (!optionsPassed) {
      str = optionsOrStr;
      options = { log: true };
    } else {
      options = optionsOrStr;
      if (args.length > 0) {
        str = args[0];
        args = args.slice(1);
      }
    }

    return invokeBaseFn(options, subject, str, ...args);
  };

  var invokeBaseFn = function(options, subject, str, ...args) {

    //# name could be invoke or its!
    let resolveValue;
    const name = state("current").get("name");

    const isCmdIts = name === "its";
    const isCmdInvoke = name === "invoke";

    const getMessage = function() {
      if (isCmdIts) {
        return `.${str}`;
      }

      return `.${str}(` + $utils.stringify(args) + ")";
    };

    //# to allow the falsy value 0 to be used
    const isProp = str => !!str || (str === 0);

    const message = getMessage();

    let traversalErr = null;

    if (options.log) {
      options._log = Cypress.log({
        message,
        $el: $dom.isElement(subject) ? subject : null,
        consoleProps() {
          return {Subject: subject};
        }
      });
    }

    //# check for false positive (negative?) with 0 given as index
    if (!isProp(str)) {
      $errUtils.throwErrByPath("invoke_its.null_or_undefined_property_name", {
        onFail: options._log,
        args: { cmd: name, identifier: isCmdIts ? "property" : "function" }
      });
    }

    if (!_.isString(str) && !_.isNumber(str)) {
      $errUtils.throwErrByPath("invoke_its.invalid_prop_name_arg", {
        onFail: options._log,
        args: { cmd: name, identifier: isCmdIts ? "property" : "function" }
      });
    }

    if (!_.isObject(options) || _.isFunction(options)) {
      $errUtils.throwErrByPath("invoke_its.invalid_options_arg", {
        onFail: options._log,
        args: { cmd: name }
      });
    }

    if (isCmdIts && args && (args.length > 0)) {
      $errUtils.throwErrByPath("invoke_its.invalid_num_of_args", {
        onFail: options._log,
        args: { cmd: name }
      });
    }

    const propertyNotOnSubjectErr = prop => $errUtils.cypressErrByPath("invoke_its.nonexistent_prop", {
      args: {
        prop,
        cmd: name
      }
    });

    const propertyValueNullOrUndefinedErr = function(prop, value) {
      const errMessagePath = isCmdIts ? "its" : "invoke";

      return $errUtils.cypressErrByPath(`${errMessagePath}.null_or_undefined_prop_value`, {
        args: {
          prop,
          value,
        },
        cmd: name
      });
    };

    const subjectNullOrUndefinedErr = function(prop, value) {
      const errMessagePath = isCmdIts ? "its" : "invoke";

      return $errUtils.cypressErrByPath(`${errMessagePath}.subject_null_or_undefined`, {
        args: {
          prop,
          cmd: name,
          value,
        }
      });
    };

    const propertyNotOnPreviousNullOrUndefinedValueErr = (prop, value, previousProp) => $errUtils.cypressErrByPath("invoke_its.previous_prop_null_or_undefined", {
      args: {
        prop,
        value,
        previousProp,
        cmd: name
      }
    });

    var traverseObjectAtPath = function(acc, pathsArray, index = 0) {
      //# traverse at this depth
      const prop = pathsArray[index];
      const previousProp = pathsArray[index - 1];
      const valIsNullOrUndefined = _.isNil(acc);

      //# if we're attempting to tunnel into
      //# a null or undefined object...
      if (isProp(prop) && valIsNullOrUndefined) {
        if (index === 0) {
          //# give an error stating the current subject is nil
          traversalErr = subjectNullOrUndefinedErr(prop, acc);
        } else {
          //# else refer to the previous property so users know which prop
          //# caused us to hit this dead end
          traversalErr = propertyNotOnPreviousNullOrUndefinedValueErr(prop, acc, previousProp);
        }

        return acc;
      }

      //# if we have no more properties to traverse
      if (!isProp(prop)) {
        if (valIsNullOrUndefined) {
          //# set traversal error that the final value is null or undefined
          traversalErr = propertyValueNullOrUndefinedErr(previousProp, acc);
        }

        //# finally return the reduced traversed accumulator here
        return acc;
      }

      //# attempt to lookup this property on the acc
      //# if our property does not exist then allow
      //# undefined to pass through but set the traversalErr
      //# since if we don't have any assertions we want to
      //# provide a very specific error message and not the
      //# generic existence one
      if (!(prop in primitiveToObject(acc))) {
        traversalErr = propertyNotOnSubjectErr(prop);

        return undefined;
      }

      //# if we succeeded then continue to traverse
      return traverseObjectAtPath(acc[prop], pathsArray, index + 1);
    };

    const getSettledValue = function(value, subject, propAtLastPath) {
      if (isCmdIts) {
        return value;
      }

      if (_.isFunction(value)) {
        return value.apply(subject, args);
      }

      //# TODO: this logic should likely be part of
      //# traverseObjectAtPath(...) rather be further
      //# away from the handling of traversals. this
      //# causes us to need to separately handle
      //# the 'propAtLastPath' argument since we're
      //# outside of the reduced accumulator.

      //# if we're not a function and we have a traversal
      //# error then throw it now - since that provide a
      //# more specific error regarding non-existant
      //# properties or null or undefined values
      if (traversalErr) {
        throw traversalErr;
      }

      //# else throw that prop isn't a function
      return $errUtils.throwErrByPath("invoke.prop_not_a_function", {
        onFail: options._log,
        args: {
          prop: propAtLastPath,
          type: $utils.stringifyFriendlyTypeof(value)
        }
      });
    };

    const getValue = function() {
      //# reset this on each go around so previous errors
      //# don't leak into new failures or upcoming assertion errors
      let paths;
      traversalErr = null;

      const remoteSubject = cy.getRemotejQueryInstance(subject);

      const actualSubject = remoteSubject || subject;

      if (_.isString(str)) {
        paths = str.split(".");
      } else {
        paths = [str];
      }

      const prop = traverseObjectAtPath(actualSubject, paths);

      const value = getSettledValue(prop, actualSubject, _.last(paths));

      if (options._log) {
        options._log.set({
          consoleProps() {
            const obj = {};

            if (isCmdInvoke) {
              obj["Function"] = message;
              if (args.length) { obj["With Arguments"] = args; }
            } else {
              obj["Property"] = message;
            }

            _.extend(obj, {
              Subject: getFormattedElement(actualSubject),
              Yielded: getFormattedElement(value)
            });

            return obj;
          }
        });
      }

      return value;
    };

    //# by default we want to only add the default assertion
    //# of ensuring existence for cy.its() not cy.invoke() because
    //# invoking a function can legitimately return null or undefined
    const ensureExistenceFor = isCmdIts ? "subject" : false;

    //# wrap retrying into its own
    //# separate function
    var retryValue = () => Promise
    .try(getValue)
    .catch(function(err) {
      options.error = err;
      return cy.retry(retryValue, options);
    });

    return (resolveValue = () => Promise
    .try(retryValue)
    .then(value => cy.verifyUpcomingAssertions(value, options, {
      ensureExistenceFor,
      onRetry: resolveValue,
      onFail(err, isDefaultAssertionErr, assertionLogs) {
        //# if we failed our upcoming assertions and also
        //# exited early out of getting the value of our
        //# subject then reset the error to this one
        if (traversalErr) {
          return options.error = traversalErr;
        }
      }
    })))();
  };

  Commands.addAll({ prevSubject: true }, {
    spread(subject, options, fn) {
      //# if this isnt an array-like blow up right here
      if (!_.isArrayLike(subject)) {
        $errUtils.throwErrByPath("spread.invalid_type");
      }

      subject._spreadArray = true;

      return thenFn(subject, options, fn);
    },

    each(subject, options, fn) {
      const ctx = this;

      if (_.isUndefined(fn)) {
        fn = options;
        options = {};
      }

      if (!_.isFunction(fn)) {
        $errUtils.throwErrByPath("each.invalid_argument");
      }

      const nonArray = () => $errUtils.throwErrByPath("each.non_array", {
        args: {subject: $utils.stringify(subject)}
      });

      try {
        if (!("length" in subject)) {
          nonArray();
        }
      } catch (e) {
        nonArray();
      }

      if (subject.length === 0) {
        return subject;
      }

      //# if we have a next command then we need to
      //# slice in this existing subject as its subject
      //# due to the way we queue promises
      const next = state("current").get("next");
      if (next) {
        var checkSubject = function(newSubject, args) {
          if (state("current") !== next) { return; }

          //# find the new subject and splice it out
          //# with our existing subject
          const index = _.indexOf(args, newSubject);
          if (index > -1) {
            args.splice(index, 1, subject);
          }

          return cy.removeListener("next:subject:prepared", checkSubject);
        };

        cy.on("next:subject:prepared", checkSubject);
      }

      let endEarly = false;

      const yieldItem = function(el, index) {
        if (endEarly) { return; }

        if ($dom.isElement(el)) {
          el = $dom.wrap(el);
        }

        const callback = function() {
          const ret = fn.call(ctx, el, index, subject);

          //# if the return value is false then return early
          if (ret === false) {
            endEarly = true;
          }

          return ret;
        };

        return thenFn(el, options, callback, state);
      };

      //# generate a real array since bluebird is finicky and
      //# doesnt want an 'array-like' structure like jquery instances
      //# need to take into account regular arrays here by first checking
      //# if its an array instance
      return Promise
      .each(_.toArray(subject), yieldItem)
      .return(subject);
    }
  });

  //# temporarily keeping this as a dual command
  //# but it will move to a child command once
  //# cy.resolve + cy.wrap are upgraded to handle
  //# promises
  Commands.addAll({ prevSubject: "optional" }, {
    then() {
      return thenFn.apply(this, arguments);
    }
  });

  return Commands.addAll({ prevSubject: true }, {
    //# making this a dual command due to child commands
    //# automatically returning their subject when their
    //# return values are undefined.  prob should rethink
    //# this and investigate why that is the default behavior
    //# of child commands
    invoke(subject, optionsOrStr, ...args) {
      return invokeFn.apply(this, [subject, optionsOrStr, ...args]);
    },

    its(subject, str, options, ...args) {
      return invokeItsFn.apply(this, [subject, str, options, ...args]);
    }
  });
};
