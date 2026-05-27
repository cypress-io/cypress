import { app } from 'electron'

console.log(process.version.replace('v', ''))

// Electron 41.7.0 on Windows intermittently fails to exit within
// 10s of `process.exit(0)` (parent execa kills with SIGTERM after
// the version has already been printed). `app.exit(0)` skips
// Electron's window/teardown shutdown path and terminates the
// process immediately, which works reliably on all platforms.
app.exit(0)
