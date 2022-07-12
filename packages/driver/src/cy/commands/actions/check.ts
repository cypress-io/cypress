import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../../dom'
import $utils from '../../../cypress/utils'
import $errUtils from '../../../cypress/error_utils'
import $elements from '../../../dom/elements'

const checkOrUncheck = (Cypress, cy, type, subject, values: any[] = [], userOptions = {}) => {
  // we're not handling conversion of values to strings
  // in case we've received numbers

  // if we're not an array but we are an object
  // reassign userOptions to values
  if (!_.isArray(values) && _.isObject(values)) {
    userOptions = values
    values = []
  } else {
    // make sure we're an array of values
    values = ([] as any[]).concat(values)
  }

  // keep an array of subjects which
  // are potentially reduced down
  // to new filtered subjects
  const matchingElements: HTMLElement[] = []

  const options: Record<string, any> = _.defaults({}, userOptions, {
    $el: subject,
    log: true,
    force: false,
  })

  const isNoop = ($el) => {
    return type === 'check'
      ? $el.prop('checked')
      : !$el.prop('checked')
  }

  const isAcceptableElement = ($el) => {
    return type === 'check'
      ? $el.is(':checkbox,:radio')
      : $el.is(':checkbox')
  }

  // does our el have a value
  // in the values array?
  // or values array is empty
  const elHasMatchingValue = ($el) => {
    const value = $elements.getNativeProp($el.get(0), 'value')

    return (values.length === 0) || values.includes(value)
  }

  // blow up if any member of the subject
  // isnt a checkbox or radio
  const checkOrUncheckEl = (el) => {
    const $el = $dom.wrap(el)
    const node = $dom.stringify($el)

    if (!isAcceptableElement($el)) {
      const word = $utils.plural(options.$el, 'contains', 'is')
      const phrase = type === 'check' ? ' and `:radio`' : ''

      $errUtils.throwErrByPath('check_uncheck.invalid_element', {
        onFail: options._log,
        args: { node, word, phrase, cmd: type },
      })
    }

    const isElActionable = elHasMatchingValue($el)

    if (isElActionable) {
      matchingElements.push(el)
    }

    const consoleProps: Record<string, any> = {
      'Applied To': $dom.getElements($el),
      'Elements': $el.length,
    }

    if (options.log && isElActionable) {
      // figure out the userOptions which actually change the behavior of clicks
      const deltaOptions = $utils.filterOutOptions(options)

      options._log = Cypress.log({
        message: deltaOptions,
        $el,
        timeout: options.timeout,
        consoleProps () {
          return _.extend(consoleProps, {
            Options: deltaOptions,
          })
        },
      })

      options._log.snapshot('before', { next: 'after' })

      // warn cmd requires all subjects to have value when args passed to cmd
      if (!($el.attr('value')) && (values.length > 0)) {
        $errUtils.throwErrByPath('check_uncheck.element_missing_value_attribute', {
          onFail: options._log,
          args: { node, cmd: type },
        })
      }

      // if the checkbox was already checked
      // then notify the user of this note
      // and bail
      if (isNoop($el)) {
        if (!options.force) {
          // still ensure visibility even if the command is noop
          cy.ensureVisibility($el, options._log)
        }

        // if the checkbox is in an indeterminate state, checking or unchecking should set the
        // prop to false to move it into a "determinate" state
        // https://github.com/cypress-io/cypress/issues/19098
        if ($el.prop('indeterminate')) {
          $el.prop('indeterminate', false)
        }

        if (options._log) {
          const inputType = $el.is(':radio') ? 'radio' : 'checkbox'

          consoleProps.Note = `This ${inputType} was already ${type}ed. No operation took place.`
          options._log.snapshot().end()
        }

        return null
      }
    }

    // if we didnt pass in any values or our
    // el's value is in the array then check it
    if (isElActionable) {
      return cy.now('click', $el, {
        $el,
        log: false,
        verify: false,
        _log: options._log,
        force: options.force,
        timeout: options.timeout,
        interval: options.interval,
        waitForAnimations: options.waitForAnimations,
        animationDistanceThreshold: options.animationDistanceThreshold,
        scrollBehavior: options.scrollBehavior,
      }).then(() => {
        if (options._log) {
          options._log.snapshot().end()
        }

        return null
      })
    }
  }

  // return our original subject when our promise resolves
  return Promise
  .resolve(options.$el.toArray())
  .each(checkOrUncheckEl)
  .then(() => {
    // filter down our $el to the
    // matching elements
    options.$el = options.$el.filter(matchingElements)

    const verifyAssertions = () => {
      return cy.verifyUpcomingAssertions(options.$el, options, {
        onRetry: verifyAssertions,
      })
    }

    return verifyAssertions()
  })
}

export default function (Commands, Cypress, cy) {
  return Commands.addAll({ prevSubject: 'element' }, {
    check (subject, values, options) {
      return checkOrUncheck.call(this, Cypress, cy, 'check', subject, values, options)
    },

    uncheck (subject, values, options) {
      return checkOrUncheck.call(this, Cypress, cy, 'uncheck', subject, values, options)
    },
  })
}
