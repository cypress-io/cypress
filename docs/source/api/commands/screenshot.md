---
title: screenshot
comments: true
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

`cy.screenshot()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.screenshot()    
```

## Arguments

**{% fa fa-angle-right %} fileName** ***(String)***

A name for the image file. By default the filename will be the title of the test.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.screenshot()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to wait for the automation server to process the command.

## Yields

`cy.screenshot()` yields `null`.

## Timeout

`cy.screenshot()` will wait up for the duration of [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) for the automation server to process this command.

# Examples

The screenshot will be stored in the `cypress/screenshots` folder by default.

You can change the directory where screenshots are saved in your [configuration](https://on.cypress.io/guides/configuration#folders).

## Screenshot

**Take a screenshot**

```javascript
describe('my tests', function(){
  it('takes a screenshot', function(){
    cy.screenshot() // saved as 'cypress/sreenshots/my tests -- takes a screenshot.png'
  })
})
```

## Filename

**Take a screenshot and save as specific filename**

```javascript
// screenshot will be saved as
// cypress/sreenshots/clickingOnNav.png
cy.screenshot('clickingOnNav')
```

# Notes

**Automatic screenshots on test failure**

When running headlessly or in [Continuous Integration](https://on.cypress.io/guides/continuous-integration), Cypress automatically takes a screenshot when a test fails. You can optionally turn this off by setting `screenshotOnHeadlessFailure` to `false` in your [configuration](https://on.cypress.io/guides/configuration).

**Screenshots in CI**

You can see screenshots taken during a CI run in the [Cypress Dashboard](https://on.cypress.io/dashboard) without any extra work.

Alternatively, to see screenshots in the [Circle CI](https://circleci.com/) UI, we automatically export screenshots as artifacts. This makes them available directly in their web UI.

If you're using Travis, you'll need to upload artifacts to an s3 bucket as per their [uploading artifacts doc](https://docs.travis-ci.com/user/uploading-artifacts/) to see screenshots outside of the Cypress Dashboard.

**Understanding when a screenshot happens**

Taking a screenshot is an asynchronous action that takes around `100ms` to complete. By the time the screenshot is taken, it's possible something in your application may have changed. It's important to realize that the screenshot may not reflect 100% of what your application looked like when the command was issued.

For example - say a command we wrote times outs: `cy.get('#element')`. This causes your test to fail. Cypress then takes a screenshot when the test fails, but it's possible something in your application changed within the `100ms` timeframe. Hypothetically your app could render the element you were searching for. When this happens the screenshot may provide confusing results. It's unlikely, but theoretically possible.

# Command Log

**Take a screenshot with a specific filename**

```javascript
cy.screenshot('my-image')
```

The commands above will display in the command log as:

<img width="559" alt="screen shot 2016-06-13 at 10 46 25 am" src="https://cloud.githubusercontent.com/assets/1271364/16012082/ded7af6c-3155-11e6-83cb-b0dcb6f850a7.png">

When clicking on `screenshot` within the command log, the console outputs the following:

<img width="667" alt="screen shot 2016-06-13 at 10 46 15 am" src="https://cloud.githubusercontent.com/assets/1271364/16012081/ded22a2e-3155-11e6-8303-0f1ec64e209b.png">

# See also

- {% url `cy.debug()` debug %}
- [Cypress Dashboard](https://on.cypress.io/dashboard)
- [pause](https://on.cypress.io/api/pause)
