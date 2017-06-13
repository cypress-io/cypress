---
title: pause
comments: false
---

Stop `cy` commands from running and allow interaction with the application under test. You can then "resume" running all commands or choose to step through the "next" commands from the Command Log.

{% note info %}
This does not set a `debugger` in your code, unlike {% url `.debug()` debug %}
{% endnote %}

# Syntax

```javascript
.pause()
.pause(options)
```

## Usage

`.pause()` can be chained off of `cy` or any cy command.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.pause().getCookie('app') // Pause at the beginning of commands
cy.get('nav').pause()       // Pause after the 'get' commands yield
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.pause()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log

## Yields

`.pause()` yields the previous command's yield.

## Timeout

# Examples

## Pause

**Pause after assertion**

```javascript
cy.get('a').should('have.attr', 'href').and('match', /dashboard/).pause()
cy.get('button').should('not.be.disabled')
```

# Command Log

**Pause and step through each `.click()` command**

```javascript
cy.get('#action-canvas')
  .click(80, 75)
  .pause()
  .click(170, 75)
  .click(80, 165)
  .click(100, 185)
  .click(125, 190)
  .click(150, 185)
  .click(170, 165)
```

The commands above will display in the GUI as:

<img width="985" alt="screen shot 2017-05-26 at 2 18 10 pm" src="https://cloud.githubusercontent.com/assets/1271364/26507426/4d48a5e4-421e-11e7-9bd4-c6829f80910d.png">

When clicking on "Next: 'click'" at the top of the Command Log, the Command Log will run only the next command and pause again.

***Click "Next"***

<img width="985" alt="screen shot 2017-05-26 at 2 18 15 pm" src="https://cloud.githubusercontent.com/assets/1271364/26507427/4d49e33c-421e-11e7-9bea-26b89ec6fe32.png">

***Click "Next" again***

<img width="985" alt="screen shot 2017-05-26 at 2 18 24 pm" src="https://cloud.githubusercontent.com/assets/1271364/26507424/4d446204-421e-11e7-82a1-a5ce8b4bb4a9.png">

***Click "Next" again***

<img width="985" alt="screen shot 2017-05-26 at 2 18 29 pm" src="https://cloud.githubusercontent.com/assets/1271364/26507421/4d3a69e8-421e-11e7-9a26-1026d0d133ec.png">

***Click "Next" again***

<img width="985" alt="screen shot 2017-05-26 at 2 18 33 pm" src="https://cloud.githubusercontent.com/assets/1271364/26507422/4d3b30a8-421e-11e7-940d-bd7bdc7b6e81.png">

***Click "Next" again***

<img width="985" alt="screen shot 2017-05-26 at 2 18 36 pm" src="https://cloud.githubusercontent.com/assets/1271364/26507420/4d37dcc8-421e-11e7-8428-8529ad628b05.png">

***Click "Next" again, then 'Resume'***

<img width="985" alt="screen shot 2017-05-26 at 2 18 51 pm" src="https://cloud.githubusercontent.com/assets/1271364/26507423/4d3c5992-421e-11e7-8df8-9af67f5ceb4a.png">

# See also

- {% url 'Dashboard' https://on.cypress.io/dashboard %}
- {% url `cy.debug()` debug %}
- {% url `cy.log()` log %}
- {% url `cy.screenshot()` screenshot %}
