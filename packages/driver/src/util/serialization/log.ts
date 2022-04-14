import _ from 'lodash'
import { isSerializableInCurrentBrowser, preprocessForSerialization } from './index'
import $dom from '../../dom'

interface PreprocessedHTMLElement {
  value?: any
  type?: any
  id?: string
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
const preprocessDomElement = (props: HTMLElement) => {
  // hydrate values in HTML copy so when serialized they show up correctly in snapshot. This is important for input boxes with typing and other 'value' attributes
  props.querySelectorAll('input').forEach((input: HTMLInputElement) => {
    input.setAttribute('value', input.value)
    if (input.checked) {
      input.setAttribute('checked', `${input.checked}`)
    }
  })

  // TODO: figure out reifying option selection
  // props.querySelectorAll('option').forEach((option) => {
  //   if (option.selected) {
  //     option.setAttribute('selected', option.selected)
  //   }
  // })

  const el: PreprocessedHTMLElement = {
    value: (props as HTMLInputElement)?.value,
    type: (props as HTMLInputElement)?.type,
    id: props?.id,
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
const reifyDomElement = (props: any) => {
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

/**
 * Attempts to take a generic data structure that is log-like and preprocess them for serialization. This generic may be/contain properties that are either
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
    if (_.isArray(props)) {
      return props.map((prop) => {
        try {
          return preprocessLogLikeForSerialization(prop, attemptToSerializeFunctions)
        } catch (e) {
          return null
        }
      })
    }

    if (_.isPlainObject(props)) {
      // only attempt to try and serialize dom elements and function (if attemptToSerializeFunctions is set to true)
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
        try {
          preprocessed[key] = preprocessLogLikeForSerialization(value, attemptToSerializeFunctions)
        } catch (e) {
          preprocessed[key] = null
        }
      })

      return preprocessed
    }

    if ($dom.isDom(props)) {
      if (props.length !== undefined && $dom.isJquery(props)) {
        const serializableArray: any[] = []

        // in the case we are dealing with a jQuery array, preprocess to a native array to nuke any prevObject(s) or unserializable values
        props.each((key) => serializableArray.push(preprocessLogLikeForSerialization(props[key], attemptToSerializeFunctions)))

        return serializableArray
      }

      // otherwise, preprocess the element to an object with pertinent DOM properties
      const serializableDOM = preprocessDomElement(props)

      return serializableDOM
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
 * @param {boolean} matchElementsAgainstCurrentDOM - Whether or not the element should be reconstructed lazily
 * against the currently rendered DOM (usually against a rendered snapshot) or should be completely recreated from scratch (common with snapshots as they will replace the DOM)
 * @returns {any} the reified version of the generic.
 */
export const reifyLogLikeFromSerialization = (props, matchElementsAgainstCurrentDOM = true) => {
  try {
    if (props?.serializationKey === 'dom') {
      props.reifyElement = function () {
        let reifiedElement

        // If the element needs to be matched against the currently rendered DOM. This is useful when analyzing consoleProps or $el in a log
        // where elements need to be evaluated LAZILY after the snapshot is attached to the page.
        // this option is set to false when reifying snapshots, since they will be replacing the current DOM when the user interacts with said snapshot.
        if (matchElementsAgainstCurrentDOM) {
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
      const reifiedFunctionData = reifyLogLikeFromSerialization(props.value, matchElementsAgainstCurrentDOM)

      return () => reifiedFunctionData
    }

    if (_.isObject(props)) {
      let reifiedObjectOrArray = {}

      _.forIn(props, (value, key) => {
        const val = reifyLogLikeFromSerialization(value, matchElementsAgainstCurrentDOM)

        if (val?.serializationKey === 'dom') {
          reifiedObjectOrArray = {
            ...reifiedObjectOrArray,
            get [key] () {
              // dynamically calculate the element (snapshot or otherwise).
              // This is important for consoleProp/$el based properties on the log because it calculates the requested element AFTER the snapshot has been rendered into the AUT.
              return val.reifyElement()
            },
          }
        } else {
          reifiedObjectOrArray[key] = reifyLogLikeFromSerialization(value, matchElementsAgainstCurrentDOM)
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
  const preprocessedSnapshot = preprocessLogLikeForSerialization(snapshot, true)

  try {
    preprocessedSnapshot.body.get.value[0] = preprocessLogLikeForSerialization(snapshot.body.get()[0])
  } catch (e) {
    return null
  }

  // @ts-ignore
  preprocessedSnapshot.styles = cy.getStyles(snapshot)

  return preprocessedSnapshot
}

/**
 * Reifies a snapshot from the serializable from to an actual HTML body snapshot that exists in the primary document.
 * @param {any} snapshot - a snapshot that has been preprocessed and sent through post message and needs to be reified in the primary.
 * @returns the reified snapshot that exists in the primary document
 */
export const reifySnapshotFromSerialization = (snapshot) => {
  snapshot.body = reifyLogLikeFromSerialization(snapshot.body, false)

  // @ts-ignore
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
 * Re defines log messages being received in the primary domain before sending them out through the event-manager.
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

  if (snapshots) {
    // @ts-ignore
    snapshots = snapshots.filter((snapshot) => !!snapshot).map((snapshot) => reifySnapshotFromSerialization(snapshot))
  }

  const reified = reifyLogLikeFromSerialization(logAttrsRest)

  if (reified.$el && reified.$el.length) {
    // make sure $els are jQuery Arrays to keep was is expected in the log
    reified.$el = Cypress.$(reified.$el.map((el) => el))
  }

  reified.snapshots = snapshots

  // use this flag to help reify the log correctly when certain property types slightly differ
  reified.crossOriginLog = true

  return reified
}
