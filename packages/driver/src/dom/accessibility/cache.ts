/**
 * Memoizes the expensive per-element lookups a single query pass makes.
 * Create one per retry: styles and roles can change between retries, so
 * nothing is kept once the pass that computed it finishes.
 */
export class AccessibilityCache {
  private styles = new WeakMap<Element, CSSStyleDeclaration>()
  private roles = new WeakMap<Element, string[]>()
  private inaccessibleSubtrees = new WeakMap<Element, boolean>()

  getComputedStyle = (element: Element): CSSStyleDeclaration => {
    let style = this.styles.get(element)

    if (!style) {
      style = (element.ownerDocument.defaultView as Window).getComputedStyle(element)
      this.styles.set(element, style)
    }

    return style
  }

  memoRoles (element: Element, compute: () => string[]): string[] {
    let roles = this.roles.get(element)

    if (!roles) {
      roles = compute()
      this.roles.set(element, roles)
    }

    return roles
  }

  memoSubtreeInaccessible (element: Element, compute: () => boolean): boolean {
    let inaccessible = this.inaccessibleSubtrees.get(element)

    if (inaccessible === undefined) {
      inaccessible = compute()
      this.inaccessibleSubtrees.set(element, inaccessible)
    }

    return inaccessible
  }
}
