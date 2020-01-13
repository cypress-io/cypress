/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const Promise = require("bluebird");

const $dom = require("../../../dom");
const $elements = require("../../../dom/elements");
const $window = require("../../../dom/window");
const $utils = require("../../../cypress/utils");
const $actionability = require("../../actionability");

const dispatch = function(target, eventName, options) {
  const event = new Event(eventName, options);

  //# some options, like clientX & clientY, must be set on the
  //# instance instead of passing them into the constructor
  _.extend(event, options);

  return target.dispatchEvent(event);
};

module.exports = (Commands, Cypress, cy, state, config) => Commands.addAll({ prevSubject: ["element", "window", "document"] }, {
  trigger(subject, eventName, positionOrX, y, options = {}) {
    let position, x;
    ({options, position, x, y} = $actionability.getPositionFromArguments(positionOrX, y, options));

    _.defaults(options, {
      log: true,
      $el: subject,
      bubbles: true,
      cancelable: true,
      position,
      x,
      y,
      waitForAnimations: config("waitForAnimations"),
      animationDistanceThreshold: config("animationDistanceThreshold")
    });

    if ($dom.isWindow(options.$el)) {
      //# get this into a jquery object
      options.$el = $dom.wrap(options.$el);
    }


    //# omit entries we know aren't part of an event, but pass anything
    //# else through so user can specify what the event object needs
    let eventOptions = _.omit(options, "log", "$el", "position", "x", "y", "waitForAnimations", "animationDistanceThreshold");

    if (options.log) {
      options._log = Cypress.log({
        $el: subject,
        consoleProps() {
          return {
            "Yielded": subject,
            "Event options": eventOptions
          };
        }
      });

      options._log.snapshot("before", {next: "after"});
    }

    if (!_.isString(eventName)) {
      $utils.throwErrByPath("trigger.invalid_argument", {
        onFail: options._log,
        args: { eventName }
      });
    }

    if (options.$el.length > 1) {
      $utils.throwErrByPath("trigger.multiple_elements", {
        onFail: options._log,
        args: { num: options.$el.length }
      });
    }

    let dispatchEarly = false;

    //# if we're window or document then dispatch early
    //# and avoid waiting for actionability
    if ($dom.isWindow(subject) || $dom.isDocument(subject)) {
      dispatchEarly = true;
    } else {
      subject = options.$el.first();
    }

    const trigger = function() {
      if (dispatchEarly) {
        return dispatch(subject, eventName, eventOptions);
      }

      return $actionability.verify(cy, subject, options, {
        onScroll($el, type) {
          return Cypress.action("cy:scrolled", $el, type);
        },

        onReady($elToClick, coords) {
          const { fromElWindow, fromElViewport, fromAutWindow } = coords;

          if (options._log) {
            //# display the red dot at these coords
            options._log.set({
              coords: fromAutWindow
            });
          }

          eventOptions = _.extend({
            clientX: fromElViewport.x,
            clientY: fromElViewport.y,
            screenX: fromElViewport.x,
            screenY: fromElViewport.y,
            pageX: fromElWindow.x,
            pageY: fromElWindow.y
          }, eventOptions);

          return dispatch($elToClick.get(0), eventName, eventOptions);
        }
    });
    };

    return Promise
    .try(trigger)
    .then(function() {
      let verifyAssertions;
      return (verifyAssertions = () => cy.verifyUpcomingAssertions(subject, options, {
        onRetry: verifyAssertions
      }))();
    });
  }
});
