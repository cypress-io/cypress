import type { AccessibilityCache } from '../../../dom/accessibility'
import {
  getAccessibleName,
  getNativeTagNames,
  hasNativeRole,
  hasRole,
  identityNormalizer,
  isInaccessible,
  matches,
} from '../../../dom/accessibility'

// How cy.getByRole decides an element matches, shared with the remote driver's agent

// The public option types, so the runtime validation can't drift from them.
export type GetByRoleOptions = Partial<Pick<Cypress.GetByRoleOptions, 'name' | 'hidden' | 'native'>>

// `native` defaults to on wherever HTML has an element for the role. A widget
// role such as `tab` has none, so for those it defaults to off rather than
// matching nothing.
export const isNativeOnly = (role: string, native?: boolean) => native ?? getNativeTagNames(role).length > 0

// Cheapest check first: most candidates are ruled out by role alone, and
// computing a name walks the element's whole subtree.
export const matchesRole = (element: Element, role: string, { name, hidden = false, native }: GetByRoleOptions, cache: AccessibilityCache) => {
  if (!hasRole(element, role, cache) || (isNativeOnly(role, native) && !hasNativeRole(element, role))) {
    return false
  }

  if (!hidden && isInaccessible(element, cache)) {
    return false
  }

  // The name computation already trims the name and collapses runs of
  // whitespace, so it's matched as computed, as Testing Library does.
  return name === undefined || matches(getAccessibleName(element, cache), element, name, { normalizer: identityNormalizer })
}
