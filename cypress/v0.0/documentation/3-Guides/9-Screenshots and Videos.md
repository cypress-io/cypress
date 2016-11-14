slug: screenshots-and-videos
excerpt: Capture screenshots and videos of your test run

# Contents

- :fa-angle-right: [Screenshots](#section-screenshots)
- :fa-angle-right: [Videos](#section-videos)

# Screenshots

Capturing screenshots of the Command Log and the test runner (the app being tested) is oftentimes helpful. Especially when you are running Cypress headlessly using `cypress run` or in [Continuous Integration](https://on.cypress.io/guides/continuous-integration) with `cypress ci`.

Cypress automatically captures screenshots during every test failure at the point of failure. These screenshots are stored within `cypress/screenshots` by default. You can turn off capturing screenshots on test failure (when running headlessly) by setting the [`screenshotOnHeadlessFailure`](https://on.cypress.io/configuration#section-screenshots) to `false` in your [configuration](https://on.cypress.io/configuration).

[block:callout]
{
  "type": "info",
  "body": "You can change the directory where screenshots are saved in your [configuration](https://on.cypress.io/configuration)."
}
[/block]

You can also capture screenshots during any test run by using the [`cy.screenshot`](https://on.cypress.io/api/screenshot) command.

By default, Cypress trashes the screenshots before each headless run. If don't want to clear your screenshots folder before a headless run, you can set [`trashAssetsBeforeHeadlessRun`](https://on.cypress.io/configuration#section-screenshots) to `false` in your [configuration](https://on.cypress.io/configuration).

# Videos

Cypress automatically records a video of the Command Log and the test runner (the app being tested) during every headless run (using `cypress run` or in [Continuous Integration](https://on.cypress.io/guides/continuous-integration) with `cypress ci`). If you don't want Cypress to record video of your headless test run, you can set [`videoRecording`](https://on.cypress.io/configuration#section-video) to `false` in your [configuration](https://on.cypress.io/configuration).

By default, Cypress trashes the video before each headless run. If don't want to clear your videos folder before a headless run, you can set [`trashAssetsBeforeHeadlessRun`](https://on.cypress.io/configuration#section-video) to `false` in your [configuration](https://on.cypress.io/configuration).
