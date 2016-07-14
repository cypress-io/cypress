os   = require("os")
Menu = require("electron").Menu
BrowserWindow = require("electron").BrowserWindow

module.exports = {
  set: ->
    template = [
      {
        label: "File"
        submenu: [
          {
            label: "Check for Updates"
          }
          {
            label: "Changelog"
            click: (item, focusedWindow) =>
              win = new BrowserWindow({width: 1400, height: 1000})
              win.on 'closed', =>
                win = null

              win.loadURL("https://github.com/cypress-io/cypress/wiki/changelog")
          }
          {
            type: "separator"
          }
          {
            label: "Log Out"
          }
          {
            type: "separator"
          }
          {
            label: "Close Window"
            accelerator: "CmdOrCtrl+W"
            click: (item, focusedWindow) =>
              focusedWindow.close() if focusedWindow
          }
        ]
      }
      {
        label: "Edit"
        submenu: [
          {
            label: "Undo"
            accelerator: "CmdOrCtrl+Z"
            role: "undo"
          }
          {
            label: "Redo"
            accelerator: "Shift+CmdOrCtrl+Z"
            role: "redo"
          }
          {
            type: "separator"
          }
          {
            label: "Cut"
            accelerator: "CmdOrCtrl+X"
            role: "cut"
          }
          {
            label: "Copy"
            accelerator: "CmdOrCtrl+C"
            role: "copy"
          }
          {
            label: "Paste"
            accelerator: "CmdOrCtrl+V"
            role: "paste"
          }
          {
            label: "Select All"
            accelerator: "CmdOrCtrl+A"
            role: "selectall"
          }
        ]
      }
      {
        label: "Window"
        role: "window"
        submenu: [
          {
            label: "Minimize"
            accelerator: "CmdOrCtrl+M"
            role: "minimize"
          }
        ]
      }
      {
        label: "Help"
        role: "help"
        submenu: [
          {
            label: "Report an Issue.."
            click: (item, focusedWindow) =>
              win = new BrowserWindow({width: 1400, height: 1000})
              win.on 'closed', =>
                win = null

              win.loadURL("https://github.com/cypress-io/cypress/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A")
          }
          {
            label: "Cypress Documentation"
            click: (item, focusedWindow) =>
              win = new BrowserWindow({width: 1400, height: 1000})
              win.on 'closed', =>
                win = null

              win.loadURL("https://docs.cypress.io/")
          }
          {
            label: "Cypress Chat"
            click: (item, focusedWindow) =>
              win = new BrowserWindow({width: 1400, height: 1000})
              win.on 'closed', =>
                win = null

              win.loadURL("https://gitter.im/cypress-io/cypress")
          }
        ]
      }
    ]

    if os.platform() is "darwin"
      name = "Cypress"
      template.unshift({
        label: name
        submenu: [
          {
            label: "About " + name
            role: "about"
          }
          {
            type: "separator"
          }
          {
            label: "Services"
            role: "services"
            submenu: []
          }
          {
            type: "separator"
          }
          {
            label: "Hide " + name
            accelerator: "Command+H"
            role: "hide"
          }
          {
            label: "Hide Others"
            accelerator: "Command+Shift+H"
            role: "hideothers"
          }
          {
            label: "Show All"
            role: "unhide"
          }
          {
            type: "separator"
          }
          {
            label: "Quit"
            accelerator: "Command+Q"
            click: (item, focusedWindow) =>
              focusedWindow.close() if focusedWindow
          }
        ]
      })

      # windowMenu = template.find (m) =>
      #   m.role is "window"

      # if windowMenu
      #   windowMenu.submenu.push(
      #     {
      #       label: "Zoom"
      #       role: "performZoom"
      #     }
      #   )

    if process.env["CYPRESS_ENV"] is "development"
      template.push(
        {
          label: "Developer Tools"
          submenu: [
            {
              label: 'Reload'
              accelerator: 'CmdOrCtrl+R'
              click: (item, focusedWindow) =>
                focusedWindow.reload() if focusedWindow
            }
            {
              label: 'Toggle Developer Tools'
              accelerator: do ->
                if os.platform() is 'darwin'
                  'Alt+Command+I'
                else
                  'Ctrl+Shift+I'
              click: (item, focusedWindow) =>
                focusedWindow.toggleDevTools() if focusedWindow
            }
          ]
        }
      )

    menu = Menu.buildFromTemplate(template)

    Menu.setApplicationMenu(menu)
}
