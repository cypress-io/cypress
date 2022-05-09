import $errUtils from '../../../cypress/error_utils'

// These properties are required to avoid failing prior to attempting to use the subject.
// If Symbol.toStringTag is passed through to the target we will not properly fail the 'cy.invoke' command.
const passThroughProps = [
  'then',
  Symbol.isConcatSpreadable,
  'jquery',
  'nodeType',
  'window',
  'document',
  'inspect',
  'isSinonProxy',
  '_spreadArray',
  'selector',
]

/**
 * Create a proxy object to fail when accessed or called.
 * @param type The type of operand that failed to serialize
 * @returns A proxy object that will fail when accessed.
 */
export const createUnserializableSubjectProxy = (type: string) => {
  let target = {}

  // If the failed subject is a function, use a function as the target.
  if (type === 'function') {
    target = () => {}
  }

  // Symbol note: The target can't be a symbol, but we can use an object until the symbol is accessed, then provide a different error.

  return new Proxy(target, {
    /**
     * Throw an error if the proxy is called like a function.
     * @param target the proxy target
     * @param thisArg this
     * @param argumentsList args passed.
     */
    apply () {
      $errUtils.throwErrByPath('origin.failed_to_serialize_function')
    },

    /**
     * Throw an error if any properties besides the listed ones are accessed.
     * @param target The proxy target
     * @param prop The property being accessed
     * @param receiver Either the proxy or an object that inherits from the proxy.
     * @returns either an error or the result of the allowed get on the target.
     */
    get (target, prop) {
      if (passThroughProps.includes(prop)) {
        return target[prop]
      }

      // Provide a slightly different message if the object was meant to be a symbol.
      if (type === 'symbol') {
        $errUtils.throwErrByPath('origin.failed_to_serialize_symbol')
      } else {
        $errUtils.throwErrByPath('origin.failed_to_serialize_object')
      }
    },
  })
}
