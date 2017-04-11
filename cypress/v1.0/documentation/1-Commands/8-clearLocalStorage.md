slug: clearlocalstorage
excerpt: Clear all data in local storage

Clears all data in local storage.

Cypress automatically invokes this command **before** each test to prevent state from building up. You shouldn't need to invoke this command unless you're using it to clear localStorage inside a single test.

| | |
|--- | --- |
| **Returns** | the remote local storage object |
| **Timeout** | *cannot timeout* |

***

# [cy.clearLocalStorage()](#usage)

Clear all data in local storage.

***

# [cy.clearLocalStorage( *string* )](#usage)

Clears all keys in local storage matching the string.

***

# [cy.clearLocalStorage( *RegExp* )](#usage)

Clears all keys in local storage matching the RegExp.

***

# Usage

## Clear Local Storage

```javascript
// returns local storage object
cy.clearLocalStorage()
```
