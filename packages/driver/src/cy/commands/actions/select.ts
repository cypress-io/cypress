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

type SelectMatcher = string | number | RegExp

// Tests `str` from its start every time, so a pattern with the `g` or `y` flag
// matches the same options no matter how many options were tested before it.
const testPattern = (pattern: RegExp, str: string) => {
  pattern.lastIndex = 0

  return pattern.test(str)
}

const isSelectMatcher = (val) => _.isNumber(val) || _.isString(val) || _.isRegExp(val)

interface OptionInfo {
  index: number
  value: string
  text: string
  $el: JQuery<HTMLOptionElement>
}

const isOptionDisabled = (option: OptionInfo) => {
  return !!option.$el.prop('disabled') || !!option.$el.closest('optgroup').prop('disabled')
}

const getOptionInfos = ($select: JQuery<HTMLSelectElement>): OptionInfo[] => {
  return $select.find('option').map((index, el) => {
    const $option = $dom.wrap(el)

    return {
      index,
      value: $elements.getNativeProp(el, 'value'),
      // replace new line chars, then trim spaces
      text: $option.text().replace(newLineRe, '').trim(),
      $el: $option,
    }
  }).get()
}

// Returns the options to select, in document order:
// - A string or index matches options by value or index, and by text only
//   when it matched none that way, so `['apoc', 'Blade Runner']` selects both.
// - A pattern matches every enabled option whose value or text it matches,
//   or with `firstOnly`, the first of them. A pattern whose every match is
//   disabled keeps its first match, so the caller can report it as disabled.
const findMatchingOptions = (optionInfos: OptionInfo[], matchers: SelectMatcher[], firstOnly: boolean) => {
  const toSelect = new Set<OptionInfo>()

  _.each(matchers, (matcher) => {
    if (_.isRegExp(matcher)) {
      const matches = _.filter(optionInfos, (option) => testPattern(matcher, option.value) || testPattern(matcher, option.text))
      const enabled = _.reject(matches, isOptionDisabled)
      const chosen = enabled.length ? enabled : matches

      _.each(firstOnly ? chosen.slice(0, 1) : chosen, (option) => toSelect.add(option))

      return
    }

    let matches = _.filter(optionInfos, (option) => matcher === option.value || matcher === option.index)

    if (!matches.length) {
      matches = _.filter(optionInfos, (option) => matcher === option.text)
    }

    _.each(matches, (option) => toSelect.add(option))
  })

  return _.filter(optionInfos, (option) => toSelect.has(option))
}

// JSON.stringify prints a RegExp as `{}`, so print patterns as `/source/flags`
const formatArgument = (value) => {
  if (_.isArray(value)) {
    return `[${_.map(value, formatArgument).join(',')}]`
  }

  return _.isRegExp(value) ? String(value) : JSON.stringify(value)
}

// every option's selected state, since a multiple select can change without its selectedIndex changing
const getSelection = (select: HTMLSelectElement) => _.map(select.options, 'selected')

export default (Commands, Cypress, cy) => {
  Commands.addAll({ prevSubject: 'element' }, {
    select (subject, valueOrTextOrIndex, userOptions: Partial<Cypress.SelectOptions> = {}) {
      if (!isSelectMatcher(valueOrTextOrIndex) && !_.isArray(valueOrTextOrIndex)) {
        $errUtils.throwErrByPath('select.invalid_argument', { args: { value: JSON.stringify(valueOrTextOrIndex) } })
      }

      if (
        _.isArray(valueOrTextOrIndex)
        && valueOrTextOrIndex.length > 0
        && !_.every(valueOrTextOrIndex, isSelectMatcher)
      ) {
        $errUtils.throwErrByPath('select.invalid_array_argument', { args: { value: formatArgument(valueOrTextOrIndex) } })
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
      const matchers: SelectMatcher[] = [].concat(valueOrTextOrIndex).map((v: any) => {
        if (_.isNumber(v) && (!_.isInteger(v) || v < 0)) {
          $errUtils.throwErrByPath('select.invalid_number', { args: { index: v } })
        }

        if (_.isNumber(v)) {
          return v
        }

        // copy the pattern so resetting its lastIndex never touches the user's RegExp
        if (_.isRegExp(v)) {
          return new RegExp(v.source, v.flags)
        }

        // https://github.com/cypress-io/cypress/issues/16045
        // replace `&nbsp;` in the text to `\us00a0` to find match.
        // @see https://stackoverflow.com/a/53306311/1038927
        return v.replace(/&nbsp;/g, '\u00a0')
      })

      const multiple = options.$el.prop('multiple')

      // a pattern can match several options, so like cy.contains(), a pattern
      // passed to a select without `multiple` picks the first enabled option it matches
      const selectFirstMatch = !multiple && matchers.length === 1 && _.isRegExp(matchers[0])
      const onlyPatterns = matchers.length > 0 && _.every(matchers, _.isRegExp)

      // throw if we're not a multiple select and we've
      // passed an array of values
      if (!multiple && matchers.length > 1) {
        $errUtils.throwErrByPath('select.invalid_multiple')
      }

      const subjectChain = cy.subjectChain()

      const getOptions = () => {
        options.$el = cy.getSubjectFromChain(subjectChain)

        // throw if <select> is disabled
        if (!options.force) {
          Cypress.ensure.isElement(options.$el, 'select', options._log)
          Cypress.ensure.isNotDisabled(options.$el, 'select', options._log)
        }

        const matches = findMatchingOptions(getOptionInfos(options.$el), matchers, selectFirstMatch)

        // if we didnt set multiple to true and
        // we have more than 1 option to set then blow up
        if (!multiple && (matches.length > 1)) {
          $errUtils.throwErrByPath('select.multiple_matches', {
            args: { value: matchers.join(', ') },
          })
        }

        if (!matches.length && matchers.length > 0) {
          $errUtils.throwErrByPath(onlyPatterns ? 'select.no_pattern_matches' : 'select.no_matches', {
            args: { value: matchers.join(', ') },
          })
        }

        _.each(matches, ({ $el }) => {
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

        return { values: _.map(matches, 'value'), optionEls: _.map(matches, '$el') }
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
        const { values, optionEls } = obj

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
            const oldSelection = getSelection(options.$el.get(0))

            // Select exactly the matched <option> elements rather than setting
            // the select's value, which can't tell options with the same value apart.
            const select: HTMLSelectElement = options.$el.get(0)
            let matched = new Set<HTMLOptionElement>(_.map(optionEls, ($el) => $el.get(0)))
            const liveOptions = new Set(Array.from(select.options))

            // the page can replace its options while they're clicked, such as
            // re-rendering them on focus, so match against the options it has now
            if (_.some(Array.from(matched), (option) => !liveOptions.has(option))) {
              matched = new Set(_.map(findMatchingOptions(getOptionInfos(options.$el), matchers, selectFirstMatch), ({ $el }) => $el.get(0)))
            }

            _.each(select.options, (option) => {
              option.selected = matched.has(option)
            })

            if (!matched.size) {
              select.selectedIndex = -1
            }

            // https://github.com/cypress-io/cypress/issues/19494
            // When user selects the same option again, `input`, `change` events should not be fired.
            if (_.isEqual(getSelection(options.$el.get(0)), oldSelection)) {
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
