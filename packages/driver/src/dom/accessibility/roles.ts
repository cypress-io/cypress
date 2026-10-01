import { elementRoles, roleElements, roles as roleDefinitions } from 'aria-query'
import type { ARIARoleDefinitionKey, ARIARoleRelationConcept } from 'aria-query'
import { computeAccessibleDescription, computeAccessibleName } from 'dom-accessibility-api'
import { escapeBackslashes, escapeQuotes } from '../../util/escape'
import { getParentNode } from '../elements/find'
import { AccessibilityCache } from './cache'

type ElementRoleEntry = ARIARoleRelationConcept

interface ImplicitRoleRule {
  match: (element: Element) => boolean
  roles: string[]
  specificity: number
}

// aria-query's element-level `constraints`, such as "scoped to the body
// element", describe DOM context a selector can't express, so they're ignored:
// every `<header>` is a `banner` and every `<td>` is a `cell`.
const makeElementSelector = ({ name, attributes = [] }: ElementRoleEntry) => {
  return `${name}${attributes.map(({ name: attributeName, value, constraints = [] }) => {
    const shouldNotExist = (constraints as string[]).includes('undefined')
    const shouldBeNonEmpty = (constraints as string[]).includes('set')

    if (value !== undefined) {
      return `[${attributeName}="${value}"]`
    }

    if (shouldNotExist) {
      return `:not([${attributeName}])`
    }

    if (shouldBeNonEmpty) {
      return `[${attributeName}]:not([${attributeName}=""])`
    }

    return `[${attributeName}]`
  }).join('')}`
}

const makeRule = (entry: ElementRoleEntry, roles: string[]): ImplicitRoleRule => {
  const attributes = entry.attributes ?? []
  // `input[type="text"]` must also match an `<input>` whose type is missing or
  // invalid, since the browser treats both as text inputs. Matching on the
  // `type` property instead of the attribute covers that.
  const typeText = attributes.find((attribute) => attribute.name === 'type' && attribute.value === 'text')
  // A `<select>` is a `listbox` when its `size` is greater than 1 and a
  // `combobox` otherwise, including `size="1"`. A selector can't compare
  // numbers, so this is checked on the parsed `size` property.
  const selectSize = entry.name === 'select' ? attributes.find((attribute) => attribute.name === 'size') : undefined
  const needsSizeAboveOne = (selectSize?.constraints as string[] | undefined)?.includes('>1')
  const selector = makeElementSelector({
    ...entry,
    attributes: attributes.filter((attribute) => attribute !== typeText && attribute !== selectSize),
  })

  return {
    match: (element) => {
      if (typeText && (element as HTMLInputElement).type !== 'text') {
        return false
      }

      if (selectSize && ((element as HTMLSelectElement).size > 1) !== needsSizeAboveOne) {
        return false
      }

      return element.matches(selector)
    },
    roles,
    specificity: attributes.length,
  }
}

let implicitRoleRules: ImplicitRoleRule[] | undefined

const getImplicitRoleRules = () => {
  if (!implicitRoleRules) {
    implicitRoleRules = Array.from(elementRoles.entries())
    .map(([entry, roles]) => makeRule(entry, Array.from(roles)))
    .sort((left, right) => right.specificity - left.specificity)
  }

  return implicitRoleRules
}

const getImplicitRoles = (element: Element): string[] => {
  for (const { match, roles } of getImplicitRoleRules()) {
    if (match(element)) {
      return [...roles]
    }
  }

  return []
}

// Abstract roles such as `widget` only organize the ARIA taxonomy, so authors
// can't give them to elements.
const isValidRole = (role: string) => {
  const definition = roleDefinitions.get(role as ARIARoleDefinitionKey)

  return !!definition && !definition.abstract
}

// A `role` attribute lists fallbacks in order, and browsers use the first
// valid one: `role="switch checkbox"` is a switch, and `role="foo button"` is a
// button. With no valid token, the element keeps its implicit role.
export const getRoles = (element: Element, cache = new AccessibilityCache()): string[] => {
  return cache.memoRoles(element, () => {
    const explicitRole = (element.getAttribute('role') ?? '').split(/\s+/).find(isValidRole)

    if (explicitRole) {
      return [explicitRole]
    }

    return getImplicitRoles(element)
  })
}

export const hasRole = (element: Element, role: string, cache?: AccessibilityCache) => {
  return getRoles(element, cache).includes(role)
}

// Empty for widget roles such as `tab` or `menuitem`, which HTML has no element for.
export const getNativeTagNames = (role: string): string[] => {
  return Array.from(new Set(Array.from(roleElements.get(role as ARIARoleDefinitionKey) ?? [], ({ name }) => name)))
}

// Whether `element` has `role` because of its tag, like `<button>`, rather than
// only through a `role` attribute, like `<div role="button">`. Every native
// element for the role counts, not just the element's implicit role: a `<td>`
// is a `cell` by default but a `gridcell` inside a grid.
export const hasNativeRole = (element: Element, role: string) => {
  return !element.hasAttribute('role') || getImplicitRoleRules().some((rule) => rule.roles.includes(role) && rule.match(element))
}

// Over-matches, since a tag that can imply a role doesn't always, so every
// candidate still has to pass `hasRole`.
export const getRoleSelector = (role: string) => {
  return [`*[role~="${escapeQuotes(escapeBackslashes(role))}"]`, ...getNativeTagNames(role)].join(',')
}

const isSubtreeInaccessible = (element: Element, cache = new AccessibilityCache()): boolean => {
  return cache.memoSubtreeInaccessible(element, () => {
    return (element as HTMLElement).hidden === true
      || element.getAttribute('aria-hidden') === 'true'
      || cache.getComputedStyle(element).display === 'none'
  })
}

// `visibility` is inherited and a descendant can set it back to `visible`, so
// only the element's own value counts. The other checks hide a whole subtree,
// so they apply to every ancestor.
export const isInaccessible = (element: Element, cache = new AccessibilityCache()): boolean => {
  if (cache.getComputedStyle(element).visibility === 'hidden') {
    return true
  }

  // `getParentNode` crosses shadow boundaries, so `aria-hidden` or `display: none`
  // on a shadow host also hides the elements inside its shadow tree.
  for (let current: Element | null = element; current; current = getParentNode(current)) {
    if (isSubtreeInaccessible(current, cache)) {
      return true
    }
  }

  return false
}

// `::before` and `::after` content is left out of names so that an icon-font
// glyph, which lives in a pseudo-element, doesn't end up in a button's name.
// The cache relies on this: it never looks up pseudo-element styles.
const textAlternativeOptions = (cache: AccessibilityCache) => {
  return {
    computedStyleSupportsPseudoElements: false,
    getComputedStyle: cache.getComputedStyle as typeof window.getComputedStyle,
  }
}

export const getAccessibleName = (element: Element, cache = new AccessibilityCache()) => {
  return computeAccessibleName(element, textAlternativeOptions(cache))
}

export const getAccessibleDescription = (element: Element, cache = new AccessibilityCache()) => {
  return computeAccessibleDescription(element, textAlternativeOptions(cache))
}

export interface RoleSummary {
  role: string
  names: string[]
}

// Only the descendants of `roots` are listed, since those are all a query can
// match. `generic` is left out since it's rarely the role anyone is looking for.
export const summarizeRoles = (roots: Array<Element | ShadowRoot>, { hidden = false } = {}, cache = new AccessibilityCache()): RoleSummary[] => {
  const byRole = new Map<string, string[]>()

  const record = (element: Element) => {
    if (!hidden && isInaccessible(element, cache)) {
      return
    }

    for (const role of getRoles(element, cache)) {
      if (role === 'generic') {
        continue
      }

      const names = byRole.get(role) ?? []

      names.push(getAccessibleName(element, cache))
      byRole.set(role, names)
    }
  }

  // Roots can be nested, as when a query is chained off `cy.get('div')`, so an
  // element can be reached more than once.
  const visited = new Set<Element>()

  const visit = (element: Element) => {
    if (visited.has(element)) {
      return
    }

    visited.add(element)
    record(element)

    for (const child of Array.from(element.children)) {
      visit(child)
    }
  }

  for (const root of roots) {
    for (const child of Array.from(root.children)) {
      visit(child)
    }
  }

  return Array.from(byRole, ([role, names]) => ({ role, names }))
}
