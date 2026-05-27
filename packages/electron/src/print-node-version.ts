import { app } from 'electron'

// Electron 41.7.0 on Windows intermittently fails to exit within
// 10s of `process.exit(0)` (parent execa kills with SIGTERM after
// the version has already been printed). `app.exit(0)` skips
// Electron's window/teardown shutdown path and terminates
// immediately — but it also skips the stdio flush, so the write
// callback below is required to make sure the version actually
// reaches the parent execa pipe before we kill the process.
process.stdout.write(`${process.version.replace('v', '')}\n`, () => {
  app.exit(0)
})
