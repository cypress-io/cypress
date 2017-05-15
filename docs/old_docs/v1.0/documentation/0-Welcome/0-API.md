slug: api
excerpt: Our API provides commands and utilities to drive your tests in the browser.

[block:callout]
{
  "type": "info",
  "body": "Read through our [Guides](https://on.cypress.io/guides/guides) first.",
  "title": "New to Cypress?"
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
| [get](https://on.cypress.io/api/get) | Get DOM element(s) by selector or alias |
| [root](https://on.cypress.io/api/root) | Set the root scope to the current subject |
| [within](https://on.cypress.io/api/within) | Set the root scope to the current subject |

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
| [nextAll](https://on.cypress.io/api/nextall) | Get all following siblings of the DOM elements |
| [nextUntil](https://on.cypress.io/api/nextuntil) | Get all following siblings of the DOM elements until another element |
| [not](https://on.cypress.io/api/not) | Remove DOM elements from the set of DOM elements |
| [parent](https://on.cypress.io/api/parent) | Get the parent DOM element of the DOM elements |
| [parents](https://on.cypress.io/api/parents) | Get the parents DOM elements of the DOM elements |
| [parentsUntil](https://on.cypress.io/api/parentsuntil) | Get all ancestors of the DOM elements until another element |
| [prev](https://on.cypress.io/api/prev) | Get the previous sibling of elements |
| [prevAll](https://on.cypress.io/api/prevall) | Get all previous siblings of the DOM elements |
| [prevUntil](https://on.cypress.io/api/prev) | Get all previous siblings of the DOM elements until another element |
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
| [request](https://on.cypress.io/api/request) | Make HTTP request |
| [route](https://on.cypress.io/api/route) | Route responses to matching requests |
| [server](https://on.cypress.io/api/server) | Control the behavior of network requests and responses |

| Connectors | |
| -------------------- | -- |
| [each](https://on.cypress.io/api/each) | Iterate through each item in the current subject |
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

| Spies, Stubs & Clocks | |
| -------------------- | -- |
| [spy](https://on.cypress.io/api/spy) | Wrap a method in a spy |
| [stub](https://on.cypress.io/api/stub) | Create a stub and/or replace a function with a stub |
| [clock](https://on.cypress.io/api/clock) | Control time in the browser |
| [tick](https://on.cypress.io/api/tick) | Move time in the browser |

| Files | |
| -------------------- | -- |
| [fixture](https://on.cypress.io/api/fixture) | Load a fixture file to represent data |
| [readFile](https://on.cypress.io/api/readfile) | Read a file's contents |
| [writeFile](https://on.cypress.io/api/writefile) | Write to a file with the specified contents |

| Viewport | |
| -------------------- | -- |
| [viewport](https://on.cypress.io/api/viewport) | Change the screen size of your application |

| Local Storage | |
| -------------------- | -- |
| [clearLocalStorage](https://on.cypress.io/api/clearlocalstorage) | Clear all data in local storage |

| Cookies | |
| -------------------- | -- |
| [clearCookie](https://on.cypress.io/api/clearcookie) | Clear a browser cookie |
| [clearCookies](https://on.cypress.io/api/clearcookies) | Clear all browser cookies |
| [getCookie](https://on.cypress.io/api/getcookie) | Get a browser cookie |
| [getCookies](https://on.cypress.io/api/getcookies) | Get all browser cookies |
| [setCookie](https://on.cypress.io/api/setcookie) | Set a browser cookie |

| Debugging | |
| -------------------- | -- |
| [debug](https://on.cypress.io/api/debug) | Set a `debugger` |
| [pause](https://on.cypress.io/api/pause) | Pause a command |

| Misc | |
| -------------------- | -- |
| [end](https://on.cypress.io/api/end) | End the command chain |
| [exec](https://on.cypress.io/api/exec) | Execute a system command |
| [focused](https://on.cypress.io/api/focused) | Get the DOM element that is focused |
| [log](https://on.cypress.io/api/log) | Print a message to the Command Log |
| [screenshot](https://on.cypress.io/api/screenshot) | Take a screenshot |
| [wrap](https://on.cypress.io/api/wrap) | Wrap an object |

# Utilities

Utilities give you access to methods from other commonly used libraries.

| Commands | |
| -------------------- | -- |
| [_](https://on.cypress.io/api/cypress-underscore) | Call any Underscore method |
| [$](https://on.cypress.io/api/cypress-jquery) | Call any jQuery method |
| [moment](https://on.cypress.io/api/cypress-moment) | Format or parse dates using moment methods |
| [Blob](https://on.cypress.io/api/cypress-blob) | Convert base64 strings to blob objects |
| [Promise](https://on.cypress.io/api/cypress-promise) | Instantiate a bluebird promise |

# Cypress API

The Cypress API enables you to configure the behavior of how Cypress works internally. You can do things like access Environment Variables, change configuration, create custom commands, and more.

| Commands | |
| -------------------- | -- |
| [config](https://on.cypress.io/api/config) | get and set configuration options |
| [env](https://on.cypress.io/api/env) | get and set environment variables |
| [Commands](https://on.cypress.io/api/commands) | Commands API |
| [Cookies](https://on.cypress.io/api/cookies) | Manage your application's cookies |
| [Dom](https://on.cypress.io/api/dom) | Find out whether an element is hidden |
| [Server](https://on.cypress.io/api/api-server) | Permanently override default server options |
