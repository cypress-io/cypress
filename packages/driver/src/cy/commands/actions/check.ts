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

  const subjectChain = cy.subjectChain()

  // blow up if any member of the subject
  // isnt a checkbox or radio
  const checkOrUncheckEl = (el, index) => {
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

    if (!elHasMatchingValue($el)) {
      return
    }

    const consoleProps: Record<string, any> = {
      'Applied To': $dom.getElements($el),
      'Elements': $el.length,
    }

    // figure out the userOptions which actually change the behavior of clicks
    const deltaOptions = $utils.filterOutOptions(options)

    options._log = Cypress.log({
      hidden: options.log === false,
      message: deltaOptions,
      $el,
      timeout: options.timeout,
      consoleProps () {
        return _.extend(consoleProps, {
          Options: deltaOptions,
        })
      },
    })

    options._log?.snapshot('before', { next: 'after' })

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
        Cypress.ensure.isVisible($el, type, options._log)
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
        options._log?.snapshot().end()
      }

      matchingElements.push($el[0])

      return null
    }

    // if we didnt pass in any values or our
    // el's value is in the array then check it
    return cy.now('click', $el, {
      $el,
      subjectFn: () => cy.getSubjectFromChain(subjectChain).eq(index),
      log: false,
      verify: false,
      _log: options._log,
      force: options.force,
      timeout: options.timeout,
      interval: options.interval,
      waitForAnimations: options.waitForAnimations,
      animationDistanceThreshold: options.animationDistanceThreshold,
      scrollBehavior: options.scrollBehavior,
    }).then(($el) => {
      options._log?.snapshot().end()

      matchingElements.push($el[0])
    })
  }

  // return our original subject when our promise resolves
  return Promise
  .resolve(options.$el.toArray())
  .each(checkOrUncheckEl)
  .then(() => {
    // filter down our $el to the
    // matching elements
    options.$el = cy.$$(matchingElements)

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
