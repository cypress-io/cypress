---
title: Screenshots and Videos
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- How Cypress captures screenshots of test failures automatically
- How to manually grab your own screenshot
- How Cypress can record a video of the entire run
- Some options of what to do with screenshot and video artifacts
{% endnote %}

# Screenshots

Cypress comes with the ability to take screenshots, whether you are running in a real, headed browser (such as Chrome) or when you are running headlessly, possibly in CI.

To take a manual screenshot just use the {% url `cy.screenshot()` screenshot %} command.

Additionally, Cypress will automatically capture screenshots when a failure happens but only during a headless run.

This behavior can be turned off by setting {% url `screenshotOnHeadlessFailure` configuration#Screenshots %} to `false`.

Screenshots are stored in the {% url `screenshotsFolder` configuration#Screenshots %} which is set to `cypress/screenshots` by default.

By default, Cypress clears any existing screenshots before a headless run. If don't want to clear your screenshots folder before a headless run, you can set {% url `trashAssetsBeforeHeadlessRun` configuration#Screenshots %} to `false`.

# Videos

Cypress also records videos when running headlessly.

This behavior can be turned off by setting {% url `videoRecording` configuration#Videos %} to `false`.

Videos are stored in the {% url `videosFolder` configuration#Videos %} which is set to `cypress/videos` by default.

After a headless run completes, Cypress will automatically compress the video to save on file size. By default it compresses to a `32 CRF` but this is configurable with the {% url `videoCompression` configuration#Videos %} property.

By default, Cypress clears any existing videos before a headless run. If don't want to clear your videos folder before a headless run, you can set {% url `trashAssetsBeforeHeadlessRun` configuration#Videos %} to `false`.

# Now What?

So you're capturing screenshots and recording videos of your test runs, now what?

## Share Them With Your Team

Something you can take advantage of today is the {% url 'Cypress Dashboard' features-dashboard %}: our companion enterprise service that stores your artifacts for you and lets you view them from any web browser, as well as share them with your team.

## Visual Regression Test / Screenshot Diffing

Another possibility is visual regression testing: comparing screenshots of past runs with the current run to ensure that nothing changed. Cypress doesn't currently have this built-in, but it is on our radar. {% issue 495 'Follow this issue' %} if you're interested in being updated about this feature, leave comments if you'd like to influence what gets built, and open a pull request if you work on it yourself!
