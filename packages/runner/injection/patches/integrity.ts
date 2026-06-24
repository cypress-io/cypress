import constants from '@packages/rewriter/lib/constants.json'

const STRIPPED_INTEGRITY_TAG = constants.STRIPPED_INTEGRITY_TAG

// Cypress's proxy rewrites JS/HTML, changing resource bytes and invalidating any pinned
// Subresource Integrity (SRI) hash — so the browser blocks the resource. These patches redirect
// `integrity` set on <script>/<link> at runtime to a non-enforced attribute
// (`cypress-stripped-integrity`), still reflecting the value back to app code that reads it.

// integrity set via setAttribute('integrity', …)
const patchSetAttribute = (prototype) => {
  const originalSetAttribute = prototype.setAttribute

  prototype.setAttribute = function (qualifiedName, value) {
    if (qualifiedName === 'integrity') {
      qualifiedName = STRIPPED_INTEGRITY_TAG
    }

    return originalSetAttribute.apply(this, [qualifiedName, value])
  }
}

// integrity set via the reflected property (el.integrity = sriHashes[id]) — the
// webpack-subresource-integrity pattern, which a regex can't rewrite (non-literal value).
// The setter stores it in the stripped attribute; the getter still returns it for app code.
const patchIntegrityProperty = (prototype) => {
  Object.defineProperty(prototype, 'integrity', {
    configurable: true,
    enumerable: true,
    get () {
      return this.getAttribute(STRIPPED_INTEGRITY_TAG) ?? ''
    },
    set (value) {
      this.setAttribute(STRIPPED_INTEGRITY_TAG, value)
    },
  })
}

export const patchElementIntegrity = (window: Window) => {
  const ctors = [window.HTMLScriptElement, window.HTMLLinkElement]

  ctors.forEach((ctor) => {
    patchSetAttribute(ctor.prototype)
    patchIntegrityProperty(ctor.prototype)
  })
}
