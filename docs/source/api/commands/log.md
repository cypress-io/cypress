---
title: log
comments: true
---

Print a message to the Cypress Command Log.

# Syntax

```javascript
cy.log(message)
cy.log(message, args...)
```

## Usage

`cy.log()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.log('created new user')    
```

## Arguments

**{% fa fa-angle-right %} message** ***(String)***

Message to be printed to Cypress Command Log.

**{% fa fa-angle-right %} args...**

Additional arguments to be printed to the Cypress Command Log. There is no limit to the number of arguments.

## Yields

`cy.log()` yields `null`.

## Timeout

# Examples

## Message

**Print a message to the Command Log.**

```javascript
cy.click('Login')
cy.url().should('not.include', 'login')
cy.log('Login successful')
```

## Arguments

**Print a message with arguments to the Command Log.**

```javascript
cy.log('events triggered', events)
```

# Command Log

**Print messages with arguments to the Command Log.**

```javascript
cy.log('log out any message we want here')
cy.log('another message', ['one', 'two', 'three'])
```

The commands above will display in the command log as:

<img width="560" alt="command log with cy.log" src="https://cloud.githubusercontent.com/assets/1271364/21321329/55389b3c-c5e2-11e6-8607-592683d520da.png">

When clicking on `log` within the command log, the console outputs the following:

<img width="746" alt="console display of cy.log" src="https://cloud.githubusercontent.com/assets/1271364/21321324/4f616dec-c5e2-11e6-8c2f-924e7bfd6f87.png">

# See also

- {% url `cy.exec()` exec %}
