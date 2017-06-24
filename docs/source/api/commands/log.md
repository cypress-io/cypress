---
title: log
comments: false
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

## Yields {% helper_icon yields %}

`cy.log()` yields `null`.

## Timeout {% helper_icon timeout %}

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

![Command Log log](/img/api/log/custom-command-log-with-any-message.png)

When clicking on `log` within the command log, the console outputs the following:

![Console log log](/img/api/log/console-shows-logs-message-and-any-arguments.png)

# See also

- {% url `cy.exec()` exec %}
