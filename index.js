require("coffee-script/register")
delete require.extensions[".litcoffee"]
delete require.extensions[".coffee.md"]
require("./lib/cypress").start(process.argv)