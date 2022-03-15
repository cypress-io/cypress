import _ from 'lodash'
import $ from 'jquery'
import Promise from 'bluebird'

import $dom from '../../../dom'
import $utils from '../../../cypress/utils'
import $errUtils from '../../../cypress/error_utils'

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
  _log?: any
  $el: JQuery
  $parent: any
  axis: string
  offset?: object
}

interface InternalScrollToOptions extends Partial<Cypress.ScrollToOptions> {
  _log?: any
  $el: any
  x: number
  y: number
  error?: any
  axis: string
}

export default (Commands, Cypress, cy, state) => {
  Commands.addAll({ prevSubject: 'element' }, {
    scrollIntoView (subject, options: Partial<Cypress.ScrollToOptions> = {}) {
      if (!_.isObject(options)) {
        $errUtils.throwErrByPath('scrollIntoView.invalid_argument', { args: { arg: options } })
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

      const _options: InternalScrollIntoViewOptions = _.defaults({}, options, {
        $el: subject,
        $parent: state('window'),
        log: true,
        duration: 0,
        easing: 'swing',
        axis: 'xy',
      })

      // figure out the options which actually change the behavior of clicks
      let deltaOptions = $utils.filterOutOptions(_options)

      // here we want to figure out what has to actually
      // be scrolled to get to this element, cause we need
      // to scrollTo passing in that element.
      _options.$parent = findScrollableParent(_options.$el, state('window'))

      let parentIsWin = false

      if (_options.$parent === state('window')) {
        parentIsWin = true
        // jQuery scrollTo looks for the prop contentWindow
        // otherwise it'll use the wrong window to scroll :(
        _options.$parent.contentWindow = _options.$parent
      }

      // if we cannot parse an integer out of duration
      // which could be 500 or "500", then it's NaN...throw
      if (isNaNOrInfinity(_options.duration)) {
        $errUtils.throwErrByPath('scrollIntoView.invalid_duration', { args: { duration: _options.duration } })
      }

      if (!((_options.easing === 'swing') || (_options.easing === 'linear'))) {
        $errUtils.throwErrByPath('scrollIntoView.invalid_easing', { args: { easing: _options.easing } })
      }

      if (_options.log) {
        deltaOptions = $utils.filterOutOptions(_options, { duration: 0, easing: 'swing', offset: { left: 0, top: 0 } })

        const log = {
          $el: _options.$el,
          message: deltaOptions,
          timeout: _options.timeout,
          consoleProps () {
            const obj = {
              // merge into consoleProps without mutating it
              'Applied To': $dom.getElements(_options.$el),
              'Scrolled Element': $dom.getElements(_options.$el),
            }

            return obj
          },
        }

        _options._log = Cypress.log(log)
      }

      if (!parentIsWin) {
        // scroll the parent into view first
        // before attemp
        _options.$parent[0].scrollIntoView()
      }

      const scrollIntoView = () => {
        return new Promise((resolve, reject) => {
          // scroll our axes
          return $(_options.$parent).scrollTo(_options.$el, {
            axis: _options.axis,
            easing: _options.easing,
            duration: _options.duration,
            offset: _options.offset,
            done () {
              return resolve(_options.$el)
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
                delete _options.$parent.contentWindow
              }
            },
          })
        })
      }

      return scrollIntoView()
      .then(() => {
        const verifyAssertions = () => {
          return cy.verifyUpcomingAssertions(_options.$el, _options, {
            onRetry: verifyAssertions,
          })
        }

        return verifyAssertions()
      })
    },
  })

  Commands.addAll({ prevSubject: ['optional', 'element', 'window'] }, {
    scrollTo (subject, xOrPosition, yOrOptions, options: Partial<Cypress.ScrollToOptions> = {}) {
      let x; let y
      let userOptions = options

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
        default:
          break
      }

      if (y == null) {
        y = 0
      }

      if (x == null) {
        x = 0
      }

      let $container
      let isWin

      // if our subject is window let it fall through
      if (subject && !$dom.isWindow(subject)) {
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
      if (!isWin && $container.length > 1) {
        $errUtils.throwErrByPath('scrollTo.multiple_containers', { args: { num: $container.length } })
      }

      const _options: InternalScrollToOptions = _.defaults({}, userOptions, {
        $el: $container,
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
      if (isNaNOrInfinity(_options.duration)) {
        $errUtils.throwErrByPath('scrollTo.invalid_duration', { args: { duration: _options.duration } })
      }

      if (!((_options.easing === 'swing') || (_options.easing === 'linear'))) {
        $errUtils.throwErrByPath('scrollTo.invalid_easing', { args: { easing: _options.easing } })
      }

      if (!_.isBoolean(_options.ensureScrollable)) {
        $errUtils.throwErrByPath('scrollTo.invalid_ensureScrollable', { args: { ensureScrollable: _options.ensureScrollable } })
      }

      // if we cannot parse an integer out of y or x
      // which could be 50 or "50px" or "50%" then
      // it's NaN/Infinity...throw
      if (isNaNOrInfinity(_options.y) || isNaNOrInfinity(_options.x)) {
        $errUtils.throwErrByPath('scrollTo.invalid_target', { args: { x, y } })
      }

      if (_options.log) {
        const deltaOptions = $utils.stringify(
          $utils.filterOutOptions(_options, { duration: 0, easing: 'swing' }),
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

        const log: Record<string, any> = {
          message: messageArgs.join(', '),
          timeout: _options.timeout,
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

            obj['Scrolled Element'] = $dom.getElements(_options.$el)

            return obj
          },
        }

        if (!isWin) {
          log.$el = _options.$el
        }

        _options._log = Cypress.log(log)
      }

      const ensureScrollability = () => {
        // Some elements are not scrollable, user may opt out of error checking
        // https://github.com/cypress-io/cypress/issues/1924
        if (!_options.ensureScrollable) {
          return
        }

        try {
          // make sure our container can even be scrolled
          return cy.ensureScrollability($container, 'scrollTo')
        } catch (err) {
          _options.error = err

          return cy.retry(ensureScrollability, _options)
        }
      }

      const scrollTo = () => {
        return new Promise((resolve, reject) => {
          // scroll our axis
          $(_options.$el).scrollTo({ left: x, top: y }, {
            axis: _options.axis,
            easing: _options.easing,
            duration: _options.duration,
            // TODO: ensureScrollable option does not exist on jQuery or config/jquery.scrollto.ts.
            // It can be removed.
            // @ts-ignore
            ensureScrollable: _options.ensureScrollable,
            done () {
              return resolve(_options.$el)
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
            delete _options.$el.contentWindow
          }
        })
      }

      return Promise
      .try(ensureScrollability)
      .then(scrollTo)
      .then(() => {
        const verifyAssertions = () => {
          return cy.verifyUpcomingAssertions(_options.$el, _options, {
            onRetry: verifyAssertions,
          })
        }

        return verifyAssertions()
      })
    },
  })
}
