import constants from '@packages/rewriter/lib/constants.json'

export const patchElementIntegrity = (window: Window) => {
  const originalFormElementSetAttribute = window.HTMLScriptElement.prototype.setAttribute

  window.HTMLScriptElement.prototype.setAttribute = function (qualifiedName, value) {
    if (qualifiedName === 'integrity') {
      qualifiedName = constants.STRIPPED_INTEGRITY_TAG
    }

    return originalFormElementSetAttribute.apply(this, [qualifiedName, value])
  }

  const originalAnchorElementSetAttribute = window.HTMLLinkElement.prototype.setAttribute

  window.HTMLLinkElement.prototype.setAttribute = function (qualifiedName, value) {
    if (qualifiedName === 'integrity') {
      qualifiedName = constants.STRIPPED_INTEGRITY_TAG
    }

    return originalAnchorElementSetAttribute.apply(this, [qualifiedName, value])
  }
}
