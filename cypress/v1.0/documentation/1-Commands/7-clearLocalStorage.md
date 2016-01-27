slug: clearlocalstorage
excerpt: Clear all data in local storage.

Clears all data in local storage.

| | |
|--- | --- |
| **Returns** | the remote local storage object |
| **Timeout** | *cannot timeout* |

***

# [cy.clearLocalStorage()](#section-usage)

Clear all data in local storage.

***

# [cy.clearLocalStorage( *string* )](#section-usage)

Clears all keys in local storage matching the string.

***

# [cy.clearLocalStorage( *RegExp* )](#section-usage)

Clears all keys in local storage matching the RegExp.

***

# Usage

## Clear Local Storage

```javascript
// returns local storage object
cy.clearLocalStorage()
```