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

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.log('created new user')    
```

## Arguments

**{% fa fa-angle-right %} message** ***(String)***

Message to be printed to Cypress Command Log.

**{% fa fa-angle-right %} args...**

Additional arguments to be printed to the Cypress Command Log. There is no limit to the number of arguments.

## Yields {% helper_icon yields %}

{% yields null cy.log %}

# Examples

## Message

***Print a message to the Command Log.***

```javascript
cy.click('Login')
cy.url().should('not.include', 'login')
cy.log('Login successful')
```

## Args

***Print a message with arguments to the Command Log.***

```javascript
cy.log('events triggered', events)
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.log %}

## Assertions {% helper_icon assertions %}

{% assertions none cy.log %}

## Timeouts {% helper_icon timeout %}

{% timeouts none cy.log %}

# Command Log

***Print messages with arguments to the Command Log.***

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
