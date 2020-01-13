/* eslint-disable
    default-case,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const $ = require('jquery')
const Promise = require('bluebird')

const $dom = require('../../../dom')
const $utils = require('../../../cypress/utils')

const findScrollableParent = function ($el, win) {
  const $parent = $el.parent()

  // if we're at the body, we just want to pass in
  // window into jQuery scrollTo
  if ($parent.is('body,html') || $dom.isDocument($parent)) {
    return win
  }

  if ($dom.isScrollable($parent)) {
    return $parent
  }

  return findScrollableParent($parent, win)
}

const isNaNOrInfinity = function (item) {
  const num = Number.parseFloat(item)

  return _.isNaN(num) || !_.isFinite(num)
}

module.exports = function (Commands, Cypress, cy, state, config) {
  Commands.addAll({ prevSubject: 'element' }, {
    scrollIntoView (subject, options = {}) {
      let parentIsWin

      if (!_.isObject(options)) {
        $utils.throwErrByPath('scrollIntoView.invalid_argument', { args: { arg: options } })
      }

      // ensure the subject is not window itself
      // cause how are you gonna scroll the window into view...
      if (subject === state('window')) {
        $utils.throwErrByPath('scrollIntoView.subject_is_window')
      }

      // throw if we're trying to scroll to multiple elements
      if (subject.length > 1) {
        $utils.throwErrByPath('scrollIntoView.multiple_elements', { args: { num: subject.length } })
      }

      _.defaults(options, {
        $el: subject,
        $parent: state('window'),
        log: true,
        duration: 0,
        easing: 'swing',
        axis: 'xy',
      })

      // figure out the options which actually change the behavior of clicks
      let deltaOptions = $utils.filterOutOptions(options)

      // here we want to figure out what has to actually
      // be scrolled to get to this element, cause we need
      // to scrollTo passing in that element.
      options.$parent = findScrollableParent(options.$el, state('window'))

      if (options.$parent === state('window')) {
        parentIsWin = true
        // jQuery scrollTo looks for the prop contentWindow
        // otherwise it'll use the wrong window to scroll :(
        options.$parent.contentWindow = options.$parent
      }

      // if we cannot parse an integer out of duration
      // which could be 500 or "500", then it's NaN...throw
      if (isNaNOrInfinity(options.duration)) {
        $utils.throwErrByPath('scrollIntoView.invalid_duration', { args: { duration: options.duration } })
      }

      if (!((options.easing === 'swing') || (options.easing === 'linear'))) {
        $utils.throwErrByPath('scrollIntoView.invalid_easing', { args: { easing: options.easing } })
      }

      if (options.log) {
        deltaOptions = $utils.filterOutOptions(options, { duration: 0, easing: 'swing', offset: { left: 0, top: 0 } })

        const log = {
          $el: options.$el,
          message: deltaOptions,
          consoleProps () {
            const obj = {
              // merge into consoleProps without mutating it
              'Applied To': $dom.getElements(options.$el),
              'Scrolled Element': $dom.getElements(options.$el),
            }

            return obj
          },
        }

        options._log = Cypress.log(log)
      }

      if (!parentIsWin) {
        // scroll the parent into view first
        // before attemp
        options.$parent[0].scrollIntoView()
      }

      const scrollIntoView = () => {
        return new Promise((resolve, reject) => {
        // scroll our axes
          return $(options.$parent).scrollTo(options.$el, {
            axis: options.axis,
            easing: options.easing,
            duration: options.duration,
            offset: options.offset,
            done (animation, jumpedToEnd) {
              return resolve(options.$el)
            },
            fail (animation, jumpedToEnd) {
            // its Promise object is rejected
              try {
                return $utils.throwErrByPath('scrollTo.animation_failed')
              } catch (err) {
                return reject(err)
              }
            },
            always () {
              if (parentIsWin) {
                return delete options.$parent.contentWindow
              }
            },
          })
        })
      }

      return scrollIntoView()
      .then(($el) => {
        let verifyAssertions

        return (verifyAssertions = () => {
          return cy.verifyUpcomingAssertions($el, options, {
            onRetry: verifyAssertions,
          })
        })()
      })
    },
  })

  return Commands.addAll({ prevSubject: ['optional', 'element', 'window'] }, {
    scrollTo (subject, xOrPosition, yOrOptions, options = {}) {
      // check for undefined or null values
      let $container; let isWin; let x; let y

      if ((xOrPosition == null)) {
        $utils.throwErrByPath('scrollTo.invalid_target', { args: { x } })
      }

      if (_.isObject(yOrOptions)) {
        options = yOrOptions
      } else {
        y = yOrOptions
      }

      let position = null

      // we may be '50%' or 'bottomCenter'
      if (_.isString(xOrPosition)) {
        // if there's a number in our string, then
        // don't check for positions and just set x
        // this will check for NaN, etc - we need to explicitly
        // include '0%' as a use case
        if (Number.parseFloat(xOrPosition) || (Number.parseFloat(xOrPosition) === 0)) {
          x = xOrPosition
        } else {
          position = xOrPosition
          // make sure it's one of the valid position strings
          cy.ensureValidPosition(position)
        }
      } else {
        x = xOrPosition
      }

      switch (position) {
        case 'topLeft':
          x = 0 // y = 0
          break
        case 'top':
          x = '50%' // y = 0
          break
        case 'topRight':
          x = '100%' // y = 0
          break
        case 'left':
          x = 0
          y = '50%'
          break
        case 'center':
          x = '50%'
          y = '50%'
          break
        case 'right':
          x = '100%'
          y = '50%'
          break
        case 'bottomLeft':
          x = 0
          y = '100%'
          break
        case 'bottom':
          x = '50%'
          y = '100%'
          break
        case 'bottomRight':
          x = '100%'
          y = '100%'
          break
      }

      if (y == null) {
        y = 0
      }

      if (x == null) {
        x = 0
      }

      // if our subject is window let it fall through
      if (subject && (!$dom.isWindow(subject))) {
        // if they passed something here, its a DOM element
        $container = subject
      } else {
        isWin = true
        // if we don't have a subject, then we are a parent command
        // assume they want to scroll the entire window.
        $container = state('window')

        // jQuery scrollTo looks for the prop contentWindow
        // otherwise it'll use the wrong window to scroll :(
        $container.contentWindow = $container
      }

      // throw if we're trying to scroll multiple containers
      if (!isWin && ($container.length > 1)) {
        $utils.throwErrByPath('scrollTo.multiple_containers', { args: { num: $container.length } })
      }

      _.defaults(options, {
        $el: $container,
        log: true,
        duration: 0,
        easing: 'swing',
        axis: 'xy',
        x,
        y,
      })

      // if we cannot parse an integer out of duration
      // which could be 500 or "500", then it's NaN...throw
      if (isNaNOrInfinity(options.duration)) {
        $utils.throwErrByPath('scrollTo.invalid_duration', { args: { duration: options.duration } })
      }

      if (!((options.easing === 'swing') || (options.easing === 'linear'))) {
        $utils.throwErrByPath('scrollTo.invalid_easing', { args: { easing: options.easing } })
      }

      // if we cannot parse an integer out of y or x
      // which could be 50 or "50px" or "50%" then
      // it's NaN/Infinity...throw
      if (isNaNOrInfinity(options.y) || isNaNOrInfinity(options.x)) {
        $utils.throwErrByPath('scrollTo.invalid_target', { args: { x, y } })
      }

      if (options.log) {
        const deltaOptions = $utils.stringify(
          $utils.filterOutOptions(options, { duration: 0, easing: 'swing' })
        )

        const messageArgs = []

        if (position) {
          messageArgs.push(position)
        } else {
          messageArgs.push(x)
          messageArgs.push(y)
        }

        if (deltaOptions) {
          messageArgs.push(deltaOptions)
        }

        const log = {
          message: messageArgs.join(', '),
          consoleProps () {
            // merge into consoleProps without mutating it
            const obj = {}

            if (position) {
              obj.Position = position
            } else {
              obj.X = x
              obj.Y = y
            }

            if (deltaOptions) {
              obj.Options = deltaOptions
            }

            obj['Scrolled Element'] = $dom.getElements(options.$el)

            return obj
          },
        }

        if (!isWin) {
          log.$el = options.$el
        }

        options._log = Cypress.log(log)
      }

      const ensureScrollability = function () {
        try {
          // make sure our container can even be scrolled
          return cy.ensureScrollability($container, 'scrollTo')
        } catch (err) {
          options.error = err

          return cy.retry(ensureScrollability, options)
        }
      }

      const scrollTo = () => {
        return new Promise((resolve, reject) => {
        // scroll our axis'
          $(options.$el).scrollTo({ left: x, top: y }, {
            axis: options.axis,
            easing: options.easing,
            duration: options.duration,
            done (animation, jumpedToEnd) {
              return resolve(options.$el)
            },
            fail (animation, jumpedToEnd) {
            // its Promise object is rejected
              try {
                return $utils.throwErrByPath('scrollTo.animation_failed')
              } catch (err) {
                return reject(err)
              }
            },
          })

          if (isWin) {
            return delete options.$el.contentWindow
          }
        })
      }

      return Promise
      .try(ensureScrollability)
      .then(scrollTo)
      .then(($el) => {
        let verifyAssertions

        return (verifyAssertions = () => {
          return cy.verifyUpcomingAssertions($el, options, {
            onRetry: verifyAssertions,
          })
        })()
      })
    },
  })
}
