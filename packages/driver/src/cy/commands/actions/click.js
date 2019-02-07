const _ = require('lodash')
const $ = require('jquery')
const Promise = require('bluebird')
const $dom = require('../../../dom')
const $utils = require('../../../cypress/utils')
const $actionability = require('../../actionability')

module.exports = (Commands, Cypress, cy, state, config) => {
  const mouse = cy.internal.mouse

  return Commands.addAll({ prevSubject: 'element' }, {
    click (subject, positionOrX, y, options = {}) {
    //# TODO handle pointer-events: none
    //# http://caniuse.com/#feat=pointer-events

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
      })

      //# throw if we're trying to click multiple elements
      //# and we did not pass the multiple flag
      if ((options.multiple === false) && (options.$el.length > 1)) {
        $utils.throwErrByPath('click.multiple_elements', {
          args: { cmd: 'click', num: options.$el.length },
        })
      }

      const click = (el) => {
        let deltaOptions
        const $el = $dom.wrap(el)

        if (options.log) {
        //# figure out the options which actually change the behavior of clicks
          deltaOptions = $utils.filterOutOptions(options)

          options._log = Cypress.log({
            message: deltaOptions,
            $el,
          })

          options._log.snapshot('before', { next: 'after' })
        }

        if (options.errorOnSelect && $el.is('select')) {
          $utils.throwErrByPath('click.on_select_element', { args: { cmd: 'click' }, onFail: options._log })
        }

        //# we want to add this delay delta to our
        //# runnables timeout so we prevent it from
        //# timing out from multiple clicks
        cy.timeout($actionability.delay, true, 'click')

        const createLog = (domEvents, fromWindowCoords) => {
          let consoleObj

          const elClicked = domEvents.moveEvents.el

          if (options._log) {
            consoleObj = options._log.invoke('consoleProps')
          }

          const consoleProps = function () {
            consoleObj = _.defaults(consoleObj != null ? consoleObj : {}, {
              'Applied To': $dom.getElements(options.$el),
              'Elements': options.$el.length,
              'Coords': _.pick(fromWindowCoords, 'x', 'y'), //# always absolute
              'Options': deltaOptions,
            })

            if (options.$el.get(0) !== elClicked) {
              //# only do this if $elToClick isnt $el
              consoleObj['Actual Element Clicked'] = $dom.getElements($(elClicked))
            }

            consoleObj.table = _.extend((consoleObj.table || {}), {
              1: () => {
                return formatMoveEventsTable(domEvents.moveEvents.events)
              },
              2: () => {
                return {
                  name: 'Mouse Click Events',
                  data: formatMouseEvents(domEvents.clickEvents),
                }
              },
            })

            return consoleObj
          }

          return Promise
          .delay($actionability.delay, 'click')
          .then(() => {
            //# display the red dot at these coords
            if (options._log) {
              //# because we snapshot and output a command per click
              //# we need to manually snapshot + end them
              options._log.set({ coords: fromWindowCoords, consoleProps })
            }

            //# we need to split this up because we want the coordinates
            //# to mutate our passed in options._log but we dont necessary
            //# want to snapshot and end our command if we're a different
            //# action like (cy.type) and we're borrowing the click action
            if (options._log && options.log) {
              return options._log.snapshot().end()
            }
          }).return(null)
        }

        //# must use callbacks here instead of .then()
        //# because we're issuing the clicks synchonrously
        //# once we establish the coordinates and the element
        //# passes all of the internal checks
        return $actionability.verify(cy, $el, options, {
          onScroll ($el, type) {
            return Cypress.action('cy:scrolled', $el, type)
          },

          onReady: ($elToClick, coords) => {
            const { fromWindow, fromViewport } = coords

            const forceEl = options.force && $elToClick.get(0)

            const moveEvents = mouse.mouseMove(fromViewport, forceEl)

            const clickEvents = mouse.mouseClick(fromViewport, forceEl)

            return createLog({ moveEvents, clickEvents }, fromWindow)

          },
        })
        .catch((err) => {
        //# snapshot only on click failure
          err.onFail = function () {
            if (options._log) {
              return options._log.snapshot()
            }
          }

          //# if we give up on waiting for actionability then
          //# lets throw this error and log the command
          return $utils.throwErr(err, { onFail: options._log })
        })
      }

      return Promise
      .each(options.$el.toArray(), click)
      .then(() => {
        let verifyAssertions

        if (options.verify === false) {
          return options.$el
        }

        return (verifyAssertions = () => {
          return cy.verifyUpcomingAssertions(options.$el, options, {
            onRetry: verifyAssertions,
          })
        })()
      })
    },

    //# update dblclick to use the click
    //# logic and just swap out the event details?
    dblclick (subject, positionOrX, y, options = {}) {

      let position
      let x

      ({ options, position, x, y } = $actionability.getPositionFromArguments(positionOrX, y, options))

      _.defaults(options, {
        $el: subject,
        log: true,
        verify: true,
        force: false,
        // TODO: 4.0 make this false by default
        multiple: true,
        position,
        x,
        y,
        errorOnSelect: true,
        waitForAnimations: config('waitForAnimations'),
        animationDistanceThreshold: config('animationDistanceThreshold'),
      })

      //# throw if we're trying to click multiple elements
      //# and we did not pass the multiple flag
      if ((options.multiple === false) && (options.$el.length > 1)) {
        $utils.throwErrByPath('click.multiple_elements', {
          args: { cmd: 'dblclick', num: options.$el.length },
        })
      }

      const dblclick = (el) => {
        let deltaOptions
        const $el = $dom.wrap(el)

        if (options.log) {
        //# figure out the options which actually change the behavior of clicks
          deltaOptions = $utils.filterOutOptions(options)

          options._log = Cypress.log({
            message: deltaOptions,
            $el,
          })

          options._log.snapshot('before', { next: 'after' })
        }

        if (options.errorOnSelect && $el.is('select')) {
          $utils.throwErrByPath('click.on_select_element', { args: { cmd: 'dblclick' }, onFail: options._log })
        }

        //# we want to add this delay delta to our
        //# runnables timeout so we prevent it from
        //# timing out from multiple clicks
        cy.timeout($actionability.delay, true, 'dblclick')

        const createLog = (domEvents, fromWindowCoords) => {
          let consoleObj

          const elClicked = domEvents.moveEvents.el

          if (options._log) {
            consoleObj = options._log.invoke('consoleProps')
          }

          const consoleProps = function () {
            consoleObj = _.defaults(consoleObj != null ? consoleObj : {}, {
              'Applied To': $dom.getElements(options.$el),
              'Elements': options.$el.length,
              'Coords': _.pick(fromWindowCoords, 'x', 'y'), //# always absolute
              'Options': deltaOptions,
            })

            if (options.$el.get(0) !== elClicked) {
              //# only do this if $elToClick isnt $el
              consoleObj['Actual Element Clicked'] = $dom.getElements(elClicked)
            }

            consoleObj.table = _.extend((consoleObj.table || {}), {
              1: () => {
                return formatMoveEventsTable(domEvents.moveEvents.events)
              },
              2: () => {
                return {
                  name: 'Mouse Click Events',
                  data: _.concat(
                    formatMouseEvents(domEvents.clickEvents[0], formatMouseEvents),
                    formatMouseEvents(domEvents.clickEvents[1], formatMouseEvents)
                  ),
                }
              },
              3: () => {
                return {
                  name: 'Mouse Dblclick Event',
                  data: formatMouseEvents({ dblclickProps: domEvents.dblclickProps }),
                }
              },
            })

            return consoleObj
          }

          return Promise
          .delay($actionability.delay, 'click')
          .then(() => {
            //# display the red dot at these coords
            if (options._log) {
              //# because we snapshot and output a command per click
              //# we need to manually snapshot + end them
              options._log.set({ coords: fromWindowCoords, consoleProps })
            }

            //# we need to split this up because we want the coordinates
            //# to mutate our passed in options._log but we dont necessary
            //# want to snapshot and end our command if we're a different
            //# action like (cy.type) and we're borrowing the click action
            if (options._log && options.log) {
              return options._log.snapshot().end()
            }
          }).return(null)
        }

        //# must use callbacks here instead of .then()
        //# because we're issuing the clicks synchonrously
        //# once we establish the coordinates and the element
        //# passes all of the internal checks
        return $actionability.verify(cy, $el, options, {
          onScroll ($el, type) {
            return Cypress.action('cy:scrolled', $el, type)
          },

          onReady: ($elToClick, coords) => {
            const { fromWindow, fromViewport } = coords
            const forceEl = options.force && $elToClick.get(0)
            const moveEvents = mouse.mouseMove(fromViewport, forceEl)
            const { clickEvents1, clickEvents2, dblclickProps } = mouse.dblclick(fromViewport, forceEl)

            return createLog({
              moveEvents,
              clickEvents: [clickEvents1, clickEvents2],
              dblclickProps,
            }, fromWindow)
          },
        })
        .catch((err) => {
        //# snapshot only on click failure
          err.onFail = function () {
            if (options._log) {
              return options._log.snapshot()
            }
          }

          //# if we give up on waiting for actionability then
          //# lets throw this error and log the command
          return $utils.throwErr(err, { onFail: options._log })
        })
      }

      return Promise
      .each(options.$el.toArray(), dblclick)
      .then(() => {
        let verifyAssertions

        if (options.verify === false) {
          return options.$el
        }

        return (verifyAssertions = () => {
          return cy.verifyUpcomingAssertions(options.$el, options, {
            onRetry: verifyAssertions,
          })
        })()
      })
    },
  })
}

const formatMoveEventsTable = (events) => {

  return {
    name: `Mouse Move Events${events ? '' : ' (skipped)'}`,
    data: _.map(events, (obj) => {
      const key = _.keys(obj)[0]
      const val = obj[_.keys(obj)[0]]

      if (val.skipped) {
        const reason = val.skipped

        return {
          'Event Name': key,
          'Target Element': reason,
          'Prevented Default?': null,
          'Stopped Propagation?': null,
        // 'Modifiers': null,
        }
      }

      return {
        'Event Name': key,
        'Target Element': val.el,
        'Prevented Default?': val.preventedDefault,
        'Stopped Propagation?': val.stoppedPropagation,
      // 'Modifiers': val.modifiers ? val.modifiers : null,
      }
    }),
  }
}

const formatMouseEvents = (events) => {
  return _.map(events, (val, key) => {

    if (val.skipped) {

      const reason = val.skipped

      return {
        'Event Name': key.slice(0, -5),
        'Target Element': reason,
        'Prevented Default?': null,
        'Stopped Propagation?': null,
        'Modifiers': null,
      }
    }

    return {
      'Event Name': key.slice(0, -5),
      'Target Element': val.el,
      'Prevented Default?': val.preventedDefault,
      'Stopped Propagation?': val.stoppedPropagation,
      'Modifiers': val.modifiers ? val.modifiers : null,
    }
  })
}
