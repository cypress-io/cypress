/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const $ = require("jquery");
const Promise = require("bluebird");

const $dom = require("../../dom");
const $utils = require("../../cypress/utils");

const $expr = $.expr[":"];

const $contains = $expr.contains;

const restoreContains = () => $expr.contains = $contains;

module.exports = function(Commands, Cypress, cy, state, config) {
  //# restore initially when a run starts
  restoreContains();

  //# restore before each test and whenever we stop
  Cypress.on("test:before:run", restoreContains);
  Cypress.on("stop", restoreContains);

  Commands.addAll({
    focused(options = {}) {
      let resolveFocused;
      _.defaults(options, {
        verify: true,
        log: true
      });

      if (options.log) {
        options._log = Cypress.log();
      }

      const log = function($el) {
        if (options.log === false) { return; }

        return options._log.set({
          $el,
          consoleProps() {
            const ret = $el ?
              $dom.getElements($el)
            :
              "--nothing--";
            return {
              Yielded: ret,
              Elements: ($el != null ? $el.length : undefined) != null ? ($el != null ? $el.length : undefined) : 0
            };
          }
        });
      };

      const getFocused = function() {
        const focused = cy.getFocused();
        log(focused);

        return focused;
      };

      return (resolveFocused = failedByNonAssertion =>
        Promise
        .try(getFocused)
        .then(function($el) {
          if (options.verify === false) {
            return $el;
          }

          if (!$el) {
            $el = $dom.wrap(null);
            $el.selector = "focused";
          }

          //# pass in a null jquery object for assertions
          return cy.verifyUpcomingAssertions($el, options, {
            onRetry: resolveFocused
          });
        })
      )(false);
    },

    get(selector, options = {}) {
      let aliasObj, allParts, needle, resolveElements, toSelect;
      const ctx = this;
      
      if ((options === null) || Array.isArray(options) || (typeof options !== 'object')) { return $utils.throwErrByPath("get.invalid_options", {
          args: { options  }
      }); }
      _.defaults(options, {
        retry: true,
        withinSubject: cy.state("withinSubject"),
        log: true,
        command: null,
        verify: true
      });

      const consoleProps = {};
      const start = function(aliasType) {
        if (options.log === false) { return; }

        return options._log != null ? options._log : (options._log = Cypress.log({
          message: selector,
          referencesAlias: (aliasObj != null ? aliasObj.alias : undefined) ? {name: aliasObj.alias} : undefined,
          aliasType,
          consoleProps() { return consoleProps; }
        }));
      };

      const log = function(value, aliasType = "dom") {
        if (options.log === false) { return; }

        if (!_.isObject(options._log)) { start(aliasType); }

        const obj = {};

        if (aliasType === "dom") {
          _.extend(obj, {
            $el: value,
            numRetries: options._retries
          });
        }

        obj.consoleProps = function() {
          const key = aliasObj ? "Alias" : "Selector";
          consoleProps[key] = selector;

          switch (aliasType) {
            case "dom":
              _.extend(consoleProps, {
                Yielded: $dom.getElements(value),
                Elements: (value != null ? value.length : undefined)
              });
              break;

            case "primitive":
              _.extend(consoleProps, {
                Yielded: value
              });
              break;

            case "route":
              _.extend(consoleProps, {
                Yielded: value
              });
              break;
          }

          return consoleProps;
        };

        return options._log.set(obj);
      };

      //# We want to strip everything after the last '.'
      //# only when it is potentially a number or 'all'
      if ((_.indexOf(selector, ".") === -1) ||
      (needle = selector.slice(1), _.keys(cy.state("aliases")).includes(needle))) {
        toSelect = selector;
      } else {
         allParts = _.split(selector, '.');
         toSelect = _.join(_.dropRight(allParts, 1), '.');
       }

      if (aliasObj = cy.getAlias(toSelect)) {
        let resolveAlias;
        let {subject, alias, command} = aliasObj;

        return (resolveAlias = function() {
          let left, needle1, verifyAssertions;
          switch (false) {
            //# if this is a DOM element
            case !$dom.isElement(subject):
              var replayFrom = false;

              var replay = function() {
                cy.replayCommandsFrom(command);

                //# its important to return undefined
                //# here else we trick cypress into thinking
                //# we have a promise violation
                return undefined;
              };

              //# if we're missing any element
              //# within our subject then filter out
              //# anything not currently in the DOM
              if ($dom.isDetached(subject)) {
                subject = subject.filter((index, el) => $dom.isAttached(el));

                //# if we have nothing left
                //# just go replay the commands
                if (!subject.length) {
                  return replay();
                }
              }

              log(subject);

              return cy.verifyUpcomingAssertions(subject, options, {
                onFail(err) {
                  //# if we are failing because our aliased elements
                  //# are less than what is expected then we know we
                  //# need to requery for them and can thus replay
                  //# the commands leading up to the alias
                  if ((err.type === "length") && (err.actual < err.expected)) {
                    return replayFrom = true;
                  }
                },
                onRetry() {
                  if (replayFrom) {
                    return replay();
                  } else {
                    return resolveAlias();
                  }
                }
              });

            //# if this is a route command
            case command.get("name") !== "route":
              if (!((_.indexOf(selector, ".") === -1) ||
              (needle1 = selector.slice(1), _.keys(cy.state("aliases")).includes(needle1)))) {
                allParts = _.split(selector, ".");
                const index = _.last(allParts);
                alias = _.join([alias, index], ".");
              }
              var requests = (left = cy.getRequestsByAlias(alias)) != null ? left : null;
              log(requests, "route");
              return requests;
            default:
              //# log as primitive
              log(subject, "primitive");

              return (verifyAssertions = () => {
                return cy.verifyUpcomingAssertions(subject, options, {
                  ensureExistenceFor: false,
                  onRetry: verifyAssertions
                });
              })();
          }
        })();
      }

      start("dom");

      const setEl = function($el) {
        if (options.log === false) { return; }

        consoleProps.Yielded = $dom.getElements($el);
        consoleProps.Elements = $el != null ? $el.length : undefined;

        return options._log.set({$el});
      };

      const getElements = function() {
        //# attempt to query for the elements by withinSubject context
        //# and catch any sizzle errors!
        let $el;
        try {
          $el = cy.$$(selector, options.withinSubject);
          //# jQuery v3 has removed its deprecated properties like ".selector"
          //# https://jquery.com/upgrade-guide/3.0/breaking-change-deprecated-context-and-selector-properties-removed
          //# but our error messages use this property to actually show the missing element
          //# so let's put it back
          if ($el.selector == null) { $el.selector = selector; }
        } catch (e) {
          e.onFail = function() { if (options.log === false) { return e; } else { return options._log.error(e); } };
          throw e;
        }

        //# if that didnt find anything and we have a within subject
        //# and we have been explictly told to filter
        //# then just attempt to filter out elements from our within subject
        if (!$el.length && options.withinSubject && options.filter) {
          const filtered = options.withinSubject.filter(selector);

          //# reset $el if this found anything
          if (filtered.length) { $el = filtered; }
        }

        //# store the $el now in case we fail
        setEl($el);

        //# allow retry to be a function which we ensure
        //# returns truthy before returning its
        if (_.isFunction(options.onRetry)) {
          let ret;
          if (ret = options.onRetry.call(ctx, $el)) {
            log($el);
            return ret;
          }
        } else {
          log($el);
          return $el;
        }
      };

      return (resolveElements = () =>
        Promise.try(getElements).then(function($el) {
          if (options.verify === false) {
            return $el;
          }

          return cy.verifyUpcomingAssertions($el, options, {
            onRetry: resolveElements
          });
        })
      )();
    },

    root(options = {}) {
      let withinSubject;
      _.defaults(options, {log: true});

      if (options.log !== false) {
        options._log = Cypress.log({message: ""});
      }

      const log = function($el) {
        if (options.log) { options._log.set({$el}); }

        return $el;
      };

      if (withinSubject = cy.state("withinSubject")) {
        return log(withinSubject);
      }

      return cy.now("get", "html", {log: false}).then(log);
    }
  });

  Commands.addAll({ prevSubject: ["optional", "window", "document", "element"] }, {
    contains(subject, filter, text, options = {}) {
      //# nuke our subject if its present but not an element.
      //# in these cases its either window or document but
      //# we dont care.
      //# we'll null out the subject so it will show up as a parent
      //# command since its behavior is identical to using it
      //# as a parent command: cy.contains()
      let consoleProps;
      if (subject && !$dom.isElement(subject)) {
        subject = null;
      }

      switch (false) {
        //# .contains(filter, text)
        case !_.isRegExp(text):
          text = text;
          filter = filter;
          break;
        //# .contains(text, options)
        case !_.isObject(text):
          options = text;
          text = filter;
          filter = "";
          break;
        //# .contains(text)
        case !_.isUndefined(text):
          text = filter;
          filter = "";
          break;
      }

      _.defaults(options, {log: true});

      if (!(_.isString(text) || _.isFinite(text) || _.isRegExp(text))) { $utils.throwErrByPath("contains.invalid_argument"); }
      if (_.isBlank(text)) { $utils.throwErrByPath("contains.empty_string"); }

      const getPhrase = function(type, negated) {
        switch (false) {
          case !filter || !subject:
            var node = $dom.stringify(subject, "short");
            return `within the element: ${node} and with the selector: '${filter}' `;
          case !filter:
            return `within the selector: '${filter}' `;
          case !subject:
            node = $dom.stringify(subject, "short");
            return `within the element: ${node} `;
          default:
            return "";
        }
      };

      const getErr = function(err) {
        const {type, negated, node} = err;

        switch (type) {
          case "existence":
            if (negated) {
              return `Expected not to find content: '${text}' ${getPhrase(type, negated)}but continuously found it.`;
            } else {
              return `Expected to find content: '${text}' ${getPhrase(type, negated)}but never did.`;
            }
        }
      };

      if (options.log !== false) {
        consoleProps = {
          Content: text,
          "Applied To": $dom.getElements(subject || cy.state("withinSubject"))
        };

        options._log = Cypress.log({
          message: _.compact([filter, text]),
          type: subject ? "child" : "parent",
          consoleProps() { return consoleProps; }
        });
      }

      const setEl = function($el) {
        if (options.log === false) { return; }

        consoleProps.Yielded = $dom.getElements($el);
        consoleProps.Elements = $el != null ? $el.length : undefined;

        return options._log.set({$el});
      };

      if (_.isRegExp(text)) {
        $expr.contains = elem =>
          //# taken from jquery's normal contains method
          text.test(elem.textContent || elem.innerText || $.text(elem))
        ;
      }

      //# find elements by the :contains psuedo selector
      //# and any submit inputs with the attributeContainsWord selector
      const selector = $dom.getContainsSelector(text, filter);

      const checkToAutomaticallyRetry = function(count, $el) {
        //# we should automatically retry querying
        //# if we did not have any upcoming assertions
        //# and our $el's length was 0, because that means
        //# the element didnt exist in the DOM and the user
        //# did not explicitly request that it does not exist
        if ((count !== 0) || ($el && $el.length)) { return; }

        //# throw here to cause the .catch to trigger
        throw new Error();
      };

      var resolveElements = function() {
        const getOpts = _.extend(_.clone(options), {
          // error: getErr(text, phrase)
          withinSubject: subject || cy.state("withinSubject") || cy.$$("body"),
          filter: true,
          log: false,
          // retry: false ## dont retry because we perform our own element validation
          verify: false //# dont verify upcoming assertions, we do that ourselves
        });

        return cy.now("get", selector, getOpts).then(function($el) {
          if ($el && $el.length) {
            $el = $dom.getFirstDeepestElement($el);
          }

          setEl($el);

          return cy.verifyUpcomingAssertions($el, options, {
            onRetry: resolveElements,
            onFail(err) {
              switch (err.type) {
                case "length":
                  if (err.expected > 1) {
                    return $utils.throwErrByPath("contains.length_option", { onFail: options._log });
                  }
                  break;
                case "existence":
                  return err.displayMessage = getErr(err);
              }
            }
          });
        });
      };

      return Promise
      .try(resolveElements)
      .finally(() =>
        //# always restore contains in case
        //# we used a regexp!
        restoreContains()
      );
    }
  });

  return Commands.addAll({ prevSubject: "element" }, {
    within(subject, options, fn) {
      const ctx = this;

      if (_.isUndefined(fn)) {
        fn = options;
        options = {};
      }

      _.defaults(options, {log: true});

      if (options.log) {
        options._log = Cypress.log({
          $el: subject,
          message: ""
        });
      }

      if (!_.isFunction(fn)) { $utils.throwErrByPath("within.invalid_argument", { onFail: options._log }); }

      //# reference the next command after this
      //# within.  when that command runs we'll
      //# know to remove withinSubject
      const next = cy.state("current").get("next");

      //# backup the current withinSubject
      //# this prevents a bug where we null out
      //# withinSubject when there are nested .withins()
      //# we want the inner within to restore the outer
      //# once its done
      const prevWithinSubject = cy.state("withinSubject");
      cy.state("withinSubject", subject);

      fn.call(ctx, subject);

      const cleanup = () => cy.removeListener("command:start", setWithinSubject);

      //# we need a mechanism to know when we should remove
      //# our withinSubject so we dont accidentally keep it
      //# around after the within callback is done executing
      //# so when each command starts, check to see if this
      //# is the command which references our 'next' and
      //# if so, remove the within subject
      var setWithinSubject = function(obj) {
        if (obj !== next) { return; }

        //# okay so what we're doing here is creating a property
        //# which stores the 'next' command which will reset the
        //# withinSubject.  If two 'within' commands reference the
        //# exact same 'next' command, then this prevents accidentally
        //# resetting withinSubject more than once.  If they point
        //# to differnet 'next's then its okay
        if (next !== cy.state("nextWithinSubject")) {
          cy.state("withinSubject", prevWithinSubject || null);
          cy.state("nextWithinSubject", next);
        }

        //# regardless nuke this listeners
        return cleanup();
      };

      //# if next is defined then we know we'll eventually
      //# unbind these listeners
      if (next) {
        cy.on("command:start", setWithinSubject);
      } else {
        //# remove our listener if we happen to reach the end
        //# event which will finalize cleanup if there was no next obj
        cy.once("command:queue:before:end", function() {
          cleanup();

          return cy.state("withinSubject", null);
        });
      }

      return subject;
    }
  });
};
