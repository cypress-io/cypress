/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const $ = require("jquery");
const Promise = require("bluebird");

const $dom = require("../../dom");
const $errUtils = require("../../cypress/error_utils");

const bRe            = /(\*\*)(.+)(\*\*)/;
const bTagOpen       = /\*\*/g;
const bTagClosed     = /\*\*/g;
const reExistence    = /exist/;
const reEventually   = /^eventually/;
const reHaveLength   = /length/;

const convertTags = function(str) {
  //# must first escape these characters
  //# since we will be inserting them
  //# as real html
  str = _.escape(str);

  //# bail if matches werent found
  if (!bRe.test(str)) { return str; }

  return str
    .replace(bTagOpen, ": <strong>")
    .replace(bTagClosed, "</strong>")
    .split(" :").join(":");
};

const convertMessage = function($row, message) {
  message = convertTags(message);

  return $row.find("[data-js=message]").html(message);
};

const convertRowFontSize = function($row, message) {
  const len = message.length;

  //# bail if this isnt a huge message
  if (len < 100) { return; }

  //# else reduce the font-size down to 85%
  //# and reduce the line height
  return $row.css({
    fontSize: "85%",
    lineHeight: "14px"
  });
};

module.exports = function(Commands, Cypress, cy, state, config) {
  const shouldFnWithCallback = function(subject, fn) {
    return Promise
    .try(() => {
      const remoteSubject = cy.getRemotejQueryInstance(subject);

      return fn.call(this, remoteSubject != null ? remoteSubject : subject);
  }).return(subject);
  };

  const shouldFn = function(subject, chainers, ...args) {
    let err, isCheckingExistence;
    if (_.isFunction(chainers)) {
      return shouldFnWithCallback.apply(this, arguments);
    }

    let exp = cy.expect(subject).to;
    const originalChainers = chainers;

    const throwAndLogErr = err => {
      //# since we are throwing our own error
      //# without going through the assertion we need
      //# to ensure our .should command gets logged
      const log = Cypress.log({
        name: "should",
        type: "child",
        message: [].concat(originalChainers, args),
        end: true,
        snapshot: true,
        error: err
      });

      return $errUtils.throwErr(err, { onFail: log });
    };

    chainers = chainers.split(".");
    const lastChainer = _.last(chainers);

    //# backup the original assertion subject
    const originalObj = exp._obj;

    const options = {};

    if (reEventually.test(chainers)) {
      err = $errUtils.cypressErrByPath('should.eventually_deprecated');
      err.retry = false;
      throwAndLogErr(err);
    }

    //# are we doing a length assertion?
    if (reHaveLength.test(chainers) || reExistence.test(chainers)) {
      isCheckingExistence = true;
    }

    const applyChainer = function(memo, value) {
      if (value === lastChainer) {
        if (_.isFunction(memo[value])) {
          try {
            return memo[value].apply(memo, args);
          } catch (err) {
            //# if we made it all the way to the actual
            //# assertion but its set to retry false then
            //# we need to log out this .should since there
            //# was a problem with the actual assertion syntax
            if (err.retry === false) {
              return throwAndLogErr(err);
            } else {
              throw err;
            }
          }
        } else {
          return memo[value];
        }
      } else {
        return memo[value];
      }
    };

    const applyChainers = function() {
      //# if we're not doing existence or length assertions
      //# then check to ensure the subject exists
      //# in the DOM if its a DOM subject
      //# because its possible we're asserting about an
      //# element which has left the DOM and we always
      //# want to auto-fail on those
      if (!isCheckingExistence && $dom.isElement(subject)) {
        cy.ensureAttached(subject, "should");
      }

      const newExp = _.reduce(chainers, (memo, value) => {
        if (!(value in memo)) {
          err = $errUtils.cypressErrByPath('should.chainer_not_found', { args: { chainer: value } });
          err.retry = false;
          throwAndLogErr(err);
        }

        return applyChainer(memo, value);
      }

      , exp);

      return exp = newExp != null ? newExp : exp;
    };

    return Promise.try(applyChainers).then(function() {
      //# if the _obj has been mutated then we
      //# are chaining assertion properties and
      //# should return this new subject
      if (originalObj !== exp._obj) {
        return exp._obj;
      }

      return subject;
    });
  };


  return Commands.addAll({ type: "assertion", prevSubject: true },{
    should() {
      return shouldFn.apply(this, arguments);
    },

    and() {
      return shouldFn.apply(this, arguments);
    }
  });
};
