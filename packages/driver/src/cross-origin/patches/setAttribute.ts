import { STRIPPED_INTEGRITY_TAG } from '@packages/rewriter/lib/constants.json'

export const patchElementIntegrity = (window: Window) => {
  const originalFormElementSetAttribute = window.HTMLFormElement.prototype.setAttribute

  window.HTMLFormElement.prototype.setAttribute = function (qualifiedName, value) {
    if (qualifiedName === 'integrity') {
      qualifiedName = STRIPPED_INTEGRITY_TAG
    }

    return originalFormElementSetAttribute.apply(this, [qualifiedName, value])
  }

  const originalAnchorElementSetAttribute = window.HTMLAnchorElement.prototype.setAttribute

  window.HTMLAnchorElement.prototype.setAttribute = function (qualifiedName, value) {
    if (qualifiedName === 'integrity') {
      qualifiedName = STRIPPED_INTEGRITY_TAG
    }

    return originalAnchorElementSetAttribute.apply(this, [qualifiedName, value])
  }
}
