slug: api
excerpt: Our API provides commands and utilities to drive your tests in the browser.

[block:callout]
{
  "type": "info",
  "body": "Read through our [Guides](https://on.cypress.io/guides/guides) first.",
  "title": "New to Cypess?"
}
[/block]

# Commands

Commands drive your tests in the browser like a real user would. They let you perform actions like typing, clicking, xhr requests, and can also assert things like "my button should be disabled".

| Navigation | |
| -------------------- | -- |
| [go](https://on.cypress.io/api/go) | Navigate back or forward to previous or next URL in the browser's history |
| [reload](https://on.cypress.io/api/reload) | Reload the page |
| [visit](https://on.cypress.io/api/visit) | Visit a remote url |

| Querying | |
| -------------------- | -- |
| [contains](https://on.cypress.io/api/contains) | Get a DOM element that contains specific text |
| [get](https://on.cypress.io/api/get) | Get DOM element(s) by selector or aliast |
| [root](https://on.cypress.io/api/root) | Set the root scope to the current subject |
| [within](https://on.cypress.io/api/within) | Within |

| Assertions | |
| -------------------- | -- |
| [and](https://on.cypress.io/api/and) | Chain multiple assertions together |
| [should](https://on.cypress.io/api/should) | Make an assertion about the current subject |

| DOM Traversal | |
| -------------------- | -- |
| [children](https://on.cypress.io/api/children) | Get the children DOM elements of the DOM elements |
| [closest](https://on.cypress.io/api/closest) | Get the closest ancestor DOM element |
| [eq](https://on.cypress.io/api/eq) | Get a DOM element at a specific index |
| [filter](https://on.cypress.io/api/filter) | Filter DOM elements by a selector |
| [find](https://on.cypress.io/api/find) | Get descendants of DOM elements |
| [first](https://on.cypress.io/api/first) | Get the first DOM element within a set of DOM elements |
| [last](https://on.cypress.io/api/last) | Get the last DOM element |
| [next](https://on.cypress.io/api/next) | Get the next sibling of the DOM elements |
| [not](https://on.cypress.io/api/not) | Remove DOM elements from the set of DOM elements |
| [parent](https://on.cypress.io/api/parent) | Get the parent DOM element of the DOM elements |
| [parents](https://on.cypress.io/api/parents) | Get the parents DOM elements of the DOM elements |
| [prev](https://on.cypress.io/api/prev) | Get the previous sibling of elements |
| [siblings](https://on.cypress.io/api/siblings) | Get all siblings DOM elements of the DOM elements |

| Actions | |
| -------------------- | -- |
| [blur](https://on.cypress.io/api/blur) | Blur a DOM element |
| [check](https://on.cypress.io/api/check) | Select a checkbox or radio |
| [clear](https://on.cypress.io/api/clear) | Clear a value of an input or textarea |
| [click](https://on.cypress.io/api/click) | Click a DOM element |
| [dblclick](https://on.cypress.io/api/dblclick) | Double-click on a DOM element |
| [focus](https://on.cypress.io/api/focus) | Focus on a DOM element |
| [select](https://on.cypress.io/api/select) | Select an option in a select |
| [submit](https://on.cypress.io/api/submit) | Submit a form |
| [type](https://on.cypress.io/api/type) | Type into a DOM element |
| [uncheck](https://on.cypress.io/api/uncheck) | Uncheck a checkbox or radio |

| Network Requests | |
| -------------------- | -- |
| [request](https://on.cypress.io/api/request) | Make XHR request |
| [route](https://on.cypress.io/api/route) | Route responses to matching requests |
| [server](https://on.cypress.io/api/server) | Control the behavior of network requests and responses |

| Connectors | |
| -------------------- | -- |
| [its](https://on.cypress.io/api/its) | Get properties on the current subject |
| [invoke](https://on.cypress.io/api/invoke) | Invoke the function on the current subject |
| [spread](https://on.cypress.io/api/spread) | Spread an array as individual arguments to a callback function |
| [then](https://on.cypress.io/api/then) | Invokes a callback function with the current subject |

| Location (URL) | |
| -------------------- | -- |
| [hash](https://on.cypress.io/api/hash) | Get the current URL hash |
| [location](https://on.cypress.io/api/location) | Get the `window.location` |
| [url](https://on.cypress.io/api/url) | Get the current URL |

| Window | |
| -------------------- | -- |
| [document](https://on.cypress.io/api/document) | Get the document |
| [title](https://on.cypress.io/api/title) | Get the title of the document |
| [window](https://on.cypress.io/api/window) | Get global window object |

| Waiting | |
| -------------------- | -- |
| [wait](https://on.cypress.io/api/wait) | Wait for a specific amount of time or resource to resolve |

| Aliasing | |
| -------------------- | -- |
| [as](https://on.cypress.io/api/as) | Alias a route or DOM element for use later. |

| Fixtures | |
| -------------------- | -- |
| [fixture](https://on.cypress.io/api/fixture) | Load a fixture to represent data |

| Viewport | |
| -------------------- | -- |
| [viewport](https://on.cypress.io/api/viewport) | Change the screen size of your application |

| Local Storage | |
| -------------------- | -- |
| [clearLocalStorage](https://on.cypress.io/api/clearLocalStorage) | Clear all data in local storage |

| Cookies | |
| -------------------- | -- |
| [clearCookies](https://on.cypress.io/api/clearCookies) | Clear all browser cookies |

| Debugging | |
| -------------------- | -- |
| [debug](https://on.cypress.io/api/debug) | Set a `debugger` |
| [pause](https://on.cypress.io/api/pause) | Pause a command |

| Misc | |
| -------------------- | -- |
| [end](https://on.cypress.io/api/end) | End the command chain |
| [focused](https://on.cypress.io/api/focused) | Get the DOM element that is focused |
| [wrap](https://on.cypress.io/api/wrap) | Invoke the function on the current subject |

# Utilities

Utilities give you access to methods from other commonly used libraries.

| Commands | |
| -------------------- | -- |
| [_](https://on.cypress.io/api/underscore) | Call any Underscore method |
| [$](https://on.cypress.io/api/jquery) | Call any jQuery method |
| [moment](https://on.cypress.io/api/moment) | Format or parse dates using moment methods |
| [Blob](https://on.cypress.io/api/Blob) | Convert base64 strings to blob objects |
| [Promise](https://on.cypress.io/api/Promise) | Instantiate a bluebird promise |

# Cypress API

The Cypress API enables you to configure the behavior of how Cypress works internally. You can do things like access Environment Variables, change configuration, create custom commands, and more.

| Commands | |
| -------------------- | -- |
| [config](https://on.cypress.io/api/config) | get and set configuration options |
| [env](https://on.cypress.io/api/env) | get and set environment variables |
| [Commands](https://on.cypress.io/api/Commands) | Commands API |
| [Cookies](https://on.cypress.io/api/Cookies) | Manage your application's cookies |
| [Dom](https://on.cypress.io/api/Dom) | Find out whether an element is hidden |
| [Server](https://on.cypress.io/api/api-server) | Permanently override default server options |