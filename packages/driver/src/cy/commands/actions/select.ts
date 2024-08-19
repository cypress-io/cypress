import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../../dom'
import $utils from '../../../cypress/utils'
import $errUtils from '../../../cypress/error_utils'
import $elements from '../../../dom/elements'
import type { Log } from '../../../cypress/log'

const newLineRe = /\n/g

interface InternalSelectOptions extends Partial<Cypress.SelectOptions> {
  _log?: Log
  $el: JQuery<HTMLSelectElement>
  error?: any
}

export default (Commands, Cypress, cy) => {
  Commands.addAll({ prevSubject: 'element' }, {
    select (subject, valueOrTextOrIndex, userOptions: Partial<Cypress.SelectOptions> = {}) {
      if (
        !_.isNumber(valueOrTextOrIndex)
        && !_.isString(valueOrTextOrIndex)
        && !_.isArray(valueOrTextOrIndex)
      ) {
        $errUtils.throwErrByPath('select.invalid_argument', { args: { value: JSON.stringify(valueOrTextOrIndex) } })
      }

      if (
        _.isArray(valueOrTextOrIndex)
        && valueOrTextOrIndex.length > 0
        && !_.some(valueOrTextOrIndex, (val) => _.isNumber(val) || _.isString(val))
      ) {
        $errUtils.throwErrByPath('select.invalid_array_argument', { args: { value: JSON.stringify(valueOrTextOrIndex) } })
      }

      const options: InternalSelectOptions = _.defaults({}, userOptions, {
        $el: subject,
        log: true,
        force: false,
      })

      const consoleProps: Record<string, any> = {}

      // figure out the options which actually change the behavior of clicks
      const deltaOptions = $utils.filterOutOptions(options)

      options._log = Cypress.log({
        $el: options.$el,
        message: deltaOptions,
        hidden: options.log === false,
        timeout: options.timeout,
        consoleProps () {
          // merge into consoleProps without mutating it
          return _.extend({}, consoleProps, {
            'Applied To': $dom.getElements(options.$el),
            'Options': deltaOptions,
          })
        },
      })

      options._log?.snapshot('before', { next: 'after' })

      let node

      // if subject is a <select> el assume we are filtering down its
      // options to a specific option first by value and then by text
      // we'll throw if more than one is found AND the select
      // element is multiple=multiple

      // if the subject isn't a <select> then we'll check to make sure
      // this is an option
      // if this is multiple=multiple then we'll accept an array of values
      // or texts and clear the previous selections which matches jQuery's
      // behavior

      if (!options.$el.is('select')) {
        node = $dom.stringify(options.$el)
        $errUtils.throwErrByPath('select.invalid_element', { args: { node } })
      }

      if (options.$el.length && options.$el.length > 1) {
        $errUtils.throwErrByPath('select.multiple_elements', { args: { num: options.$el.length } })
      }

      // normalize valueOrTextOrIndex if its not an array
      valueOrTextOrIndex = [].concat(valueOrTextOrIndex).map((v: any) => {
        if (_.isNumber(v) && (!_.isInteger(v) || v < 0)) {
          $errUtils.throwErrByPath('select.invalid_number', { args: { index: v } })
        }

        // https://github.com/cypress-io/cypress/issues/16045
        // replace `&nbsp;` in the text to `\us00a0` to find match.
        // @see https://stackoverflow.com/a/53306311/1038927
        return _.isNumber(v) ? v : v.replace(/&nbsp;/g, '\u00a0')
      })

      const multiple = options.$el.prop('multiple')

      // throw if we're not a multiple select and we've
      // passed an array of values
      if (!multiple && valueOrTextOrIndex.length > 1) {
        $errUtils.throwErrByPath('select.invalid_multiple')
      }

      const subjectChain = cy.subjectChain()

      const getOptions = () => {
        options.$el = cy.getSubjectFromChain(subjectChain)
        let notAllUniqueValues

        // throw if <select> is disabled
        if (!options.force) {
          Cypress.ensure.isElement(options.$el, 'select', options._log)
          Cypress.ensure.isNotDisabled(options.$el, 'select', options._log)
        }

        const values: string[] = []
        const optionEls: JQuery<any>[] = []
        const optionsObjects = options.$el.find('option').map((index, el) => {
          // push the value in values array if its
          // found within the valueOrText
          const value = $elements.getNativeProp(el, 'value')
          const optEl = $dom.wrap(el)

          if (valueOrTextOrIndex.includes(value) || valueOrTextOrIndex.includes(index)) {
            optionEls.push(optEl)
            values.push(value)

            // https://github.com/cypress-io/cypress/issues/24739
            if (options.$el.find(`option[value="${value.replace(/"/g, '\\\"')}"]`).length > 1) {
              notAllUniqueValues = true
            }
          }

          // replace new line chars, then trim spaces
          const trimmedText = optEl.text().replace(newLineRe, '').trim()

          // return the elements text + value
          return {
            value,
            originalText: optEl.text(),
            text: trimmedText,
            $el: optEl,
          }
        }).get()

        // if we couldn't find anything by value then attempt
        // to find it by text and insert its value into values arr
        if (!values.length) {
          // if any of the values are the same and the user is trying to
          // select based on the text, setting the value won't work
          // `notAllUniqueValues` is used later to do the right thing
          const uniqueValues = _.chain(optionsObjects).map('value').uniq().value()

          notAllUniqueValues = uniqueValues.length !== optionsObjects.length

          _.each(optionsObjects, (obj) => {
            if (valueOrTextOrIndex.includes(obj.text)) {
              optionEls.push(obj.$el)
              const objValue = obj.value

              values.push(objValue)
            }
          })
        }

        // if we didnt set multiple to true and
        // we have more than 1 option to set then blow up
        if (!multiple && (values.length > 1)) {
          $errUtils.throwErrByPath('select.multiple_matches', {
            args: { value: valueOrTextOrIndex.join(', ') },
          })
        }

        if (!values.length && !(_.isArray(valueOrTextOrIndex) && valueOrTextOrIndex.length === 0)) {
          $errUtils.throwErrByPath('select.no_matches', {
            args: { value: valueOrTextOrIndex.join(', ') },
          })
        }

        _.each(optionEls, ($el) => {
          if ($el.prop('disabled')) {
            node = $dom.stringify($el)

            $errUtils.throwErrByPath('select.option_disabled', {
              args: { node },
            })
          }

          if ($el.closest('optgroup').prop('disabled')) {
            node = $dom.stringify($el)

            $errUtils.throwErrByPath('select.optgroup_disabled', {
              args: { node },
            })
          }
        })

        return { values, optionEls, optionsObjects, notAllUniqueValues }
      }

      const retryOptions = () => {
        return Promise
        .try(getOptions)
        .catch((err) => {
          options.error = err

          return cy.retry(retryOptions, options)
        })
      }

      return Promise
      .try(retryOptions)
      .then((obj = {}) => {
        const { values, optionEls, optionsObjects, notAllUniqueValues } = obj

        // preserve the selected values
        consoleProps.Selected = values

        return cy.now('click', options.$el, {
          $el: options.$el,
          log: false,
          verify: false,
          errorOnSelect: false, // prevent click errors since we want the select to be clicked
          _log: options._log,
          force: options.force,
          timeout: options.timeout,
          interval: options.interval,
        }).then(() => {
          // TODO:
          // 1. test cancelation
          // 2. test passing optionEls to each directly
          // 3. update other tests using this Promise.each pattern
          // 4. test that force is always true
          // 5. test that command is not provided (undefined / null)
          // 6. test that option actually receives click event
          // 7. test that select still has focus (i think it already does have a test)
          // 8. test that multiple=true selects receive option event for each selected option
          const activeElement = $elements.getActiveElByDocument(options.$el)

          if (!options.force && activeElement === null) {
            $errUtils.throwErrByPath('dom.disabled', {
              onFail: options._log,
              args: {
                cmd: 'select',
                node: $dom.stringify(options.$el),
              },
            })
          }

          return Promise
          .resolve(optionEls) // why cant we just pass these directly to .each?
          .each((optEl) => {
            return cy.now('click', optEl, {
              $el: optEl,
              log: false,
              verify: false,
              force: true, // always force the click to happen on the <option>
              timeout: options.timeout,
              interval: options.interval,
            })
          }).then(() => {
            const oldValue = options.$el[0].selectedIndex

            // reset the selects value after we've
            // fired all the proper click events
            // for the options
            // TODO: shouldn't we be updating the values
            // as we click the <option> instead of
            // all afterwards?
            options.$el.val(values)

            if (notAllUniqueValues) {
              // if all the values are the same and the user is trying to
              // select based on the text or index, setting the val() will just
              // select the first one
              let selectedIndex = 0

              _.each(optionEls, ($el) => {
                const index = _.findIndex(optionsObjects, (optionObject: any) => {
                  return $el.text() === optionObject.originalText
                })

                selectedIndex = index

                return $el.prop('selected', 'selected')
              })

              options.$el[0].selectedIndex = selectedIndex
            }

            // https://github.com/cypress-io/cypress/issues/19494
            // When user selects the same option again, `input`, `change` events should not be fired.
            if (options.$el[0].selectedIndex === oldValue) {
              return
            }

            const input = new Event('input', {
              bubbles: true,
              cancelable: false,
            })

            options.$el.get(0).dispatchEvent(input)

            // yup manually create this change event
            // 1.6.5. HTML event types
            // scroll down to 'change'
            const change = document.createEvent('HTMLEvents')

            change.initEvent('change', true, false)

            options.$el.get(0).dispatchEvent(change)
          })
        }).then(() => {
          const verifyAssertions = () => {
            return cy.verifyUpcomingAssertions(options.$el, options, {
              onRetry: verifyAssertions,
            })
          }

          return verifyAssertions()
        })
      })
    },
  })
}
