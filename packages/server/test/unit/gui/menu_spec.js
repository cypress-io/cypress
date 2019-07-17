require('../../spec_helper')

const _ = require('lodash')
const os = require('os')
const electron = require('electron')
const appData = require(`${root}../lib/util/app_data`)
const open = require(`${root}../lib/util/open`)
const menu = require(`${root}../lib/gui/menu`)

const getMenuItem = (label) => _.find(electron.Menu.buildFromTemplate.lastCall.args[0], { label })

const getSubMenuItem = (menu, label) => _.find(menu.submenu, { label })

const getLabels = (menu) => _(menu).map('label').compact().value()

describe('gui/menu', function () {
  beforeEach(function () {
    sinon.stub(os, 'platform').returns('darwin')
    sinon.stub(electron.Menu, 'buildFromTemplate')
    sinon.stub(electron.Menu, 'setApplicationMenu')
    electron.shell.openExternal = sinon.stub()
  })

  it('builds menu from template and sets it', function () {
    electron.Menu.buildFromTemplate.returns('menu')
    menu.set()

    expect(electron.Menu.buildFromTemplate).to.be.called
    expect(electron.Menu.setApplicationMenu).to.be.calledWith('menu')
  })

  context('Cypress', function () {
    describe('on macOS', function () {
      it('contains about, services, hide, hide others, show all, quit', function () {
        menu.set()
        const labels = getLabels(getMenuItem('Cypress').submenu)

        expect(labels).to.eql([
          'About Cypress',
          'Services',
          'Hide Cypress',
          'Hide Others',
          'Show All',
          'Quit',
        ])
      })

      it('sets roles and shortcuts', function () {
        menu.set()
        const cyMenu = getMenuItem('Cypress')

        expect(getSubMenuItem(cyMenu, 'About Cypress').role).to.equal('about')
        expect(getSubMenuItem(cyMenu, 'Services').role).to.equal('services')
        expect(getSubMenuItem(cyMenu, 'Hide Cypress').role).to.equal('hide')
        expect(getSubMenuItem(cyMenu, 'Hide Cypress').accelerator).to.equal('Command+H')
        expect(getSubMenuItem(cyMenu, 'Hide Others').role).to.equal('hideothers')
        expect(getSubMenuItem(cyMenu, 'Hide Others').accelerator).to.equal('Command+Shift+H')
        expect(getSubMenuItem(cyMenu, 'Show All').role).to.equal('unhide')
        expect(getSubMenuItem(cyMenu, 'Quit').accelerator).to.equal('Command+Q')
      })

      it('exits process when Quit is clicked', function () {
        sinon.stub(process, 'exit')
        menu.set()
        getSubMenuItem(getMenuItem('Cypress'), 'Quit').click()
        expect(process.exit).to.be.calledWith(0)
      })
    })

    describe('other OS', () => {
      it('does not exist', function () {
        os.platform.returns('linux')
        menu.set()
        expect(getMenuItem('Cypress')).to.be.undefined
      })
    })
  })

  context('File', function () {
    it('contains changelog, logout, close window', function () {
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

    it('opens changelog when Changelog is clicked', function () {
      menu.set()
      getSubMenuItem(getMenuItem('File'), 'Changelog').click()
      expect(electron.shell.openExternal).to.be.calledWith('https://on.cypress.io/changelog')
    })

    it('opens dashboard when Manage Account is clicked', function () {
      menu.set()
      getSubMenuItem(getMenuItem('File'), 'Manage Account').click()
      expect(electron.shell.openExternal).to.be.calledWith('https://on.cypress.io/dashboard')
    })

    it('opens app data directory when View App Data is clicked', function () {
      sinon.stub(open, 'opn')
      menu.set()
      getSubMenuItem(getMenuItem('File'), 'View App Data').click()
      expect(open.opn).to.be.calledWith(appData.path())
    })

    it('calls logout callback when Log Out is clicked', function () {
      const onLogOutClicked = sinon.stub()

      menu.set({ onLogOutClicked })
      getSubMenuItem(getMenuItem('File'), 'Log Out').click()
      expect(onLogOutClicked).to.be.called
    })

    it('calls original logout callback when menu is reset without new callback', function () {
      const onLogOutClicked = sinon.stub()

      menu.set({ onLogOutClicked })
      menu.set()
      getSubMenuItem(getMenuItem('File'), 'Log Out').click()
      expect(onLogOutClicked).to.be.called
    })

    it('is noop when Log Out is clicked with no callback', function () {
      menu.set()
      expect(() => getSubMenuItem(getMenuItem('File'), 'Log Out').click()).not.to.throw()
    })

    it('binds Close Window to shortcut', function () {
      menu.set()
      expect(getSubMenuItem(getMenuItem('File'), 'Close Window')).to.eql({
        label: 'Close Window',
        accelerator: 'CmdOrCtrl+W',
        role: 'close',
      })
    })
  })

  context('Edit', () => {
    it('contains undo, redo, cut, copy, paste, selectall', function () {
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
    it('contains minimize', function () {
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
    it('contains minimize', function () {
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

  context('Help', function () {
    it('contains report an issue, docs, chat', function () {
      menu.set()
      const labels = getLabels(getMenuItem('Help').submenu)

      expect(labels).to.eql([
        'Support',
        'Documentation',
        'Download Chromium',
        'Report an Issue',
      ])
    })

    it('opens chat when Support is clicked', function () {
      menu.set()
      getMenuItem('Help').submenu[0].click()
      expect(electron.shell.openExternal).to.be.calledWith('https://on.cypress.io/support')
    })

    it('opens docs when Documentation is clicked', function () {
      menu.set()
      getMenuItem('Help').submenu[1].click()
      expect(electron.shell.openExternal).to.be.calledWith('https://on.cypress.io')
    })

    it('opens chromium downloads when Download Chromium is clicked', function () {
      menu.set()
      getMenuItem('Help').submenu[2].click()
      expect(electron.shell.openExternal).to.be.calledWith('https://on.cypress.io/chromium-downloads')
    })

    it('opens new issue when Report an Issue is clicked', function () {
      menu.set()
      getMenuItem('Help').submenu[3].click()
      expect(electron.shell.openExternal).to.be.calledWith('https://on.cypress.io/new-issue')
    })
  })

  context('Developer Tools', function () {
    it('does not exist by default', function () {
      menu.set()
      expect(getMenuItem('Developer Tools')).to.be.undefined
    })

    it('does not exist by when withDevTools is false', function () {
      menu.set({ withDevTools: false })
      expect(getMenuItem('Developer Tools')).to.be.undefined
    })

    describe('when withDevTools is true', function () {
      beforeEach(function () {
        menu.set({ withDevTools: true })
        this.devSubmenu = getMenuItem('Developer Tools').submenu
      })

      it('exists and contains reload, toggle', function () {
        const labels = getLabels(this.devSubmenu)

        expect(labels).to.eql([
          'Reload',
          'Toggle Developer Tools',
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

      it('sets shortcut for Toggle Developer Tools when not macOS', function () {
        os.platform.returns('linux')
        menu.set({ withDevTools: true })
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
