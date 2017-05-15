slug: screenshots-and-videos
excerpt: Capture screenshots and videos of your test run

# Contents

- :fa-angle-right: [Screenshots](#section-screenshots)
- :fa-angle-right: [Videos](#section-videos)

***

# Screenshots

Cypress comes with the ability to take screenshots whether you are running in a real headed browser (such as Chrome) or when you are running headlessly or in CI.

To take a manual screenshot just use the [`cy.screenshot`](https://on.cypress.io/api/screenshot) command.

Additionally, Cypress will automatically capture screenshots when a failure happens but only during a headless run.

This behavior can be turned off by setting [`screenshotOnHeadlessFailure`](https://on.cypress.io/configuration#section-screenshots) to `false`.

Screenshots are stored in the [`screenshotsFolder`](https://on.cypress.io/configuration#section-screenshots) which is set to `cypress/screenshots` by default.

By default, Cypress trashes the previous screenshots before a headless run. If don't want to clear your screenshots folder before a headless run, you can set [`trashAssetsBeforeHeadlessRun`](https://on.cypress.io/configuration#section-screenshots) to `false`.

***

# Videos

Cypress also records videos when running headlessly.

This behavior can be turned off by setting [`videoRecording`](https://on.cypress.io/configuration#section-videos) to `false`.

Videos are stored in the [`videosFolder`](https://on.cypress.io/configuration#section-videos) which is set to `cypress/videos` by default.

After a headless run completes, Cypress will automatically compress the video to save on file size. By default it compresses to a `32 CRF` but this is configurable with the [`videoCompression`](https://on.cypress.io/configuration#section-videos) property.

By default, Cypress trashes the previous videos before a headless run. If don't want to clear your videos folder before a headless run, you can set [`trashAssetsBeforeHeadlessRun`](https://on.cypress.io/configuration#section-videos) to `false`.
