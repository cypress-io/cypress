const _ = require('lodash')
const Promise = require('bluebird')

const $dom = require('../../../dom')
const $errUtils = require('../../../cypress/error_utils')
const $actionability = require('../../actionability')

const dispatch = (target, appWindow, eventName, options) => {
  const eventConstructor = options.eventConstructor ?? 'Event'
  const ctor = appWindow[eventConstructor]

  if (typeof ctor !== 'function') {
    $errUtils.throwErrByPath('trigger.invalid_event_type', {
      args: { eventConstructor },
    })
  }

  // eventConstructor property should not be added to event instance.
  delete options.eventConstructor

  // https://github.com/cypress-io/cypress/issues/3686
  // UIEvent and its derived events like MouseEvent, KeyboardEvent
  // has a property, view, which is the window object where the event happened.
  // Logic below checks the ctor function is UIEvent itself or its children
  // and adds view to the instance init object.
  if (ctor === appWindow['UIEvent'] || ctor.prototype instanceof appWindow['UIEvent']) {
    options.view = appWindow
  }

  const event = new ctor(eventName, options)

  // some options, like clientX & clientY, must be set on the
  // instance instead of passing them into the constructor
  _.extend(event, options)

  return target.dispatchEvent(event)
}

module.exports = (Commands, Cypress, cy, state, config) => {
  return Commands.addAll({ prevSubject: ['element', 'window', 'document'] }, {
    trigger (subject, eventName, positionOrX, y, userOptions = {}) {
      let position
      let x

      ({ options: userOptions, position, x, y } = $actionability.getPositionFromArguments(positionOrX, y, userOptions))

      const options = _.defaults({}, userOptions, {
        log: true,
        $el: subject,
        bubbles: true,
        cancelable: true,
        position,
        x,
        y,
        waitForAnimations: config('waitForAnimations'),
        animationDistanceThreshold: config('animationDistanceThreshold'),
        scrollBehavior: config('scrollBehavior'),
      })

      if ($dom.isWindow(options.$el)) {
        // get this into a jquery object
        options.$el = $dom.wrap(options.$el)
      }

      // omit entries we know aren't part of an event, but pass anything
      // else through so user can specify what the event object needs
      let eventOptions = _.omit(options, 'log', '$el', 'position', 'x', 'y', 'waitForAnimations', 'animationDistanceThreshold')

      if (options.log) {
        options._log = Cypress.log({
          $el: subject,
          timeout: options.timeout,
          consoleProps () {
            return {
              'Yielded': subject,
              'Event options': eventOptions,
            }
          },
        })

        options._log.snapshot('before', { next: 'after' })
      }

      if (!_.isString(eventName)) {
        $errUtils.throwErrByPath('trigger.invalid_argument', {
          onFail: options._log,
          args: { eventName },
        })
      }

      if (options.$el.length > 1) {
        $errUtils.throwErrByPath('trigger.multiple_elements', {
          onFail: options._log,
          args: { num: options.$el.length },
        })
      }

      let dispatchEarly = false

      // if we're window or document then dispatch early
      // and avoid waiting for actionability
      if ($dom.isWindow(subject) || $dom.isDocument(subject)) {
        dispatchEarly = true
      } else {
        subject = options.$el.first()
      }

      const trigger = () => {
        if (dispatchEarly) {
          return dispatch(subject, state('window'), eventName, eventOptions)
        }

        return $actionability.verify(cy, subject, options, {
          onScroll ($el, type) {
            Cypress.action('cy:scrolled', $el, type)
          },

          onReady ($elToClick, coords) {
            const { fromElWindow, fromElViewport, fromAutWindow } = coords

            if (options._log) {
              // display the red dot at these coords
              options._log.set({
                coords: fromAutWindow,
              })
            }

            eventOptions = _.extend({
              clientX: fromElViewport.x,
              clientY: fromElViewport.y,
              screenX: fromElViewport.x,
              screenY: fromElViewport.y,
              pageX: fromElWindow.x,
              pageY: fromElWindow.y,
            }, eventOptions)

            return dispatch($elToClick.get(0), state('window'), eventName, eventOptions)
          },
        })
      }

      return Promise
      .try(trigger)
      .then(() => {
        const verifyAssertions = () => {
          return cy.verifyUpcomingAssertions(options.$el, options, {
            onRetry: verifyAssertions,
          })
        }

        return verifyAssertions()
      })
    },
  })
}
