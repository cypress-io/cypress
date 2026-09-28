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
import type { AccessibilityCache, Matcher } from '../../../dom/accessibility'
import { addGetByQuery } from './get_by'
import type { GetByRoot } from './get_by'

interface GetByRoleOptions {
  name?: Matcher
  hidden?: boolean
  native?: boolean
}

// Keeps the error readable on large pages.
const MAX_ROLES_IN_HINT = 20
const MAX_NAMES_PER_ROLE = 5

const formatNames = (names: string[]) => {
  const shown = names.slice(0, MAX_NAMES_PER_ROLE).map((name) => (name ? `"${name}"` : '(no name)'))
  const remaining = names.length - shown.length

  return remaining > 0 ? `${shown.join(', ')} and ${remaining} more` : shown.join(', ')
}

// Explains a failure caused by `native: true`: elements with the role exist,
// but only through a `role` attribute.
const getNativeHint = (roots: GetByRoot[], role: string, cache: AccessibilityCache) => {
  const skipped = roots.some((root) => {
    return Array.from(root.querySelectorAll(getRoleSelector(role))).some((element) => hasRole(element, role, cache) && !hasNativeRole(element, role))
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
      checked: '`.should(\'be.checked\')` or `.filter(\':checked\')`',
      selected: '`.filter(\':selected\')` or `.filter(\'[aria-selected=true]\')`',
      pressed: '`.filter(\'[aria-pressed=true]\')`',
      expanded: '`.filter(\'[aria-expanded=true]\')`',
      current: '`.filter(\'[aria-current=page]\')`',
      busy: '`.filter(\'[aria-busy=true]\')`',
      level: '`.filter(\'h2, [aria-level=2]\')`',
      value: '`.filter(\'[aria-valuenow=50]\')`',
    },

    validateMatcher (role) {
      if (!_.isString(role) || _.isBlank(role)) {
        $errUtils.throwErrByPath('get_by.getByRole.invalid_role', {
          args: { matcher: $utils.stringifyActual(role) },
        })
      }
    },

    validate (role, { native }) {
      if (native && !getNativeTagNames(role).length) {
        $errUtils.throwErrByPath('get_by.getByRole.no_native_element', { args: { role } })
      }
    },

    candidates: (role) => getRoleSelector(role),

    // Cheapest check first: most candidates are ruled out by role alone, and
    // computing a name walks the element's whole subtree.
    match (element, role, { name, hidden = false, native = false }, cache) {
      if (!hasRole(element, role, cache) || (native && !hasNativeRole(element, role))) {
        return false
      }

      if (!hidden && isInaccessible(element, cache)) {
        return false
      }

      // The name computation already collapses whitespace, so a function
      // matcher receives the name exactly as computed.
      return name === undefined || matches(getAccessibleName(element, cache), element, name, { normalizer: identityNormalizer })
    },

    describe (role, { name, hidden = false, native = false }) {
      const nameHint = name === undefined ? '' : ` and name ${describeMatcher(name)}`

      const noun = _.compact([!hidden && 'accessible', native && 'native', 'element']).join(' ')

      return `${noun.startsWith('native') ? 'a' : 'an'} ${noun} with the role "${role}"${nameHint}`
    },

    onNotFound (roots, role, { hidden = false, native = false }, cache) {
      const nativeHint = native ? getNativeHint(roots, role, cache) : ''
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
