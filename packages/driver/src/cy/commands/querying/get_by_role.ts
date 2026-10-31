import _ from 'lodash'

import $errUtils from '../../../cypress/error_utils'
import $utils from '../../../cypress/utils'
import { resolveShadowDomInclusion } from '../../../cypress/shadow_dom_utils'
import {
  AccessibilityCache,
  describeMatcher,
  getNativeTagNames,
  getRoleSelector,
  hasNativeRole,
  summarizeRoles,
} from '../../../dom/accessibility'
import { explainMiss, findMatches, logQuery, pickOptions, searchScope, validateOptions, yieldMatches } from './get_by'
import { isNativeOnly, matchesRole } from './role_match'
import { extendRemoteSubject, getRemoteWithinSubject, isRemoteDriverEnabled } from '../../remote'
import type { GetByRoleOptions } from './role_match'
import type { GetByQuery, GetByRoot, Search } from './get_by'

// Keeps the error readable on large pages.
const MAX_ROLES_IN_HINT = 20
const MAX_NAMES_PER_ROLE = 5

const formatNames = (names: string[]) => {
  const shown = names.slice(0, MAX_NAMES_PER_ROLE).map((name) => (name ? `"${name}"` : '(no name)'))
  const remaining = names.length - shown.length

  return remaining > 0 ? `${shown.join(', ')} and ${remaining} more` : shown.join(', ')
}

// Explains a failure caused by `native`: an element would have matched, but
// it only has the role through a `role` attribute.
const getNativeHint = (roots: GetByRoot[], role: string, options: GetByRoleOptions, cache: AccessibilityCache) => {
  const skipped = roots.some((root) => {
    return Array.from(root.querySelectorAll(getRoleSelector(role))).some((element) => {
      return !hasNativeRole(element, role) && matchesRole(element, role, { ...options, native: false }, cache)
    })
  })

  if (!skipped) {
    return ''
  }

  const tags = getNativeTagNames(role).map((tag) => `\`<${tag}>\``).join(', ')

  return `${$errUtils.errByPath('get_by.getByRole.native_hint', { role, tags }).message}\n\n`
}

const GET_BY_ROLE: GetByQuery<GetByRoleOptions> = {
  name: 'getByRole',
  docsUrl: 'https://on.cypress.io/getbyrole',
  options: {
    name: 'matcher',
    hidden: 'boolean',
    native: 'boolean',
  },
  unsupportedOptionHints: {
    checked: '`.filter(\':checked\')` for a native checkbox or radio, or `.filter(\'[aria-checked=true]\')` for an element with a `role` attribute',
    selected: '`.filter(\':selected\')` or `.filter(\'[aria-selected=true]\')`',
    pressed: '`.filter(\'[aria-pressed=true]\')`',
    expanded: '`.filter(\'[aria-expanded=true]\')`',
    current: '`.filter(\'[aria-current=page]\')`',
    busy: '`.filter(\'[aria-busy=true]\')`',
    level: '`.filter(\'h2, [aria-level=2]\')`',
    value: '`.filter(\'[aria-valuenow=50]\')`',
  },
}

function validateRole (role: unknown): asserts role is string {
  if (!_.isString(role) || _.isBlank(role)) {
    return $errUtils.throwErrByPath('get_by.getByRole.invalid_role', {
      args: { matcher: $utils.stringifyActual(role) },
    })
  }

  // A role is a single token, so one with whitespace could never match,
  // and a newline would also break the attribute selector.
  if (/\s/.test(role)) {
    $errUtils.throwErrByPath('get_by.getByRole.role_with_whitespace', {
      args: { role: $utils.stringifyActual(role) },
    })
  }
}

const validateNative = (role: string, { native }: GetByRoleOptions) => {
  if (native && !getNativeTagNames(role).length) {
    $errUtils.throwErrByPath('get_by.getByRole.no_native_element', { args: { role } })
  }
}

const describeQuery = (role: string, { name, hidden = false, native }: GetByRoleOptions) => {
  const nameHint = name === undefined ? '' : ` and name ${describeMatcher(name)}`
  const noun = _.compact([!hidden && 'accessible', isNativeOnly(role, native) && 'native', 'element']).join(' ')

  return `${noun.startsWith('native') ? 'a' : 'an'} ${noun} with the role "${role}"${nameHint}`
}

// Lists the roles that are present, so a typo or a wrong guess about an
// element's role is easy to spot.
const getNotFoundHint = (roots: GetByRoot[], role: string, options: GetByRoleOptions) => {
  const cache = new AccessibilityCache()
  const { hidden = false, native } = options
  const nativeHint = isNativeOnly(role, native) ? getNativeHint(roots, role, options, cache) : ''
  const roles = summarizeRoles(roots, { hidden }, cache)

  if (!roles.length) {
    return nativeHint + $errUtils.errByPath(`get_by.getByRole.${hidden ? 'no_roles' : 'no_accessible_roles'}`).message
  }

  const shown = roles.slice(0, MAX_ROLES_IN_HINT)
  const lines = shown.map((summary) => `  - ${summary.role}: ${formatNames(summary.names)}`)

  if (roles.length > shown.length) {
    lines.push(`  - and ${roles.length - shown.length} more roles`)
  }

  return nativeHint + $errUtils.errByPath('get_by.getByRole.roles_hint', {
    accessible: hidden ? '' : 'accessible ',
    roles: lines.join('\n'),
  }).message
}

export default (Commands, Cypress, cy) => {
  Commands.addQuery('getByRole', function getByRole (role: unknown, userOptions: unknown = {}) {
    validateRole(role)
    validateOptions(GET_BY_ROLE, userOptions)

    const options = pickOptions(GET_BY_ROLE, userOptions)

    validateNative(role, options)

    const includeShadowDom = resolveShadowDomInclusion(Cypress, userOptions.includeShadowDom)
    const withinSubject = cy.state('withinSubjectChain')
    const log = logQuery(this, Cypress, role, options, userOptions)

    // the matching runs in the AUT, so the name has to cross as JSON; a failure there has no search to describe
    if (isRemoteDriverEnabled(Cypress)) {
      const { name: matcher } = options

      if (typeof matcher === 'function') {
        return $errUtils.throwErrByPath('remote_driver.unsupported_argument', { args: { cmd: 'getByRole' } })
      }

      const name = _.isRegExp(matcher) ? { source: matcher.source, flags: matcher.flags } : matcher

      return (subject) => {
        const scope = subject ?? (withinSubject ? getRemoteWithinSubject(() => cy.getSubjectFromChain(withinSubject), 'getByRole') : undefined)

        return extendRemoteSubject('getByRole', scope, { type: 'role', role, name, hidden: options.hidden, native: options.native, includeShadowDom }, describeQuery(role, options))
      }
    }

    // Kept from the most recent attempt so a failure can describe it.
    let lastSearch: Search | undefined

    this.set('onFail', (err) => {
      explainMiss(err, GET_BY_ROLE, {
        description: describeQuery(role, options),
        search: lastSearch,
        hint: () => getNotFoundHint(lastSearch?.roots ?? [], role, options),
      })
    })

    return (subject) => {
      Cypress.ensure.isType(subject, ['optional', 'element', 'window', 'document'], this.get('name'), cy)
      Cypress.ensure.commandCanCommunicateWithAUT(cy)

      const search = searchScope(cy, subject, withinSubject, includeShadowDom)
      const matches = findMatches(search.roots, getRoleSelector(role), (element, cache) => matchesRole(element, role, options, cache))

      lastSearch = search

      return yieldMatches(this, cy, log, matches, { matcherLabel: 'Role', matcher: role, options, search })
    }
  })
}
