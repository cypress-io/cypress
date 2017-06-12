---
title: clearLocalStorage
comments: true
---

Clear all data in local storage.

{% note warning %}
Cypress automatically runs this command *before* each test to prevent state from being shared across tests. You shouldn't need to use this command unless you're using it to clear localStorage inside a single test.
{% endnote %}

# Syntax

```javascript
cy.clearLocalStorage()
cy.clearLocalStorage(keys)
```

## Usage

`cy.clearLocalStorage()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.clearLocalStorage()  // clear all local storage
```

## Arguments

**{% fa fa-angle-right %} keys** ***(String, RegExp)***

Specify keys to be cleared in local storage.

## Yields

`cy.clearLocalStorage()` yields the remove local storage object.

## Timeout

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

<img width="466" alt="screen shot 2017-05-24 at 3 19 15 pm" src="https://cloud.githubusercontent.com/assets/1271364/26421551/738be792-4094-11e7-9100-14937a369c7c.png">

When clicking on `clearLocalStorage` within the command log, the console outputs the following:

<img width="564" alt="screen shot 2017-05-24 at 3 19 25 pm" src="https://cloud.githubusercontent.com/assets/1271364/26421552/73b17ac0-4094-11e7-8a13-b59bc9613613.png">

# See also

- {% url `cy.clearCookies()` clearcookies %}
