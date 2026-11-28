import os from 'os'
import Xvfb from '@cypress/xvfb'

// Starts a virtual display on Linux and points DISPLAY at it, so the browsers
// and Electron windows these specs launch can open on a headless host. The
// screen size matches the one the CLI uses (cli/lib/exec/xvfb.ts); without an
// explicit screen, Electron crashes (https://github.com/cypress-io/cypress/issues/6184).
// The sanitized environment never carries the host's DISPLAY, so every Linux
// run gets the same virtual display.
export default async function setup (): Promise<(() => Promise<void>) | undefined> {
  if (os.platform() !== 'linux') {
    return undefined
  }

  const xvfb = new Xvfb({
    timeout: 30_000,
    xvfb_args: ['-screen', '0', '1280x1024x24'],
  })

  await new Promise<void>((resolve, reject) => {
    xvfb.start((err) => (err ? reject(err) : resolve()))
  })

  process.env.DISPLAY = xvfb.display()

  return async () => {
    await new Promise<void>((resolve, reject) => {
      xvfb.stop((err) => (err ? reject(err) : resolve()))
    })
  }
}
