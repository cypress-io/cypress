import _ from 'lodash'

import $errUtils from '../../../cypress/error_utils'
import $utils from '../../../cypress/utils'
import {
  describeMatcher,
  getAccessibleName,
  getNativeTagNames,
  getRoleSelector,
  hasNativeRole,
  hasRole,
  identityNormalizer,
  isInaccessible,
  matches,
  summarizeRoles,
} from '../../../dom/accessibility'
import type { AccessibilityCache } from '../../../dom/accessibility'
import { addGetByQuery } from './get_by'
import type { GetByRoot } from './get_by'

// The public option types, so the runtime validation can't drift from them.
type GetByRoleOptions = Partial<Pick<Cypress.GetByRoleOptions, 'name' | 'hidden' | 'native'>>

// Keeps the error readable on large pages.
const MAX_ROLES_IN_HINT = 20
const MAX_NAMES_PER_ROLE = 5

const formatNames = (names: string[]) => {
  const shown = names.slice(0, MAX_NAMES_PER_ROLE).map((name) => (name ? `"${name}"` : '(no name)'))
  const remaining = names.length - shown.length

  return remaining > 0 ? `${shown.join(', ')} and ${remaining} more` : shown.join(', ')
}

// `native` defaults to on wherever HTML has an element for the role. A widget
// role such as `tab` has none, so for those it defaults to off rather than
// matching nothing.
const isNativeOnly = (role: string, native?: boolean) => native ?? getNativeTagNames(role).length > 0

// Cheapest check first: most candidates are ruled out by role alone, and
// computing a name walks the element's whole subtree.
const matchesRole = (element: Element, role: string, { name, hidden = false, native }: GetByRoleOptions, cache: AccessibilityCache) => {
  if (!hasRole(element, role, cache) || (isNativeOnly(role, native) && !hasNativeRole(element, role))) {
    return false
  }

  if (!hidden && isInaccessible(element, cache)) {
    return false
  }

  // The name computation already collapses whitespace, so a function
  // matcher receives the name exactly as computed.
  return name === undefined || matches(getAccessibleName(element, cache), element, name, { normalizer: identityNormalizer })
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

export default (Commands, Cypress, cy) => {
  addGetByQuery<string, GetByRoleOptions>(Commands, Cypress, cy, {
    name: 'getByRole',
    docsUrl: 'https://on.cypress.io/getbyrole',
    matcherLabel: 'Role',
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

    validateMatcher (role): asserts role is string {
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
    },

    validate (role, { native }) {
      if (native && !getNativeTagNames(role).length) {
        $errUtils.throwErrByPath('get_by.getByRole.no_native_element', { args: { role } })
      }
    },

    candidates: (role) => getRoleSelector(role),

    match: matchesRole,

    describe (role, { name, hidden = false, native }) {
      const nameHint = name === undefined ? '' : ` and name ${describeMatcher(name)}`

      const noun = _.compact([!hidden && 'accessible', isNativeOnly(role, native) && 'native', 'element']).join(' ')

      return `${noun.startsWith('native') ? 'a' : 'an'} ${noun} with the role "${role}"${nameHint}`
    },

    onNotFound (roots, role, options, cache) {
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
    },
  })
}
