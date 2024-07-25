import _ from 'lodash'
import { isSerializableInCurrentBrowser, preprocessForSerialization } from './index'
import $dom from '../../dom'

interface PreprocessedHTMLElement {
  tagName: string
  attributes: { [key: string]: string }
  innerHTML: string
  serializationKey: 'dom'
}

interface PreprocessedFunction {
  value: any
  serializationKey: 'function'
}

/**
 * Takes an HTMLElement that might be a <body> for a given snapshot or any other element, likely pertaining to log consoleProps,
 * on the page that needs to be preprocessed for serialization. The method here is to do a very shallow serialization,
 * by trying to make the HTML as stateful as possible before preprocessing.
 *
 * @param {HTMLElement} props - an HTMLElement
 * @returns {PreprocessedHTMLElement} a preprocessed element that can be fed through postMessage() that can be reified in the primary.
 */
export const preprocessDomElement = (props: HTMLElement) => {
  const inputPreprocessArray = Array.from(props.querySelectorAll('input, textarea, select'))

  // Since we serialize on innerHTML, we also need to account for the props element itself in the case it is an input, select, or textarea.
  inputPreprocessArray.push(props)

  // Hydrate values in the HTML copy so when serialized they show up correctly in snapshot.
  // We do this by mapping certain properties to attributes that are not already reflected in the attributes map.
  // Things like id, class, type, and others are reflected in the attribute map and do not need to be explicitly added.
  inputPreprocessArray.forEach((el: any) => {
    switch (el.type) {
      case 'checkbox':
      case 'radio':
        if (el.checked) {
          el.setAttribute('checked', '')
        }

        break
      case 'select-one':
      case 'select-multiple': {
        const options = el.type === 'select-one' ? el.options : el.selectedOptions

        if (el.selectedIndex !== -1) {
          for (let option of options) {
            if (option.selected) {
              option.setAttribute('selected', 'true')
            } else {
              option.removeAttribute('selected')
            }
          }
        }
      }
        break
      case 'textarea': {
        el.innerHTML = el.value
      }
        break
      default:
        if (el.value !== undefined) {
          el.setAttribute('value', el.value)
        }
    }
  })

  const el: PreprocessedHTMLElement = {
    tagName: props.tagName,
    attributes: {},
    innerHTML: props.innerHTML,
    serializationKey: 'dom',
  }

  // get all attributes and classes off the element
  props.getAttributeNames().forEach((attributeName) => {
    el.attributes[attributeName] = props.getAttribute(attributeName) || ''
  })

  return el
}

/**
 * Takes an PreprocessedHTMLElement that might represent a given snapshot or any other element that needs to be reified
 * after postMessage() serialization. The method here is to do a very basic reification,
 * attempting to create an element based off the PreprocessedHTMLElement tagName, and populating some basic state if applicable,
 * such as element type, id, value, classes, attributes, etc.
 *
 * @param {PreprocessedHTMLElement} props - a preprocessed element that was fed through postMessage() that need to be reified in the primary.
 * @returns {HTMLElement} a reified element, likely a log snapshot, $el, or consoleProp elements.
 */
export const reifyDomElement = (props: any) => {
  const reifiedEl = document.createElement(props.tagName)

  reifiedEl.innerHTML = props.innerHTML

  Object.keys(props.attributes).forEach((attribute) => {
    reifiedEl.setAttribute(attribute, props.attributes[attribute])
  })

  return reifiedEl
}

/**
 * Attempts to preprocess an Object/Array by excluding unserializable values except for DOM elements and possible functions (if attemptToSerializeFunctions is true).
 * DOM elements are processed to a serializable object via preprocessDomElement, and functions are serialized to an object with a value key containing their output contents.
 *
 * @param {any} props an Object/Array that needs to be preprocessed before being sent through postMessage().
 * @param {boolean} [attemptToSerializeFunctions=false] - Whether or not the function should attempt to preprocess a function by invoking it.
 * @returns
 */
export const preprocessObjectLikeForSerialization = (props, attemptToSerializeFunctions = false) => {
  if (_.isArray(props)) {
    return props.map((prop) => preprocessLogLikeForSerialization(prop, attemptToSerializeFunctions))
  }

  if (_.isPlainObject(props)) {
    // only attempt to try and serialize dom elements and functions (if attemptToSerializeFunctions is set to true)
    let objWithPossiblySerializableProps = _.pickBy(props, (value) => {
      const isSerializable = isSerializableInCurrentBrowser(value)

      if (!isSerializable && $dom.isDom(value) || _.isFunction(value) || _.isObject(value)) {
        return true
      }

      return false
    })

    let objWithOnlySerializableProps = _.pickBy(props, (value) => isSerializableInCurrentBrowser(value))

    // assign the properties we know we can serialize here
    let preprocessed: any = preprocessForSerialization(objWithOnlySerializableProps)

    // and attempt to serialize possibly unserializable props here and fail gracefully if unsuccessful
    _.forIn(objWithPossiblySerializableProps, (value, key) => {
      preprocessed[key] = preprocessLogLikeForSerialization(value, attemptToSerializeFunctions)
    })

    return preprocessed
  }

  return preprocessForSerialization(props)
}

/**
 * Attempts to take an Object and reify it correctly. Most of this is handled by reifyLogLikeFromSerialization, with the exception here being DOM elements.
 * DOM elements, if needed to match against the snapshot DOM, are defined as getters on the object to have their values calculated at request.
 * This is important for certain log items, such as consoleProps, to be rendered correctly against the snapshot. Other DOM elements, such as snapshots, do not need to be matched
 * against the current DOM and can be reified immediately. Since there is a potential need for object getters to exist within an array, arrays are wrapped in a proxy, with array indices
 * proxied to the reified object or array, and other methods proxying to the preprocessed array (such as native array methods like map, foreach, etc...).
 *
 * @param {Object} props - a preprocessed Object/Array that was fed through postMessage() that need to be reified in the primary.
 * @param {boolean} matchElementsAgainstSnapshotDOM - whether DOM elements within the Object/Array should be matched against
 * @returns {Object|Proxy} - a reified version of the Object or Array (Proxy).
 */
export const reifyObjectLikeForSerialization = (props, matchElementsAgainstSnapshotDOM) => {
  let reifiedObjectOrArray = {}

  _.forIn(props, (value, key) => {
    const val = reifyLogLikeFromSerialization(value, matchElementsAgainstSnapshotDOM)

    if (val?.serializationKey === 'dom') {
      if (matchElementsAgainstSnapshotDOM) {
        // dynamically calculate the element (snapshot or otherwise).
        // This is important for consoleProp/$el based properties on the log because it calculates the requested element AFTER the snapshot has been rendered into the AUT.
        reifiedObjectOrArray = {
          ...reifiedObjectOrArray,
          get [key] () {
            return val.reifyElement()
          },
        }
      } else {
        // The DOM element in question is something like a snapshot. It can be reified immediately
        reifiedObjectOrArray[key] = val.reifyElement()
      }
    } else {
      reifiedObjectOrArray[key] = reifyLogLikeFromSerialization(value, matchElementsAgainstSnapshotDOM)
    }
  })

  // NOTE: transforms arrays into objects to have defined getters for DOM elements, and proxy back to that object via an ES6 Proxy.
  if (_.isArray(props)) {
    // if an array, map the array to our special getter object.
    return new Proxy(reifiedObjectOrArray, {
      get (target, name) {
        return target[name] || props[name]
      },
    })
  }

  // otherwise, just returned the object with our special getter
  return reifiedObjectOrArray
}

/**
 * Attempts to take a generic data structure that is log-like and preprocess them for serialization. This generic may contain properties that are either
 *  a) unserializable entirely
 *  b) unserializable natively but can be processed to a serializable form (DOM elements or Functions)
 *  c) serializable
 *
 * DOM elements are preprocessed via some key properties
 * (attributes, classes, ids, tagName, value) including their innerHTML. Before the innerHTML is captured, inputs are traversed to set their stateful value
 * inside the DOM element. This is crucial for body copy snapshots that are being sent to the primary domain to make the snapshot 'stateful'. Functions, if
 * explicitly stated, will be preprocessed with whatever value they return (assuming that value is serializable). If a value cannot be preprocessed for whatever reason,
 * null is returned.
 *
 *
 * NOTE: this function recursively calls itself to preprocess a log
 *
 * @param {any} props a generic variable that represents a value that needs to be preprocessed before being sent through postMessage().
 * @param {boolean} [attemptToSerializeFunctions=false] - Whether or not the function should attempt to preprocess a function by invoking it. USE WITH CAUTION!
 * @returns {any} the serializable version of the generic.
 */
export const preprocessLogLikeForSerialization = (props, attemptToSerializeFunctions = false) => {
  try {
    if ($dom.isDom(props)) {
      if (props.length !== undefined && $dom.isJquery(props)) {
        const serializableArray: any[] = []

        // in the case we are dealing with a jQuery array, preprocess to a native array to nuke any prevObject(s) or unserializable values
        props.each((key) => serializableArray.push(preprocessLogLikeForSerialization(props[key], attemptToSerializeFunctions)))

        return serializableArray
      }

      // otherwise, preprocess the element to an object with pertinent DOM properties
      const serializedDom = preprocessDomElement(props)

      return serializedDom
    }

    /**
     * When preprocessing a log, there might be certain functions we want to attempt to serialize.
     * One of these instances is the 'table' key in consoleProps, which has contents that CAN be serialized.
     * If there are other functions that have serializable contents, the invoker/developer will need to be EXPLICIT
     * in what needs serialization. Otherwise, functions should NOT be serialized.
     */
    if (_.isFunction(props)) {
      if (attemptToSerializeFunctions) {
        return {
          value: preprocessLogLikeForSerialization(props(), attemptToSerializeFunctions),
          serializationKey: 'function',
        } as PreprocessedFunction
      }

      return null
    }

    if (_.isObject(props)) {
      return preprocessObjectLikeForSerialization(props, attemptToSerializeFunctions)
    }

    return preprocessForSerialization(props)
  } catch (e) {
    return null
  }
}

/**
 * Attempts to take in a preprocessed/serialized log-like attributes and reify them. DOM elements are lazily calculated via
 * getter properties on an object. If these DOM elements are in an array, the array is defined as an ES6 proxy that
 * ultimately proxies to these getter objects. Functions, if serialized, are rewrapped. If a value cannot be reified for whatever reason,
 * null is returned.
 *
 * This is logLike because there is a need outside of logs, such as in the iframe-model in the runner.
 * to serialize DOM elements, such as the final snapshot upon request.
 *
 * NOTE: this function recursively calls itself to reify a log
 *
 * @param {any} props - a generic variable that represents a value that has been preprocessed and sent through postMessage() and needs to be reified.
 * @param {boolean} matchElementsAgainstSnapshotDOM - Whether or not the element should be reconstructed lazily
 * against the currently rendered DOM (usually against a rendered snapshot) or should be completely recreated from scratch (common with snapshots as they will replace the DOM)
 * @returns {any} the reified version of the generic.
 */
export const reifyLogLikeFromSerialization = (props, matchElementsAgainstSnapshotDOM = true) => {
  try {
    if (props?.serializationKey === 'dom') {
      props.reifyElement = function () {
        let reifiedElement

        // If the element needs to be matched against the currently rendered DOM. This is useful when analyzing consoleProps or $el in a log
        // where elements need to be evaluated LAZILY after the snapshot is attached to the page.
        // this option is set to false when reifying snapshots, since they will be replacing the current DOM when the user interacts with said snapshot.
        if (matchElementsAgainstSnapshotDOM) {
          const attributes = Object.keys(props.attributes).map((attribute) => {
            return `[${attribute}="${props.attributes[attribute]}"]`
          }).join('')

          const selector = `${props.tagName}${attributes}`

          reifiedElement = Cypress.$(selector)

          if (reifiedElement.length) {
            return reifiedElement.length > 1 ? reifiedElement : reifiedElement[0]
          }
        }

        // if the element couldn't be found, return a synthetic copy that doesn't actually exist on the page
        return reifyDomElement(props)
      }

      return props
    }

    if (props?.serializationKey === 'function') {
      const reifiedFunctionData = reifyLogLikeFromSerialization(props.value, matchElementsAgainstSnapshotDOM)

      return () => reifiedFunctionData
    }

    if (_.isObject(props)) {
      return reifyObjectLikeForSerialization(props, matchElementsAgainstSnapshotDOM)
    }

    return props
  } catch (e) {
    return null
  }
}

/**
 * Preprocess a snapshot to a serializable form before piping them over through postMessage().
 * This method is also used by a spec bridge on request if a 'final state' snapshot is requested outside that of the primary domain
 *
 * @param {any} snapshot - a snapshot matching the same structure that is returned from cy.createSnapshot.
 * @returns a serializable form of a snapshot, including a serializable <body> with styles
 */
export const preprocessSnapshotForSerialization = (snapshot) => {
  // if the protocol is enabled, we don't need to preprocess the snapshot since it is serializable,
  // also make sure numTestsKeptInMemory is 0, otherwise we will want to preprocess the snapshot
  // (the driver test's set numTestsKeptInMemory to 1 in run mode to verify the snapshots)
  if (Cypress.config('protocolEnabled') && Cypress.config('numTestsKeptInMemory') === 0) {
    return snapshot
  }

  try {
    const preprocessedSnapshot = preprocessLogLikeForSerialization(snapshot, true)

    if (!preprocessedSnapshot.body.get) {
      return null
    }

    preprocessedSnapshot.styles = cy.getStyles(snapshot)

    return preprocessedSnapshot
  } catch (e) {
    return null
  }
}

/**
 * Reifies a snapshot from the serializable from to an actual HTML body snapshot that exists in the primary document.
 * @param {any} snapshot - a snapshot that has been preprocessed and sent through post message and needs to be reified in the primary.
 * @returns the reified snapshot that exists in the primary document
 */
export const reifySnapshotFromSerialization = (snapshot) => {
  snapshot.body = reifyLogLikeFromSerialization(snapshot.body, false)

  return cy.createSnapshot(snapshot.name, null, snapshot)
}

/**
 * Sanitizes the log messages going to the primary domain before piping them to postMessage().
 * This is designed to function as an extension of preprocessForSerialization, but also attempts to serialize DOM elements,
 * as well as functions if explicitly stated.
 *
 * DOM elements are serialized with their outermost properties (attributes, classes, ids, tagName) including their innerHTML.
 * DOM Traversal serialization is not possible with larger html bodies and will likely cause a stack overflow.
 *
 * Functions are serialized when explicitly state (ex: table in consoleProps).
 * NOTE: If not explicitly handling function serialization for a given property, the property will be set to null
 *
 * @param logAttrs raw log attributes passed in from either a log:changed or log:added event
 * @returns a serializable form of the log, including attempted serialization of DOM elements and Functions (if explicitly stated)
 */
export const preprocessLogForSerialization = (logAttrs) => {
  let { snapshots, ...logAttrsRest } = logAttrs

  const preprocessed = preprocessLogLikeForSerialization(logAttrsRest)

  if (preprocessed) {
    if (snapshots) {
      preprocessed.snapshots = snapshots.map((snapshot) => preprocessSnapshotForSerialization(snapshot))
    }

    if (logAttrs?.consoleProps?.table) {
      preprocessed.consoleProps.table = preprocessLogLikeForSerialization(logAttrs.consoleProps.table, true)
    }
  }

  return preprocessed
}

/**
 * Redefines log messages being received in the primary domain before sending them out through the event-manager.
 *
 * Efforts here include importing captured snapshots from the spec bridge into the primary snapshot document, importing inline
 * snapshot styles into the snapshot css map, and reconstructing DOM elements and functions somewhat naively.
 *
 * To property render consoleProps/$el elements in snapshots or the console, DOM elements are lazily calculated via
 * getter properties on an object. If these DOM elements are in an array, the array is defined as an ES6 proxy that
 * ultimately proxies to these getter objects.
 *
 * The secret here is that consoleProp DOM elements needs to be reified at console printing runtime AFTER the serialized snapshot
 * is attached to the DOM so the element can be located and displayed properly
 *
 * In most cases, the element can be queried by attributes that exist specifically on the element or by the `HIGHLIGHT_ATTR`. If that fails or does not locate an element,
 * then a new element is created against the snapshot context. This element will NOT be found on the page, but will represent what the element
 * looked like at the time of the snapshot.
 *
 * @param logAttrs serialized/preprocessed log attributes passed to the primary domain from a spec bridge
 * @returns a reified version of what a log is supposed to look like in Cypress
 */
export const reifyLogFromSerialization = (logAttrs) => {
  let { snapshots, ... logAttrsRest } = logAttrs

  // if the protocol is enabled, we don't need to reify the snapshot since the snapshot was serializable coming into the primary instance of Cypress.
  // also make sure numTestsKeptInMemory is 0, otherwise we will want to preprocess the snapshot
  // (the driver test's set numTestsKeptInMemory to 1 in run mode to verify the snapshots)
  if (snapshots && !(Cypress.config('protocolEnabled') && Cypress.config('numTestsKeptInMemory') === 0)) {
    snapshots = snapshots.filter((snapshot) => !!snapshot).map((snapshot) => reifySnapshotFromSerialization(snapshot))
  }

  const reified = reifyLogLikeFromSerialization(logAttrsRest)

  if (reified.$el && reified.$el.length) {
    // Make sure $els are jQuery Arrays to keep what is expected in the log.
    reified.$el = Cypress.$(reified.$el.map((el) => el))
  }

  reified.snapshots = snapshots

  return reified
}
