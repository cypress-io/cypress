require("coffee-script/register")

var gui, Updater, Server;

(function(){
  var fs         = require("fs")
  var AutoLaunch = require('auto-launch')

  Server         = require('../../lib/server')
  gui            = require('nw.gui')
  Updater        = require("./js/updater.js")

  var win = gui.Window.get()

  win.showDevTools()
  win.setAlwaysOnTop()

  win.show()

  var width = win.width

  window.tray = new gui.Tray({ title: 'Cy' })

  tray.on("click", function(coords){
    win.moveTo(coords.x, coords.y)
    win.moveBy(-(width / 2), 5)
    win.show()
  })

  // win.on("blur", function(){
  //   if(App.fileDialogOpened) return;
  //   win.hide()
  // })

  var autoLaunch = function(title){
    var nwAppLauncher = new AutoLaunch({
        name: gui.App.manifest.name
    })

    nwAppLauncher.isEnabled(function(enabled){
      if(enabled) return

      nwAppLauncher.enable(function(err){

      })

    })
  }

  autoLaunch(win.title)

})()

var checkUpdates = function(){
  Updater.check()
}

process.argv = process.argv.concat(gui.App.argv)
