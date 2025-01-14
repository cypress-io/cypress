import _ from 'lodash'
import $ from 'jquery'
import Promise from 'bluebird'

import $dom from '../../../dom'
import $utils from '../../../cypress/utils'
import $errUtils from '../../../cypress/error_utils'
import $actionability from '../../actionability'
import type { Log } from '../../../cypress/log'

const findScrollableParent = ($el, win) => {
  const $parent = $dom.getParent($el)

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

const isNaNOrInfinity = (item) => {
  const num = Number.parseFloat(item)

  return _.isNaN(num) || !_.isFinite(num)
}

interface InternalScrollIntoViewOptions extends Partial<Cypress.ScrollToOptions> {
  _log?: Log
  $el: JQuery
  $parent: any
  axis: string
  offset?: object
}

interface InternalScrollToOptions extends Partial<Cypress.ScrollToOptions> {
  _log?: Log
  $el: any
  x: number
  y: number
  error?: any
  axis: string
}

export default (Commands, Cypress, cy, state) => {
  Commands.addAll({ prevSubject: 'element' }, {
    scrollIntoView (subject, userOptions: Partial<Cypress.ScrollToOptions> = {}) {
      if (!_.isObject(userOptions)) {
        $errUtils.throwErrByPath('scrollIntoView.invalid_argument', { args: { arg: userOptions } })
      }

      // ensure the subject is not window itself
      // cause how are you gonna scroll the window into view...
      if (subject === state('window')) {
        $errUtils.throwErrByPath('scrollIntoView.subject_is_window')
      }

      // throw if we're trying to scroll to multiple elements
      if (subject.length > 1) {
        $errUtils.throwErrByPath('scrollIntoView.multiple_elements', { args: { num: subject.length } })
      }

      const options: InternalScrollIntoViewOptions = _.defaults({}, userOptions, {
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

      let parentIsWin = false

      if (options.$parent === state('window')) {
        parentIsWin = true
        // jQuery scrollTo looks for the prop contentWindow
        // otherwise it'll use the wrong window to scroll :(
        options.$parent.contentWindow = options.$parent
      }

      // if we cannot parse an integer out of duration
      // which could be 500 or "500", then it's NaN...throw
      if (isNaNOrInfinity(options.duration)) {
        $errUtils.throwErrByPath('scrollIntoView.invalid_duration', { args: { duration: options.duration } })
      }

      if (!((options.easing === 'swing') || (options.easing === 'linear'))) {
        $errUtils.throwErrByPath('scrollIntoView.invalid_easing', { args: { easing: options.easing } })
      }

      deltaOptions = $utils.filterOutOptions(options, { duration: 0, easing: 'swing', offset: { left: 0, top: 0 } })

      options._log = Cypress.log({
        $el: options.$el,
        message: deltaOptions,
        hidden: options.log === false,
        timeout: options.timeout,
        consoleProps () {
          const obj = {
            // merge into consoleProps without mutating it
            'Applied To': $dom.getElements(options.$el),
            'Scrolled Element': $dom.getElements(options.$el),
          }

          return obj
        },
      })

      if (!parentIsWin) {
        // scroll the parent into view first
        // before attemp
        options.$parent[0].scrollIntoView()
      }

      const scrollIntoView = () => {
        return new Promise((resolve, reject) => {
          // scroll our axes
          // @ts-ignore - scrollTo does not define a 'done()' key on its config object.
          return $(options.$parent).scrollTo(options.$el, {
            axis: options.axis,
            easing: options.easing,
            duration: options.duration,
            offset: options.offset,
            done () {
              return resolve(options.$el)
            },
            fail () {
              // its Promise object is rejected
              try {
                return $errUtils.throwErrByPath('scrollTo.animation_failed')
              } catch (err) {
                return reject(err)
              }
            },
            always () {
              if (parentIsWin) {
                delete options.$parent.contentWindow
              }
            },
          })
        })
      }

      return scrollIntoView()
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

  Commands.addAll({ prevSubject: ['optional', 'element', 'window'] }, {
    scrollTo (subject, xOrPosition, yOrOptions, userOptions: Partial<Cypress.ScrollToOptions> = {}) {
      let x; let y

      // check for undefined or null values
      if (xOrPosition === undefined || xOrPosition === null) {
        $errUtils.throwErrByPath('scrollTo.invalid_target', { args: { x } })
      }

      if (_.isObject(yOrOptions)) {
        userOptions = yOrOptions
      } else {
        y = yOrOptions
      }

      let position: string | null = null

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
          $actionability.ensureIsValidPosition(position)
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
        default:
          break
      }

      if (y == null) {
        y = 0
      }

      if (x == null) {
        x = 0
      }

      let isWin

      const options: InternalScrollToOptions = _.defaults({}, userOptions, {
        $el: subject,
        log: true,
        duration: 0,
        easing: 'swing',
        axis: 'xy',
        ensureScrollable: true,
        x,
        y,
      })

      // if we cannot parse an integer out of duration
      // which could be 500 or "500", then it's NaN...throw
      if (isNaNOrInfinity(options.duration)) {
        $errUtils.throwErrByPath('scrollTo.invalid_duration', { args: { duration: options.duration } })
      }

      if (!((options.easing === 'swing') || (options.easing === 'linear'))) {
        $errUtils.throwErrByPath('scrollTo.invalid_easing', { args: { easing: options.easing } })
      }

      if (!_.isBoolean(options.ensureScrollable)) {
        $errUtils.throwErrByPath('scrollTo.invalid_ensureScrollable', { args: { ensureScrollable: options.ensureScrollable } })
      }

      // if we cannot parse an integer out of y or x
      // which could be 50 or "50px" or "50%" then
      // it's NaN/Infinity...throw
      if (isNaNOrInfinity(options.y) || isNaNOrInfinity(options.x)) {
        $errUtils.throwErrByPath('scrollTo.invalid_target', { args: { x, y } })
      }

      const deltaOptions = $utils.stringify(
        $utils.filterOutOptions(options, { duration: 0, easing: 'swing' }),
      )

      const messageArgs: string[] = []

      if (position) {
        messageArgs.push(position)
      } else {
        messageArgs.push(x)
        messageArgs.push(y)
      }

      if (deltaOptions) {
        messageArgs.push(deltaOptions)
      }

      options._log = Cypress.log({
        message: messageArgs.join(', '),
        hidden: options.log === false,
        timeout: options.timeout,
        consoleProps () {
          // merge into consoleProps without mutating it
          const obj: Record<string, any> = {}

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
      })

      const subjectChain = cy.subjectChain()

      const ensureScrollability = () => {
        // Make sure the scroll command can communicate with the AUT
        Cypress.ensure.commandCanCommunicateWithAUT(cy)

        try {
          subject = cy.getSubjectFromChain(subjectChain)

          if (!subject || $dom.isWindow(subject)) {
            isWin = true
            // if we don't have a subject, then we are a parent command
            // assume they want to scroll the entire window.
            options.$el = state('window')

            // jQuery scrollTo looks for the prop contentWindow
            // otherwise it'll use the wrong window to scroll :(
            options.$el.contentWindow = options.$el
          } else {
            // if they passed something here, its a DOM element
            options.$el = subject

            // scrollTo does not use the normal $actionability check, because that check contains, itself, scrolling
            // logic. But we still want to throw the same error if our subject disappears while retrying.
            if (options.$el.length === 0 || $dom.isDetached(options.$el)) {
              const current = cy.state('current')

              $errUtils.throwErrByPath('subject.detached_during_actionability', {
                args: { name: current.get('name'), subjectChain },
              })
            }

            Cypress.ensure.isElement(options.$el, 'scrollTo')
          }

          // throw if we're trying to scroll multiple containers
          if (!isWin && options.$el.length > 1) {
            $errUtils.throwErrByPath('scrollTo.multiple_containers', { args: { num: options.$el.length } })
          }

          options._log?.set('$el', options.$el)

          // Some elements are not scrollable, user may opt out of error checking
          // https://github.com/cypress-io/cypress/issues/1924
          if (options.ensureScrollable) {
            Cypress.ensure.isScrollable(options.$el, 'scrollTo')
          }
        } catch (err) {
          options.error = err

          return cy.retry(ensureScrollability, options)
        }
      }

      const scrollTo = () => {
        return new Promise((resolve, reject) => {
          // scroll our axis
          // @ts-ignore
          $(options.$el).scrollTo({ left: x, top: y }, {
            axis: options.axis,
            easing: options.easing,
            duration: options.duration,
            done () {
              return resolve(options.$el)
            },
            fail () {
              // its Promise object is rejected
              try {
                return $errUtils.throwErrByPath('scrollTo.animation_failed')
              } catch (err) {
                return reject(err)
              }
            },
          })

          if (isWin) {
            delete options.$el.contentWindow
          }
        })
      }

      return Promise
      .try(ensureScrollability)
      .then(scrollTo)
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
