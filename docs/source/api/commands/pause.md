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

cy.pause()
cy.pause(options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.pause().getCookie('app') // Pause at the beginning of commands
cy.get('nav').pause()       // Pause after the 'get' commands yield
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.pause()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}

## Yields {% helper_icon yields %}

{% yields same_subject .pause %}

# Examples

## No Args

**Pause after assertion**

```javascript
cy.get('a').should('have.attr', 'href').and('match', /dashboard/).pause()
cy.get('button').should('not.be.disabled')
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dual .pause %}

## Assertions {% helper_icon assertions %}

{% assertions utility .pause %}

## Timeouts {% helper_icon timeout %}

{% timeouts none .pause %}

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

![Pause command on intial pause](/img/api/pause/initial-pause-in-gui-highlights-the-pause-command.png)

When clicking on "Next: 'click'" at the top of the Command Log, the Command Log will run only the next command and pause again.

***Click "Next"***

![Pause command after clicking next](/img/api/pause/next-goes-on-to-next-command-during-pause.png)

***Click "Next" again***

![Continue to next command during pause](/img/api/pause/continue-in-pause-command-just-like-debugger.png)

***Click "Next" again***

![Pause command](/img/api/pause/pause-goes-to-show-next-click.png)

***Click "Next" again***

![Pause command](/img/api/pause/clicking-on-canvas-continues-as-we-click-next.png)

***Click "Next" again***

![Pause command](/img/api/pause/last-next-click-before-out-test-is-finished.png)

***Click "Next" again, then 'Resume'***

![Pause command](/img/api/pause/next-then-resume-shows-our-test-has-ended.png)

# See also

- {% url 'Dashboard' https://on.cypress.io/dashboard %}
- {% url `cy.debug()` debug %}
- {% url `cy.log()` log %}
- {% url `cy.screenshot()` screenshot %}
