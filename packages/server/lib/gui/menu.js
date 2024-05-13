const _ = require('lodash')
const os = require('os')
const { Menu } = require('electron')
const { shell } = require('electron')

const appData = require('../util/app_data')

// hoist up options and allow calling menu.set({})
// to override existing options or be called multiple
// times to preserve existing options
let options = {}

module.exports = {
  set (opts = {}) {
    _.extend(options, opts)

    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Changelog',
            click () {
              return shell.openExternal('https://on.cypress.io/changelog')
            },
          },
          {
            type: 'separator',
          },
          {
            label: 'Manage Account',
            click () {
              return shell.openExternal('https://on.cypress.io/dashboard')
            },
          },
          {
            label: 'Log Out',
            click: options.onLogOutClicked,
          },
          {
            type: 'separator',
          },
          {
            label: 'View App Data',
            click () {
              return shell.openPath(appData.path())
            },
          },
          {
            type: 'separator',
          },
          {
            label: 'Close Window',
            accelerator: 'CmdOrCtrl+W',
            role: 'close',
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
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
        ],
      },
      {
        label: 'View',
        submenu: [
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
        ],
      },
      {
        label: 'Window',
        role: 'window',
        submenu: [
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize',
          },
        ],
      },
      {
        label: 'Help',
        role: 'help',
        submenu: [
          {
            label: 'Support',
            click () {
              return shell.openExternal('https://on.cypress.io/support')
            },
          },
          {
            label: 'Documentation',
            click () {
              return shell.openExternal('https://on.cypress.io')
            },
          },
          {
            label: 'Download Chromium',
            click () {
              return shell.openExternal('https://on.cypress.io/chromium-downloads')
            },
          },
          {
            label: 'Report an Issue',
            click () {
              return shell.openExternal('https://on.cypress.io/new-issue')
            },
          },
        ],
      },
    ]

    if (os.platform() === 'darwin') {
      const name = 'Cypress'

      template.unshift({
        label: name,
        role: 'appMenu',
      })
    }

    let devToolsSubmenu = [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            return focusedWindow.reload()
          }
        },
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: (() => {
          if (os.platform() === 'darwin') {
            return 'Alt+Command+I'
          }

          return 'Ctrl+Shift+I'
        })(),
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            return focusedWindow.toggleDevTools()
          }
        },
      },
      {
        label: 'View App Data',
        click () {
          return shell.openPath(appData.path())
        },
      },
    ]

    if (options.withInternalDevTools) {
      devToolsSubmenu = devToolsSubmenu.concat([
        {
          label: `GraphQL requests over Fetch (${process.env.CYPRESS_INTERNAL_GQL_NO_SOCKET ? 'on' : 'off'})`,
          click: (item, focusedWindow) => {
            if (process.env.CYPRESS_INTERNAL_GQL_NO_SOCKET) {
              delete process.env.CYPRESS_INTERNAL_GQL_NO_SOCKET
            } else {
              process.env.CYPRESS_INTERNAL_GQL_NO_SOCKET = '1'
            }

            this.set(opts)
          },
        },
        {
          label: 'GraphiQL',
          click () {
            return shell.openExternal(`http://localhost:${options.getGraphQLPort()}/__launchpad/graphql`)
          },
        },
      ])
    }

    template.push(
      {
        label: 'Developer Tools',
        submenu: devToolsSubmenu,
      },
    )

    const menu = Menu.buildFromTemplate(template)

    return Menu.setApplicationMenu(menu)
  },
}
