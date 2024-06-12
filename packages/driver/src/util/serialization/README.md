# Cross-origin Data Serialization Explainer

To communicate between drivers, `cy.origin` leverages the [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) under the hood. The goal of this guide is to go more in depth as to how Cypress internally preprocesses values to be compatible for `postMessage`. For a general overview of cross-origin communication, please refer to the [cross-origin-testing](../../../cross-origin-testing.md#cross-origin-communication) explainer.

## Preprocessing

Before sending data through `postMessage`, data must be considered serializable within the context of [the structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm). However, several data types simply [do not work with the structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone), mainly functions, DOM elements, and complex objects containing prototype chains or getters/setters. Because of this, Cypress has developed a way to preprocess some of these data types to work with structured clone when handling internal events. These methods are not leveraged to serialize end user data to keep behavior as consistent as possible.

The structured clone algorithm is [supported](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone#browser_compatibility) via the native `structuredClone` function from chrome/chromium version 98 and firefox version 94. For browser versions where `structuredClone` is not available, the [core-js-pure](https://github.com/zloirock/core-js/blob/master/packages/core-js/modules/web.structured-clone.js) `structuredClone` ponyfill is used to determine if a value is serializable.

To determine if a given value is serializable, the value is passed as an argument into the structured clone algorithm. If an error is thrown, the value is not serializable. Otherwise, the copied value is returned. This is generally how we determine if a value is serializable, but there are exceptions as follows:

#### Errors

[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) preprocessing is a bit complicated, because the error object itself may be considered serializable depending on the browser's implementation of the structured clone algorithm.

At the time of this writing, the structured clone algorithm does support cloning of errors in Firefox 99, but is supported in newer versions of Firefox (such as 115) and is supported in Chromium and `core-js`. However, there are caveats to this support. Take the following snippet:

```js
  // older firefox version 99
  var myError = new Error('error-message') 
  var myErrorCopy = structuredClone(myError) // throws DOMException: object could not be cloned

  // chrome/edge/electron/firefox115+
  var myError = new Error('error-message') 
  myError.foo = 'bar'
  var myErrorCopy = structuredClone(myError)
  myErrorCopy.foo // is undefined
  myErrorCopy instanceof Error // is true

  // Classes/objects that extend the prototype chain
  class CustomError extends Error {}
  var myCustomError = new CustomError('custom-error-message') 
  myCustomError.foo = 'bar'
  var myCustomErrorCopy = structuredClone(myCustomError)
  myCustomErrorCopy.foo // is undefined
  myCustomErrorCopy instanceof CustomError // is false
  myCustomErrorCopy instanceof Error // is true

```

Within chromium browsers, errors cloned through the structured clone algorithm only preserve `name`, `stack`, and `message` properties, as well as the `Error` prototype. Custom properties, as well as extensions of the prototype chain, are omitted. Due to inconsistencies with structured clone error serialization implementations and Cypress having multiple types of custom errors with multiple properties, we have elected to serialize errors the same as we serialize objects (after all, errors are objects).

### Objects

Since the structured clone algorithm does not walk the prototype tree, nor attempts to serialize certain property descriptions (such as setters/getters), we have to preprocess objects before feeding them through `postMessage` in order to preserve most the properties on the object. To do this, we map an object's properties to a [object literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#object_literals) (enumerable and non-enumerable) via [getOwnPropertyNames](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyNames) and walk the object prototype tree. If a key inside that object is not deemed serializable, then the key is omitted from the object. If that same key is available on the object's prototype, and is serializable, that key will be included. In other words, closest child to the root with a serializable key is what is mapped to the object literal. Getters on the object are retrieved and set on the literal as a regular property, and `readonly` properties are now read/write. For example:

```ts
import { preprocessForSerialization } from './index'

class BaseClass {
  readonly foo = 'foo'
  get bar() {
    return 'bar'
  }

 printFooBar() {
   console.log('foobar')
 }
}


class SubClass extends BaseClass {
  baz = 'baz' 
}

const mySubClass = new SubClass()

const preprocessedSubClass = preprocessForSerialization(mySubClass)

preprocessedSubClass.bar // is "bar"
preprocessedSubClass.baz // is "baz"
preprocessedSubClass.foo // is "foo"
preprocessedSubClass.printFooBar // is undefined

// only accurate if going through postMessage
preprocessedSubClass instanceof SubClass // is false
preprocessedSubClass instanceof BaseClass // is false
preprocessedSubClass instanceof Object // is true
```

Arrays are also considered objects, and are processed similarly by attempting to serialize each index to a new array literal.

### Complex Serialization of Logs

Currently, most serialization follows the rules explained above, with a current exception being Cypress's log messages generated from `log:added` and `log:changed` events. These messages are objects that contain DOM elements, functions, and other unserializable values. We attempt to pre/post process these log messages to accurate display snapshots, as well as console props that are printed when a snapshot is pinned

#### Preprocessing

When preprocessing a log, snapshots are preprocessed into a string with hydrated html state for attributes and various input values, such as `checkbox` `select`, `input`, etc to make the snapshot serializable. Other DOM element like structures, such as `$el` within log `consoleProps`, are preprocessed the same way. This is similar to how [Percy serializes the DOM](https://github.com/percy/cli/blob/master/packages/dom/src/serialize-inputs.js).

Additional preprocessing occurs for `consoleProps.table`, where the function output is preprocessed into a serializable object, ultimately to be wrapped back into a function when received from `postMessage`

#### Postprocessing/Reification

When the preprocessed log is sent through `postMessage` and received by the primary Cypress instance, the log is postprocessed. This process includes recreating the stringified snapshot as a DOM element and inserting the snapshot and its styles into the primary Cypress instance's snapshot map to be associated with its appropriate command log. This way, the correct snapshot is pinned when time travel debugging is leveraged after the test has run. `consoleProps` are recreated, with DOM elements being calculated lazily via object getters. This method works because the element(s) is/are only recreated once the snapshot is pinned to the page, correctly matching the element in the snapshot. This also means that if an array of elements is present, the array is actually a proxy to an object with the keys being the index number.