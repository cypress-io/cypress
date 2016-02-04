slug: known-issues
excerpt: Known issues which cause problems in Cypress

# Switching tabs causes Cypress to fail

### Problem

[https://github.com/cypress-io/cypress/issues/9](https://github.com/cypress-io/cypress/issues/9)

While your tests are running if you switch to a different tab you will notice your tests time out.

This is due to Chrome. When a tab is **backgrounded** Chrome will automatically throttle back `setTimeouts` from `.004s` to `1s`. This is a decrease in performance of **250x**.

There is no way for Cypress to control this behavior, as Chrome has also removed the special `--disable-renderer-backgrounding` flag.

You'll see your tests fail because Cypress cannot issue its commands fast enough. Your application's code is also being throttled which can cause separate failures as well.

### Workaround

To work around this issue, don't switch to a different tab. Instead run Cypress in its own window. You can switch between Chrome windows without causing throttling.