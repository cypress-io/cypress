slug: screenshot
excerpt: Take a screenshot

Take a screenshot of the Command Log and the test runner (the app being tested). The screenshot will be stored in `cypress/screenshots` by default.

You can change the directory where screenshots are saved in your [configuration](https://on.cypress.io/guides/configuration#folders).

| | |
|--- | --- |
| **Returns** | `null` |
| **Timeout** | `cy.screenshot` will wait up for the duration of [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) for the automation server to process this command. |

***

# [cy.screenshot()](#usage)

Take a screenshot of the screen and save as a `.png` in `cypress/screenshots`. By default the filename will be the title of the test.

***

# [cy.screenshot( *filename* )](#filename-usage)

Take a screenshot of the screen and save as a `.png` in `cypress/screenshots`. The filename will be the filename passed in as the argument.

***

# Options

Pass in an options object to change the default behavior of `cy.screenshot`.

**cy.screenshot( *options* )**
**cy.screenshot( *filename*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to wait for the automation server to process this command.

***

# Usage

## Take a screenshot

```javascript
// screenshot will be saved at
// cypress/sreenshots/takes a screenshot.png
it("takes a screenshot", function(){
  // returns null
  cy.screenshot()
})
```

***

# Filename Usage

## Take a screenshot and save as specific filename

```javascript
// screenshot will be saved at
// cypress/sreenshots/clickingOnNav.png
cy.screenshot("clickingOnNav")
```

***

# Notes

## Automatic screenshots on test failure

When running headlessly or in [Continuous Integration](https://on.cypress.io/guides/continuous-integration), Cypress will automatically take a screenshot when a test fails. You can optionally turn this off by setting `screenshotOnHeadlessFailure` to `false` in your [configuration](https://on.cypress.io/guides/configuration).

***

## Default screenshots folder

By default, screenshots will be saved in `cypress/screenshots`. You can change the directory where screenshots are saved in your [configuration](https://on.cypress.io/guides/configuration#folders).

***

## Screenshots in CI

When running in [Circle CI](https://circleci.com/), we will automatically export screenshots as artifacts. This makes them available directly in their web UI. If you're using Circle CI, you'll be able to see screenshots without doing anything.

If you're using Travis, you'll need to upload artifacts to an s3 bucket as per their [uploading artifacts doc](https://docs.travis-ci.com/user/uploading-artifacts/).

***

## Understanding when a screenshot happens

Taking a screenshot is an asynchronous action which takes around `100ms` to complete. By the time the screenshot is taken it's possible something in your application may have changed. It's important to realize that the screenshot may not reflect 100% of what your application looked like when the command was issued.

For example - say this command times outs `cy.get("#element")`. This causes your test to fail. We'll then take a screenshot when the test fails but it's possible something in your application changes within the `100ms` timeframe. Hypothetically your app could render the element you were searching for. When this happens the screenshot may provide confusing results. It's unlikely but theoretically possible.

## No Command Log scrolling during screenshots

 Currently you may not be able to see the Command Log at the exact test you took the screenshot due to the view not scrolling when the screenshot is taken.

***

# Command Log

## Take a screenshot with a specific filename

```javascript
cy.screenshot("my-image")
```

The commands above will display in the command log as:

<img width="559" alt="screen shot 2016-06-13 at 10 46 25 am" src="https://cloud.githubusercontent.com/assets/1271364/16012082/ded7af6c-3155-11e6-83cb-b0dcb6f850a7.png">

When clicking on `screenshot` within the command log, the console outputs the following:

<img width="667" alt="screen shot 2016-06-13 at 10 46 15 am" src="https://cloud.githubusercontent.com/assets/1271364/16012081/ded22a2e-3155-11e6-8303-0f1ec64e209b.png">
