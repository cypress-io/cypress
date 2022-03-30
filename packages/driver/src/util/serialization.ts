import _ from 'lodash'
import $dom from '../dom'
import structuredClonePonyfill from 'core-js-pure/actual/structured-clone'
import $stackUtils from '../cypress/stack_utils'
import $errUtils from '../cypress/error_utils'

export const UNSERIALIZABLE = '__cypress_unserializable_value'

// If a native structuredClone exists, use that to determine if a value can be serialized or not. Otherwise, use the ponyfill.
// we need this because some implementations of SCA treat certain values as unserializable (ex: Error is serializable in ponyfill but NOT in firefox implementations)
// @ts-ignore
const structuredCloneRef = window?.structuredClone || structuredClonePonyfill

const isSerializableInCurrentBrowser = (value: any) => {
  try {
    structuredCloneRef(value)

    // @ts-ignore
    if (Cypress.isBrowser('firefox') && _.isError(value) && structuredCloneRef !== window?.structuredClone) {
      /**
       * NOTE: structuredClone() was introduced in Firefox 94. Supported versions below 94 need to use the ponyfill
       * to determine whether or not a value can be serialized through postMessage. Since the ponyfill deems Errors
       * as clone-able, but postMessage does not in Firefox, we must make sure we do NOT attempt to send native errors through firefox
       */
      return false
    }

    return true
  } catch (e) {
    return false
  }
}

/**
 * Walks the prototype chain and finds any serializable properties that exist on the object or its prototypes.
 * If the property can be serialized, the property is added to the literal.
 * This means read-only properties are now read/write on the literal.
 *
 * Please see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone for more details.
 * @param obj Object that is being converted
 * @returns a new object void of prototype chain (object literal) with all serializable properties
 */
const convertObjectToSerializableLiteral = (obj): typeof obj => {
  const allProps: string[] = []
  let currentObjectRef = obj

  do {
    const props = Object.getOwnPropertyNames(currentObjectRef)

    props.forEach((prop: string) => {
      try {
        if (!allProps.includes(prop) && isSerializableInCurrentBrowser(currentObjectRef[prop])) {
          allProps.push(prop)
        }
      } catch (err) {
      /**
       * In some browsers, properties of objects on the prototype chain point to the implementation object.
       * Depending on implementation constraints, these properties may throw an error when accessed.
       *
       * ex: DOMException's prototype is Error, and calling the 'name' getter on DOMException's prototype
       * throws a TypeError since Error does not implement the DOMException interface.
       */
        if (err?.name !== 'TypeError') {
          throw err
        }
      }
    })

    currentObjectRef = Object.getPrototypeOf(currentObjectRef)
  } while (currentObjectRef)

  const objectAsLiteral = {}

  allProps.forEach((key) => {
    objectAsLiteral[key] = obj[key]
  })

  return objectAsLiteral
}

/**
 * Sanitizes any unserializable values to prep for postMessage serialization. All Objects, including Errors, are mapped to an Object literal with
 * whatever serialization properties they have, including their prototype hierarchy.
 * This keeps behavior consistent between browsers without having to worry about the inner workings of structuredClone(). For example:
 *
 * chromium
 * new Error('myError') -> Object literal with message key having value 'myError'. Also, other custom properties on the object are omitted and only name, message, and stack are preserved
 *
 * For instance:
 * var a = new Error('myError')
 * a.foo = 'bar'
 * var b = structuredClone(a)
 * b.foo // is undefined
 *
 * firefox
 * structuredClone(new Error('myError')) -> throws error as native error cannot be serialized
 *
 * This method takes a similar approach as the 'chromium' structuredClone algorithm, except that the prototype chain is walked and ANY serializable value, including getters, is serialized.
 * Please see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone.
 *
 *  NOTE: If an object nested inside valueToSanitize contains an unserializable property, the whole object is deemed as unserializable
 * @param valueToSanitize subject of sanitization that might be unserializable or have unserializable properties
 * @returns a serializable form of the subject. If the value passed in cannot be serialized, an error is thrown
 * @throws '__cypress_unserializable_value'
 */
export const preprocessForSerialization = <T>(valueToSanitize: { [key: string]: any }): T | undefined => {
// Even if native errors can be serialized through postMessage, many properties are omitted on structuredClone(), including prototypical hierarchy
// because of this, we preprocess native errors to objects and postprocess them once they come back to the primary origin

  // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays. This is important for commands like .selectFile() using buffer streams
  if (_.isArray(valueToSanitize) || _.isTypedArray(valueToSanitize)) {
    return _.map(valueToSanitize, preprocessForSerialization) as unknown as T
  }

  if (_.isObject(valueToSanitize)) {
    try {
      const sanitizedValueAsLiteral = convertObjectToSerializableLiteral(valueToSanitize) as T

      // convert any nested structures as well, if objects or arrays, to literals. This is needed in the case of Proxy objects
      _.forEach(sanitizedValueAsLiteral as any, (value, key) => {
        sanitizedValueAsLiteral[key] = preprocessForSerialization(value)
      })

      return sanitizedValueAsLiteral
    } catch (err) {
      // if its not serializable, tell the primary to inform the user that the value thrown could not be serialized
      throw UNSERIALIZABLE
    }
  }

  if (!isSerializableInCurrentBrowser(valueToSanitize)) {
    throw UNSERIALIZABLE
  }

  return valueToSanitize
}

export const reifySerializedError = (serializedError: any, userInvocationStack: string) => {
  // we have no idea what type the error this is... could be 'undefined', a plain old object, or something else entirely

  let reifiedError = $errUtils.errByPath('origin.failed_to_serialize_or_map_thrown_value')

  if (_.isArray(serializedError)) {
    // if the error is an array of anything, create a normal error with the stringified values of the passed in array
    reifiedError = new Error(serializedError.toString())
  } else if (_.isObject(serializedError as any)) {
    // otherwise, try to determine if there are any error details in the object and merge the error objects together
    let errorToMerge = serializedError?.message ? new Error(serializedError?.message || '') : reifiedError

    reifiedError = _.assignWith(errorToMerge, serializedError)
  } else if (serializedError !== UNSERIALIZABLE) {
    reifiedError = new Error(`${serializedError}`)
  }

  reifiedError.onFail = () => {}

  reifiedError.stack = $stackUtils.replacedStack(reifiedError, userInvocationStack)

  return reifiedError
}

export const preProcessDomElement = (props: any) => {
  // hydrate values in HTML copy so when serialized they show up correctly in snapshot. This is important for input boxes with typing and other 'value' attributes
  props.querySelectorAll('input').forEach((input) => {
    input.setAttribute('value', input.value)
    if (input.checked) {
      input.setAttribute('checked', input.checked)
    }
  })

  // TODO: figure out reifying option selection
  // props.querySelectorAll('option').forEach((option) => {
  //   if (option.selected) {
  //     option.setAttribute('selected', option.selected)
  //   }
  // })

  const el = {
    value: props?.value,
    type: props?.type,
    id: props?.id,
    tagName: props.tagName,
    attributes: {},
    innerHTML: props.innerHTML,
  }

  // get all attributes and classes off the element
  props.getAttributeNames().forEach((attributeName) => {
    el.attributes[attributeName] = props.getAttribute(attributeName)
  })

  return el
}

export const postProcessDomElement = (props: any) => {
  const reifiedEl = document.createElement(props.tagName)

  if (props.value) {
    reifiedEl.value = props.value
  }

  try {
    if (props.type) {
      reifiedEl.type = props.type
    }
  } catch (e) {
    // swallow this. certain elements this is a read-only property on (such as <select>)
  }

  if (props.id) {
    reifiedEl.id = props.id
  }

  reifiedEl.innerHTML = props.innerHTML

  Object.keys(props.attributes).forEach((attribute) => {
    reifiedEl.setAttribute(attribute, props.attributes[attribute])
  })

  return reifiedEl
}

export const preprocessLogLikeForSerialization = (props) => {
  try {
    if (_.isArray(props)) {
      return props.map((prop) => {
        try {
          return preprocessLogLikeForSerialization(prop)
        } catch (e) {
          return null
        }
      })
    }

    if (_.isPlainObject(props)) {
      let objWithOnlyUnserializableProps = _.pickBy(props, (value) => !isSerializableInCurrentBrowser(value))

      let preprocessed: any = preprocessForSerialization(props)

      _.forIn(objWithOnlyUnserializableProps, (value, key) => {
        try {
          preprocessed[key] = preprocessLogLikeForSerialization(value)
        } catch (e) {
          preprocessed[key] = null
        }
      })

      return preprocessed
    }

    if ($dom.isDom(props)) {
      // in the case we are dealing with a jQuery array
      if (props.length !== undefined && $dom.isJquery(props)) {
        const serializableArray: any[] = []

        // Nuke any prevObjects or unserializable values. common with assertion 'Subject'
        props.each((key) => serializableArray.push(preprocessLogLikeForSerialization(props[key])))

        return serializableArray
      }

      const serializableDOM = preProcessDomElement(props)

      serializableDOM.serializationKey = 'dom'

      return serializableDOM
    }

    if (_.isFunction(props)) {
      // TODO: re access this. there are functions we want to attempt to unravel/serialize and ones we don't. we might only want to opt into this for console props or something...
      // sinon proxies are circular and will cause the runner to crash. Do NOT serialize these
      // @ts-ignore
      if (props?.isSinonProxy) {
        return null
      }

      return {
        value: preprocessLogLikeForSerialization(props()),
        serializationKey: 'function',
      }
    }

    return preprocessForSerialization(props)
  } catch (e) {
    return null
  }
}

export const postprocessLogLikeFromSerialization = (props) => {
  try {
    if (props?.serializationKey === 'dom') {
      props.html = function () {
        let reifiedElement

        // if snapshots exists, this element needs to be matched against the rendered snapshot on the page LAZILY.
        // a bit of a hack, but we attach the snapshot to the page and then LAZILY select the element

        const attributes = Object.keys(props.attributes).map((attribute) => {
          return `[${attribute}="${props.attributes[attribute]}"]`
        }).join('')

        const selector = `${props.tagName}${attributes}`

        reifiedElement = Cypress.$(selector)

        if (reifiedElement.length) {
          return reifiedElement.length > 1 ? reifiedElement : reifiedElement[0]
        }

        // if the element couldn't be found, return a synthetic copy that doesn't actually exist on the page
        return postProcessDomElement(props)
      }

      return props
    }

    if (props?.serializationKey === 'function') {
      const reifiedFunctionData = postprocessLogLikeFromSerialization(props.value)

      return () => reifiedFunctionData
    }

    // NOTE: transforms arrays into objects to have defined getters for DOM els
    if (_.isObject(props)) {
      let postProcessed = {}

      _.forIn(props, (value, key) => {
        const val = postprocessLogLikeFromSerialization(value)

        if (val?.serializationKey === 'dom') {
          postProcessed = {
            ...postProcessed,
            get [key] () {
              // only calculate the requested $el from console props AFTER the snapshot has been rendered into the AUT
              return val.html()
            },
          }
        } else {
          postProcessed[key] = postprocessLogLikeFromSerialization(value)
        }
      })

      if (_.isArray(props)) {
        // if an array, map the array to or special getter object
        return new Proxy(postProcessed, {
          get (target, name) {
            return target[name] || props[name]
          },
        })
      }

      // otherwise, just returned the object with our special getter
      return postProcessed
    }

    return props
  } catch (e) {
    return null
  }
}

// needs its own method as it needs to be used by the spec bridge on request for the 'final state' snapshot
export const preprocessSnapshotForSerialization = (snapshot) => {
  const preprocessedSnapshot = preprocessLogLikeForSerialization(snapshot)

  try {
    preprocessedSnapshot.body.get.value[0] = preprocessLogLikeForSerialization(snapshot.body.get()[0])
  } catch (e) {
    return null
  }

  // @ts-ignore
  preprocessedSnapshot.styles = cy.getStyles(snapshot)

  return preprocessedSnapshot
}

export const preprocessLogForSerialization = (logAttrs) => {
  let { snapshots, ... logAttrsRest } = logAttrs

  const preprocessed = preprocessLogLikeForSerialization(logAttrsRest)

  if (snapshots && preprocessed) {
    preprocessed.snapshots = snapshots.map((snapshot) => preprocessSnapshotForSerialization(snapshot))
  }

  return preprocessed
}

export const postprocessLogFromSerialization = (logAttrs) => {
  /**
     * consoleProp DOM elements needs to be reified at console printing runtime AFTER the serialized snapshot
     * is attached to the DOM so the element can be located.
     *
     * In most cases, the HIGHLIGHT_ATTR is used to located the element in the snapshot. If that fails or does not locate an element,
     * then a new element is created against the snapshot context. This element will NOT be found on the page, but will represent what the element
     * looked like at the time of the snapshot.
     */
  let { snapshots, ... logAttrsRest } = logAttrs

  if (snapshots) {
    // @ts-ignore
    snapshots = snapshots.filter((snapshot) => !!snapshot).map((snapshot) => {
      snapshot.body = postprocessLogLikeFromSerialization(snapshot.body)

      // @ts-ignore
      return cy.createSnapshot(snapshot.name, null, snapshot)
    })
  }

  const reified = postprocessLogLikeFromSerialization(logAttrsRest)

  if (reified.$el && reified.$el.length) {
    // make sure $els are jQuery Arrays to keep was is expected in the log
    reified.$el = Cypress.$(reified.$el.map((el) => el))
  }

  reified.snapshots = snapshots
  reified.crossOriginLog = true

  return reified
}
