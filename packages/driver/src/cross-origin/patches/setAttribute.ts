import { STRIPPED_INTEGRITY_TAG } from '@packages/rewriter/lib/constants.json'

export const patchElementIntegrity = (window: Window) => {
  const originalSetAttribute = window.Element.prototype.setAttribute

  window.Element.prototype.setAttribute = function (qualifiedName, value) {
    if (qualifiedName === 'integrity') {
      qualifiedName = STRIPPED_INTEGRITY_TAG
    }

    return originalSetAttribute.apply(this, [qualifiedName, value])
  }
}
