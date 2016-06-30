os   = require("os")
Menu = require("electron").Menu

module.exports = {
  set: ->
    return if os.platform() isnt "darwin"

    template = [
      {
        label: "File"
        submenu: [
          {
            label: "Close Window"
            accelerator: "CmdOrCtrl+W"
            role: "close"
          }
        ]
      }
    ]

    if process.platform is "darwin"
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
            click: =>
              app.quit()
          }
        ]
      })

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
