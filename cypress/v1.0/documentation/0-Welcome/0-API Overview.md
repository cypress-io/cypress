slug: overview
excerpt: Cypress helps you write automated tests for the web

[block:callout]
{
  "type": "info",
  "body": "Read through our [Guides](https://on.cypress.io/guides/overview) first.",
  "title": "New to Cypess?"
}
[/block]

---

# Commands

Commands drive your tests in the browser like a real user would. They let you perform actions like typing, clicking, xhr requests, and can also assert things like "my button should be disabled".

| Navigation | |
| -------------------- | -- |
| [go](https://on.cypress.io/api/go) | Navigate back or forward to the previous or next URL in the browser's history |
| [visit](https://on.cypress.io/api/visit) | Visit a remote url |

| Querying | |
| -------------------- | -- |
| [contains](https://on.cypress.io/api/contains) | Check to see if matching element contains text |
| [get](https://on.cypress.io/api/get) | Get an element |
| [root](https://on.cypress.io/api/root) | Get the root element |
| [within](https://on.cypress.io/api/within) | Within |

| Assertions | |
| -------------------- | -- |
| [and](https://on.cypress.io/api/and) | Enables chaining multiple assertions together |
| [should](https://on.cypress.io/api/should) | Make an assertion about current subject |

| DOM Traversal | |
| -------------------- | -- |
| [children](https://on.cypress.io/api/children) | Get the children of elements |
| [closest](https://on.cypress.io/api/closest) | Get the closest ancestor |
| [eq](https://on.cypress.io/api/eq) | Get element at index |
| [filter](https://on.cypress.io/api/filter) | Filter elements by selector |
| [find](https://on.cypress.io/api/find) | Get descendants of elements |
| [first](https://on.cypress.io/api/first) | Get the first element within elements |
| [last](https://on.cypress.io/api/last) | Get the last element |
| [next](https://on.cypress.io/api/next) | Get the next sibling of elements |
| [not](https://on.cypress.io/api/not) | Remove elements from set |
| [parent](https://on.cypress.io/api/parent) | Get the parent of elements |
| [parents](https://on.cypress.io/api/parents) | Get the parents of elements |
| [prev](https://on.cypress.io/api/prev) | Get the previous sibling of elements |
| [siblings](https://on.cypress.io/api/siblings) | Get the siblings of elements |

| Actions | |
| -------------------- | -- |
| [blur](https://on.cypress.io/api/blur) | Blur the current subject |
| [check](https://on.cypress.io/api/check) | Check a checkbox |
| [clear](https://on.cypress.io/api/clear) | Clear a value of an input or textarea |
| [click](https://on.cypress.io/api/click) | Click the current DOM subject |
| [dblclick](https://on.cypress.io/api/dblclick) | Double-click on the current subject |
| [focus](https://on.cypress.io/api/focus) | Focus on the current subject |
| [select](https://on.cypress.io/api/select) | Select an option |
| [submit](https://on.cypress.io/api/submit) | Submit a form |
| [type](https://on.cypress.io/api/type) | Type into element |
| [uncheck](https://on.cypress.io/api/uncheck) | Uncheck a checkbox |

| Network Requests (XHR / AJAX) | |
| -------------------- | -- |
| [request](https://on.cypress.io/api/request) | Make XHR request |
| [route](https://on.cypress.io/api/route) | Route responses to matching requests |
| [server](https://on.cypress.io/api/server) | Control the behavior of network requests and responses. |

| Connectors | |
| -------------------- | -- |
| [its](https://on.cypress.io/api/its) | Call properties on the current subject |
| [invoke](https://on.cypress.io/api/invoke) | Call properties on the current subject |
| [spread](https://on.cypress.io/api/spread) | Spread an array as individual arguments to a callback function |
| [then](https://on.cypress.io/api/then) | Yield the current subject as an argument |

| Location (URL) | |
| -------------------- | -- |
| [hash](https://on.cypress.io/api/hash) | Get the current URL hash |
| [location](https://on.cypress.io/api/location) | Get window.location |
| [url](https://on.cypress.io/api/url) | Get the current URL |

| Window | |
| -------------------- | -- |
| [document](https://on.cypress.io/api/document) | Get the document element |
| [title](https://on.cypress.io/api/title) | Get the title of the document |
| [window](https://on.cypress.io/api/window) | Get the global window object |

| Waiting | |
| -------------------- | -- |
| [wait](https://on.cypress.io/api/wait) | Wait for a specific amount of time or resource to resolve |

| Aliasing | |
| -------------------- | -- |
| [as](https://on.cypress.io/api/as) | Alias reusable objects for later |

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
| [debug](https://on.cypress.io/api/debug) | Call debugger |
| [pause](https://on.cypress.io/api/pause) | Pause current command |

| Misc | |
| -------------------- | -- |
| [end](https://on.cypress.io/api/end) | End the command chain |
| [focused](https://on.cypress.io/api/focused) | Get the element that is focused |
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