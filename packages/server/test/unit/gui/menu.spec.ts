import _ from 'lodash'
import os from 'os'
import electron from 'electron'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import * as appData from '../../../lib/util/app_data'
import menu from '../../../lib/gui/menu'

vi.mock('electron', () => {
  const electronMock = {
    shell: {},
    Menu: {
      buildFromTemplate () {},
      setApplicationMenu () {},
    },
  }

  return { ...electronMock, default: electronMock }
})

const getMenuItem = function (label) {
  return _.find((electron.Menu.buildFromTemplate as Mock).mock.lastCall![0], { label })
}

const getSubMenuItem = (menu, label) => {
  return _.find(menu.submenu, { label })
}

const getLabels = (menu) => {
  return _(menu).map('label').compact().value()
}

describe('gui/menu', () => {
  beforeEach(() => {
    vi.spyOn(os, 'platform').mockReturnValue('darwin')
    vi.spyOn(electron.Menu, 'buildFromTemplate').mockImplementation(() => undefined as any)
    vi.spyOn(electron.Menu, 'setApplicationMenu').mockImplementation(() => {})
    electron.shell.openExternal = vi.fn()
    electron.shell.openPath = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds menu from template and sets it', () => {
    vi.mocked(electron.Menu.buildFromTemplate).mockReturnValue('menu' as any)
    menu.set()

    expect(electron.Menu.buildFromTemplate).toHaveBeenCalled()
    expect(electron.Menu.setApplicationMenu).toHaveBeenCalledWith('menu')
  })

  describe('Cypress', () => {
    it('on darwin has appMenu role', () => {
      menu.set()
      const cyMenu = getMenuItem('Cypress')

      expect(cyMenu.role).toBe('appMenu')
    })

    it('on other OS does not exist', () => {
      vi.mocked(os.platform).mockReturnValue('linux')
      menu.set()
      expect(getMenuItem('Cypress')).toBeUndefined()
    })
  })

  describe('File', () => {
    it('contains changelog, logout, close window', () => {
      menu.set()
      const labels = getLabels(getMenuItem('File').submenu)

      expect(labels).toEqual([
        'Changelog',
        'Manage Account',
        'Log Out',
        'View App Data',
        'Close Window',
      ])
    })

    it('opens changelog when Changelog is clicked', () => {
      menu.set()
      getSubMenuItem(getMenuItem('File'), 'Changelog').click()
      expect(electron.shell.openExternal).toHaveBeenCalledWith('https://on.cypress.io/changelog')
    })

    it('opens Cypress Cloud when Manage Account is clicked', () => {
      menu.set()
      getSubMenuItem(getMenuItem('File'), 'Manage Account').click()
      expect(electron.shell.openExternal).toHaveBeenCalledWith('https://on.cypress.io/dashboard')
    })

    it('opens app data directory when View App Data is clicked', () => {
      menu.set()
      getSubMenuItem(getMenuItem('File'), 'View App Data').click()
      expect(electron.shell.openPath).toHaveBeenCalledWith(appData.path())
    })

    it('calls logout callback when Log Out is clicked', () => {
      const onLogOutClicked = vi.fn()

      menu.set({ onLogOutClicked })
      getSubMenuItem(getMenuItem('File'), 'Log Out').click()
      expect(onLogOutClicked).toHaveBeenCalled()
    })

    it('merges options and calls callback functions', () => {
      const onLogOutClicked1 = vi.fn()
      const onLogOutClicked2 = vi.fn()

      menu.set()
      menu.set({ onLogOutClicked: onLogOutClicked1 })
      menu.set({ onLogOutClicked: onLogOutClicked2 })

      getSubMenuItem(getMenuItem('File'), 'Log Out').click()

      expect(onLogOutClicked1).not.toHaveBeenCalled()
      expect(onLogOutClicked2).toHaveBeenCalled()
    })

    it('calls original logout callback when menu is reset without new callback', () => {
      const onLogOutClicked = vi.fn()

      menu.set({ onLogOutClicked })
      menu.set()
      getSubMenuItem(getMenuItem('File'), 'Log Out').click()
      expect(onLogOutClicked).toHaveBeenCalled()
    })

    it('is noop when Log Out is clicked with no callback', () => {
      menu.set()
      expect(() => getSubMenuItem(getMenuItem('File'), 'Log Out').click()).not.toThrow()
    })

    it('binds Close Window to shortcut', () => {
      menu.set()
      expect(getSubMenuItem(getMenuItem('File'), 'Close Window')).toEqual({
        label: 'Close Window',
        accelerator: 'CmdOrCtrl+W',
        role: 'close',
      })
    })
  })

  describe('Edit', () => {
    it('contains undo, redo, cut, copy, paste, selectall', () => {
      menu.set()

      expect(getMenuItem('Edit').submenu).toEqual([
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo',
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall',
        },
      ])
    })
  })

  describe('View', () => {
    it('contains zoom actions', () => {
      menu.set()

      expect(getMenuItem('View').submenu).toEqual([
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          role: 'resetzoom',
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          role: 'zoomin',
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          role: 'zoomout',
        },
      ])
    })
  })

  describe('Window', () => {
    it('contains minimize', () => {
      menu.set()

      expect(getMenuItem('Window')).toEqual({
        label: 'Window',
        role: 'window',
        submenu: [
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize',
          },
        ],
      })
    })
  })

  describe('Help', () => {
    it('contains report an issue, docs, chat', () => {
      menu.set()
      const labels = getLabels(getMenuItem('Help').submenu)

      expect(labels).toEqual([
        'Support',
        'Documentation',
        'Download Chromium',
        'Report an Issue',
      ])
    })

    it('opens chat when Support is clicked', () => {
      menu.set()
      getMenuItem('Help').submenu[0].click()
      expect(electron.shell.openExternal).toHaveBeenCalledWith('https://on.cypress.io/support')
    })

    it('opens docs when Documentation is clicked', () => {
      menu.set()
      getMenuItem('Help').submenu[1].click()
      expect(electron.shell.openExternal).toHaveBeenCalledWith('https://on.cypress.io')
    })

    it('opens chromium downloads when Download Chromium is clicked', () => {
      menu.set()
      getMenuItem('Help').submenu[2].click()
      expect(electron.shell.openExternal).toHaveBeenCalledWith('https://on.cypress.io/chromium-downloads')
    })

    it('opens new issue when Report an Issue is clicked', () => {
      menu.set()
      getMenuItem('Help').submenu[3].click()
      expect(electron.shell.openExternal).toHaveBeenCalledWith('https://on.cypress.io/new-issue')
    })
  })

  describe('Developer Tools', () => {
    it('exists by default', () => {
      menu.set()
      expect(getMenuItem('Developer Tools')).toBeDefined()
    })

    it('exists when withInternalDevTools is false', () => {
      menu.set({ withInternalDevTools: false })
      expect(getMenuItem('Developer Tools')).toBeDefined()
    })

    it('contains only Reload and Toggle Developer Tools items in expected order', () => {
      menu.set()
      const labels = getLabels(getMenuItem('Developer Tools').submenu)

      expect(labels).toEqual([
        'Reload',
        'Toggle Developer Tools',
        'View App Data',
      ])
    })

    describe('when withInternalDevTools is true', () => {
      let devSubmenu

      beforeEach(() => {
        menu.set({ withInternalDevTools: true })
        devSubmenu = getMenuItem('Developer Tools').submenu
      })

      it('exists and contains reload, toggle', () => {
        const labels = getLabels(devSubmenu)

        expect(labels).toEqual([
          'Reload',
          'Toggle Developer Tools',
          'View App Data',
          'GraphQL requests over Fetch (off)',
          'GraphiQL',
        ])
      })

      it('sets shortcut for Reload', () => {
        expect(devSubmenu[0].accelerator).toBe('CmdOrCtrl+R')
      })

      it('reloads focused window when Reload is clicked', () => {
        const reload = vi.fn()

        devSubmenu[0].click(null, { reload })
        expect(reload).toHaveBeenCalled()
      })

      it('is noop if no focused window when Reload is clicked', () => {
        expect(() => devSubmenu[0].click()).not.toThrow()
      })

      it('sets shortcut for Toggle Developer Tools when macOS', () => {
        expect(devSubmenu[1].accelerator).toBe('Alt+Command+I')
      })

      it('sets shortcut for Toggle Developer Tools when not macOS', () => {
        vi.mocked(os.platform).mockReturnValue('linux')
        menu.set({ withInternalDevTools: true })
        expect(getMenuItem('Developer Tools').submenu[1].accelerator).toBe('Ctrl+Shift+I')
      })

      it('toggles dev tools on focused window when Toggle Developer Tools is clicked', () => {
        const toggleDevTools = vi.fn()

        devSubmenu[1].click(null, { toggleDevTools })
        expect(toggleDevTools).toHaveBeenCalled()
      })

      it('is noop if no focused window when Toggle Developer Tools is clicked', () => {
        expect(() => devSubmenu[1].click()).not.toThrow()
      })
    })
  })
})
