---
title: screenshot
comments: false
---

Take a screenshot of the application under test and the Cypress Command Log.

# Syntax

```javascript
cy.screenshot()
cy.screenshot(fileName)
cy.screenshot(options)
cy.screenshot(fileName, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.screenshot()    
```

## Arguments

**{% fa fa-angle-right %} fileName** ***(String)***

A name for the image file. By default the filename will be the title of the test.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.screenshot()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `responseTimeout` configuration#Timeouts %} | {% usage_options timeout cy.screenshot %}

## Yields {% helper_icon yields %}

{% yields null cy.screenshot %}

# Examples

The screenshot will be stored in the `cypress/screenshots` folder by default.

You can change the directory where screenshots are saved in your {% url 'configuration' configuration#Folders %}.

## No Args

***Take a screenshot***

```javascript
describe('my tests', function(){
  it('takes a screenshot', function(){
    cy.screenshot() // saved as 'cypress/sreenshots/my tests -- takes a screenshot.png'
  })
})
```

## Filename

***Take a screenshot and save as specific filename***

```javascript
// screenshot will be saved as
// cypress/sreenshots/clickingOnNav.png
cy.screenshot('clickingOnNav')
```

# Notes

## Test Failures

***Automatic screenshots on test failure***

When running headlessly or in {% url 'Continuous Integration' continuous-integration %}, Cypress automatically takes a screenshot when a test fails. You can optionally turn this off by setting `screenshotOnHeadlessFailure` to `false` in your {% url 'configuration' configuration %}.

## Viewing Screenshots

***Screenshots in CI***

You can see screenshots taken during a CI run in the {% url 'Dashboard' https://on.cypress.io/dashboard %} without any extra work.

Alternatively, to see screenshots in the {% url 'Circle CI' https://circleci.com/ %} UI, we automatically export screenshots as artifacts. This makes them available directly in their web UI.

If you're using Travis, you'll need to upload artifacts to an s3 bucket as per their {% url 'uploading artifacts doc' https://docs.travis-ci.com/user/uploading-artifacts/ %} to see screenshots outside of the Cypress Dashboard.

## Asynchronous

***Understanding when a screenshot happens***

Taking a screenshot is an asynchronous action that takes around `100ms` to complete. By the time the screenshot is taken, it's possible something in your application may have changed. It's important to realize that the screenshot may not reflect 100% of what your application looked like when the command was issued.

For example - say a command we wrote times out: {% url "`cy.get('#element')`" get %}. This causes your test to fail. Cypress then takes a screenshot when the test fails, but it's possible something in your application changed within the `100ms` timeframe. Hypothetically your app could render the element you were searching for. When this happens the screenshot may provide confusing results. It's unlikely, but theoretically possible.

Another potential problem to be aware of is that our own Reporter's UI is using `react` under the hood and only rendering asynchronously during an animation frame. It's possible you will see screenshots taken before our Reporter has rendered. This means you may not see the **error displayed** in the screenshot. But this is also why we take a video - to show you the complete failure.

It's possible for us to synchronize taking a screenshot with our renderer, but it would delay taking the screenshot. The trade off here is that adding an artificial delay would mean then there's a greater chance your own application's state is not accurate.

{% open_an_issue %} if you'd like us to add support for synchronizing the screenshot with our Reporter.

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.screenshot %}

## Assertions {% helper_icon assertions %}

{% assertions none cy.screenshot %}

## Timeouts {% helper_icon timeout %}

{% timeouts automation cy.screenshot %}

# Command Log

***Take a screenshot with a specific filename***

```javascript
cy.screenshot('my-image')
```

The commands above will display in the command log as:

![Command Log](/img/api/screenshot/command-log-shows-name-of-screenshot-taken.png)

When clicking on `screenshot` within the command log, the console outputs the following:

![Console Log](/img/api/screenshot/console-logs-exactly-where-screenshot-was-saved-in-file-system.png)

# See also

- {% url `cy.debug()` debug %}
- {% url 'Dashboard' https://on.cypress.io/dashboard %}
- {% url `.pause()` pause %}
