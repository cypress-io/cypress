os   = require("os")
Menu = require("electron").Menu

module.exports = {
  set: ->
    template = [
      {
        label: "File"
        submenu: [
          {
            label: "Add Project..."
          }
          {
            type: "separator"
          }
          {
            label: "Check for Updates"
          }
          {
            label: "Changelog"
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
            role: "close"
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
          }
          {
            label: "Cypress Documentation"
          }
          {
            label: "Cypress Chat"
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
            role: "quit"
          }
        ]
      })

      windowMenu = template.find (m) =>
        m.role is "window"

      if windowMenu
        windowMenu.submenu.push(
          {
            label: "Zoom"
            role: "performZoom"
          }
        )

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
