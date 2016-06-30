os   = require("os")
Menu = require("electron").Menu

module.exports = {
  set: ->
    return if os.platform() isnt "darwin"

    template = [
      {
        label: "Cypress"
        submenu: [
          {
            label: "Services"
            role: "services"
          }
          {
            type: "separator"
          }
          {
            label: "Hide Cypress"
            accelerator: "CmdOrCtrl+H"
            role: "hide"
          }
          {
            label: "Hide Others"
            accelerator: "Alt+CmdOrCtrl+H"
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
            label: "Quit Cypress"
            accelerator: "CmdOrCtrl+Q"
            role: "quit"
          }
        ]
      }
    ]

    if process.env["CYPRESS_ENV"] is "development"
      template.push(
        {
          label: "Developer Tools"
          submenu: [
            {
              label: 'Reload'
              accelerator: 'CmdOrCtrl+R'
              click: (item, focusedWindow) =>
                focusedWindow.reload() if (focusedWindow)
            }
            {
              label: 'Toggle Developer Tools'
              accelerator: do ->
                if process.platform is 'darwin'
                  'Alt+Command+I'
                else
                  'Ctrl+Shift+I'
              click: (item, focusedWindow) =>
                focusedWindow.toggleDevTools() if (focusedWindow)
            }
          ]
        }
      )

    menu = Menu.buildFromTemplate(template)

    Menu.setApplicationMenu(menu)
}
