slug: log
excerpt: Print a message to the command log

Print a message to the Command Log within Cypress.

| | |
|--- | --- |
| **Returns** | null |
| **Timeout** | *cannot timeout* |

***

# [cy.log( *message* )](#section-usage)

Print the message to the Command Log.

***

# [cy.log( *message*, *arguments* )](#section-arguments-usage)

Print the message to the Command Log, along with any arguments.

***

# Usage

## Log a message to the Command Log.

```javascript
cy.log("Login successful")
```

***

# Arguments Usage

## Log a message with arguments to the Command Log.

```javascript
// print previously saved variable 'events' to the Command Log.
cy.log("events triggered", events)
```

***

# Command Log

## Print messages with arguments to the Command Log.

```javascript
cy
  .log("log out any message we want here")
  .log("another message", ["one", "two", "three"])
```

The commands above will display in the command log as:

<img width="560" alt="command log with cy.log" src="https://cloud.githubusercontent.com/assets/1271364/21321329/55389b3c-c5e2-11e6-8607-592683d520da.png">

When clicking on `log` within the command log, the console outputs the following:

<img width="746" alt="console display of cy.log" src="https://cloud.githubusercontent.com/assets/1271364/21321324/4f616dec-c5e2-11e6-8c2f-924e7bfd6f87.png">
