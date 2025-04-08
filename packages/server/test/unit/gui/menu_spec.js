require('../../spec_helper')

const _ = require('lodash')
const os = require('os')
const electron = require('electron')
const appData = require(`../../../lib/util/app_data`)
const menu = require(`../../../lib/gui/menu`)

const getMenuItem = function (label) {
  return _.find(electron.Menu.buildFromTemplate.lastCall.args[0], { label })
}

const getSubMenuItem = (menu, label) => {
  return _.find(menu.submenu, { label })
}

const getLabels = (menu) => {
  return _(menu).map('label').compact().value()
}

describe('gui/menu', function () {
  beforeEach(() => {
    sinon.stub(os, 'platform').returns('darwin')
    sinon.stub(electron.Menu, 'buildFromTemplate')
    sinon.stub(electron.Menu, 'setApplicationMenu')
    electron.shell.openExternal = sinon.stub()
    electron.shell.openPath = sinon.stub()
  })

  it('builds menu from template and sets it', () => {
    electron.Menu.buildFromTemplate.returns('menu')
    menu.set()

    expect(electron.Menu.buildFromTemplate).to.be.called
    expect(electron.Menu.setApplicationMenu).to.be.calledWith('menu')
  })

  context('Cypress', function () {
    it('on darwin has appMenu role', () => {
      menu.set()
      const cyMenu = getMenuItem('Cypress')

      expect(cyMenu.role).to.eq('appMenu')
    })

    it('on other OS does not exist', () => {
      os.platform.returns('linux')
      menu.set()
      expect(getMenuItem('Cypress')).to.be.undefined
    })
  })

  context('File', function () {
    it('contains changelog, logout, close window', () => {
      menu.set()
      const labels = getLabels(getMenuItem('File').submenu)

      expect(labels).to.eql([
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
      expect(electron.shell.openExternal).to.be.calledWith('https://on.cypress.io/changelog')
    })

    it('opens Cypress Cloud when Manage Account is clicked', () => {
      menu.set()
      getSubMenuItem(getMenuItem('File'), 'Manage Account').click()
      expect(electron.shell.openExternal).to.be.calledWith('https://on.cypress.io/dashboard')
    })

    it('opens app data directory when View App Data is clicked', () => {
      menu.set()
      getSubMenuItem(getMenuItem('File'), 'View App Data').click()
      expect(electron.shell.openPath).to.be.calledWith(appData.path())
    })

    it('calls logout callback when Log Out is clicked', () => {
      const onLogOutClicked = sinon.stub()

      menu.set({ onLogOutClicked })
      getSubMenuItem(getMenuItem('File'), 'Log Out').click()
      expect(onLogOutClicked).to.be.called
    })

    it('merges options and calls callback functions', () => {
      const onLogOutClicked1 = sinon.stub()
      const onLogOutClicked2 = sinon.stub()

      menu.set()
      menu.set({ onLogOutClicked: onLogOutClicked1 })
      menu.set({ onLogOutClicked: onLogOutClicked2 })

      getSubMenuItem(getMenuItem('File'), 'Log Out').click()

      expect(onLogOutClicked1).not.to.be.called
      expect(onLogOutClicked2).to.be.called
    })

    it('calls original logout callback when menu is reset without new callback', () => {
      const onLogOutClicked = sinon.stub()

      menu.set({ onLogOutClicked })
      menu.set()
      getSubMenuItem(getMenuItem('File'), 'Log Out').click()
      expect(onLogOutClicked).to.be.called
    })

    it('is noop when Log Out is clicked with no callback', () => {
      menu.set()
      expect(() => getSubMenuItem(getMenuItem('File'), 'Log Out').click()).not.to.throw()
    })

    it('binds Close Window to shortcut', () => {
      menu.set()
      expect(getSubMenuItem(getMenuItem('File'), 'Close Window')).to.eql({
        label: 'Close Window',
        accelerator: 'CmdOrCtrl+W',
        role: 'close',
      })
    })
  })

  context('Edit', () => {
    it('contains undo, redo, cut, copy, paste, selectall', () => {
      menu.set()

      expect(getMenuItem('Edit').submenu).to.eql([
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

  context('View', () => {
    it('contains zoom actions', () => {
      menu.set()

      expect(getMenuItem('View').submenu).to.eql([
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

  context('Window', () => {
    it('contains minimize', () => {
      menu.set()

      expect(getMenuItem('Window')).to.eql({
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

  context('Help', () => {
    it('contains report an issue, docs, chat', () => {
      menu.set()
      const labels = getLabels(getMenuItem('Help').submenu)

      expect(labels).to.eql([
        'Support',
        'Documentation',
        'Download Chromium',
        'Report an Issue',
      ])
    })

    it('opens chat when Support is clicked', () => {
      menu.set()
      getMenuItem('Help').submenu[0].click()
      expect(electron.shell.openExternal).to.be.calledWith('https://on.cypress.io/support')
    })

    it('opens docs when Documentation is clicked', () => {
      menu.set()
      getMenuItem('Help').submenu[1].click()
      expect(electron.shell.openExternal).to.be.calledWith('https://on.cypress.io')
    })

    it('opens chromium downloads when Download Chromium is clicked', () => {
      menu.set()
      getMenuItem('Help').submenu[2].click()
      expect(electron.shell.openExternal).to.be.calledWith('https://on.cypress.io/chromium-downloads')
    })

    it('opens new issue when Report an Issue is clicked', () => {
      menu.set()
      getMenuItem('Help').submenu[3].click()
      expect(electron.shell.openExternal).to.be.calledWith('https://on.cypress.io/new-issue')
    })
  })

  context('Developer Tools', () => {
    it('exists by default', () => {
      menu.set()
      expect(getMenuItem('Developer Tools')).to.be.defined
    })

    it('exists when withInternalDevTools is false', () => {
      menu.set({ withInternalDevTools: false })
      expect(getMenuItem('Developer Tools')).to.be.defined
    })

    it('contains only Reload and Toggle Developer Tools items in expected order', () => {
      menu.set()
      const labels = getLabels(getMenuItem('Developer Tools').submenu)

      expect(labels).to.eql([
        'Reload',
        'Toggle Developer Tools',
        'View App Data',
      ])
    })

    describe('when withInternalDevTools is true', () => {
      beforeEach(function () {
        menu.set({ withInternalDevTools: true })
        this.devSubmenu = getMenuItem('Developer Tools').submenu
      })

      it('exists and contains reload, toggle', function () {
        const labels = getLabels(this.devSubmenu)

        expect(labels).to.eql([
          'Reload',
          'Toggle Developer Tools',
          'View App Data',
          'GraphQL requests over Fetch (off)',
          'GraphiQL',
        ])
      })

      it('sets shortcut for Reload', function () {
        expect(this.devSubmenu[0].accelerator).to.equal('CmdOrCtrl+R')
      })

      it('reloads focused window when Reload is clicked', function () {
        const reload = sinon.stub()

        this.devSubmenu[0].click(null, { reload })
        expect(reload).to.be.called
      })

      it('is noop if no focused window when Reload is clicked', function () {
        expect(() => this.devSubmenu[0].click()).not.to.throw()
      })

      it('sets shortcut for Toggle Developer Tools when macOS', function () {
        expect(this.devSubmenu[1].accelerator).to.equal('Alt+Command+I')
      })

      it('sets shortcut for Toggle Developer Tools when not macOS', () => {
        os.platform.returns('linux')
        menu.set({ withInternalDevTools: true })
        expect(getMenuItem('Developer Tools').submenu[1].accelerator).to.equal('Ctrl+Shift+I')
      })

      it('toggles dev tools on focused window when Toggle Developer Tools is clicked', function () {
        const toggleDevTools = sinon.stub()

        this.devSubmenu[1].click(null, { toggleDevTools })
        expect(toggleDevTools).to.be.called
      })

      it('is noop if no focused window when Toggle Developer Tools is clicked', function () {
        expect(() => this.devSubmenu[1].click()).not.to.throw()
      })
    })
  })
})
