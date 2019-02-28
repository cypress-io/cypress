/**
 * This runs an electron process that gets all events that can occur
 * on `window` and then writes them in cli/types/window-actions.d.ts
 */
const cp = require('child_process')
const electronPath = require('electron')

cp.spawn(electronPath, ['generate-and-write-window-types.js'], {
  cwd: __dirname,
  stdio: 'inherit',
})
