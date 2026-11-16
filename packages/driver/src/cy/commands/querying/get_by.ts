import _ from 'lodash'

import $dom from '../../../dom'
import $elements from '../../../dom/elements'
import { compareTreeOrder } from '../../../dom/elements/shadow'
import $errUtils from '../../../cypress/error_utils'
import $utils from '../../../cypress/utils'
import { AccessibilityCache, isValidMatcher } from '../../../dom/accessibility'

export type GetByRoot = Element | ShadowRoot

// Derived from each option's type, so a query can't declare a kind that
// disagrees with the option it validates.
// `any`, as in `GetByQuery<any>`, allows either kind.
type OptionKind<T> = 0 extends (1 & T) ? 'boolean' | 'matcher' : [NonNullable<T>] extends [boolean] ? 'boolean' : 'matcher'

export type SharedOptions = Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Shadow>

// What the shared helpers need to know about a `cy.getBy*()` query to
// validate its options and word its errors.
export interface GetByQuery<TOptions extends object> {
  name: string
  docsUrl: string
  // The options this query accepts beyond `timeout`, `log` and `includeShadowDom`.
  options: { [K in keyof TOptions]-?: OptionKind<TOptions[K]> }
  // Options this query leaves out on purpose, mapped to the chain that gets the
  // same result, so the error can suggest it.
  unsupportedOptionHints?: Record<string, string>
}

export interface Search {
  $scope: JQuery<GetByRoot>
  roots: GetByRoot[]
}

const SHARED_OPTIONS = ['timeout', 'log', 'includeShadowDom']

const throwGetByErr = (query: GetByQuery<any>, path: string, args: Record<string, unknown> = {}): never => {
  return $errUtils.throwErrByPath(`get_by.${path}`, {
    args: { cmd: query.name, docsUrl: query.docsUrl, ...args },
  })
}

const isOptionsObject = (value: unknown): value is Record<string, unknown> => _.isPlainObject(value)

export function validateOptions<TOptions extends object> (query: GetByQuery<TOptions>, userOptions: unknown): asserts userOptions is TOptions & SharedOptions {
  if (!isOptionsObject(userOptions)) {
    return throwGetByErr(query, 'invalid_options', { options: $utils.stringifyActual(userOptions) })
  }

  const kinds: Record<string, 'boolean' | 'matcher' | undefined> = query.options
  const accepted = [...Object.keys(kinds), ...SHARED_OPTIONS]

  _.each(userOptions, (value, option) => {
    if (!accepted.includes(option)) {
      const alternative = query.unsupportedOptionHints?.[option]
      const hint = alternative ? $errUtils.errByPath(`get_by.${query.name}.option_hint`, { option, alternative }).message : ''

      throwGetByErr(query, 'invalid_option', {
        option,
        hint,
        accepted: accepted.map((name) => `\`${name}\``).join(', '),
      })
    }

    if (value === undefined) {
      return
    }

    if (option === 'timeout' && !_.isFinite(value)) {
      throwGetByErr(query, 'invalid_option_timeout', { timeout: $utils.stringifyActual(value) })
    }

    // Every shared option other than `timeout` is a boolean.
    const kind = option === 'timeout' ? undefined : kinds[option] ?? 'boolean'

    if (kind === 'boolean' && !_.isBoolean(value)) {
      throwGetByErr(query, 'invalid_option_boolean', { option, value: $utils.stringifyActual(value) })
    }

    if (kind === 'matcher' && !isValidMatcher(value)) {
      throwGetByErr(query, 'invalid_option_matcher', { option, value: $utils.stringifyActual(value) })
    }
  })
}

// The query's own options, leaving out any set to `undefined` so they aren't
// shown in the command log.
export const pickOptions = <TOptions extends object>(query: GetByQuery<TOptions>, userOptions: TOptions & SharedOptions): Partial<TOptions> => {
  // Safe because `query.options` is a mapped type over exactly `keyof TOptions`.
  const keys = Object.keys(query.options) as Array<keyof TOptions>

  return _.pick(userOptions, keys.filter((key) => userOptions[key] !== undefined))
}

const formatQuery = (matcher: unknown, options: object) => {
  return $utils.stringify(_.isEmpty(options) ? [matcher] : [matcher, options])
}

export const logQuery = (command, Cypress, matcher: unknown, options: object, { log, timeout }: SharedOptions) => {
  command.set('timeout', timeout)

  return Cypress.log({
    message: formatQuery(matcher, options),
    type: command.hasPreviouslyLinkedCommand() ? 'child' : 'parent',
    hidden: log === false,
    timeout,
    consoleProps: () => ({}),
  })
}

// Chained off an element or shadow root, the query searches that subject.
// Otherwise it searches the `.within()` scope, or the whole body. With
// `includeShadowDom`, every shadow root inside the scope is searched too.
// `cy.wrap()` can yield a bare element or shadow root rather than a jQuery
// collection, so the subject is wrapped either way.
export const searchScope = (cy, subject, withinSubject, includeShadowDom: boolean): Search => {
  const isScope = subject && ($dom.isElement(subject) || $elements.isShadowRoot(subject) || $elements.isShadowRoot(subject[0]))
  const $scope: JQuery<GetByRoot> = isScope ? cy.$$(subject) : cy.getSubjectFromChain(withinSubject || [cy.$$('body')])
  const scopeRoots: GetByRoot[] = $scope.toArray()

  const roots = includeShadowDom
    ? _.flatMap(scopeRoots, (root) => [root, ...$dom.findAllShadowRoots(root).filter($elements.isShadowRoot)])
    : scopeRoots

  return { $scope, roots }
}

// Narrows each root to the elements matching `selector`, then keeps the ones
// `isMatch` accepts, each element once and in document order.
export const findMatches = (roots: GetByRoot[], selector: string, isMatch: (element: Element, cache: AccessibilityCache) => boolean): Element[] => {
  const cache = new AccessibilityCache()
  const seen = new Set<Element>()
  const matched: Element[] = []

  for (const root of roots) {
    for (const element of Array.from(root.querySelectorAll(selector))) {
      if (seen.has(element)) {
        continue
      }

      seen.add(element)

      if (isMatch(element, cache)) {
        matched.push(element)
      }
    }
  }

  // Each root is searched in turn, so matches from a shadow root or a later
  // subject element can land out of document order.
  if (roots.length > 1) {
    matched.sort(compareTreeOrder)
  }

  return matched
}

interface YieldDetails {
  // Shown in the console props, e.g. `Role`.
  matcherLabel: string
  matcher: unknown
  options: object
  search: Search
}

export const yieldMatches = (command, cy, log, matches: Element[], { matcherLabel, matcher, options, search }: YieldDetails): JQuery<Element> => {
  const $el = cy.$$(matches)

  $el.selector = formatQuery(matcher, options)

  log && cy.state('current') === command && log.set({
    $el,
    consoleProps: () => {
      return {
        [matcherLabel]: matcher,
        ...(_.isEmpty(options) ? {} : { Options: options }),
        'Applied To': $dom.getElements(search.$scope),
        Yielded: $dom.getElements($el),
        Elements: $el.length,
      }
    },
  })

  return $el
}

// A shadow root has no tag to show, so it's described by its host.
const describeScope = ($scope: JQuery<GetByRoot> | undefined) => {
  if (!$scope || $scope.is('body')) {
    return ''
  }

  const scope = $scope.toArray()

  if (scope.every($elements.isShadowRoot)) {
    return ` within the shadow root of the element: ${$dom.stringify(scope.map((root) => root.host), 'short')}`
  }

  return ` within the element: ${$dom.stringify($scope, 'short')}`
}

interface MissDetails {
  // A noun phrase, e.g. `an accessible element with the role "button"`.
  description: string
  // The most recent search, if the query got far enough to run one.
  search: Search | undefined
  // Extra help for why nothing was found. Only computed when it's shown.
  hint?: () => string | undefined
}

// Rewrites an existence failure to say what the query looked for and where,
// plus any hint about why nothing matched.
export const explainMiss = (err, query: GetByQuery<any>, { description, search, hint }: MissDetails) => {
  if (err.type !== 'existence') {
    return
  }

  const hintText = !err.negated && hint ? hint() : undefined

  const { message, docsUrl } = $errUtils.cypressErrByPath(err.negated ? 'get_by.found' : 'get_by.not_found', {
    args: {
      description,
      scope: describeScope(search?.$scope),
      hints: hintText ? `\n\n${hintText}` : '',
      docsUrl: query.docsUrl,
    },
  })

  err.message = message
  err.docsUrl = docsUrl
}
