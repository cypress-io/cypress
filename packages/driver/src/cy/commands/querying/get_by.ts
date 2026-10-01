import _ from 'lodash'

import $dom from '../../../dom'
import $elements from '../../../dom/elements'
import { compareTreeOrder } from '../../../dom/elements/shadow'
import $errUtils from '../../../cypress/error_utils'
import $utils from '../../../cypress/utils'
import { resolveShadowDomInclusion } from '../../../cypress/shadow_dom_utils'
import { AccessibilityCache, isValidMatcher } from '../../../dom/accessibility'

export type GetByRoot = Element | ShadowRoot

// Derived from each option's type, so a definition can't declare a kind that
// disagrees with the option it validates.
// `any`, as in `GetByDefinition<any, any>`, allows either kind.
type OptionKind<T> = 0 extends (1 & T) ? 'boolean' | 'matcher' : [NonNullable<T>] extends [boolean] ? 'boolean' : 'matcher'

type SharedOptions = Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Shadow>

export interface GetByDefinition<TMatcher, TOptions extends object> {
  name: string
  docsUrl: string
  // Shown in the console props, e.g. `Role`.
  matcherLabel: string
  // The options this query accepts beyond `timeout`, `log` and `includeShadowDom`.
  options: { [K in keyof TOptions]-?: OptionKind<TOptions[K]> }
  // Options this query leaves out on purpose, mapped to the chain that gets the
  // same result, so the error can suggest it.
  unsupportedOptionHints?: Record<string, string>
  // Throws when the matcher is invalid. Defaults to accepting any `Matcher`.
  validateMatcher?: (matcher: unknown) => void
  // Throws when the matcher and options are each valid but can't be combined.
  validate?: (matcher: TMatcher, options: TOptions) => void
  // A cheap CSS selector that every matching element also matches.
  candidates: (matcher: TMatcher, options: TOptions) => string
  match: (element: Element, matcher: TMatcher, options: TOptions, cache: AccessibilityCache) => boolean
  // A noun phrase for errors, e.g. `an accessible element with the role "button"`.
  describe: (matcher: TMatcher, options: TOptions) => string
  // Extra help appended to the error when nothing was found in `roots`.
  onNotFound?: (roots: GetByRoot[], matcher: TMatcher, options: TOptions, cache: AccessibilityCache) => string | undefined
}

const SHARED_OPTIONS = ['timeout', 'log', 'includeShadowDom']

const throwGetByErr = (definition: GetByDefinition<any, any>, path: string, args: Record<string, unknown> = {}): never => {
  return $errUtils.throwErrByPath(`get_by.${path}`, {
    args: { cmd: definition.name, docsUrl: definition.docsUrl, ...args },
  })
}

const validateOptions = (definition: GetByDefinition<any, any>, userOptions: unknown) => {
  if (!_.isPlainObject(userOptions)) {
    throwGetByErr(definition, 'invalid_options', { options: $utils.stringifyActual(userOptions) })
  }

  const accepted = [...Object.keys(definition.options), ...SHARED_OPTIONS]

  _.each(userOptions as Record<string, unknown>, (value, option) => {
    if (!accepted.includes(option)) {
      const alternative = definition.unsupportedOptionHints?.[option]
      const hint = alternative ? $errUtils.errByPath(`get_by.${definition.name}.option_hint`, { option, alternative }).message : ''

      throwGetByErr(definition, 'invalid_option', {
        option,
        hint,
        accepted: accepted.map((name) => `\`${name}\``).join(', '),
      })
    }

    if (value === undefined) {
      return
    }

    if (option === 'timeout' && !_.isFinite(value)) {
      throwGetByErr(definition, 'invalid_option_timeout', { timeout: $utils.stringifyActual(value) })
    }

    // Every shared option other than `timeout` is a boolean.
    const kind = option === 'timeout' ? undefined : definition.options[option] ?? 'boolean'

    if (kind === 'boolean' && !_.isBoolean(value)) {
      throwGetByErr(definition, 'invalid_option_boolean', { option, value: $utils.stringifyActual(value) })
    }

    if (kind === 'matcher' && !isValidMatcher(value)) {
      throwGetByErr(definition, 'invalid_option_matcher', { option, value: $utils.stringifyActual(value) })
    }
  })
}

/**
 * Registers a `cy.getBy*()` query. The definition supplies what is specific
 * to the query (which elements are candidates and how one is matched); this
 * handles the rest the same way `cy.contains()` does: running as a parent or
 * child command, `.within()`, `includeShadowDom`, retries, logging and errors.
 */
export const addGetByQuery = <TMatcher, TOptions extends object>(Commands, Cypress, cy, definition: GetByDefinition<TMatcher, TOptions>) => {
  Commands.addQuery(definition.name, function getByQuery (matcher: TMatcher, userOptions: TOptions & SharedOptions = {} as TOptions & SharedOptions) {
    if (definition.validateMatcher) {
      definition.validateMatcher(matcher)
    } else if (!isValidMatcher(matcher)) {
      throwGetByErr(definition, 'invalid_matcher', { matcher: $utils.stringifyActual(matcher) })
    }

    validateOptions(definition, userOptions)

    const options = _.omitBy(_.pick(userOptions, Object.keys(definition.options)), _.isUndefined) as TOptions

    definition.validate?.(matcher, options)
    const includeShadowDom = resolveShadowDomInclusion(Cypress, userOptions.includeShadowDom)
    const displayName = $utils.stringify(_.isEmpty(options) ? [matcher] : [matcher, options])
    const withinSubject = cy.state('withinSubjectChain')

    const log = Cypress.log({
      message: displayName,
      type: this.hasPreviouslyLinkedCommand() ? 'child' : 'parent',
      hidden: userOptions.log === false,
      timeout: userOptions.timeout,
      consoleProps: () => ({}),
    })

    // The scope of the most recent attempt, kept so the error can describe
    // where the query looked.
    let $lastScope: JQuery<GetByRoot> | undefined
    let lastRoots: GetByRoot[] = []

    const getScopePhrase = () => {
      if (!$lastScope || $lastScope.is('body')) {
        return ''
      }

      // A shadow root has no tag to show, so it's described by its host.
      const scope = $lastScope.toArray()

      if (scope.every($elements.isShadowRoot)) {
        return ` within the shadow root of the element: ${$dom.stringify(scope.map((root) => (root as ShadowRoot).host), 'short')}`
      }

      return ` within the element: ${$dom.stringify($lastScope, 'short')}`
    }

    this.set('timeout', userOptions.timeout)
    this.set('onFail', (err) => {
      if (err.type !== 'existence') {
        return
      }

      let hints = ''

      if (!err.negated && definition.onNotFound) {
        const hint = definition.onNotFound(lastRoots, matcher, options, new AccessibilityCache())

        hints = hint ? `\n\n${hint}` : ''
      }

      const { message, docsUrl } = $errUtils.cypressErrByPath(err.negated ? 'get_by.found' : 'get_by.not_found', {
        args: {
          description: definition.describe(matcher, options),
          scope: getScopePhrase(),
          hints,
          docsUrl: definition.docsUrl,
        },
      })

      err.message = message
      err.docsUrl = docsUrl
    })

    return (subject) => {
      Cypress.ensure.isType(subject, ['optional', 'element', 'window', 'document'], this.get('name'), cy)
      Cypress.ensure.commandCanCommunicateWithAUT(cy)

      let $scope = subject

      if (!subject || (!$dom.isElement(subject) && !$elements.isShadowRoot(subject[0]))) {
        $scope = cy.getSubjectFromChain(withinSubject || [cy.$$('body')])
      }

      const scopeRoots: GetByRoot[] = $scope.toArray()
      const roots = includeShadowDom
        ? _.flatMap(scopeRoots, (root) => [root, ...$dom.findAllShadowRoots(root) as ShadowRoot[]])
        : scopeRoots

      const cache = new AccessibilityCache()
      const selector = definition.candidates(matcher, options)
      const seen = new Set<Element>()
      const matched: Element[] = []

      for (const root of roots) {
        for (const element of Array.from(root.querySelectorAll(selector))) {
          if (seen.has(element)) {
            continue
          }

          seen.add(element)

          if (definition.match(element, matcher, options, cache)) {
            matched.push(element)
          }
        }
      }

      // Each root is searched in turn, so matches from a shadow root or a later
      // subject element can land out of document order.
      if (roots.length > 1) {
        matched.sort(compareTreeOrder)
      }

      $lastScope = $scope
      lastRoots = roots

      const $el = cy.$$(matched)

      $el.selector = displayName

      log && cy.state('current') === this && log.set({
        $el,
        consoleProps: () => {
          return {
            [definition.matcherLabel]: matcher,
            ...(_.isEmpty(options) ? {} : { Options: options }),
            'Applied To': $dom.getElements($scope),
            Yielded: $dom.getElements($el),
            Elements: $el.length,
          }
        },
      })

      return $el
    }
  })
}
