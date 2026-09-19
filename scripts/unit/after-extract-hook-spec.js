const mockfs = require('mock-fs')
const fs = require('fs-extra')
const { expect } = require('chai')

const afterExtractHook = require('../after-extract-hook')

describe('after-extract-hook', () => {
  afterEach(() => {
    mockfs.restore()
  })

  const setup = ({ includeNotices = true } = {}) => {
    const files = {
      '/out/Cypress.app/Contents/Resources': mockfs.directory(),
    }

    if (includeNotices) {
      files['/out/LICENSE'] = 'electron license'
      files['/out/LICENSES.chromium.html'] = 'chromium licenses'
    }

    mockfs(files)
  }

  it('copies the Electron notices into the app bundle on macOS', async () => {
    setup()

    await afterExtractHook({ appOutDir: '/out', electronPlatformName: 'darwin' })

    expect(await fs.readFile('/out/Cypress.app/Contents/Resources/LICENSE.electron.txt', 'utf8')).to.equal('electron license')
    expect(await fs.readFile('/out/Cypress.app/Contents/Resources/LICENSES.chromium.html', 'utf8')).to.equal('chromium licenses')
  })

  it('does nothing on non-macOS platforms', async () => {
    setup()

    await afterExtractHook({ appOutDir: '/out', electronPlatformName: 'linux' })

    expect(fs.existsSync('/out/Cypress.app/Contents/Resources/LICENSE.electron.txt')).to.be.false
  })

  it('tolerates a build without notice files', async () => {
    setup({ includeNotices: false })

    await afterExtractHook({ appOutDir: '/out', electronPlatformName: 'darwin' })

    expect(fs.existsSync('/out/Cypress.app/Contents/Resources/LICENSE.electron.txt')).to.be.false
  })
})
