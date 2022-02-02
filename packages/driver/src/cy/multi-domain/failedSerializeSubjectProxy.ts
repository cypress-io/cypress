import $errUtils from '../../cypress/error_utils'

/**
 * Create a proxy object to fail when accessed or called.
 * @param type The type of operand that failed to serialize
 * @returns A proxy object that will fail when accessed.
 */
const failedToSerializeSubject = (type: string) => {
  let target = {}

  // If the failed subject is a function, use a function as the target.
  if (type === 'function') {
    target = () => {}
  }

  // Symbol note: I don't think the target can be a symbol, but we can just use an object until the symbols is accessed, then provide a different error.

  return new Proxy(target, {
    /**
     * Throw an error if the proxy is called like a function.
     * @param target the proxy target
     * @param thisArg this
     * @param argumentsList args passed.
     */
    apply (target, thisArg, argumentsList) {
      $errUtils.throwErrByPath('switchToDomain.failed_to_serialize_function')
    },

    /**
     * Throw an error if any properties besides the listed ones are accessed.
     * @param target The proxy target
     * @param prop The property being accessed
     * @param receiver Either the proxy or an object that inherits from the proxy.
     * @returns either an error or the result of the allowed get on the target.
     */
    get (target, prop, receiver) {
      // These properties are required to avoid failing prior to attempting to use the subject.
      if (
        prop === 'then'
        || prop === Symbol.isConcatSpreadable
        || prop === 'jquery'
        || prop === 'nodeType'
        // || prop === Symbol.toStringTag // If this is passed through to the target we will not properly fail the 'cy.invoke' command.
        || prop === 'window'
        || prop === 'document'
        || prop === 'inspect'
        || prop === 'isSinonProxy'
        || prop === '_spreadArray'
        || prop === 'selector'
      ) {
        return target[prop]
      }

      // Provide a slightly different message if the object was meant to be a symbol.
      if (type === 'symbol') {
        $errUtils.throwErrByPath('switchToDomain.failed_to_serialize_symbol')
      } else {
        $errUtils.throwErrByPath('switchToDomain.failed_to_serialize_object')
      }
    },
  })
}

export { failedToSerializeSubject }
