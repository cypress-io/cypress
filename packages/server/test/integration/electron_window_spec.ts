import '../spec_helper'

import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import execa from 'execa'
import { expect } from 'chai'
import electron from '../../lib/browsers/electron'
import * as Windows from '../../lib/gui/windows'
import type { Automation } from '../../lib/automation'
import type { BrowserLaunchOpts } from '@packages/types'

// The `electron` module is substituted with a stub inside the test process, so
// the executable is resolved the way the electron package's own entrypoint does.
const getElectronExecPath = async () => {
  const pkgRoot = path.dirname(require.resolve('electron/package.json'))
  const execPath = await fs.readFile(path.join(pkgRoot, 'path.txt'), 'utf8')

  return path.join(pkgRoot, 'dist', execPath.trim())
}

const MAIN_JS = `
const { app, BrowserWindow } = require('electron')

app.disableHardwareAcceleration()

app.whenReady().then(() => {
  const options = JSON.parse(process.env.BROWSER_WINDOW_OPTIONS)
  const win = new BrowserWindow(options)

  // mirrors how run mode sizes the hidden window in lib/browsers/electron
  win.setSize(options.width, options.height)

  const [width, height] = win.getContentSize()

  win.destroy()

  process.stdout.write('<content-size>' + JSON.stringify({ width, height }) + '</content-size>', () => {
    app.exit(0)
  })
})
`

describe('lib/gui/windows - run mode window', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cy-electron-window-'))

    await fs.writeFile(path.join(tmpDir, 'main.js'), MAIN_JS)
  })

  afterEach(() => {
    return fs.remove(tmpDir)
  })

  const getContentSize = async (options: object) => {
    const { stdout } = await execa(await getElectronExecPath(), [path.join(tmpDir, 'main.js'), '--no-sandbox'], {
      env: {
        BROWSER_WINDOW_OPTIONS: JSON.stringify(options),
      },
    })

    const size = stdout.match(/<content-size>(.*)<\/content-size>/)

    if (!size) {
      throw new Error(`Electron did not report a content size. It printed:\n${stdout}`)
    }

    return JSON.parse(size[1])
  }

  // Windows reserves part of a frameless window's client area for resize hit
  // targets, which silently shrinks screenshots and video frames.
  // @see https://github.com/cypress-io/cypress/issues/34771
  it('gives the web contents the size the browser was launched with', async function () {
    this.timeout(60000)

    const launchOptions = electron._defaultOptions('/foo/', {}, {
      isTextTerminal: true,
      browser: {
        isHeadless: true,
      },
      onError: () => {},
      onWarning: () => {},
    } as unknown as BrowserLaunchOpts, {} as Automation)

    const contentSize = await getContentSize(Windows.browserWindowOptions(launchOptions))

    expect(contentSize).to.deep.eq({ width: 1280, height: 720 })
  })
})
