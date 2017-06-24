---
title: clearLocalStorage
comments: false
---

Clear all data in local storage.

{% note warning %}
Cypress automatically runs this command *before* each test to prevent state from being shared across tests. You shouldn't need to use this command unless you're using it to clear localStorage inside a single test.
{% endnote %}

# Syntax

```javascript
cy.clearLocalStorage()
cy.clearLocalStorage(key)
cy.clearLocalStorage(options)
cy.clearLocalStorage(keys, options)
```

## Usage

`cy.clearLocalStorage()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.clearLocalStorage()  // clear all local storage
```

## Arguments

**{% fa fa-angle-right %} keys** ***(String, RegExp)***

Specify key to be cleared in local storage.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.clearCookies()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `responseTimeout` configuration#Timeouts %} | {% usage_options timeout cy.clearLocalStorage %}

## Yields {% helper_icon yields %}

`cy.clearLocalStorage()` yields the remove local storage object.

## Timeout {% helper_icon timeout %}

`cy.clearLocalStorage()` will wait up for the duration of {% url `defaultCommandTimeout` configuration#Timeouts %} to process this command.

# Examples

## Clear Local Storage

**Clear all local storage**

```javascript
cy.clearLocalStorage()
```

## Clear Keys

**Clear local storage with key 'appName'**

```javascript
cy.clearLocalStorage('appName')
```

**Clear all local storage matching /app-/**

```javascript
cy.clearLocalStorage(/app-/)
```

# Command Log

```javascript
cy.clearLocalStorage(/prop1|2/).then(function(ls){
  expect(ls.getItem('prop1')).to.be.null
  expect(ls.getItem('prop2')).to.be.null
  expect(ls.getItem('prop3')).to.eq('magenta')
})
```

The commands above will display in the command log as:

![Command log for clearLocalStorage](/img/api/clearlocalstorage/clear-ls-localstorage-in-command-log.png)

When clicking on `clearLocalStorage` within the command log, the console outputs the following:

![console.log for clearLocalStorage](/img/api/clearlocalstorage/local-storage-object-shown-in-console.png)

# See also

- {% url `cy.clearCookies()` clearcookies %}
