const _ = require('lodash')
const $ = require('jquery')
const Promise = require('bluebird')
const $dom = require('../../../dom')
const $utils = require('../../../cypress/utils')
const $actionability = require('../../actionability')

const formatMouseEvents = (events) => {
  return _.map(events, (val, key) => {
    // get event type either from the keyname, or from the sole object key name
    const eventName = (typeof key === 'string') ? key : val.type

    if (val.skipped) {
      const reason = val.skipped

      return {
        'Event Type': eventName,
        'Target Element': reason,
        'Prevented Default': null,
        'Stopped Propagation': null,
        'Active Modifiers': null,
      }
    }

    return {
      'Event Type': eventName,
      'Target Element': val.el,
      'Prevented Default': val.preventedDefault || null,
      'Stopped Propagation': val.stoppedPropagation || null,
      'Active Modifiers': val.modifiers || null,
    }
  })
}

module.exports = (Commands, Cypress, cy, state, config) => {
  const { mouse } = cy.devices

  const mouseAction = (eventName, { subject, positionOrX, y, options, onReady, onTable, defaultOptions }) => {
    let position
    let x

    ({ options, position, x, y } = $actionability.getPositionFromArguments(positionOrX, y, options))

    _.defaults(options, {
      $el: subject,
      log: true,
      verify: true,
      force: false,
      multiple: false,
      position,
      x,
      y,
      errorOnSelect: true,
      waitForAnimations: config('waitForAnimations'),
      animationDistanceThreshold: config('animationDistanceThreshold'),
      ...defaultOptions,
    })

    // throw if we're trying to click multiple elements
    // and we did not pass the multiple flag
    if ((options.multiple === false) && (options.$el.length > 1)) {
      $utils.throwErrByPath('click.multiple_elements', {
        args: { cmd: eventName, num: options.$el.length },
      })
    }

    const perform = (el) => {
      let deltaOptions
      const $el = $dom.wrap(el)

      if (options.log) {
        // figure out the options which actually change the behavior of clicks
        deltaOptions = $utils.filterOutOptions(options, defaultOptions)

        options._log = Cypress.log({
          message: deltaOptions,
          $el,
        })

        options._log.snapshot('before', { next: 'after' })
      }

      if (options.errorOnSelect && $el.is('select')) {
        $utils.throwErrByPath('click.on_select_element', {
          args: { cmd: eventName },
          onFail: options._log,
        })
      }

      // we want to add this delay delta to our
      // runnables timeout so we prevent it from
      // timing out from multiple clicks
      cy.timeout($actionability.delay, true, eventName)

      const createLog = (domEvents, fromElWindow, fromAutWindow) => {
        let consoleObj

        const elClicked = domEvents.moveEvents.el

        if (options._log) {
          consoleObj = options._log.invoke('consoleProps')
        }

        const consoleProps = function () {
          consoleObj = _.defaults(consoleObj != null ? consoleObj : {}, {
            'Applied To': $dom.getElements(options.$el),
            'Elements': options.$el.length,
            'Coords': _.pick(fromElWindow, 'x', 'y'), // always absolute
            'Options': deltaOptions,
          })

          if (options.$el.get(0) !== elClicked) {
            // only do this if $elToClick isnt $el
            consoleObj['Actual Element Clicked'] = $dom.getElements($(elClicked))
          }

          consoleObj.table = _.extend((consoleObj.table || {}), onTable(domEvents))

          return consoleObj
        }

        return Promise
        .delay($actionability.delay, 'click')
        .then(() => {
          // display the red dot at these coords
          if (options._log) {
            // because we snapshot and output a command per click
            // we need to manually snapshot + end them
            options._log.set({ coords: fromAutWindow, consoleProps })
          }

          // we need to split this up because we want the coordinates
          // to mutate our passed in options._log but we dont necessary
          // want to snapshot and end our command if we're a different
          // action like (cy.type) and we're borrowing the click action
          if (options._log && options.log) {
            return options._log.snapshot().end()
          }
        })
        .return(null)
      }

      // must use callbacks here instead of .then()
      // because we're issuing the clicks synchonrously
      // once we establish the coordinates and the element
      // passes all of the internal checks
      return $actionability.verify(cy, $el, options, {
        onScroll ($el, type) {
          return Cypress.action('cy:scrolled', $el, type)
        },

        onReady ($elToClick, coords) {
          const { fromElViewport, fromElWindow, fromAutWindow } = coords

          const forceEl = options.force && $elToClick.get(0)

          const moveEvents = mouse.move(fromElViewport, forceEl)

          const onReadyProps = onReady(fromElViewport, forceEl)

          return createLog({
            moveEvents,
            ...onReadyProps,
          },
          fromElWindow,
          fromAutWindow)
        },
      })
      .catch((err) => {
        // snapshot only on click failure
        err.onFail = function () {
          if (options._log) {
            return options._log.snapshot()
          }
        }

        // if we give up on waiting for actionability then
        // lets throw this error and log the command
        return $utils.throwErr(err, { onFail: options._log })
      })
    }

    return Promise
    .each(options.$el.toArray(), perform)
    .then(() => {
      if (options.verify === false) {
        return options.$el
      }

      const verifyAssertions = () => {
        return cy.verifyUpcomingAssertions(options.$el, options, {
          onRetry: verifyAssertions,
        })
      }

      return verifyAssertions()
    })
  }

  return Commands.addAll({ prevSubject: 'element' }, {
    click (subject, positionOrX, y, options = {}) {
      return mouseAction('click', {
        y,
        subject,
        options,
        positionOrX,
        onReady (fromElViewport, forceEl) {
          const clickEvents = mouse.click(fromElViewport, forceEl)

          return {
            clickEvents,
          }
        },
        onTable (domEvents) {
          return {
            1: () => {
              return {
                name: 'Mouse Events',
                data: _.concat(
                  formatMouseEvents(domEvents.moveEvents.events),
                  formatMouseEvents(domEvents.clickEvents),
                ),
              }
            },
          }
        },
      })
    },

    dblclick (subject, positionOrX, y, options = {}) {
      return mouseAction('dblclick', {
        y,
        subject,
        options,
        // TODO: 4.0 make this false by default
        defaultOptions: { multiple: true },
        positionOrX,
        onReady (fromElViewport, forceEl) {
          const { clickEvents1, clickEvents2, dblclick } = mouse.dblclick(fromElViewport, forceEl)

          return {
            dblclick,
            clickEvents: [clickEvents1, clickEvents2],
          }
        },
        onTable (domEvents) {
          return {
            1: () => {
              return {
                name: 'Mouse Events',
                data: _.concat(
                  formatMouseEvents(domEvents.moveEvents.events),
                  formatMouseEvents(domEvents.clickEvents[0]),
                  formatMouseEvents(domEvents.clickEvents[1]),
                  formatMouseEvents({
                    dblclick: domEvents.dblclick,
                  })
                ),
              }
            },
          }
        },
      })
    },

    rightclick (subject, positionOrX, y, options = {}) {
      return mouseAction('rightclick', {
        y,
        subject,
        options,
        positionOrX,
        onReady (fromElViewport, forceEl) {
          const { clickEvents, contextmenuEvent } = mouse.rightclick(fromElViewport, forceEl)

          return {
            clickEvents,
            contextmenuEvent,
          }
        },
        onTable (domEvents) {
          return {
            1: () => {
              return {
                name: 'Mouse Events',
                data: _.concat(
                  formatMouseEvents(domEvents.moveEvents.events),
                  formatMouseEvents(domEvents.clickEvents),
                  formatMouseEvents(domEvents.contextmenuEvent)
                ),
              }
            },

          }
        },
      })
    },
  })
}
