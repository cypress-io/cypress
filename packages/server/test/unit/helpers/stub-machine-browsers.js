/**
 * `getFullInitialConfig` / `project.getConfig()` require a non-empty machine browser list.
 * Stub for unit specs when the host has no detectable Chrome/Firefox/WebKit (e.g. minimal CI).
 *
 * Call after the current `DataContext` exists (`setCtx` / spec_helper `beforeEach`).
 */
const stubChromeBrowser = {
  channel: 'stable',
  displayName: 'Chrome',
  family: 'chromium',
  majorVersion: '0',
  name: 'chrome',
  path: '/fake/cypress-server-unit-test-chrome',
  version: '0.0.0',
}

function stubMachineBrowsers (ctx, sinon) {
  sinon.stub(ctx.browser, 'machineBrowsers').resolves([stubChromeBrowser])
}

module.exports = {
  stubMachineBrowsers,
  stubChromeBrowser,
}
